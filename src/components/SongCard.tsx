import React from "react";
import { View,Text,Image,TouchableOpacity,StyleSheet,} from "react-native";
import { Song } from "@/types/song";

interface SongCardProps {
  song: Song;
  onPress: (song: Song) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SongCard({ song, onPress }: SongCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(song)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: song.thumbnail }}
        style={styles.thumbnail}
      />

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>

      <Text style={styles.duration}>{formatDuration(song.duration_sec)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: "#12121e",
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#000000',
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 3,
  },
  artist: {
    fontSize: 12,
    color: "#adaaaa",
  },
  duration: {
    fontSize: 11,
    color: "#adaaaa",
  },
});
