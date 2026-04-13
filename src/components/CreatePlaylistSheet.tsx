import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase/client";
import { useLibraryStore } from "@/store/useLibraryStore";
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base-64';

export function CreatePlaylistSheet({ onClose }: { onClose?: () => void } = {}){

    const [name,setName] = useState('');
    const [coverUri,setCoverUri] = useState<string| null>(null);
    const [loading,setLoading] = useState(false);
    const { addPlaylist } = useLibraryStore();

    const pickCover = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsEditing: true,
            aspect: [1, 1],
        })

        if(!result.canceled){
            setCoverUri(result.assets[0].uri);
        }
    }

    const create = async ()=> {
        if(!name.trim()) {
            Alert.alert("Input Required", "Please enter a playlist name");
            return;
        }
        setLoading(true);

        try {
            const { data: {user}} = await supabase.auth.getUser();

            let cover_url = null;
            if(coverUri) {
                const ext = coverUri.split('.').pop();
                const path = `${user?.id}_${Date.now()}.${ext}`;
                
                // Android compatible blob read
                const base64 = await FileSystem.readAsStringAsync(coverUri, { 
                    encoding: 'base64' 
                });
                const binaryStr = decode(base64);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                }

                const { error: uploadError } = await supabase.storage
                    .from('playlist-covers')
                    .upload(path, bytes.buffer, {
                        contentType: `image/${ext}`,
                        upsert: true
                    });
                
                if (uploadError) throw uploadError;

                const {data} = supabase.storage.from('playlist-covers').getPublicUrl(path);
                cover_url = data.publicUrl;
            }

            const {data: playlist, error: insertError} = await supabase.from('playlists').insert({
                owner_id: user?.id,
                name: name.trim(),
                cover_url
                }).select().single();

            if (insertError) throw insertError;

            if(playlist){
                addPlaylist(playlist);
                if (onClose) onClose();
                Alert.alert("Success", "Playlist created!");
            }

        } catch (err: any) {
            console.error("Create playlist error:", err);
            Alert.alert("Error", err.message || "Failed to create playlist.");
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