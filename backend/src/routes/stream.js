import { Router } from "express";
import { getCache, setCache } from "../services/redis.js";
import { extractAudioUrl } from "../services/ytdlp.js";
import { upsertSong, insertPlayHistory } from "../services/supabase.js";

const router = Router();

const STREAM_TTL = 21600; // 6 hours
const STREAM_EXPIRY_SAFETY_WINDOW = 60;

// ---------------- HELPERS ----------------

function getStreamExpiryTimestamp(url) {
  try {
    const parsed = new URL(url);
    const expire = Number(parsed.searchParams.get("expire"));
    return Number.isFinite(expire) ? expire : null;
  } catch {
    return null;
  }
}

function isStreamUrlFresh(url) {
  const expiresAt = getStreamExpiryTimestamp(url);
  if (!expiresAt) return true;

  const now = Math.floor(Date.now() / 1000);
  return expiresAt - now > STREAM_EXPIRY_SAFETY_WINDOW;
}

function getStreamCacheTtl(url) {
  const expiresAt = getStreamExpiryTimestamp(url);
  if (!expiresAt) return STREAM_TTL;

  const now = Math.floor(Date.now() / 1000);
  const ttl = expiresAt - now - STREAM_EXPIRY_SAFETY_WINDOW;
  return ttl > 0 ? Math.min(ttl, STREAM_TTL) : 0;
}

// ---------------- ROUTE ----------------

router.get("/:videoId", async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const forceFresh = req.query.fresh === "1";

    const cacheKey = `stream:${videoId}`;
    const cached = forceFresh ? null : await getCache(cacheKey);

    // ✅ 1. Return cached if valid
    if (cached && isStreamUrlFresh(cached)) {
      return res.json({
        success: true,
        data: { url: cached, cached: true, source: "cache" },
      });
    }

    let url;
    let source = "unknown";

    // ✅ 2. Try yt-dlp (may fail on Render)
    try {
      url = await extractAudioUrl(videoId);
      source = "ytdlp";
      console.log("yt-dlp success");
    } catch (err) {
      console.log("yt-dlp failed → trying fallback");

      // ✅ 3. Fallback: Piped API (using multiple instances)
      const pipedInstances = [
        "https://pipedapi.kavin.rocks",
        "https://api.piped.dev",
        "https://piped-api.lunar.icu"
      ];

      for (const instance of pipedInstances) {
        try {
          console.log(`trying fallback instance: ${instance}`);
          const response = await fetch(`${instance}/api/v1/streams/${videoId}`, {
            signal: AbortSignal.timeout(5000) // 5s timeout per instance
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = await response.json();
          const audioStreams = data.audioStreams || [];

          if (audioStreams.length > 0) {
            // pick highest bitrate
            const bestAudio = audioStreams.sort(
              (a, b) => (b.bitrate || 0) - (a.bitrate || 0)
            )[0];

            url = bestAudio.url;
            source = `piped:${new URL(instance).hostname}`;
            console.log("fallback success");
            break;
          }
        } catch (instanceErr) {
          console.warn(`${instance} failed:`, instanceErr.message);
          continue; // try next
        }
      }

      if (!url) {
        console.log("Piped failed → trying Invidious");
        const invidiousInstances = [
          "https://inv.tux.rs",
          "https://invidious.snopyta.org",
          "https://yewtu.be"
        ];

        for (const instance of invidiousInstances) {
          try {
            console.log(`trying invidious instance: ${instance}`);
            const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
              signal: AbortSignal.timeout(5000)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            const format = data.adaptiveFormats?.find(f => f.type?.includes("audio/webm") || f.type?.includes("audio/mp4"));
            
            if (format?.url) {
              url = format.url;
              source = `invidious:${new URL(instance).hostname}`;
              break;
            }
          } catch (invErr) {
            console.warn(`${instance} failed:`, invErr.message);
            continue;
          }
        }
      }

      if (!url) {
        throw new Error("All fallback instances failed (yt-dlp, Piped, Invidious)");
      }
    }

    // ✅ 4. Cache safely (only if URL valid & not expiring soon)
    if (url && isStreamUrlFresh(url)) {
      const cacheTtl = getStreamCacheTtl(url);
      if (cacheTtl > 0) {
        await setCache(cacheKey, url, cacheTtl);
      }
    }

    // ✅ 5. Fire-and-forget Supabase
    const songMeta = {
      videoId,
      title: req.query.title ?? "",
      artist: req.query.artist ?? "",
      thumbnail: req.query.thumbnail ?? "",
      duration: Number(req.query.duration) || 0,
    };

    Promise.all([
      upsertSong(songMeta),
      insertPlayHistory(videoId),
    ]).catch((err) =>
      console.error("Supabase write error (non-blocking):", err)
    );

    // ✅ 6. Response
    return res.json({
      success: true,
      data: {
        url,
        cached: false,
        source,
      },
    });
  } catch (err) {
    console.error("Stream route error:", err);
    next(err);
  }
});

