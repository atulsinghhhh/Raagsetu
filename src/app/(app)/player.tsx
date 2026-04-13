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

import { Ionicons } from "@expo/vector-icons";

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
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-down" size={28} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
            <Text style={styles.headerSubtitle}>PLAYING FROM</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>Nocturne Editorial</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(app)/queue")} style={styles.headerBtn}>
          <Ionicons name="list" size={24} color="#ffffff" />
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
        <View style={{ flex: 1, marginRight: 16 }}>
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
      <View style={styles.progressSection}>
        <ProgressBar />
      </View>

      {/* Controls */}
      <View style={styles.controlsSection}>
         <Controls />
      </View>

      {/* Footer Actions */}
      <View style={styles.playerFooter}>
         <TouchableOpacity style={styles.footerBtn}>
            <Ionicons name="shuffle-outline" size={22} color="#adaaaa" />
         </TouchableOpacity>
         <TouchableOpacity style={styles.footerBtn}>
            <Ionicons name="repeat-outline" size={22} color="#adaaaa" />
         </TouchableOpacity>
         <TouchableOpacity style={styles.footerBtn} onPress={() => router.push("/(app)/queue")}>
            <Ionicons name="layers-outline" size={22} color="#adaaaa" />
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0e0e0e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#565555",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  artworkWrap: {
    alignItems: "center",
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 20,
  },
  artwork: {
    width: 320,
    height: 320,
    borderRadius: 24,
    backgroundColor: '#131313',
  },
  infoWrap: {
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  artist: {
    fontSize: 16,
    color: "#4af8e3",
    fontWeight: '600',
  },
  progressSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  controlsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  playerFooter: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 40,
      paddingBottom: 20,
  },
  footerBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#adaaaa",
    fontSize: 16,
  },
});
