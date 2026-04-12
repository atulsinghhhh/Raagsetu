import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio, AVPlaybackStatus } from "expo-av";

const { width } = Dimensions.get("window");

const JAMENDO_CLIENT_ID = "e76dee42";

interface Track {
  id: string;
  name: string;
  artist_name: string;
  album_name: string;
  album_image: string;
  audio: string;
  duration: number;
  releasedate: string;
  musicinfo?: {
    tags?: {
      genres?: string[];
    };
  };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HomeScreen() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Audio playback state
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  // Setup audio mode once
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    return () => {
      // Cleanup on unmount
      stopAndUnload();
    };
  }, []);

  const stopAndUnload = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (_) {}
      soundRef.current = null;
    }
    setPlayingId(null);
    setPositionMs(0);
    setDurationMs(0);
  };

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setBuffering(false);
      return;
    }
    setBuffering(status.isBuffering);
    setPositionMs(status.positionMillis ?? 0);
    setDurationMs(status.durationMillis ?? 0);

    if (status.didJustFinish) {
      setPlayingId(null);
      setPositionMs(0);
    }
  }, []);

  const handlePlay = async (track: Track) => {
    // If same track — toggle pause/resume
    if (playingId === track.id && soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
        setPlayingId(null);
      } else if (status.isLoaded) {
        await soundRef.current.playAsync();
        setPlayingId(track.id);
      }
      return;
    }

    // Unload previous
    await stopAndUnload();

    setBuffering(true);
    setPlayingId(track.id);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.audio },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
    } catch (err) {
      console.log("Audio playback error:", err);
      Alert.alert("Playback Error", "Could not play this track.");
      setPlayingId(null);
      setBuffering(false);
    }
  };

  const fetchTracks = async () => {
    try {
      const res = await fetch(
        `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=20&fuzzytags=popular&include=musicinfo&imagesize=300`
      );
      const json = await res.json();
      if (json.headers?.status === "success") {
        setTracks(json.results);
      } else {
        Alert.alert("Error", "Could not load songs.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Failed to fetch songs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTracks();
  };

  // Progress bar percentage
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  const renderFeatured = () => {
    if (!tracks.length) return null;
    const featured = tracks[0];
    const isPlaying = playingId === featured.id;

    return (
      <View style={styles.featuredCard}>
        <Image source={{ uri: featured.album_image }} style={styles.featuredImage} />
        <View style={styles.featuredOverlay}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>🔥 Featured</Text>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {featured.name}
          </Text>
          <Text style={styles.featuredArtist}>{featured.artist_name}</Text>

          <View style={styles.featuredMeta}>
            <Text style={styles.featuredDuration}>
              ⏱ {formatDuration(featured.duration)}
            </Text>
            {featured.musicinfo?.tags?.genres?.[0] && (
              <View style={styles.genreChip}>
                <Text style={styles.genreText}>
                  {featured.musicinfo.tags.genres[0]}
                </Text>
              </View>
            )}
          </View>

          {/* Progress bar for featured track */}
          {isPlaying && durationMs > 0 && (
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` as any }]} />
            </View>
          )}

          <View style={styles.featuredActions}>
            <TouchableOpacity
              style={[styles.playBtn, isPlaying && styles.playBtnActive]}
              onPress={() => handlePlay(featured)}
            >
              {buffering && isPlaying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.playBtnText}>
                  {isPlaying ? "⏸  Pause" : "▶  Play"}
                </Text>
              )}
            </TouchableOpacity>
            {isPlaying && (
              <TouchableOpacity style={styles.stopBtn} onPress={stopAndUnload}>
                <Text style={styles.stopBtnText}>⏹</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTrack = ({ item, index }: { item: Track; index: number }) => {
    const isPlaying = playingId === item.id;

    return (
      <TouchableOpacity
        style={[styles.trackRow, isPlaying && styles.trackRowActive]}
        onPress={() => handlePlay(item)}
        activeOpacity={0.75}
      >
        {/* Index / playing indicator */}
        <View style={styles.trackIndexWrap}>
          {buffering && isPlaying ? (
            <ActivityIndicator color="#7c3aed" size="small" />
          ) : isPlaying ? (
            <Text style={styles.trackPlaying}>♪</Text>
          ) : (
            <Text style={styles.trackIndex}>{index + 1}</Text>
          )}
        </View>

        <Image source={{ uri: item.album_image }} style={styles.trackArt} />

        <View style={styles.trackInfo}>
          <Text
            style={[styles.trackName, isPlaying && styles.trackNameActive]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {item.artist_name}
          </Text>
          {item.musicinfo?.tags?.genres?.[0] && (
            <Text style={styles.trackGenre}>
              {item.musicinfo.tags.genres[0]}
            </Text>
          )}
          {/* Mini progress bar inside active track row */}
          {isPlaying && durationMs > 0 && (
            <View style={styles.miniProgressBg}>
              <View style={[styles.miniProgressFill, { width: `${progress * 100}%` as any }]} />
            </View>
          )}
        </View>

        <View style={styles.trackRight}>
          <Text style={styles.trackDuration}>
            {isPlaying && positionMs > 0
              ? formatDuration(Math.floor(positionMs / 1000))
              : formatDuration(item.duration)}
          </Text>
          <View style={[styles.playCircle, isPlaying && styles.playCircleActive]}>
            <Text style={styles.playCircleIcon}>
              {isPlaying ? "⏸" : "▶"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#7c3aed" size="large" />
        <Text style={styles.loadingText}>Loading songs…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <FlatList
        data={tracks.slice(1)}
        keyExtractor={(item) => item.id}
        renderItem={renderTrack}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7c3aed"
            colors={["#7c3aed"]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Good evening 🎵</Text>
                <Text style={styles.pageTitle}>Discover Music</Text>
              </View>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>🎧</Text>
              </View>
            </View>

            {renderFeatured()}

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Popular Tracks</Text>
              <Text style={styles.sectionCount}>{tracks.length - 1} songs</Text>
            </View>
          </>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Powered by <Text style={styles.footerBrand}>Jamendo</Text>
            </Text>
          </View>
        }
      />
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

  blobTop: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#7c3aed",
    opacity: 0.12,
  },
  blobBottom: {
    position: "absolute",
    bottom: -60,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#06b6d4",
    opacity: 0.1,
  },

  listContent: { paddingBottom: 32 },

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

  /* Featured */
  featuredCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    height: 240,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,10,20,0.74)",
    padding: 20,
    justifyContent: "flex-end",
  },
  featuredBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "#7c3aed",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  featuredArtist: { fontSize: 13, color: "#a0a0d8", marginBottom: 8 },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  featuredDuration: { color: "#8080b0", fontSize: 12 },
  genreChip: {
    backgroundColor: "#ffffff22",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  genreText: {
    color: "#c0c0e8",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  progressBarBg: {
    height: 3,
    backgroundColor: "#ffffff25",
    borderRadius: 2,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#7c3aed",
    borderRadius: 2,
  },
  featuredActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playBtn: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    minWidth: 100,
    alignItems: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  playBtnActive: { backgroundColor: "#5b21b6" },
  playBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  stopBtn: {
    backgroundColor: "#ffffff18",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  stopBtnText: { fontSize: 16 },

  /* Section */
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#e2e2ff" },
  sectionCount: { fontSize: 13, color: "#5a5a8a" },

  /* Track row */
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
  trackIndexWrap: {
    width: 28,
    alignItems: "center",
    marginRight: 10,
  },
  trackIndex: { color: "#4a4a7a", fontSize: 13, fontWeight: "600" },
  trackPlaying: { color: "#7c3aed", fontSize: 18, fontWeight: "800" },
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
  trackArtist: { fontSize: 12, color: "#6868a0", marginBottom: 2 },
  trackGenre: { fontSize: 10, color: "#4a4a70", textTransform: "capitalize" },

  miniProgressBg: {
    height: 2,
    backgroundColor: "#2a2a50",
    borderRadius: 1,
    marginTop: 5,
    overflow: "hidden",
  },
  miniProgressFill: {
    height: "100%",
    backgroundColor: "#7c3aed",
    borderRadius: 1,
  },

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

  footer: { alignItems: "center", paddingTop: 24, paddingBottom: 8 },
  footerText: { color: "#4a4a6a", fontSize: 12 },
  footerBrand: { color: "#7c3aed", fontWeight: "700" },
});
