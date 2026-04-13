import { supabase } from "@/lib/supabase/client";
import { useQueueStore } from "@/store/queueStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { Song } from "@/types/song";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { usePlayer } from "@/hook/usePlayer";
import { SongRow } from "@/components/SongRow";
import { Alert, FlatList, Text, TouchableOpacity, View,StyleSheet } from "react-native";
import { sharePlaylist } from "@/lib/utils/playlistHelpers";



import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function PlaylistDetails() {
    const { playlistId } = useLocalSearchParams<{ playlistId: string }>();
    const [songs, setSongs] = useState<Song[]>([]);
    const { playQueue } = useQueueStore();
    const { removePlaylist, playlists } = useLibraryStore();
    const { currentSong } = usePlayer();
    const router = useRouter();

    const playlist = playlists.find(p => p.id === playlistId);

    useEffect(() => {
        if (playlistId) loadPlaylist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playlistId])

    const loadPlaylist = async () => {
        const { data } = await supabase.from('playlist_songs')
            .select('songs(*),position')
            .eq('playlist_id', playlistId)
            .order('position', { ascending: true });
        setSongs(data?.map((item: any) => item.songs) || []);
    }

    const removeFromPlaylist = async (songId: string) => {
        setSongs(songs.filter(s => s.video_id !== songId));
        await supabase.from('playlist_songs')
            .delete()
            .eq('playlist_id', playlistId)
            .eq('song_id', songId);
    }

    const deletePlaylist = async () => {
        Alert.alert("Delete Playlist", "Are you sure you want to delete this playlist?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    await supabase.from('playlists').delete().eq('id', playlistId);
                    removePlaylist(playlistId as string);
                    router.back();
                }
            }
        ])
    }

    const handleSharePlaylist = async () => {
        try {
            await sharePlaylist(playlistId as string);
        } catch (e) {
            console.error(e);
            Alert.alert("Failed to share playlist");
        }
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.title} numberOfLines={1}>{playlist?.name || "Playlist"}</Text>
                    <Text style={styles.subtitle}>{songs.length} Tracks • Nocturne Edition</Text>
                </View>
                <TouchableOpacity onPress={deletePlaylist} style={styles.moreBtn}>
                    <Ionicons name="trash-outline" size={22} color="#ff9dac" />
                </TouchableOpacity>
            </View>

            <View style={styles.actionBar}>
                <TouchableOpacity style={styles.playBtn} onPress={() => playQueue(songs)}>
                    <Ionicons name="play" size={20} color="#000" />
                    <Text style={styles.playBtnText}>Play All</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconAction} onPress={() => playQueue([...songs].sort(() => Math.random() - 0.5))}>
                    <Ionicons name="shuffle" size={24} color="#adaaaa" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconAction} onPress={handleSharePlaylist}>
                    <Ionicons name="share-social-outline" size={24} color="#adaaaa" />
                </TouchableOpacity>
            </View>

            <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={16} color="#4af8e3" />
                <Text style={styles.infoText}>Long press any track to remove it from the playlist</Text>
            </View>

            <FlatList
                data={songs}
                keyExtractor={item => item.video_id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <SongRow
                        song={item}
                        showIndex={index + 1}
                        showHeart={false}
                        showMenu={true}
                        isPlaying={currentSong?.video_id === item.video_id}
                        onLongPress={() => removeFromPlaylist(item.video_id)}
                    />
                )}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0e0e0e' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitleWrap: { flex: 1, marginLeft: 8 },
    title: { fontSize: 22, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: '#adaaaa', marginTop: 2 },
    moreBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 16,
        gap: 16,
    },
    playBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#c799ff',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        gap: 8,
    },
    playBtnText: { color: '#440080', fontWeight: '800', fontSize: 15 },
    iconAction: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#20201f',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(118, 117, 117, 0.15)',
    },

    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 12,
        backgroundColor: '#131313',
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
    },
    infoText: { fontSize: 13, color: '#adaaaa', flex: 1 },

    listContent: { paddingBottom: 100 },
})