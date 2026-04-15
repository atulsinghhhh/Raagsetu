import playdl from "play-dl";

/**
 * Extract a direct audio stream URL using play-dl.
 * play-dl uses different HTTP fingerprinting than yt-dlp and can often
 * bypass YouTube bot detection from datacenter IPs.
 */
export async function extractWithPlayDl(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  // Try a few times with different user agents
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // Rotation happens internally via play-dl's browser-like headers
      const info = await playdl.video_info(videoUrl, {
        htrace: attempt > 1 // Enable detailed tracing on second attempt
      });
      
      if (!info || !info.format) continue;

      const audioFormats = info.format
        .filter(f => f.mimeType?.includes("audio") && f.url)
        .sort((a, b) => (Number(b.bitrate) || 0) - (Number(a.bitrate) || 0));

      if (audioFormats.length > 0) {
        const best = audioFormats[0];
        console.log(`play-dl success on attempt ${attempt}: mimeType=${best.mimeType}`);
        return best.url;
      }
    } catch (err) {
      console.warn(`play-dl attempt ${attempt} failed:`, err.message);
      if (err.message.includes("Sign in to confirm")) {
        // Specifically bot error
      }
    }
  }

  throw new Error("play-dl: all extraction attempts failed");
}
