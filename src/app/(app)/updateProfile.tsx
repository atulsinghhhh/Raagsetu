import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image,ScrollView } from "react-native";
import { useAuth } from "@/context/AuthProvider";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase/client";

import { SafeAreaView } from "react-native-safe-area-context";

import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base-64';

export default function UpdateProfileScreen() {
    const { user, updateUserProfile, signOut } = useAuth();
    
    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState(user?.username || "");
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
    const [loading, setLoading] = useState(false);

    // Sync state if user context updates (e.g. after background sync)
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setUsername(user.username || "");
            setAvatarUrl(user.avatar_url || "");
        }
    }, [user?.id, user?.name, user?.username, user?.avatar_url]);

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
                
                // Stable way to get blob-like data on Android/Expo
                const base64Data = await FileSystem.readAsStringAsync(uri, { 
                    encoding: 'base64' 
                });
                
                const binaryStr = decode(base64Data);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                }
                
                const ext = uri.split('.').pop() || 'jpg';
                const fileExt = ext.includes('?') ? ext.split('?')[0] : ext;
                const fileName = `${user?.id || 'user'}_${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, bytes.buffer, {
                    contentType: `image/${fileExt}`,
                    upsert: true
                });
                
                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
                setAvatarUrl(publicUrl);
                Alert.alert("Success", "Avatar uploaded. Hit Save to lock it in!");
            } catch (err: any) {
                console.error("Upload error detail:", err);
                Alert.alert("Upload Failed", err?.message || "Could not upload image.");
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

    const handleSignOut = () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: async () => await signOut() }
        ]);
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile & Settings</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} disabled={loading} activeOpacity={0.8}>
                        {avatarUrl ? (
                            <Image 
                                source={{ uri: avatarUrl }} 
                                style={styles.avatar} 
                            />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Ionicons name="person" size={40} color="#c799ff" />
                            </View>
                        )}
                        {loading ? (
                            <View style={[styles.editAvatarOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                                <ActivityIndicator color="#c799ff" />
                            </View>
                        ) : (
                            <View style={styles.editAvatarOverlay}>
                                <Ionicons name="camera" size={18} color="#000" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.userNameDisplay}>{user?.name}</Text>
                    <Text style={styles.userEmailDisplay}>{user?.email}</Text>
                </View>

                {/* Account Form */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Account Information</Text>
                    <View style={styles.inputWrap}>
                        <Ionicons name="person-outline" size={20} color="#adaaaa" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Full Name"
                            placeholderTextColor="#565555"
                        />
                    </View>
                    <View style={styles.inputWrap}>
                        <Ionicons name="at-outline" size={20} color="#adaaaa" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Username"
                            placeholderTextColor="#565555"
                            autoCapitalize="none"
                        />
                    </View>
                    <TouchableOpacity 
                        style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>App Settings</Text>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconWrap, { backgroundColor: '#4af8e322' }]}>
                             <Ionicons name="notifications-outline" size={20} color="#4af8e3" />
                        </View>
                        <Text style={styles.menuText}>Notifications</Text>
                        <Ionicons name="chevron-forward" size={18} color="#565555" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconWrap, { backgroundColor: '#82b1ff22' }]}>
                             <Ionicons name="lock-closed-outline" size={20} color="#82b1ff" />
                        </View>
                        <Text style={styles.menuText}>Privacy & Security</Text>
                        <Ionicons name="chevron-forward" size={18} color="#565555" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconWrap, { backgroundColor: '#ffca2822' }]}>
                             <Ionicons name="help-circle-outline" size={20} color="#ffca28" />
                        </View>
                        <Text style={styles.menuText}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={18} color="#565555" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, { marginTop: 20 }]} onPress={handleSignOut}>
                        <View style={[styles.menuIconWrap, { backgroundColor: '#ff9dac22' }]}>
                             <Ionicons name="log-out-outline" size={20} color="#ff9dac" />
                        </View>
                        <Text style={[styles.menuText, { color: '#ff9dac' }]}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#0e0e0e" },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 12,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#fff' },
    
    scrollContent: { paddingBottom: 120 },
    
    avatarSection: { alignItems: 'center', marginVertical: 32 },
    avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#131313' },
    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(118, 117, 117, 0.2)',
    },
    editAvatarOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#c799ff',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#0e0e0e',
    },
    userNameDisplay: { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 16 },
    userEmailDisplay: { fontSize: 14, color: '#adaaaa', marginTop: 4 },

    section: { paddingHorizontal: 20, marginBottom: 32 },
    sectionLabel: { fontSize: 13, fontWeight: '800', color: '#565555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#131313',
        borderRadius: 16,
        marginBottom: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(118, 117, 117, 0.1)',
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 14 },
    
    saveBtn: {
        backgroundColor: '#c799ff',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    saveBtnText: { color: '#000', fontSize: 15, fontWeight: '900' },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 16,
    },
    menuIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#fff' },
});
