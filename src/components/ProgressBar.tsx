import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAudioPlayerStatus } from "expo-audio";
import { player } from "@/lib/audioManager";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ProgressBar() {
  const status = useAudioPlayerStatus(player);
  const { currentTime: position, duration } = status;

  const pct = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.barOuter}>
        <View style={[styles.barInner, { width: `${pct}%` }]} />
      </View>

      <View style={styles.times}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: 24,
  },
  barOuter: {
    height: 4,
    backgroundColor: "#2a2a50",
    borderRadius: 2,
    overflow: "hidden",
  },
  barInner: {
    height: "100%",
    backgroundColor: "#7c3aed",
    borderRadius: 2,
  },
  times: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeText: {
    fontSize: 11,
    color: "#6868a0",
    fontVariant: ["tabular-nums"],
  },
});
