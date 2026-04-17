import playdl from "play-dl";

/**
 * Extract a direct audio stream URL using play-dl.
 * play-dl uses different HTTP fingerprinting than yt-dlp and can often
 * bypass YouTube bot detection from datacenter IPs.
 */
export async function extractWithPlayDl(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    // playdl.stream is more direct than video_info for getting URLs
    const stream = await playdl.stream(videoUrl, {
      quality: 1, // High quality
      seek: 0
    });

    const innerStream = stream?.stream;
    if (innerStream && typeof innerStream.on === "function") {
      innerStream.on("error", (error) => {
        console.warn("play-dl inner stream error:", error.message);
      });
      if (typeof innerStream.destroy === "function") {
        innerStream.destroy();
      }
    }

    if (stream?.url) {
      console.log(`play-dl stream success: ${stream.type}`);
      return stream.url;
    }
  } catch (err) {
    console.warn(`play-dl stream failed:`, err.message);
  }

  throw new Error("play-dl: all extraction attempts failed");
}
