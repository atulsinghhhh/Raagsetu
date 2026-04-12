import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function searchYoutube(query) {
  const { stdout } = await execFileAsync("yt-dlp", [
    "--dump-json",
    "--flat-playlist",
    "--no-warnings",
    "--extractor-args", "youtube:player-client=android,web,ios",
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
  const { stdout } = await execFileAsync("yt-dlp", [
    "-f", "bestaudio/best",
    "-g",
    "--no-warnings",
    "--extractor-args", "youtube:player-client=android,web,ios",
    `https://www.youtube.com/watch?v=${videoId}`,
  ]);

  return stdout.trim();
}