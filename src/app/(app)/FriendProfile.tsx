import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Image } from "react-native";
import { supabase } from "@/lib/supabase/client";
import { SongRow } from "@/components/SongRow";
import { Song, Playlist } from "@/types/song";

export default function FriendProfileScreen() {
    const { friendId } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [recentPlays, setRecentPlays] = useState<Song[]>([]);
    const [sharedPlaylists, setSharedPlaylists] = useState<Playlist[]>([]);
    const [friendProfile, setFriendProfile] = useState<any>(null);

    useEffect(() => {
        if (!friendId) return;

        async function fetchProfile() {
            try {
                // Fetch profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', friendId)
                    .single();
                setFriendProfile(profileData);

                // Fetch recent plays
                const { data: historyData } = await supabase
                    .from('play_history')
                    .select('songs(*)')
                    .eq('user_id', friendId)
                    .order('played_at', { ascending: false })
                    .limit(10);
                
                if (historyData) {
                    const mappedSongs = historyData.map((h: any) => h.songs).filter(Boolean);
                    setRecentPlays(mappedSongs);
                }

                // Fetch shared playlists
                // Assuming playlists have an 'is_shared' boolean or we just pull playlists owned by friend
                const { data: playlistData } = await supabase
                    .from('playlists')
                    .select('*, playlist_songs(count)')
                    .eq('owner_id', friendId);
                
                if (playlistData) {
                    const mappedPl = playlistData.map((p: any) => ({
                        ...p,
                        songs_count: p.playlist_songs?.[0]?.count || 0
                    }))
                    setSharedPlaylists(mappedPl);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [friendId]);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0a0a14', justifyContent: 'center' }}>
                <ActivityIndicator color="#1D9E75" />
            </View>
        );
    }

    return (
        <FlatList
            style={{ flex: 1, backgroundColor: '#0a0a14' }}
            ListHeaderComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Image 
                        source={{ uri: friendProfile?.avatar_url || 'https://via.placeholder.com/100' }} 
                        style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#222' }} 
                    />
                    <Text style={{ fontSize: 20, color: '#fff', fontWeight: 'bold', marginTop: 12 }}>
                        {friendProfile?.name || friendProfile?.username || 'Friend'}
                    </Text>
                </View>
            }
            data={[{ id: 'header1', type: 'header', title: 'Recent Plays' }, ...recentPlays, { id: 'header2', type: 'header', title: 'Shared Playlists' }, ...sharedPlaylists]}
            keyExtractor={(item: any, index) => item.video_id || item.id || index.toString()}
            renderItem={({ item }: any) => {
                if (item.type === 'header') {
                    return <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', margin: 16 }}>{item.title}</Text>;
                }

                if (item.owner_id === friendId) {
                    // This is a playlist
                    return (
                        <View style={{ flexDirection: 'row', padding: 16, backgroundColor: '#141428', marginHorizontal: 16, marginVertical: 4, borderRadius: 8 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>{item.name}</Text>
                                <Text style={{ color: '#aaa', fontSize: 14 }}>{item.songs_count || 0} songs</Text>
                            </View>
                            { /* We could add join btn here if join-by-code flow works by pressing it */ }
                        </View>
                    );
                }

                // Otherwise it's a song
                if (item.video_id) {
                    return <SongRow song={item} showHeart={false} showMenu={false} />;
                }

                return null;
            }}
        />
    );
}
