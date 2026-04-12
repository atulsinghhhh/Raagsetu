import { create } from "zustand";
import { Song } from "@/types/song";

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: null,
  isPlaying: false,
  setCurrentSong: (song: Song | null) => set({ currentSong: song }),
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
}));
