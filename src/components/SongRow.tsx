import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Song } from '@/types/song'
import { usePlayer } from '@/hook/usePlayer'
import { HeartButton } from './HeartButton'
import { SongMenu } from './SongMenu'

type Props = {
  song: Song
  showHeart?: boolean      // show heart icon (default true)
  showMenu?: boolean       // show 3-dot menu (default true)
  showIndex?: number       // show position number instead of thumbnail
  isPlaying?: boolean      // highlight row when this song is active
  onPress?: () => void     // override default play behaviour
  onLongPress?: () => void // e.g. remove from playlist
}

export function SongRow({
  song,
  showHeart = true,
  showMenu = true,
  showIndex,
  isPlaying = false,
  onPress,
  onLongPress,
}: Props) {
  const { playSong } = usePlayer()
  const [menuVisible, setMenuVisible] = useState(false)

  const handlePress = () => {
    if (onPress) { onPress(); return }
    playSong(song)
  }

  const formatDuration = (sec: number) => {
    if (!sec) return '0:00'
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.row, isPlaying && styles.rowActive]}
        onPress={handlePress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {/* Left — thumbnail or index number */}
        {showIndex !== undefined ? (
          <View style={styles.indexBox}>
            {isPlaying
              ? <ActivityIndicator size="small" color="#1D9E75" />
              : <Text style={styles.indexText}>{showIndex}</Text>
            }
          </View>
        ) : (
          <Image
            source={{ uri: song.thumbnail }}
            style={styles.thumb}
            resizeMode="cover"
          />
        )}

        {/* Middle — title + artist */}
        <View style={styles.info}>
          <Text
            style={[styles.title, isPlaying && styles.titleActive]}
            numberOfLines={1}
          >
            {song.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artist} · {formatDuration(song.duration_sec)}
          </Text>
        </View>

        {/* Right — heart + menu */}
        <View style={styles.actions}>
          {showHeart && <HeartButton song={song} size={20} />}
          {showMenu && (
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.dots}>···</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Song options bottom sheet */}
      {menuVisible && (
        <SongMenu
          song={song}
          onClose={() => setMenuVisible(false)}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  rowActive: {
    backgroundColor: 'rgba(29,158,117,0.06)',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  indexBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 15,
    color: '#888',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  titleActive: {
    color: '#1D9E75',
  },
  artist: {
    fontSize: 12,
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dots: {
    fontSize: 18,
    color: '#aaa',
    letterSpacing: 1,
  },
})