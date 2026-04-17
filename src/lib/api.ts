import { Song } from "@/types/song";
import { extractAudioUrl, searchYouTube } from "@/lib/youtube";

/**
 * Search songs via client-side youtubei.js (no backend needed).
 */
export async function searchSongs(query: string): Promise<Song[]> {
  if (!query?.trim()) return [];
  return searchYouTube(query.trim());
}

/**
 * Get a direct audio stream URL for a given video_id.
 * Uses client-side extraction via youtubei.js — runs on the user's
 * device so YouTube never blocks the request.
 */
export async function getStreamUrl(
  video_id: string,
  _meta?: Partial<Song>
): Promise<string> {
  if (!video_id?.trim()) {
    throw new Error("Missing video id for stream lookup");
  }

  try {
    const url = await extractAudioUrl(video_id);
    if (url) {
      console.log("[api] client-side extraction succeeded");
      return url;
    }
    throw new Error("extractAudioUrl returned empty URL");
  } catch (err: any) {
    console.error("[api] client-side extraction failed:", err.message);
    throw new Error("Could not extract audio. Please try again.");
  }
}
