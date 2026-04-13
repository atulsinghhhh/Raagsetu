import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { setAudioModeAsync } from "expo-audio";
import { player as globalPlayer } from "@/lib/audioManager";
import { usePlayer } from "@/hook/usePlayer";
import { useQueueStore } from "@/store/queueStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { Song } from "@/types/song";
import { searchSongs } from "@/lib/api";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthProvider";

const JAMENDO_CLIENT_ID = "e76dee42";

interface Track {
  id: string;
  name: string;
  artist_name: string;
  album_image: string;
  audio: string;
  duration: number;
  musicinfo?: { tags?: { genres?: string[] } };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HomeScreen() {
  const [jamendoTracks, setJamendoTracks] = useState<Track[]>([]);
  const [ytTracks, setYtTracks] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { currentSong, isPlaying, playSong, status } = usePlayer();
  const { setQueue } = useQueueStore();
  const { recentlyHistory } = useLibraryStore();

  const playingId = currentSong?.video_id || null;

  // Configure audio session once
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch Jamendo tracks with a timeout or local catch
      let jTracks: Track[] = [];
      try {
        const jamendoRes = await fetch(
          `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=10&fuzzytags=popular&include=musicinfo&imagesize=300`
        );
        if (jamendoRes.ok) {
          const jamendoJson = await jamendoRes.json();
          if (jamendoJson.headers?.status === "success") {
            jTracks = jamendoJson.results;
            setJamendoTracks(jTracks);
          }
        }
      } catch (err) {
        console.error("Jamendo fetch failed:", err);
      }

      // 2. Fetch YouTube tracks via our search API
      let yTracks: Song[] = [];
      try {
        yTracks = await searchSongs("popular music 2024");
        setYtTracks(yTracks);
      } catch (err) {
        console.error("YT fetch failed:", err);
      }

      // 3. Sync queue with whatever we successfully loaded
      const jamendoToSong = jTracks.map((t: Track) => ({
        video_id: t.id,
        title: t.name,
        artist: t.artist_name,
        thumbnail: t.album_image,
        duration_sec: t.duration,
      }));
      
      const fullQueue = [...jamendoToSong, ...yTracks];
      if (fullQueue.length > 0) {
        setQueue(fullQueue);
      }

    } catch (error) {
       console.error("Global fetch error:", error);
    } finally {
      // Always stop loading
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePlayJamendo = (track: Track) => {
    const song: Song = {
      video_id: track.id,
      title: track.name,
      artist: track.artist_name,
      thumbnail: track.album_image,
      duration_sec: track.duration,
    };

    if (playingId === track.id) {
      status.playing ? globalPlayer.pause() : globalPlayer.play();
      return;
    }

    const idx = jamendoTracks.findIndex(t => t.id === track.id);
    playSong(song, idx);
  };

  const handlePlayYT = (song: Song, index: number) => {
    if (playingId === song.video_id) {
      status.playing ? globalPlayer.pause() : globalPlayer.play();
      return;
    }
    // Set index relative to YT list (or total queue)
    playSong(song, jamendoTracks.length + index);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#7c3aed" size="large" />
        <Text style={styles.loadingText}>Loading music…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor="#7c3aed"
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good evening 🎵</Text>
            <Text style={styles.pageTitle}>Raagsetu</Text>
          </View>
          <TouchableOpacity 
             style={styles.avatarCircle} 
             onPress={() => router.push('/updateProfile' as any)}
             activeOpacity={0.7}
          >
            {user?.avatar_url ? (
               <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 22 }} />
            ) : (
               <Text style={styles.avatarEmoji}>🎹</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Recently Played */}
        {recentlyHistory && recentlyHistory.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recently Played</Text>
            </View>
            <FlatList
              horizontal
              data={recentlyHistory}
              keyExtractor={(item, index) => `${item.video_id}-${index}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.ytCard}
                  onPress={() => playSong(item)}
                >
                  <Image source={{ uri: item.thumbnail }} style={styles.ytImage} />
                  <View style={styles.ytInfo}>
                    <Text style={styles.ytTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.ytArtist} numberOfLines={1}>{item.artist}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* YouTube Section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>YouTube Trending</Text>
        </View>
        
        <FlatList
          horizontal
          data={ytTracks}
          keyExtractor={(item) => item.video_id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={styles.ytCard}
              onPress={() => handlePlayYT(item, index)}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.ytImage} />
              <View style={styles.ytInfo}>
                <Text style={styles.ytTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.ytArtist} numberOfLines={1}>{item.artist}</Text>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Jamendo Section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Jamendo Favorites</Text>
        </View>

        {jamendoTracks.map((item, index) => {
          const isPlaying = playingId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.trackRow, isPlaying && styles.trackRowActive]}
              onPress={() => handlePlayJamendo(item)}
              activeOpacity={0.75}
            >
              <Image source={{ uri: item.album_image }} style={styles.trackArt} />
              <View style={styles.trackInfo}>
                <Text style={[styles.trackName, isPlaying && styles.trackNameActive]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{item.artist_name}</Text>
              </View>
              <View style={styles.trackRight}>
                <Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>
                <View style={[styles.playCircle, isPlaying && styles.playCircleActive]}>
                  <Text style={styles.playCircleIcon}>{(isPlaying && status.playing) ? "⏸" : "▶"}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ready to play your favorite tunes.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0a14" },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#0a0a14",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#7878a8", fontSize: 15 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: { fontSize: 14, color: "#7878a8", marginBottom: 2 },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#e2e2ff",
    letterSpacing: -0.3,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1e1b3a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#7c3aed55",
  },
  avatarEmoji: { fontSize: 22 },
  sectionRow: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#e2e2ff" },
  
  ytCard: {
    width: 160,
    marginRight: 16,
    backgroundColor: "#16162a",
    borderRadius: 16,
    overflow: "hidden",
  },
  ytImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#1a1a30",
  },
  ytInfo: {
    padding: 10,
  },
  ytTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#d0d0f0",
    lineHeight: 18,
    height: 36,
  },
  ytArtist: {
    fontSize: 11,
    color: "#6868a0",
    marginTop: 4,
  },

  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 14,
    marginBottom: 4,
  },
  trackRowActive: { backgroundColor: "#1a1a38" },
  trackArt: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: "#1a1a30",
  },
  trackInfo: { flex: 1, marginRight: 8 },
  trackName: { fontSize: 14, fontWeight: "600", color: "#d0d0f0", marginBottom: 2 },
  trackNameActive: { color: "#a78bfa" },
  trackArtist: { fontSize: 12, color: "#6868a0" },
  trackRight: { alignItems: "flex-end", gap: 6 },
  trackDuration: { color: "#5a5a8a", fontSize: 11 },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1e1e3a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3a3a60",
  },
  playCircleActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  playCircleIcon: { fontSize: 12, color: "#fff" },

  footer: { alignItems: "center", paddingVertical: 40 },
  footerText: { color: "#4a4a6a", fontSize: 12 },
});
