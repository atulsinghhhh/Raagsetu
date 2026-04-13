import React, { useEffect, useRef, useState } from 'react'
import {View, Text, Image, TouchableOpacity,StyleSheet, Modal, Animated, Dimensions, Clipboard} from 'react-native'
import { Song } from '@/types/song'
import { useQueueStore } from '@/store/queueStore'
import { useLibraryStore } from '@/store/useLibraryStore'
import { AddToPlaylistSheet } from './AddToPlaylistSheet'


type Props = {
  song: Song
  onClose: () => void
  onRemove?: () => void  // optional — shown in playlist detail
}

export function SongMenu({ song, onClose, onRemove }: Props) {
  const slideY = useRef(new Animated.Value(300)).current
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false)
  const { likedIds, likeSong, unlikeSong } = useLibraryStore()
  const { playNext, addToQueue } = useQueueStore()
  const isLiked = likedIds.has(song.video_id)

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start()
  }, [])

  const close = () => {
    Animated.timing(slideY, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(onClose)
  }

  const handleAction = (action: () => void) => {
    action()
    close()
  }

  const menuItems = [
    {
      label: isLiked ? 'Remove from liked' : 'Like song',
      icon: isLiked ? '♥' : '♡',
      color: isLiked ? '#D4537E' : undefined,
      onPress: () => isLiked
        ? unlikeSong(song.video_id)
        : likeSong(song),
    },
    {
      label: 'Add to playlist',
      icon: '+',
      onPress: () => setShowAddToPlaylist(true),
      noClose: true,
    },
    {
      label: 'Play next',
      icon: '▶',
      onPress: () => playNext(song),
    },
    {
      label: 'Add to queue',
      icon: '≡',
      onPress: () => addToQueue(song),
    },
    {
      label: 'Copy song title',
      icon: '⎘',
      onPress: () => Clipboard.setString(`${song.title} - ${song.artist}`),
    },
    ...(onRemove ? [{
      label: 'Remove from playlist',
      icon: '✕',
      color: '#E24B4A',
      onPress: onRemove,
    }] : []),
  ]

  if (showAddToPlaylist) {
    return (
      <Modal transparent animationType="none" onRequestClose={close}>
        <TouchableOpacity style={styles.backdrop} onPress={close} activeOpacity={1} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
          <TouchableOpacity onPress={() => setShowAddToPlaylist(false)} style={styles.backRow}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <AddToPlaylistSheet song={song} onClose={close} />
        </Animated.View>
      </Modal>
    )
  }

  return (
    <Modal transparent animationType="none" onRequestClose={close}>
      <TouchableOpacity style={styles.backdrop} onPress={close} activeOpacity={1} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>

        {/* Song info header */}
        <View style={styles.songHeader}>
          <Image source={{ uri: song.thumbnail }} style={styles.headerThumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{song.title}</Text>
            <Text style={styles.headerArtist} numberOfLines={1}>{song.artist}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Menu items */}
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.menuItem}
            onPress={() => item.noClose ? item.onPress() : handleAction(item.onPress)}
          >
            <Text style={[styles.menuIcon, item.color && { color: item.color }]}>
              {item.icon}
            </Text>
            <Text style={[styles.menuLabel, item.color && { color: item.color }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 24 }} />
      </Animated.View>
    </Modal>
  )
}

const { height } = Dimensions.get('window')

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    minHeight: 320,
  },
  songHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  headerThumb: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  headerArtist: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#e5e5e5',
    marginBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuIcon: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
    color: '#555',
  },
  menuLabel: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  backRow: {
    padding: 14,
    paddingHorizontal: 20,
  },
  backText: {
    fontSize: 14,
    color: '#185FA5',
  },
})