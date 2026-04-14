import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function searchYoutube(query) {
  const { stdout } = await execFileAsync("yt-dlp", [
    "--dump-json",
    "--flat-playlist",
    "--no-warnings",
    "--no-check-certificates",
    "--geo-bypass",
    "--extractor-args", "youtube:player-client=tv",
    `ytsearch10:${query}`,
  ]);

  const lines = stdout.trim().split("\n").filter(Boolean);

  return lines.map((line) => {
    const data = JSON.parse(line);
    return {
      videoId: data.id,
      title: data.title ?? "Unknown Title",
      artist: data.uploader ?? data.channel ?? "Unknown Artist",
      thumbnail:
        data.thumbnail ?? data.thumbnails?.[data.thumbnails.length - 1]?.url ?? "",
      duration: data.duration ?? 0,
    };
  });
}

export async function extractAudioUrl(videoId) {
  try {
    const { stdout } = await execFileAsync("yt-dlp", [
      "-f", "bestaudio/best",
      "-g",
      "--no-warnings",
      "--no-check-certificates",
      "--geo-bypass",
      "--extractor-args", "youtube:player-client=tv",
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);

    const url = stdout.trim();
    if (!url) {
      throw new Error("No URL extracted");
    }
    return url;
  } catch (err) {
    console.error(`Failed to extract audio URL for ${videoId}:`, err.message);
    throw err;
  }
}