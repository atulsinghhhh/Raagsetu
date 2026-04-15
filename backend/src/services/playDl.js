import playdl from "play-dl";

/**
 * Extract a direct audio stream URL using play-dl.
 * play-dl uses different HTTP fingerprinting than yt-dlp and can often
 * bypass YouTube bot detection from datacenter IPs.
 */
export async function extractWithPlayDl(videoId) {
  try {
    // Validate the video ID first
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    const info = await playdl.video_info(videoUrl);
    if (!info || !info.format) {
      throw new Error("play-dl: no video info returned");
    }

    // Get audio-only formats, sorted by bitrate descending
    const audioFormats = info.format
      .filter(f => f.mimeType?.includes("audio") && f.url)
      .sort((a, b) => (Number(b.bitrate) || 0) - (Number(a.bitrate) || 0));

    if (audioFormats.length === 0) {
      throw new Error("play-dl: no audio formats found");
    }

    const best = audioFormats[0];
    console.log(`play-dl success: mimeType=${best.mimeType}, bitrate=${best.bitrate}`);
    return best.url;
  } catch (err) {
    console.warn("play-dl extraction failed:", err.message);
    throw err;
  }
}
