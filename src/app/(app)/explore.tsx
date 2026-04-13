import React, { useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSearch } from "@/hook/useSearch";
import { usePlayer } from "@/hook/usePlayer";
import { SongRow } from "@/components/SongRow";
import { Song } from "@/types/song";

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const { results, loading } = useSearch(query);
  const { playSong } = usePlayer();
  const router = useRouter();

  const handleSongPress = async (song: Song) => {
    await playSong(song);
    router.push("/(app)/player");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="Search for songs..."
          placeholderTextColor="#5a5a8a"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#7c3aed" size="small" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.video_id}
        renderItem={({ item }) => (
          <SongRow 
            song={item} 
            showHeart={true} 
            showMenu={true} 
            onPress={() => handleSongPress(item)} 
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && query.trim().length > 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          ) : null
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#e2e2ff",
    letterSpacing: -0.3,
  },
  inputWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#1a1a30",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#e2e2ff",
    borderWidth: 1,
    borderColor: "#2a2a50",
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    color: "#6868a0",
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 100, // space for MiniPlayer
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
