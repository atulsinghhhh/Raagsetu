import { useEffect } from "react";
import { useAudioPlayerStatus } from "expo-audio";
import { player, playSong as audioPlaySong } from "@/lib/audioManager";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { supabase } from "@/lib/supabase/client";
import { Song } from "@/types/song";
import { updateNowPlaying } from "@/lib/utils/friendsHelpers";

export async function saveSongToSupabase(song: Song) {
  const { error } = await supabase.from('songs').upsert(
    {
      video_id: song.video_id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration_sec: Math.floor(song.duration_sec || 0)
    },
    { onConflict: 'video_id' }
  );
  if (error) {
    console.log("Supabase Upsert RLS Block (Safe to ignore):", error.message);
  }
}


export function usePlayer() {
  const currentSong = usePlayerStore((s: any) => s.currentSong);
  const setCurrentSong = usePlayerStore((s: any) => s.setCurrentSong);
  const setIsPlaying = usePlayerStore((s: any) => s.setIsPlaying);

  const { queue, currentIndex, setCurrentIndex, repeatMode } = useQueueStore();
  const status = useAudioPlayerStatus(player);

  // Keep isPlaying in sync with expo-audio state
  useEffect(() => {
    setIsPlaying(status.playing);
    
    // Step 6: update now_playing presence
    if (status.playing && currentSong) {
      updateNowPlaying(currentSong).catch(e => console.log('NowPlaying error', e));
    } else if (!status.playing) {
      updateNowPlaying(null).catch(e => console.log('NowPlaying error', e));
    }
  }, [status.playing, setIsPlaying, currentSong]);

  // Handle automatic song change when finished
  useEffect(() => {
    if (status.duration > 0 && status.currentTime >= status.duration) {
       handleAutoNext();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const played = await audioPlaySong(song);
    if (!played) {
      return;
    }

    setCurrentSong(song);

    // Step 2 & Step 11: Save to songs table and update play history
    await saveSongToSupabase(song);
    useLibraryStore.getState().addToHistory(song);
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
    if (!currentSong) {
      return;
    }

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
