import { Router } from "express";
import { getCache, setCache } from "../services/redis.js";
import { extractAudioUrl } from "../services/ytdlp.js";
import { upsertSong, insertPlayHistory } from "../services/supabase.js";

const router = Router();

const STREAM_TTL = 21600; // Fallback: 6 hours in seconds
const STREAM_EXPIRY_SAFETY_WINDOW = 60; // Avoid serving links that are about to expire

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
  if (!expiresAt) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return expiresAt - now > STREAM_EXPIRY_SAFETY_WINDOW;
}

function getStreamCacheTtl(url) {
  const expiresAt = getStreamExpiryTimestamp(url);
  if (!expiresAt) {
    return STREAM_TTL;
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = expiresAt - now - STREAM_EXPIRY_SAFETY_WINDOW;
  return ttl > 0 ? Math.min(ttl, STREAM_TTL) : 0;
}

/**
 * GET /stream/:videoId
 *
 * Flow:
 *  1. Check Redis for a cached audio URL
 *  2. If hit → return instantly
 *  3. If miss → call yt-dlp to extract the direct audio URL
 *  4. Save the URL to Redis with 6-hour TTL
 *  5. Fire-and-forget: upsertSong + insertPlayHistory to Supabase
 *  6. Return the URL
 */
router.get("/:videoId", async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const forceFresh = req.query.fresh === "1";

    // 1. Check Redis cache
    const cacheKey = `stream:${videoId}`;
    const cached = forceFresh ? null : await getCache(cacheKey);

    if (cached && isStreamUrlFresh(cached)) {
      return res.json({ success: true, data: { url: cached, cached: true } });
    }

    // 2. Cache miss — extract via yt-dlp
    const url = await extractAudioUrl(videoId);

    // 3. Save to Redis using the media URL's real expiry when available
    const cacheTtl = getStreamCacheTtl(url);
    if (cacheTtl > 0) {
      await setCache(cacheKey, url, cacheTtl);
    }

    // 4. Fire-and-forget Supabase writes
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
    ]).catch((err) => console.error("Supabase write error (non-blocking):", err));

    // 5. Respond
    return res.json({ success: true, data: { url, cached: false } });
  } catch (err) {
    next(err);
  }
});

export default router;
