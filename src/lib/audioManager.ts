import { createAudioPlayer } from "expo-audio";
import { Song } from "@/types/song";
import { getStreamUrl } from "@/lib/api";

// Lazy-initialize the audio player to avoid crashes during static web rendering
// (Node.js has no browser Audio API).
let _player: ReturnType<typeof createAudioPlayer> | null = null;

export function getPlayer() {
  if (!_player) {
    _player = createAudioPlayer(null);
  }
  return _player;
}

// Keep backward-compatible named export.
// On web during SSR this will be null; at runtime callers should use getPlayer().
export const player = typeof window !== "undefined"
  ? getPlayer()
  : (null as unknown as ReturnType<typeof createAudioPlayer>);


export async function setupAudio() {
  // Ensure the player is created (safe at runtime)
  getPlayer();
}


export async function playSong(song: Song) {
  try {
    const url = song.audio_url?.trim() || await getStreamUrl(song.video_id, song);

    if (!url) {
      throw new Error("No playable audio URL was found for this track");
    }
    
    const p = getPlayer();
    p.replace(url);
    
    (p as any).metadata = {
      title: song.title,
      artist: song.artist,
      artwork: song.thumbnail,
    };
    
    p.play();
    return true;
  } catch (error) {
    console.error("Error playing song:", error);
    return false;
  }
}
