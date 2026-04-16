import { Song } from "@/types/song";
import { extractAudioUrl } from "@/lib/youtube";

// Point this to your backend. On Android emulator use 10.0.2.2; on
// a physical device use your machine's LAN IP.
const rawApiBase = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_BASE = rawApiBase || "https://raagsetu-2.onrender.com";

function ensureValidApiBase() {
  if (!API_BASE) {
    throw new Error("API URL is missing");
  }

  try {
    return new URL(API_BASE).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid API URL: ${API_BASE}`);
  }
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

async function parseJsonResponse(res: Response, fallbackMessage: string) {
  const text = await res.text();

  if (!text) {
    throw new Error(`${fallbackMessage}: empty response`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${fallbackMessage}: invalid JSON response`);
  }
}

/**
 * Search songs via the backend /search route.
 */
export async function searchSongs(query: string): Promise<Song[]> {
  const baseUrl = ensureValidApiBase();
  const res = await fetch(
    `${baseUrl}/search?q=${encodeURIComponent(query)}`
  );
  const json = await parseJsonResponse(res, "Search failed");
  if (!res.ok) throw new Error((isRecord(json) && json.error) || `Search failed with status ${res.status}`);
  if (!isRecord(json) || !json.success || !Array.isArray(json.data)) {
    throw new Error((isRecord(json) && json.error) || "Search returned an unexpected payload");
  }
  return json.data.map((item: any) => ({
    video_id: item.videoId,
    title: item.title,
    artist: item.artist,
    thumbnail: item.thumbnail,
    duration_sec: item.duration,
  }));
}

/**
 * Get a direct audio stream URL for a given video_id.
 * 
 * Strategy:
 *   1. Client-side extraction via youtubei.js (runs on user device, never blocked)
 *   2. Backend fallback (may fail due to datacenter IP blocking)
 */
export async function getStreamUrl(
  video_id: string,
  meta?: Partial<Song>
): Promise<string> {
  if (!video_id?.trim()) {
    throw new Error("Missing video id for stream lookup");
  }

  // ✅ Primary: Client-side extraction (user's real IP — never blocked)
  try {
    const url = await extractAudioUrl(video_id);
    if (url) {
      console.log("[api] client-side extraction succeeded");
      // Fire-and-forget: notify backend for play history tracking
      notifyBackend(video_id, meta).catch(() => {});
      return url;
    }
  } catch (err: any) {
    console.warn("[api] client-side extraction failed:", err.message);
  }

  // ❌ Fallback: Server-side extraction (may fail on Render)
  try {
    const baseUrl = ensureValidApiBase();
    const params = new URLSearchParams();
    if (meta?.title) params.set("title", meta.title);
    if (meta?.artist) params.set("artist", meta.artist);
    if (meta?.thumbnail) params.set("thumbnail", meta.thumbnail);
    if (meta?.duration_sec) params.set("duration", String(meta.duration_sec));

    const res = await fetch(
      `${baseUrl}/stream/${video_id}?${params.toString()}`
    );
    const json = await parseJsonResponse(res, "Stream request failed");
    if (!res.ok) {
      throw new Error((isRecord(json) && json.error) || `Stream request failed with status ${res.status}`);
    }
    if (!isRecord(json) || !json.success || !isRecord(json.data) || typeof json.data.url !== "string" || !json.data.url.trim()) {
      throw new Error((isRecord(json) && json.error) || "Stream payload did not include a valid URL");
    }
    return json.data.url;
  } catch (err: any) {
    console.warn("[api] backend stream failed:", err.message);
    throw new Error("Could not extract audio from any source");
  }
}

/**
 * Fire-and-forget: notify backend of playback for history/analytics.
 * Does not block the audio playback.
 */
async function notifyBackend(video_id: string, meta?: Partial<Song>) {
  const baseUrl = ensureValidApiBase();
  const params = new URLSearchParams();
  if (meta?.title) params.set("title", meta.title);
  if (meta?.artist) params.set("artist", meta.artist);
  if (meta?.thumbnail) params.set("thumbnail", meta.thumbnail);
  if (meta?.duration_sec) params.set("duration", String(meta.duration_sec));

  await fetch(`${baseUrl}/stream/${video_id}?${params.toString()}`).catch(() => {});
}
