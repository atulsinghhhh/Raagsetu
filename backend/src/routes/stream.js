import { Router } from "express";
import { getCache, setCache } from "../services/redis.js";
import { extractAudioUrl } from "../services/ytdlp.js";
import { upsertSong, insertPlayHistory } from "../services/supabase.js";

const router = Router();

const STREAM_TTL = 21600; // 6 hours in seconds

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

    // 1. Check Redis cache
    const cacheKey = `stream:${videoId}`;
    const cached = await getCache(cacheKey);

    if (cached) {
      return res.json({ success: true, data: { url: cached, cached: true } });
    }

    // 2. Cache miss — extract via yt-dlp
    const url = await extractAudioUrl(videoId);

    // 3. Save to Redis (6 h TTL)
    await setCache(cacheKey, url, STREAM_TTL);

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
