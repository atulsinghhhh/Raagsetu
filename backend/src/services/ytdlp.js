import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execFileAsync = promisify(execFile);
const COOKIES_PATH = path.join(process.cwd(), "cookies.txt");
const SRC_COOKIES_PATH = path.join(process.cwd(), "src", "cookies.txt");

function getYtdlpArgs(baseArgs) {
  const args = [...baseArgs];
  if (fs.existsSync(COOKIES_PATH)) {
    args.push("--cookies", COOKIES_PATH);
  } else if (fs.existsSync(SRC_COOKIES_PATH)) {
    args.push("--cookies", SRC_COOKIES_PATH);
  } else if (fs.existsSync("/app/cookies.txt")) {
    args.push("--cookies", "/app/cookies.txt");
  }
  return args;
}

export async function searchYoutube(query) {
  try {
    const args = getYtdlpArgs([
      "--dump-json",
      "--flat-playlist",
      "--no-warnings",
      "--no-check-certificates",
      "--geo-bypass",
      "--extractor-args", "youtube:player-client=ios,tv",
      `ytsearch10:${query}`,
    ]);

    const { stdout } = await execFileAsync("yt-dlp", args);

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
  } catch (err) {
    console.error(`Failed to search YouTube for ${query}:`, err.message);
    throw err;
  }
}

export async function extractAudioUrl(videoId) {
  try {
    const args = getYtdlpArgs([
      "-f", "bestaudio/best",
      "-g",
      "--no-warnings",
      "--no-check-certificates",
      "--geo-bypass",
      "--extractor-args", "youtube:player-client=ios,tv",
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);

    const { stdout } = await execFileAsync("yt-dlp", args);

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