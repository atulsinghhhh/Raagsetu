import { useFriendsRealtime } from "@/hook/useFriendsRealtime";
import { supabase } from "@/lib/supabase/client";
import { useFriendsStore } from "@/store/useFriendsStore";
import { useEffect } from "react";
import { Alert, View,Text,TouchableOpacity, FlatList, Share, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { generateInviteLink } from "@/lib/utils/friendsHelpers";


export default function FriendsScreen({navigation}: any) {

    const { friends, pendingCount, isLoading, loadFriends } = useFriendsStore();
    useFriendsRealtime();

    useEffect(()=>{
        loadFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    const unfriend = async (friendship_id: string,friendId: string)=>  {
        Alert.alert('Remove friend?', '', [
        { text: 'Cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
            await supabase.from('friendships').delete().eq('id', friendship_id)
            useFriendsStore.getState().removeFriend(friendId)
        }}
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

    return (

         <View style={{ flex:1 }}>

      {/* Header */}
      <View style={{ flexDirection:'row', padding:16, alignItems:'center' }}>
        <Text style={{ flex:1, fontSize:22, fontWeight:'500' }}>Friends</Text>
        {pendingCount > 0 && (
          <View style={{ backgroundColor:'#D4537E', borderRadius:10, paddingHorizontal:7, paddingVertical:2 }}>
            <Text style={{ color:'#fff', fontSize:11 }}>{pendingCount}</Text>
          </View>
        )}
        <TouchableOpacity onPress={shareInviteLink} style={{ marginLeft:12 }}>
          <Ionicons name="person-add-outline" size={22} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        refreshing={isLoading}
        onRefresh={loadFriends}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('FriendProfile', { friendId: item.id })}
            onLongPress={() => unfriend(item.friendship_id, item.id)}
            style={{ flexDirection:'row', padding:14, gap:12, alignItems:'center' }}
          >
            {/* Avatar */}
            <Image
              source={{ uri: item.avatar_url ?? undefined }}
              style={{ width:44, height:44, borderRadius:22, backgroundColor:'#eee' }}
            />

            <View style={{ flex:1 }}>
              <Text style={{ fontWeight:'500', fontSize:14 }}>{item.name || item.username}</Text>

              {item.now_playing?.is_playing ? (
                <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:2 }}>
                  {/* Animated music bars icon */}
                  <Text style={{ fontSize:12, color:'#1D9E75' }} numberOfLines={1}>
                    {item.now_playing.title}
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize:12, color:'#888' }}>Not listening</Text>
              )}
            </View>

            {item.now_playing?.thumbnail && item.now_playing.is_playing && (
              <Image
                source={{ uri: item.now_playing.thumbnail }}
                style={{ width:36, height:36, borderRadius:4 }}
              />
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding:32, alignItems:'center' }}>
            <Text style={{ color:'#888' }}>No friends yet</Text>
            <TouchableOpacity onPress={shareInviteLink} style={{ marginTop:12 }}>
              <Text style={{ color:'#1D9E75' }}>Invite someone</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
    )
}