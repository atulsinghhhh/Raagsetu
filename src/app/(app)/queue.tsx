import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueue } from "@/hook/useQueue";
import { useQueueStore } from "@/store/queueStore";
import { usePlayer } from "@/hook/usePlayer";
import SongCard from "@/components/SongCard";

export default function QueueScreen() {
  const { queue } = useQueueStore();
  const { shuffleQueue } = useQueue();
  const { playSong } = usePlayer();
  const router = useRouter();

  const handleShuffle = () => {
    shuffleQueue();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Queue</Text>
        <TouchableOpacity onPress={handleShuffle}>
          <Text style={styles.shuffleBtn}>🔀</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item, i) => `${item.videoId}-${i}`}
        renderItem={({ item, index }) => (
          <SongCard
            song={item}
            onPress={() => playSong(item, index)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Queue is empty</Text>
          </View>
        }
      />
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
    fontSize: 18,
    fontWeight: "700",
    color: "#e2e2ff",
  },
  shuffleBtn: {
    fontSize: 22,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 48,
  },
  emptyText: {
    color: "#5a5a8a",
    fontSize: 15,
  },
});
