import { Song } from "@/types/song";
import { extractAudioUrl } from "@/lib/youtube";

// Point this to your backend. On Android emulator use 10.0.2.2; on
// a physical device use your machine's LAN IP.
const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://raagsetu-2.onrender.com";

/**
 * Search songs via the backend /search route.
 */
export async function searchSongs(query: string): Promise<Song[]> {
  const res = await fetch(
    `${API_BASE}/search?q=${encodeURIComponent(query)}`
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Search failed");
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
    const params = new URLSearchParams();
    if (meta?.title) params.set("title", meta.title);
    if (meta?.artist) params.set("artist", meta.artist);
    if (meta?.thumbnail) params.set("thumbnail", meta.thumbnail);
    if (meta?.duration_sec) params.set("duration", String(meta.duration_sec));

    const res = await fetch(
      `${API_BASE}/stream/${video_id}?${params.toString()}`
    );
    if (!res.ok) throw new Error("Stream request failed");

    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Stream failed");
    return json.data.url as string;
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
  const params = new URLSearchParams();
  if (meta?.title) params.set("title", meta.title);
  if (meta?.artist) params.set("artist", meta.artist);
  if (meta?.thumbnail) params.set("thumbnail", meta.thumbnail);
  if (meta?.duration_sec) params.set("duration", String(meta.duration_sec));

  await fetch(`${API_BASE}/stream/${video_id}?${params.toString()}`).catch(() => {});
}
