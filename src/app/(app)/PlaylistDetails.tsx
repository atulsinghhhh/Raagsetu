import { supabase } from "@/lib/supabase/client";
import { useQueueStore } from "@/store/queueStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { Playlist, Song } from "@/types/song";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { usePlayer } from "@/hook/usePlayer";
import { SongRow } from "@/components/SongRow";
import { Alert, FlatList, Text, TouchableOpacity, View,StyleSheet } from "react-native";
import { sharePlaylist } from "@/lib/utils/playlistHelpers";



export function PlaylistDetails({route}: any){
    const { playlistId } = route.params;
    const [songs,setSongs] = useState<Song[]>([]);
    const [playlist,setPlaylist] = useState<Playlist|null>(null);
    const {playQueue} = useQueueStore();
    const {removePlaylist} = useLibraryStore();
    const { currentSong } = usePlayer();

    const navigateion = useNavigation();

    useEffect(()=>{
        loadPlaylist();
    },[playlistId])

    const  loadPlaylist = async() =>{
        const {data} = await supabase.from('playlist_songs')
            .select('songs(*),position')
            .eq('playlist_id',playlistId)
            .order('position',{ascending:true});
        setSongs(data?.map((item:any)=>item.songs) || []);
    }

    const removeFromPlaylist = async(songId: string) => {
        setSongs(songs.filter(s=>s.video_id !== songId));
        await supabase.from('playlist_songs')
            .delete()
            .eq('playlist_id',playlistId)
            .eq('song_id',songId);
    }

    const deletePlaylist = async() => {
        Alert.alert("Confirm Delete","Are you sure you want to delete this playlist?",[
            {text: "Cancel"},
            {text: "Delete", style:"destructive", onPress: async()=>{
                await supabase.from('playlists').delete().eq('id',playlistId);
                removePlaylist(playlistId);
                navigateion.goBack();
            }}
        ])
    }

    const handleSharePlaylist = async () => {
        try {
            await sharePlaylist(playlistId);
        } catch(e) {
            console.error(e);
            Alert.alert("Failed to share playlist");
        }
    }

    return (
        <View style={styles.container}>
            <View>
                <TouchableOpacity onPress={()=> playQueue(songs)}>
                    <Text>Play all</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={()=>playQueue([...songs].sort(()=> Math.random()-0.5))}>
                    <Text>Shuffle play</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSharePlaylist}>
                    <Text>Share playlist</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={deletePlaylist}>
                    <Text>Delete playlist</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={songs}
                keyExtractor={item => item.video_id}
                renderItem={({item, index})=>(
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

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex:1,
    },
    songItem: {
        flexDirection:'row',
        justifyContent:'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1e1e3a'
    },
    removeText: {
        color: 'red'
    }
})