import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
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
import { Ionicons } from "@expo/vector-icons";

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
  const { currentSong, playSong, status } = usePlayer();
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
        audio_url: t.audio,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayJamendo = (track: Track) => {
    const song: Song = {
      video_id: track.id,
      title: track.name,
      artist: track.artist_name,
      thumbnail: track.album_image,
      duration_sec: track.duration,
      audio_url: track.audio,
    };

    if (playingId === track.id) {
      if (status.playing) globalPlayer.pause(); 
      else globalPlayer.play();
      return;
    }

    const idx = jamendoTracks.findIndex(t => t.id === track.id);
    playSong(song, idx);
  };

  const handlePlayYT = (song: Song, index: number) => {
    if (playingId === song.video_id) {
      if (status.playing) globalPlayer.pause();
      else globalPlayer.play();
      return;
    }
    // Set index relative to YT list (or total queue)
    playSong(song, jamendoTracks.length + index);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning ☀️";
    if (hour < 18) return "Good afternoon 🌤️";
    return "Good evening 🌙";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#c799ff" size="large" />
        <Text style={styles.loadingText}>Tuning your experience…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={jamendoTracks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor="#c799ff"
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.pageTitle}>{user?.name?.split(' ')[0] || 'Ready'}, for some music?</Text>
              </View>
              <TouchableOpacity 
                 style={styles.avatarCircle} 
                 onPress={() => router.push('/updateProfile')}
                 activeOpacity={0.7}
              >
                {user?.avatar_url ? (
                   <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 22 }} />
                ) : (
                   <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={20} color="#c799ff" />
                   </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Hero Section */}
            {ytTracks.length > 0 && ytTracks[0]?.video_id && (
              <View style={styles.heroContainer}>
                <Image 
                  source={{ uri: ytTracks[0].thumbnail }} 
                  style={styles.heroBg} 
                />
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroBadge}>TOP TRENDING</Text>
                  <Text style={styles.heroTitle} numberOfLines={1}>{ytTracks[0].title}</Text>
                  <Text style={styles.heroSubtitle} numberOfLines={1}>
                    {ytTracks[0].artist} • Global 50
                  </Text>
                  <TouchableOpacity 
                    style={styles.heroBtn} 
                    onPress={() => handlePlayYT(ytTracks[0], 0)}
                  >
                    <Ionicons name="play" size={16} color="#000" />
                    <Text style={styles.heroBtnText}>Play Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Trending Section */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Global Charts</Text>
              <Text style={styles.sectionSubtitle}>Updated every hour</Text>
            </View>
            
            <FlatList
              horizontal
              data={ytTracks}
              keyExtractor={(item) => item.video_id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 10, paddingBottom: 10 }}
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  style={styles.trendingCard}
                  onPress={() => item.video_id && handlePlayYT(item, index)}
                >
                  <Image source={{ uri: item.thumbnail }} style={styles.trendingImage} />
                  <View style={styles.trendingInfo}>
                    <Text style={styles.trendingTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.trendingArtist} numberOfLines={1}>{item.artist}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* Recently Played */}
            {recentlyHistory && recentlyHistory.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Back to the rhythm</Text>
                </View>
                <FlatList
                  horizontal
                  data={recentlyHistory}
                  keyExtractor={(item, index) => `${item.video_id || index}-${index}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.ytCard}
                      onPress={() => item.video_id && playSong(item)}
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

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Curated Collections</Text>
            </View>
          </>
        }
        renderItem={({ item, index }) => {
          const isPlaying = playingId === item.id;
          return (
            <TouchableOpacity
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
                  <Ionicons 
                    name={(isPlaying && status.playing) ? "pause" : "play"} 
                    size={14} 
                    color={isPlaying ? "#000" : "#fff"} 
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={<View style={{ height: 120 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0e0e0e" },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#0e0e0e",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#adaaaa", fontSize: 15 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: { fontSize: 14, color: "#adaaaa", marginBottom: 2 },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#131313",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(118, 117, 117, 0.2)",
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#ffffff", letterSpacing: -0.5 },
  sectionSubtitle: { fontSize: 13, color: "#adaaaa", marginTop: 2 },
  
  heroContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#131313',
  },
  heroBg: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroBadge: {
    backgroundColor: '#ffffff22',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#adaaaa',
    lineHeight: 18,
    marginBottom: 12,
  },
  heroBtn: {
    backgroundColor: '#c799ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heroBtnText: {
    color: '#440080',
    fontSize: 13,
    fontWeight: '700',
  },

  trendingCard: {
    width: 200,
    marginRight: 16,
    backgroundColor: "#20201f",
    borderRadius: 16,
    overflow: "hidden",
  },
  trendingImage: {
    width: "100%",
    height: 120,
    backgroundColor: '#000000',
  },
  trendingInfo: {
    padding: 12,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  trendingArtist: {
    fontSize: 12,
    color: "#adaaaa",
  },

  ytCard: {
    width: 140,
    marginRight: 16,
    backgroundColor: "transparent",
  },
  ytImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  ytInfo: {
    marginTop: 8,
  },
  ytTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  ytArtist: {
    fontSize: 11,
    color: "#adaaaa",
  },

  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  trackRowActive: { backgroundColor: "#20201f" },
  trackArt: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#000000',
  },
  trackInfo: { flex: 1, marginRight: 8 },
  trackName: { fontSize: 15, fontWeight: "600", color: "#ffffff", marginBottom: 3 },
  trackNameActive: { color: "#c799ff" },
  trackArtist: { fontSize: 13, color: "#adaaaa" },
  trackRight: { alignItems: "flex-end", gap: 6 },
  trackDuration: { color: "#adaaaa", fontSize: 12 },
  playCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#20201f",
    alignItems: "center",
    justifyContent: "center",
  },
  playCircleActive: { backgroundColor: "#c799ff" },
  playCircleIcon: { fontSize: 12, color: "#ffffff" },

  footer: { alignItems: "center", paddingVertical: 60 },
  footerText: { color: "#565555", fontSize: 12, letterSpacing: 1 },
});
