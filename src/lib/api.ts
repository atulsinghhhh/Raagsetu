import { Song } from "@/types/song";

// Point this to your backend. On Android emulator use 10.0.2.2; on
// a physical device use your machine's LAN IP.
const API_BASE = __DEV__
  ? process.env.EXPO_PUBLIC_API_URL   // Current network IP
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
 */
export async function getStreamUrl(
  video_id: string,
  meta?: Partial<Song>
): Promise<string> {
  const params = new URLSearchParams();
  if (meta?.title) params.set("title", meta.title);
  if (meta?.artist) params.set("artist", meta.artist);
  if (meta?.thumbnail) params.set("thumbnail", meta.thumbnail);
  if (meta?.duration_sec) params.set("duration", String(meta.duration_sec));

  const res = await fetch(
    `${API_BASE}/stream/${video_id}?${params.toString()}`
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Stream failed");
  return json.data.url as string;
}
