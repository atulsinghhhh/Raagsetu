import { useFriendsRealtime } from "@/hook/useFriendsRealtime";
import { supabase } from "@/lib/supabase/client";
import { useFriendsStore } from "@/store/useFriendsStore";
import { useEffect } from "react";
import { Alert, View,Text,TouchableOpacity, FlatList, Share, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { generateInviteLink } from "@/lib/utils/friendsHelpers";

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet } from "react-native";

export default function FriendsScreen() {
    const { friends, pendingCount, isLoading, loadFriends } = useFriendsStore();
    useFriendsRealtime();

    useEffect(() => {
        loadFriends();
    }, []);

    const unfriend = async (friendship_id: string, friendId: string) => {
        Alert.alert('Remove friend?', '', [
            { text: 'Cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    await supabase.from('friendships').delete().eq('id', friendship_id)
                    useFriendsStore.getState().removeFriend(friendId)
                }
            }
        ])
    }

    const shareInviteLink = async () => {
        try {
            const link = await generateInviteLink();
            await Share.share({ message: `Let's listen to music together on Raagsetu! Add me as a friend: ${link}` });
        } catch (error) {
            console.log(error);
            Alert.alert("Failed to generate invite link");
        }
    };

    const navigation = useRouter();

    const handleFriendPress = (item: any) => {
        navigation.push({ pathname: '/(app)/FriendProfile', params: { friendId: item.id } } as any);
    };

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>Friends</Text>
                <Text style={styles.subtitle}>{friends.length} Friends Active Now</Text>
            </View>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>{pendingCount}</Text>
              </View>
            )}
            <TouchableOpacity onPress={shareInviteLink} style={styles.addBtn}>
              <Ionicons name="person-add-outline" size={22} color="#4af8e3" />
            </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Friend List */}
            <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Friend Activity</Text>
            </View>

            {friends.length === 0 ? (
                 <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>No friends yet</Text>
                    <TouchableOpacity onPress={shareInviteLink} style={styles.inviteBtn}>
                        <Text style={styles.inviteBtnText}>Invite someone</Text>
                    </TouchableOpacity>
                 </View>
            ) : (
                friends.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        onPress={() => handleFriendPress(item)}
                        onLongPress={() => unfriend(item.friendship_id, item.id)}
                        style={styles.friendRow}
                    >
                        <Image source={{ uri: item.avatar_url ?? undefined }} style={styles.avatar} />
                        <View style={styles.friendInfo}>
                            <Text style={styles.friendName}>{item.name || item.username}</Text>
                            {item.now_playing?.is_playing ? (
                                <View style={styles.playingBox}>
                                    <Ionicons name="musical-notes" size={12} color="#4af8e3" />
                                    <Text style={styles.playingText} numberOfLines={1}>
                                        {item.now_playing.title}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.statusText}>Not listening</Text>
                            )}
                        </View>
                        {item.now_playing?.thumbnail && item.now_playing.is_playing && (
                            <Image source={{ uri: item.now_playing.thumbnail }} style={styles.nowThumbnail} />
                        )}
                    </TouchableOpacity>
                ))
            )}
        </ScrollView>
      </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0e0e0e' },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 20,
        alignItems: 'center',
    },
    title: { fontSize: 28, fontWeight: '900', color: '#ffffff', letterSpacing: -1 },
    subtitle: { fontSize: 13, color: '#adaaaa', marginTop: 2 },
    pendingBadge: {
        backgroundColor: '#c799ff',
        borderRadius: 12,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    pendingText: { color: '#000', fontSize: 11, fontWeight: '700' },
    addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#20201f', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
    
    scrollContent: { paddingBottom: 100 },
    sectionRow: { paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },

    partyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 16,
        backgroundColor: '#131313',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(118, 117, 117, 0.15)',
    },
    partyIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    partyInfo: { flex: 1, marginLeft: 14 },
    partyName: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
    partyMeta: { fontSize: 12, color: '#adaaaa', marginTop: 2 },
    joinBtn: { backgroundColor: '#4af8e3', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
    joinBtnText: { color: '#00463f', fontSize: 13, fontWeight: '700' },

    friendRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#131313' },
    friendInfo: { flex: 1, marginLeft: 16 },
    friendName: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
    playingBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    playingText: { fontSize: 13, color: '#4af8e3', fontWeight: '500' },
    statusText: { fontSize: 13, color: '#adaaaa', marginTop: 4 },
    nowThumbnail: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#131313' },

    discoverScroll: { paddingHorizontal: 14 },
    fanCard: { width: 150, backgroundColor: '#131313', borderRadius: 24, padding: 20, alignItems: 'center', marginLeft: 6, marginRight: 6 },
    fanAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    fanName: { fontSize: 14, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
    fanTaste: { fontSize: 11, color: '#adaaaa', marginTop: 4 },

    emptyWrap: { padding: 48, alignItems: 'center' },
    emptyText: { color: '#adaaaa', fontSize: 15 },
    inviteBtn: { marginTop: 16, backgroundColor: '#20201f', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    inviteBtnText: { color: '#4af8e3', fontWeight: '700' },
});