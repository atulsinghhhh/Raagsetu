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

      // Fallback 1: Invidious (Most reliable currently)
      if (!url) {
        const invidiousInstances = [
          "https://yewtu.be",
          "https://inv.tux.rs",
          "https://invidious.nerdvpn.de",
          "https://invidious.snopyta.org"
        ];
        for (const instance of invidiousInstances) {
          if (url) break;
          try {
            console.log(`trying Invidious: ${instance}`);
            const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
              signal: AbortSignal.timeout(10000)
            });
            if (!response.ok) continue;

            const data = await response.json();
            // Try to find the best audio stream
            const format = data.adaptiveFormats?.find(f => 
              f.type?.includes("audio") || (f.container === "m4a" && !f.type?.includes("video"))
            );
            
            if (format?.url) {
              url = format.url;
              source = `invidious:${new URL(instance).hostname}`;
              console.log(`Invidious success: ${instance}`);
            }
          } catch (e) { /* try next */ }
        }
      }

      // Fallback 2: Piped API
      if (!url) {
        const pipedInstances = [
          "https://pipedapi.kavin.rocks",
          "https://api.piped.dev",
          "https://piped-api.lunar.icu",
          "https://pipedapi.rimgo.lol",
          "https://pipedapi.tinfoil-hat.net"
        ];

        for (const instance of pipedInstances) {
          if (url) break;
          try {
            console.log(`trying Piped: ${instance}`);
            const response = await fetch(`${instance}/api/v1/streams/${videoId}`, {
              signal: AbortSignal.timeout(10000)
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
      }

      // Fallback 3: Shisui API (High Performance Proxy)
      if (!url) {
        try {
          console.log("trying Shisui fallback...");
          const res = await fetch(`https://shisui.xyz/api/v1/streams/${videoId}`, {
            signal: AbortSignal.timeout(10000)
          });
          if (res.ok) {
            const data = await res.json();
            if (data.audio?.[0]?.url) {
              url = data.audio[0].url;
              source = "shisui";
            }
          }
        } catch (e) {
          console.warn("Shisui fallback failed:", e.message);
        }
      }

      if (!url) {
        try {
          console.log("trying Cobalt API (v10 format)...");
          const cobaltResponse = await fetch("https://api.cobalt.tools/api/json", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              url: `https://www.youtube.com/watch?v=${videoId}`,
              videoQuality: "720",
              audioFormat: "mp3",
              filenameStyle: "pretty",
              downloadMode: "audio",
              youtubeVideoCodec: "h264",
              isAudioOnly: true
            }),
            signal: AbortSignal.timeout(10000)
          });

          if (cobaltResponse.ok) {
            const cobaltData = await cobaltResponse.json();
            console.log("Cobalt debug data:", JSON.stringify(cobaltData));
            if (cobaltData.url) {
              url = cobaltData.url;
              source = "cobalt:v10";
            } else if (cobaltData.status === "redirect" && cobaltData.url) {
              url = cobaltData.url;
              source = "cobalt:redirect";
            } else if (cobaltData.status === "stream" && cobaltData.url) {
              url = cobaltData.url;
              source = "cobalt:stream";
            }
          } else {
            const errText = await cobaltResponse.text();
            console.warn(`Cobalt API error (${cobaltResponse.status}): ${errText}`);
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

    // Ensure duration is captured correctly from query string
    // Accepting both formats for maximum frontend compatibility
    const rawDuration = req.query.duration || req.query.duration_sec;
    const songMeta = {
      videoId,
      title: req.query.title ?? "Unknown Track",
      artist: req.query.artist ?? "Unknown Artist",
      thumbnail: req.query.thumbnail ?? "",
      duration: Number(rawDuration) || 0,
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
