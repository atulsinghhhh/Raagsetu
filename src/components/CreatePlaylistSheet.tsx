import { useLibraryStore } from "@/store/useLibraryStore";
import { useState } from "react";
import  * as ImagePicker  from "expo-image-picker";
import { supabase } from "@/lib/supabase/client";
import { Alert, StyleSheet, TextInput, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";


export function CreatePlaylistSheet({ onClose }: { onClose?: () => void } = {}){

    const [name,setName] = useState('');
    const [coverUri,setCoverUri] = useState<string| null>(null);
    const [loading,setLoading] = useState(false);
    const { addPlaylist } = useLibraryStore();

    const pickCover = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
            aspect: [1, 1],
        })

        if(!result.canceled){
            setCoverUri(result.assets[0].uri);
        }
    }

    const create = async ()=> {
        if(name.trim()) return;
        setLoading(true);

        try {
            const { data: {user}} = await supabase.auth.getUser();

            let cover_url = null;
            if(coverUri) {
                const ext=coverUri.split('.').pop();
                const path = `playlist_covers/${user?.id}_${Date.now()}.${ext}`;
                const blob = await fetch(coverUri).then(res=>res.blob());

                await supabase.storage.from('playlist-covers').upload(path,blob)
                const {data} = supabase.storage.from('playlist-covers').getPublicUrl(path);
                cover_url = data.publicUrl;
            }

            const {data: playlist} = await supabase.from('playlists').insert({
                owner_id: user?.id,
                name: name.trim(),
                cover_url
                }).select().single();

            if(playlist){
                addPlaylist(playlist);
                if (onClose) onClose();
            }

        } catch {
            Alert.alert("Error", "Failed to create playlist. Please try again.");
            return;
        } finally{
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}> 
            <TouchableOpacity onPress={pickCover}>
                {coverUri ? 
                    <Image source={{uri: coverUri}} style={styles.cover} /> :
                    <View style={styles.coverPlaceholder}/>      
                }
            </TouchableOpacity>

            <TextInput
                placeholder={"Playlist name"}
                value={name}
                onChangeText={setName}
                style={styles.input}
            />

            <TouchableOpacity onPress={create} disabled={loading}>
                <Text>{loading ? "creating..." : "Create Playlist"}</Text>
            </TouchableOpacity>

        </View>
    )

}

const styles= StyleSheet.create({
    container: {
        padding: 20,
        gap: 14
    },
    cover: {
        width: 80,
        height: 80,
        borderRadius: 8,
    }, 
    coverPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#eee',
    },
    coverPlaceholderText: {
        color: '#666',
        textAlign: 'center',
        lineHeight: 80,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding:10
    }

})