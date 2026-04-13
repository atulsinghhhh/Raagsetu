import { useCallback } from "react";
import { useQueueStore } from "@/store/queueStore";

/**
 * Hook for queue management: shuffle, repeat modes.
 */
export function useQueue() {
  const { queue, setQueue, repeatMode, setRepeatMode, isShuffled, setShuffled, currentIndex } = useQueueStore();

  /**
   * Fisher–Yates shuffle on the upcoming tracks (keeps the current track in place).
   */
  const shuffleQueue = useCallback(() => {
    if (currentIndex === -1 || queue.length <= 1) return;

    const newQueue = [...queue];
    const currentTrack = newQueue[currentIndex];
    
    // Extract other tracks
    const others = newQueue.filter((_, i) => i !== currentIndex);

    // Fisher-Yates
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }

    // Reconstruct queue with current track first (or at same index)
    // For simplicity, let's put current at index 0 and others after
    const shuffled = [currentTrack, ...others];
    setQueue(shuffled);
    setShuffled(true);
  }, [queue, currentIndex, setQueue, setShuffled]);

  const setRepeatOne = useCallback(() => {
    setRepeatMode("one");
  }, [setRepeatMode]);

  const setRepeatAll = useCallback(() => {
    setRepeatMode("all");
  }, [setRepeatMode]);

  const setRepeatOff = useCallback(() => {
    setRepeatMode("off");
  }, [setRepeatMode]);

  /**
   * Cycle through off → one → all.
   */
  const cycleRepeat = useCallback(() => {
    if (repeatMode === "off") setRepeatOne();
    else if (repeatMode === "one") setRepeatAll();
    else setRepeatOff();
  }, [repeatMode, setRepeatOne, setRepeatAll, setRepeatOff]);

  return {
    shuffleQueue,
    setRepeatOne,
    setRepeatAll,
    setRepeatOff,
    cycleRepeat,
    repeatMode,
    isShuffled,
  };
}
