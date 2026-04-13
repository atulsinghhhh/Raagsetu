import { supabase } from "@/lib/supabase/client";
import { useQueueStore } from "@/store/queueStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { Song } from "@/types/song";
import { useEffect, useState } from "react";
import { usePlayer } from "@/hook/usePlayer";
import { SongRow } from "@/components/SongRow";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";


export function LikedSongsScreen(){
    const { likedIds } = useLibraryStore();
    const { playQueue } = useQueueStore();
    const { currentSong } = usePlayer();

    const [songs,setSongs] = useState<Song[]>([]);
    useEffect(()=>{
        const fetchLikedSongs = async () => {
            if(likedIds.size===0){
                setSongs([]);
                return;
            }

            const {data: {user}} = await supabase.auth.getUser();
            supabase.from('liked_songs')
                .select('songs(*),liked_at')
                .eq('user_id',user?.id)
                .in('song_id',Array.from(likedIds))
                .order('liked_at',{ascending:false})
                .then(({data})=>{
                    if(data){
                        setSongs(data.map((item:any)=>item.songs));
                    }
                })
        }
        fetchLikedSongs();
    },[likedIds])

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Liked Songs</Text>
                <TouchableOpacity onPress={()=>playQueue(songs)}>
                    <Text>Play all</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={songs}
                keyExtractor={item => item.video_id}
                renderItem={({item,index})=>(
                    <SongRow
                      song={item}
                      showHeart={true}
                      showMenu={true}
                      isPlaying={currentSong?.video_id === item.video_id}
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
    header: {
        flexDirection:'row',
        gap: 12,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        flex:1
    }
});