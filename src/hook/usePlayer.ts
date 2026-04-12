import { useEffect } from "react";
import { useAudioPlayerStatus } from "expo-audio";
import { player, playSong as audioPlaySong } from "@/lib/audioManager";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { Song } from "@/types/song";

/**
 * Hook that exposes playSong and keeps currentSong / isPlaying in sync
 * via the Zustand stores and expo-audio status.
 */
export function usePlayer() {
  const currentSong = usePlayerStore((s: any) => s.currentSong);
  const setCurrentSong = usePlayerStore((s: any) => s.setCurrentSong);
  const setIsPlaying = usePlayerStore((s: any) => s.setIsPlaying);

  const { queue, currentIndex, setCurrentIndex, repeatMode } = useQueueStore();
  const status = useAudioPlayerStatus(player);

  // Keep isPlaying in sync with expo-audio state
  useEffect(() => {
    setIsPlaying(status.playing);
  }, [status.playing, setIsPlaying]);

  // Handle automatic song change when finished
  useEffect(() => {
    // Note: Checking for status.playbackState === "finished" or similar
    // expo-audio status often has a "finished" or "didJustFinish" property
    // For now we'll check if position >= duration and duration > 0
    if (status.duration > 0 && status.currentTime >= status.duration) {
       handleAutoNext();
    }
  }, [status.currentTime, status.duration]);

  const handleAutoNext = async () => {
    if (repeatMode === "one") {
      player.seekTo(0);
      player.play();
    } else {
      await skipNext();
    }
  };

  const playSong = async (song: Song, index?: number) => {
    if (index !== undefined) {
      setCurrentIndex(index);
    }
    setCurrentSong(song);
    await audioPlaySong(song);
  };

  const skipNext = async () => {
    if (queue.length === 0) return;
    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= queue.length) {
      if (repeatMode === "all") {
        nextIndex = 0;
      } else {
        return; // stop playback
      }
    }
    
    const nextSong = queue[nextIndex];
    if (nextSong) {
      await playSong(nextSong, nextIndex);
    }
  };

  const skipPrevious = async () => {
    if (queue.length === 0) return;
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      if (repeatMode === "all") {
        prevIndex = queue.length - 1;
      } else {
        prevIndex = 0;
      }
    }
    
    const prevSong = queue[prevIndex];
    if (prevSong) {
      await playSong(prevSong, prevIndex);
    }
  };

  const togglePlayPause = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return { 
    currentSong, 
    isPlaying: status.playing, 
    playSong, 
    skipNext, 
    skipPrevious, 
    togglePlayPause,
    status 
  };
}
