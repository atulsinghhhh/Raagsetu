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

import { Ionicons } from "@expo/vector-icons";
import { ScrollView, TouchableOpacity } from "react-native";

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
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.inputWrap}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={20} color="#adaaaa" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="What do you want to listen to?"
            placeholderTextColor="#adaaaa"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      {query.length === 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContent}>
           <View style={styles.emptyWrap}>
              <Ionicons name="search" size={64} color="#20201f" />
              <Text style={styles.emptyText}>Search for your favorite tracks</Text>
           </View>
        </ScrollView>
      ) : (
        <>
          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#c799ff" size="small" />
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
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0e0e0e",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -1,
  },
  inputWrap: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131313',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(118, 117, 117, 0.15)",
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#ffffff",
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    color: "#adaaaa",
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 100, 
  },
  gridContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    height: 100,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    justifyContent: 'space-between',
  },
  gridText: {
    fontSize: 16,
    fontWeight: '800',
  },
  gridIcon: {
    alignSelf: 'flex-end',
    opacity: 0.8,
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
