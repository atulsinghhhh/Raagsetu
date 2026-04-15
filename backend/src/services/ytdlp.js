import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

import { findCookiesFile } from "./cookieService.js";

const execFileAsync = promisify(execFile);

function getYtdlpArgs(baseArgs) {
  const args = [...baseArgs];
  const cookiesPath = findCookiesFile();
  if (cookiesPath) {
    args.push("--cookies", cookiesPath);
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
  // android_embedded and ios bypass YouTube bot detection best from datacenter IPs
  // They don't require cookies and avoid the "Sign in to confirm" gate
  const playerClients = ["android_embedded", "ios", "tv_embedded", "android,web"];

  for (const playerClient of playerClients) {
    try {
      const args = getYtdlpArgs([
        "-f", "bestaudio/best",
        "-g",
        "--no-warnings",
        "--no-check-certificates",
        "--geo-bypass",
        "--no-cache-dir",
        "--extractor-args", `youtube:player-client=${playerClient}`,
        `https://www.youtube.com/watch?v=${videoId}`,
      ]);

      const { stdout } = await execFileAsync("yt-dlp", args, { timeout: 30000 });
      const url = stdout.trim();
      if (url) {
        console.log(`yt-dlp success with player-client=${playerClient}`);
        return url;
      }
    } catch (err) {
      console.warn(`yt-dlp failed (player-client=${playerClient}):`, err.message.substring(0, 120));
    }
  }

  throw new Error("yt-dlp: all player clients failed (bot detection)");
}