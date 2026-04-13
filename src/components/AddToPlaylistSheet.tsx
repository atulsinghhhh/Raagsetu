import { supabase } from "@/lib/supabase/client";
import { useLibraryStore } from "@/store/useLibraryStore";
import { Song } from "@/types/song";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function AddToPlaylistSheet({ song, onClose }: { song: Song; onClose: () => void }) {
    const { playlists } = useLibraryStore();

    const [songInPlaylists, setSongInPlaylists] = useState<Set<string>>(new Set());
    const [adding, setAdding] = useState<string | null>(null);

    useEffect(() => {
        supabase.from('playlist_songs')
            .select('playlist_id')
            .eq('song_id', song.video_id)
            .then(({ data }) => {
                if (data) {
                    setSongInPlaylists(new Set(data.map(item => item.playlist_id)));
                }
            })
    }, [song.video_id])

    const addToPlaylist = async (playlistId: string) => {
        if (songInPlaylists.has(playlistId)) return;
        setAdding(playlistId);

        const { data: songRow } = await supabase.from('songs').select('id').eq('video_id', song.video_id).single();
        if (!songRow) {
            setAdding(null);
            return;
        }

        const { count } = await supabase
            .from('playlist_songs')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', playlistId)

        await supabase.from('playlist_songs').insert({
            playlist_id: playlistId,
            song_id: songRow.id,
            added_by: (await supabase.auth.getUser()).data.user?.id,
            position: (count ?? 0) + 1
        })

        setSongInPlaylists(s => new Set([...s, playlistId]))
        setAdding(null)
    }

    return (
        <View>
            <Text style={{ padding: 16, fontSize: 16, fontWeight: '500' }}>Add to playlist</Text>
            <FlatList
                data={playlists}
                keyExtractor={item => item.id}
                renderItem={({ item: pl }) => (
                    <TouchableOpacity
                        onPress={() => addToPlaylist(pl.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}
                    >
                        <View style={{ width: 40, height: 40, backgroundColor: '#eee', borderRadius: 4 }} />
                        <Text style={{ flex: 1, fontSize: 16 }}>{pl.name}</Text>
                        {adding === pl.id
                            ? <ActivityIndicator />
                            : songInPlaylists.has(pl.id)
                                ? <Ionicons name="checkmark-circle" color="#1D9E75" size={24} />
                                : <Ionicons name="add-circle-outline" color="#888" size={24} />
                        }
                    </TouchableOpacity>
                )}
            />
        </View>
    )
}
