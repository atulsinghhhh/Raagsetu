import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { usePlayer } from "@/hook/usePlayer";
import ProgressBar from "./ProgressBar";

export default function MiniPlayer() {
  const { currentSong, isPlaying, togglePlayPause } = usePlayer();
  const router = useRouter();

  if (!currentSong) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => router.push("/(app)/player")}
    >
      <View style={styles.row}>
        <Image
          source={{ uri: currentSong.thumbnail }}
          style={styles.thumbnail}
        />

        <Text style={styles.title} numberOfLines={1}>
          {currentSong.title}
        </Text>

        <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
          <Text style={styles.playIcon}>{isPlaying ? "⏸" : "▶"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#141428",
    borderTopWidth: 1,
    borderTopColor: "#1e1e3a",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#1a1a30",
    marginRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#d0d0f0",
    marginRight: 8,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    fontSize: 14,
    color: "#fff",
  },
  progressWrap: {
    marginTop: -4,
  },
});
