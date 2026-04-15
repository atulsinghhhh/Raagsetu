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

      // Fallback 1: Cobalt v10 community instances (no JWT required)
      if (!url) {
        const cobaltInstances = [
          "https://cobalt.api.timelessnesses.me",
          "https://cobalt.codeq.ru",
          "https://co.wuk.sh",
          "https://cobalt.gg.lol"
        ];
        for (const cobaltBase of cobaltInstances) {
          if (url) break;
          try {
            console.log(`trying Cobalt: ${cobaltBase}`);
            const r = await fetch(`${cobaltBase}/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({
                url: `https://www.youtube.com/watch?v=${videoId}`,
                downloadMode: "audio",
                audioFormat: "mp3"
              }),
              signal: AbortSignal.timeout(12000)
            });
            const data = await r.json();
            console.log(`Cobalt ${cobaltBase} (${r.status}):`, JSON.stringify(data).substring(0, 150));
            if (data.url) { url = data.url; source = `cobalt:${new URL(cobaltBase).hostname}`; }
            else if ((data.status === "redirect" || data.status === "stream") && data.url) {
              url = data.url; source = `cobalt:${data.status}`;
            }
          } catch(e) { console.warn(`Cobalt ${cobaltBase} error:`, e.message); }
        }
      }

      // Fallback 2: Invidious (instances that allow API from datacenter IPs)
      if (!url) {
        const invidiousInstances = [
          "https://invidious.io.lol",
          "https://invidious.privacyredirect.com",
          "https://iv.ggtyler.dev",
          "https://invidious.fdn.fr",
          "https://invidious.flokinet.to"
        ];
        for (const instance of invidiousInstances) {
          if (url) break;
          try {
            console.log(`trying Invidious: ${instance}`);
            const r = await fetch(`${instance}/api/v1/videos/${videoId}`, {
              signal: AbortSignal.timeout(10000)
            });
            if (!r.ok) { console.warn(`Invidious ${instance}: ${r.status}`); continue; }
            const data = await r.json();
            const format = data.adaptiveFormats?.find(f =>
              f.type?.includes("audio") || f.container === "m4a"
            ) || data.formatStreams?.find(f => f.type?.includes("audio"));
            if (format?.url) {
              url = format.url;
              source = `invidious:${new URL(instance).hostname}`;
              console.log(`Invidious success: ${instance}`);
            }
          } catch(e) { console.warn(`Invidious ${instance} error:`, e.message); }
        }
      }

      // Fallback 3: Piped
      if (!url) {
        const pipedInstances = [
          "https://pipedapi.kavin.rocks",
          "https://api.piped.dev",
          "https://piped-api.lunar.icu"
        ];
        for (const instance of pipedInstances) {
          if (url) break;
          try {
            console.log(`trying Piped: ${instance}`);
            const r = await fetch(`${instance}/api/v1/streams/${videoId}`, { signal: AbortSignal.timeout(8000) });
            if (!r.ok) { console.warn(`Piped ${instance}: ${r.status}`); continue; }
            const data = await r.json();
            const streams = data.audioStreams || [];
            if (streams.length > 0) {
              const best = streams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
              url = best.url;
              source = `piped:${new URL(instance).hostname}`;
            }
          } catch(e) { console.warn(`Piped ${instance} error:`, e.message); }
        }
      }

      if (!url) {
        throw new Error("All fallback instances failed (yt-dlp, Cobalt, Invidious, Piped)");
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
