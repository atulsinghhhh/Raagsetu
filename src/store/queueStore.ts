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
  playQueue: (songs: Song[], startIndex?: number) => void;
  playNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
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

  playQueue: (songs: Song[], startIndex: number = 0) => {
    set({
      queue: songs,
      currentIndex: startIndex,
      isShuffled: false,
      repeatMode: "off"
    })
  },
  playNext: (song: Song) => set((state) => {
    const newQueue = [...state.queue];
    newQueue.splice(state.currentIndex + 1, 0, song);
    return { queue: newQueue };
  }),
  addToQueue: (song: Song) => set((state) => ({ queue: [...state.queue, song] }))
}));
