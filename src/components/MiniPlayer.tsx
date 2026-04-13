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
    position: "absolute",
    bottom: 68,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 24,
    paddingBottom: 4,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#000000',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginRight: 8,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#c799ff",
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    fontSize: 16,
    color: "#440080",
  },
  progressWrap: {
    marginTop: -2,
    marginHorizontal: 16,
    marginBottom: 6,
  },
});
