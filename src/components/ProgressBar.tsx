import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAudioPlayerStatus } from "expo-audio";
import { getPlayer } from "@/lib/audioManager";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ProgressBar() {
  const status = useAudioPlayerStatus(getPlayer());
  const { currentTime: position, duration } = status;

  const pct = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.barOuter}>
        <View style={[styles.barInner, { width: `${pct}%` }]}>
          <View style={styles.thumb} />
        </View>
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
    backgroundColor: "rgba(118, 117, 117, 0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  barInner: {
    height: "100%",
    backgroundColor: "#c799ff",
    borderRadius: 2,
    position: "relative",
  },
  thumb: {
    position: "absolute",
    right: -4,
    top: -2.5,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#4af8e3",
    shadowColor: "#4af8e3",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  times: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeText: {
    fontSize: 11,
    color: "#adaaaa",
    fontVariant: ["tabular-nums"],
  },
});
