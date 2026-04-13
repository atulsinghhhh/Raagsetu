import { useLibraryStore } from "@/store/useLibraryStore"
import { useState } from "react"
import { TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { View, Text, FlatList, Image, Modal, StyleSheet } from "react-native"
import { CreatePlaylistSheet } from "@/components/CreatePlaylistSheet"


import { router } from "expo-router"

export default function LibraryScreen({ navigation }: any) {
  const { playlists, likedIds } = useLibraryStore()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <View style={{ flex:1, backgroundColor:'#0a0a14', paddingTop: 40 }}>
      <View style={{ flexDirection:'row', padding:16, alignItems:'center' }}>
        <Text style={{ flex:1, fontSize:22, fontWeight:'500', color: '#fff' }}>Your Library</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Liked Songs fixed shortcut */}
      <TouchableOpacity
        onPress={() => router.push('/likedSongs' as any)}
        style={{ flexDirection:'row', padding:14, gap:12, alignItems:'center' }}
      >
        <View style={{ width:48, height:48, borderRadius:8, backgroundColor:'#FBEAF0', alignItems:'center', justifyContent:'center' }}>
          <Ionicons name="heart" color="#D4537E" size={22} />
        </View>
        <View>
          <Text style={{ fontWeight:'500', color: '#fff' }}>Liked Songs</Text>
          <Text style={{ fontSize:12, color:'#888' }}>{likedIds.size} songs</Text>
        </View>
      </TouchableOpacity>

      {/* Playlists */}
      <FlatList
        data={playlists}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/PlaylistDetails' as any, params: { playlistId: item.id } })}
            style={{ flexDirection:'row', padding:14, gap:12, alignItems:'center' }}
          >
            <Image source={{ uri: item.cover_url ?? undefined }}
              style={{ width:48, height:48, borderRadius:8, backgroundColor:'#eee' }} />
            <View>
              <Text style={{ fontWeight:'500', color: '#fff' }}>{item.name}</Text>
              <Text style={{ fontSize:12, color:'#888' }}>{item.song_count ?? 0} songs</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Bottom sheet for create */}
      {showCreate && (
        <Modal animationType="slide" transparent={true} visible={showCreate} onRequestClose={() => setShowCreate(false)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowCreate(false)}>
            <View style={styles.modalContent}>
              <CreatePlaylistSheet onClose={() => setShowCreate(false)} />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
  }
})