import { Router } from "express";
import { searchYoutube } from "../services/ytdlp.js";

const router = Router();

/**
 * GET /search?q=<query>
 * Returns an array of search results from YouTube.
 */
router.get("/", async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or empty "q" query parameter',
      });
    }

    const results = await searchYoutube(q.trim());

    return res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

export default router;
