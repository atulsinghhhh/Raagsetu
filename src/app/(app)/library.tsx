import { useLibraryStore } from "@/store/useLibraryStore"
import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import { View, Text, FlatList, Image, Modal, StyleSheet, TouchableOpacity } from "react-native"
import { CreatePlaylistSheet } from "@/components/CreatePlaylistSheet"


import { router } from "expo-router"

import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";

export default function LibraryScreen() {
  const { playlists, likedIds } = useLibraryStore()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={26} color="#4af8e3" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Liked Songs Hero Card */}
        <TouchableOpacity
          onPress={() => router.push('/likedSongs' as any)}
          style={styles.likedHero}
          activeOpacity={0.8}
        >
          <View style={styles.likedIcon}>
            <Ionicons name="heart" color="#c799ff" size={32} />
          </View>
          <View style={styles.likedInfo}>
            <Text style={styles.likedTitle}>Liked Songs</Text>
            <Text style={styles.likedMeta}>{likedIds.size} tracks • Updated recently</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#adaaaa" />
        </TouchableOpacity>

        {/* Playlists Title */}
        <View style={styles.sectionRow}>
           <Text style={styles.sectionTitle}>Your Playlists</Text>
        </View>

        {playlists.length === 0 ? (
           <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No playlists created yet</Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
                 <Text style={styles.createBtnText}>Create New</Text>
              </TouchableOpacity>
           </View>
        ) : (
          playlists.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push({ pathname: '/PlaylistDetails' as any, params: { playlistId: item.id } })}
              style={styles.playlistRow}
              activeOpacity={0.7}
            >
              <Image 
                source={{ uri: item.cover_url ?? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop' }}
                style={styles.playlistArt} 
              />
              <View style={styles.playlistInfo}>
                <Text style={styles.playlistName}>{item.name}</Text>
                <Text style={styles.playlistMeta}>By You • {item.song_count ?? 0} songs</Text>
              </View>
              <Ionicons name="ellipsis-vertical" size={16} color="#adaaaa" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

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
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff', letterSpacing: -1, flex: 1 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#20201f', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingBottom: 100 },
  likedHero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: '#131313',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(118, 117, 117, 0.15)',
  },
  likedIcon: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#20201f', alignItems: 'center', justifyContent: 'center' },
  likedInfo: { flex: 1, marginLeft: 16 },
  likedTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  likedMeta: { fontSize: 13, color: '#adaaaa', marginTop: 4 },

  sectionRow: { paddingHorizontal: 20, marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },

  playlistRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  playlistArt: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#131313' },
  playlistInfo: { flex: 1, marginLeft: 16 },
  playlistName: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  playlistMeta: { fontSize: 13, color: '#adaaaa', marginTop: 4 },

  emptyWrap: { padding: 48, alignItems: 'center' },
  emptyText: { color: '#adaaaa', fontSize: 15, textAlign: 'center' },
  createBtn: { marginTop: 20, backgroundColor: '#c799ff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  createBtnText: { color: '#440080', fontWeight: '800', fontSize: 14 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#20201f',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    minHeight: 300,
  }
})