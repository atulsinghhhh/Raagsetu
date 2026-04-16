import { createAudioPlayer } from "expo-audio";
import { Song } from "@/types/song";
import { getStreamUrl } from "@/lib/api";

export const player = createAudioPlayer(null);


export async function setupAudio() {
  // In expo-audio, basic setup is often unnecessary beyond creation,
  // but we can configure audio session here if needed.
  // For now, creation is enough.
}


export async function playSong(song: Song) {
  try {
    const url = song.audio_url?.trim() || await getStreamUrl(song.video_id, song);

    if (!url) {
      throw new Error("No playable audio URL was found for this track");
    }
    
    player.replace(url);
    
    (player as any).metadata = {
      title: song.title,
      artist: song.artist,
      artwork: song.thumbnail,
    };
    
    player.play();
    return true;
  } catch (error) {
    console.error("Error playing song:", error);
    return false;
  }
}
