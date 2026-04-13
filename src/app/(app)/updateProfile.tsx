import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { useAuth } from "@/context/AuthProvider";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase/client";

export default function UpdateProfileScreen() {
    const { user, updateUserProfile } = useAuth();
    
    // Initializing state with current user profile info or empty string
    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState(user?.username || "");
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload an avatar.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0]) {
            setLoading(true);
            try {
                const uri = result.assets[0].uri;
                const req = await fetch(uri);
                const blob = await req.blob();
                
                const ext = uri.split('.').pop() || 'jpg';
                const fileExt = ext.includes('?') ? ext.split('?')[0] : ext;
                const fileName = `${user?.id || 'user'}_${Date.now()}.${fileExt}`;
                
                const { data, error } = await supabase.storage.from('avatars').upload(fileName, blob, {
                    contentType: `image/${fileExt}`
                });
                
                if (error) {
                    throw error;
                }
                
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
                setAvatarUrl(publicUrl);
                Alert.alert("Success", "Avatar uploaded. Hit Save to lock it in!");
            } catch (err: any) {
                console.error(err);
                Alert.alert("Upload Failed", err?.message || "Could not upload image to Supabase.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpdate = async () => {
        if (!name.trim() || !username.trim()) {
            Alert.alert("Error", "Name and username are required");
            return;
        }

        setLoading(true);
        try {
            await updateUserProfile({
                name: name.trim(),
                username: username.trim(),
                avatar_url: avatarUrl.trim()
            });
            Alert.alert("Success", "Your profile has been updated!");
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert("Update Failed", "An error occurred while updating profile");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Update Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.formContainer}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} disabled={loading} activeOpacity={0.8}>
                        <Image 
                            source={{ uri: avatarUrl || 'https://via.placeholder.com/150' }} 
                            style={styles.avatar} 
                        />
                        <View style={styles.editAvatarOverlay}>
                            <Ionicons name="camera" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>Tap image to upload, or paste a URL below</Text>
                </View>

                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter full name"
                    placeholderTextColor="#5a5a8a"
                />

                <Text style={styles.label}>Username</Text>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter username"
                    placeholderTextColor="#5a5a8a"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Avatar URL</Text>
                <TextInput
                    style={styles.input}
                    value={avatarUrl}
                    onChangeText={setAvatarUrl}
                    placeholder="https://example.com/image.png"
                    placeholderTextColor="#5a5a8a"
                    autoCapitalize="none"
                />

                <TouchableOpacity 
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
                    onPress={handleUpdate}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0a0a14",
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#141428',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    formContainer: {
        padding: 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1e1e3a',
        marginBottom: 12,
    },
    avatarHint: {
        fontSize: 12,
        color: '#888',
        marginTop: 8,
    },
    editAvatarOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 0,
        backgroundColor: '#7c3aed',
        borderRadius: 16,
        padding: 6,
        borderWidth: 2,
        borderColor: '#0a0a14',
    },
    label: {
        fontSize: 14,
        color: '#d0d0f0',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#1e1e3a',
        color: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    saveBtn: {
        backgroundColor: '#7c3aed',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
