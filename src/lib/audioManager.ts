import { createAudioPlayer } from "expo-audio";
import { Song } from "@/types/song";
import { getStreamUrl } from "@/lib/api";

/**
 * Global player instance to ensure background playback and 
 * consistent state across the app.
 */
export const player = createAudioPlayer("");

/**
 * Setup audio player options.
 */
export async function setupAudio() {
  // In expo-audio, basic setup is often unnecessary beyond creation,
  // but we can configure audio session here if needed.
  // For now, creation is enough.
}

/**
 * Play a specific song.
 */
export async function playSong(song: Song) {
  try {
    const url = await getStreamUrl(song.videoId, song);
    
    // Replace current source and play
    player.replace(url);
    
    // Set metadata for the notification / lock screen
    player.metadata = {
      title: song.title,
      artist: song.artist,
      artwork: song.thumbnail,
    };
    
    player.play();
  } catch (error) {
    console.error("Error playing song:", error);
  }
}
