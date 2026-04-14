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
      console.log("yt-dlp failed → trying fallbacks");

      // Fallback 1: Piped API
      const pipedInstances = [
        "https://pipedapi.kavin.rocks",
        "https://api.piped.dev",
        "https://piped-api.lunar.icu"
      ];

      for (const instance of pipedInstances) {
        if (url) break;
        try {
          console.log(`trying Piped: ${instance}`);
          const response = await fetch(`${instance}/api/v1/streams/${videoId}`, {
            signal: AbortSignal.timeout(5000)
          });
          if (!response.ok) continue;

          const data = await response.json();
          const streams = data.audioStreams || [];
          if (streams.length > 0) {
            const best = streams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
            url = best.url;
            source = `piped:${new URL(instance).hostname}`;
          }
        } catch (e) { /* silent fail, try next */ }
      }

      // Fallback 2: Invidious
      if (!url) {
        const invidiousInstances = ["https://inv.tux.rs", "https://yewtu.be"];
        for (const instance of invidiousInstances) {
          if (url) break;
          try {
            console.log(`trying Invidious: ${instance}`);
            const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
              signal: AbortSignal.timeout(5000)
            });
            const data = await response.json();
            const format = data.adaptiveFormats?.find(f => f.type?.includes("audio"));
            if (format?.url) {
              url = format.url;
              source = `invidious:${new URL(instance).hostname}`;
            }
          } catch (e) { /* try next */ }
        }
      }

      // Fallback 3: Cobalt
      if (!url) {
        try {
          console.log("trying Cobalt fallback...");
          const res = await fetch("https://api.cobalt.tools/api/json", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              url: `https://www.youtube.com/watch?v=${videoId}`,
              downloadMode: "audio",
              audioFormat: "mp3",
              audioBitrate: "128"
            }),
            signal: AbortSignal.timeout(10000)
          });

          const cobaltData = await res.json();
          if (cobaltData.url) {
            url = cobaltData.url;
            source = "cobalt";
          }
        } catch (cobaltErr) {
          console.warn("Cobalt fallback failed:", cobaltErr.message);
        }
      }

      if (!url) {
        throw new Error("All fallback instances failed (yt-dlp, Piped, Invidious, Cobalt)");
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
