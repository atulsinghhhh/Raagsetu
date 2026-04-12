import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { usePlayer } from "@/hook/usePlayer";
import { useQueue } from "@/hook/useQueue";

const REPEAT_ICONS: Record<string, string> = {
  off: "↻",
  one: "↻1",
  all: "↻∞",
};

export default function Controls() {
  const { isPlaying, togglePlayPause, skipNext, skipPrevious } = usePlayer();
  const { cycleRepeat, repeatMode } = useQueue();

  return (
    <View style={styles.container}>
      {/* Repeat toggle */}
      <TouchableOpacity style={styles.sideBtn} onPress={cycleRepeat}>
        <Text
          style={[
            styles.sideBtnText,
            repeatMode !== "off" && styles.activeText,
          ]}
        >
          {REPEAT_ICONS[repeatMode]}
        </Text>
      </TouchableOpacity>

      {/* Previous */}
      <TouchableOpacity
        style={styles.controlBtn}
        onPress={skipPrevious}
      >
        <Text style={styles.controlIcon}>⏮</Text>
      </TouchableOpacity>

      {/* Play / Pause */}
      <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlayPause}>
        <Text style={styles.playPauseIcon}>{isPlaying ? "⏸" : "▶"}</Text>
      </TouchableOpacity>

      {/* Next */}
      <TouchableOpacity
        style={styles.controlBtn}
        onPress={skipNext}
      >
        <Text style={styles.controlIcon}>⏭</Text>
      </TouchableOpacity>

      {/* Spacer for symmetry */}
      <View style={styles.sideBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingVertical: 16,
  },
  sideBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnText: {
    fontSize: 18,
    color: "#6868a0",
  },
  activeText: {
    color: "#7c3aed",
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1e1e3a",
    alignItems: "center",
    justifyContent: "center",
  },
  controlIcon: {
    fontSize: 18,
    color: "#d0d0f0",
  },
  playPauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  playPauseIcon: {
    fontSize: 24,
    color: "#fff",
  },
});
