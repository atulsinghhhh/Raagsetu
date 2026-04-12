import { Song } from "@/types/song";

// Point this to your backend. On Android emulator use 10.0.2.2; on
// a physical device use your machine's LAN IP.
const API_BASE = __DEV__
  ? "http://10.15.36.113:3000"   // Current network IP
  : "http://localhost:3000";    // Production

/**
 * Search songs via the backend /search route.
 */
export async function searchSongs(query: string): Promise<Song[]> {
  const res = await fetch(
    `${API_BASE}/search?q=${encodeURIComponent(query)}`
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Search failed");
  return json.data as Song[];
}

/**
 * Get a direct audio stream URL for a given videoId.
 */
export async function getStreamUrl(
  videoId: string,
  meta?: Partial<Song>
): Promise<string> {
  const params = new URLSearchParams();
  if (meta?.title) params.set("title", meta.title);
  if (meta?.artist) params.set("artist", meta.artist);
  if (meta?.thumbnail) params.set("thumbnail", meta.thumbnail);
  if (meta?.duration) params.set("duration", String(meta.duration));

  const res = await fetch(
    `${API_BASE}/stream/${videoId}?${params.toString()}`
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Stream failed");
  return json.data.url as string;
}
