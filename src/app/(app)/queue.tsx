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
        keyExtractor={(item, i) => `${item.video_id}-${i}`}
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
    backgroundColor: "#0e0e0e",
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
    color: "#ffffff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
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
    color: "#adaaaa",
    fontSize: 15,
  },
});