export default router;



// import { Router } from "express";
// import { getCache, setCache } from "../services/redis.js";
// import { extractAudioUrl } from "../services/ytdlp.js";
// import { upsertSong, insertPlayHistory } from "../services/supabase.js";

// const router = Router();

// const STREAM_TTL = 21600; // Fallback: 6 hours in seconds
// const STREAM_EXPIRY_SAFETY_WINDOW = 60; // Avoid serving links that are about to expire

// function getStreamExpiryTimestamp(url) {
//   try {
//     const parsed = new URL(url);
//     const expire = Number(parsed.searchParams.get("expire"));
//     return Number.isFinite(expire) ? expire : null;
//   } catch {
//     return null;
//   }
// }

// function isStreamUrlFresh(url) {
//   const expiresAt = getStreamExpiryTimestamp(url);
//   if (!expiresAt) {
//     return true;
//   }

//   const now = Math.floor(Date.now() / 1000);
//   return expiresAt - now > STREAM_EXPIRY_SAFETY_WINDOW;
// }

// function getStreamCacheTtl(url) {
//   const expiresAt = getStreamExpiryTimestamp(url);
//   if (!expiresAt) {
//     return STREAM_TTL;
//   }

//   const now = Math.floor(Date.now() / 1000);
//   const ttl = expiresAt - now - STREAM_EXPIRY_SAFETY_WINDOW;
//   return ttl > 0 ? Math.min(ttl, STREAM_TTL) : 0;
// }

// /**
//  * GET /stream/:videoId
//  *
//  * Flow:
//  *  1. Check Redis for a cached audio URL
//  *  2. If hit → return instantly
//  *  3. If miss → call yt-dlp to extract the direct audio URL
//  *  4. Save the URL to Redis with 6-hour TTL
//  *  5. Fire-and-forget: upsertSong + insertPlayHistory to Supabase
//  *  6. Return the URL
//  */
// router.get("/:videoId", async (req, res, next) => {
//   try {
//     const { videoId } = req.params;
//     const forceFresh = req.query.fresh === "1";

//     // 1. Check Redis cache
//     const cacheKey = `stream:${videoId}`;
//     const cached = forceFresh ? null : await getCache(cacheKey);

//     if (cached && isStreamUrlFresh(cached)) {
//       return res.json({ success: true, data: { url: cached, cached: true } });
//     }

//     // 2. Cache miss — extract via yt-dlp
//     const url = await extractAudioUrl(videoId);

//     // 3. Save to Redis using the media URL's real expiry when available
//     const cacheTtl = getStreamCacheTtl(url);
//     if (cacheTtl > 0) {
//       await setCache(cacheKey, url, cacheTtl);
//     }

//     // 4. Fire-and-forget Supabase writes
//     const songMeta = {
//       videoId,
//       title: req.query.title ?? "",
//       artist: req.query.artist ?? "",
//       thumbnail: req.query.thumbnail ?? "",
//       duration: Number(req.query.duration) || 0,
//     };

//     Promise.all([
//       upsertSong(songMeta),
//       insertPlayHistory(videoId),
//     ]).catch((err) => console.error("Supabase write error (non-blocking):", err));

//     // 5. Respond
//     return res.json({ success: true, data: { url, cached: false } });
//   } catch (err) {
//     next(err);
//   }
// });

// export default router;
