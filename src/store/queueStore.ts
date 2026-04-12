import { create } from "zustand";
import { Song } from "@/types/song";

export type RepeatMode = "off" | "one" | "all";

interface QueueState {
  queue: Song[];
  currentIndex: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  setQueue: (queue: Song[]) => void;
  setCurrentIndex: (index: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setShuffled: (shuffled: boolean) => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  queue: [],
  currentIndex: -1,
  repeatMode: "off",
  isShuffled: false,
  setQueue: (queue: Song[]) => set({ queue }),
  setCurrentIndex: (index: number) => set({ currentIndex: index }),
  setRepeatMode: (mode: RepeatMode) => set({ repeatMode: mode }),
  setShuffled: (shuffled: boolean) => set({ isShuffled: shuffled }),
}));
