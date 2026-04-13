import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { usePlayerStore } from "@/store/playerStore";
import Controls from "@/components/Controls";
import ProgressBar from "@/components/ProgressBar";
import { HeartButton } from "@/components/HeartButton";

export default function PlayerScreen() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const router = useRouter();

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No song playing</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <TouchableOpacity onPress={() => router.push("/(app)/queue")}>
          <Text style={styles.queueBtn}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Artwork */}
      <View style={styles.artworkWrap}>
        <Image
          source={{ uri: currentSong.thumbnail }}
          style={styles.artwork}
        />
      </View>

      {/* Song info */}
      <View style={styles.infoWrap}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {currentSong.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>
        <HeartButton song={currentSong} size={28} />
      </View>

      {/* Progress */}
      <ProgressBar />

      {/* Controls */}
      <Controls />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0a0a14",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    fontSize: 24,
    color: "#d0d0f0",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7878a8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  queueBtn: {
    fontSize: 22,
    color: "#d0d0f0",
  },
  artworkWrap: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  artwork: {
    width: 280,
    height: 280,
    borderRadius: 20,
    backgroundColor: "#1a1a30",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  infoWrap: {
    paddingHorizontal: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#e2e2ff",
    textAlign: "left",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  artist: {
    fontSize: 15,
    color: "#7878a8",
    textAlign: "left",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#5a5a8a",
    fontSize: 16,
  },
});
