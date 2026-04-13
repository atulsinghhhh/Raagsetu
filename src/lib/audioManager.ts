import { createAudioPlayer } from "expo-audio";
import { Song } from "@/types/song";
import { getStreamUrl } from "@/lib/api";

export const player = createAudioPlayer("");


export async function setupAudio() {
  // In expo-audio, basic setup is often unnecessary beyond creation,
  // but we can configure audio session here if needed.
  // For now, creation is enough.
}


export async function playSong(song: Song) {
  try {
    const url = song.audio_url || await getStreamUrl(song.video_id, song);
    
    player.replace(url);
    
    (player as any).metadata = {
      title: song.title,
      artist: song.artist,
      artwork: song.thumbnail,
    };
    
    player.play();
  } catch (error) {
    console.error("Error playing song:", error);
  }
}
