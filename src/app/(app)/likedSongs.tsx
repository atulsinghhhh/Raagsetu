import { supabase } from "@/lib/supabase/client";
import { useQueueStore } from "@/store/queueStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { Song } from "@/types/song";
import { useEffect, useState } from "react";
import { usePlayer } from "@/hook/usePlayer";
import { SongRow } from "@/components/SongRow";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";


import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function LikedSongsScreen(){
    const { likedIds } = useLibraryStore();
    const { playQueue } = useQueueStore();
    const { currentSong } = usePlayer();
    const router = useRouter();

    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLikedSongs = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('liked_songs')
            .select('songs(*), liked_at')
            .eq('user_id', user.id)
            .order('liked_at', { ascending: false });

        if (error) {
            console.error("Error fetching liked songs:", error);
        } else if (data) {
            // Filter out any null songs and map to the Song type
            const songList = data
                .filter((item: any) => item.songs !== null)
                .map((item: any) => item.songs);
            setSongs(songList);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchLikedSongs();
    }, [likedIds.size]) // Re-fetch when the count changes

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                <View style={styles.titleWrap}>
                    <Text style={styles.title}>Liked Songs</Text>
                    <Text style={styles.subtitle}>{songs.length} Tracks</Text>
                </View>
                {songs.length > 0 && (
                    <TouchableOpacity style={styles.playAllBtn} onPress={() => playQueue(songs)}>
                        <Ionicons name="play" size={20} color="#000" />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={songs}
                keyExtractor={item => item.video_id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <SongRow
                        song={item}
                        showHeart={true}
                        showMenu={true}
                        isPlaying={currentSong?.video_id === item.video_id}
                    />
                )}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyWrap}>
                            <Ionicons name="heart-dislike-outline" size={64} color="#20201f" />
                            <Text style={styles.emptyText}>No liked songs yet</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0e0e0e',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    titleWrap: { flex: 1 },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 13,
        color: '#adaaaa',
        marginTop: 2,
    },
    playAllBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#c799ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: { paddingBottom: 100 },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#adaaaa',
        fontWeight: '600',
    }
});