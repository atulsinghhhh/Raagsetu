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
              ? <ActivityIndicator size="small" color="#4af8e3" />
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  rowActive: {
    backgroundColor: '#131313',
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#000000',
  },
  indexBox: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 15,
    color: '#adaaaa',
    fontWeight: '600',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  titleActive: {
    color: '#c799ff',
  },
  artist: {
    fontSize: 13,
    color: '#adaaaa',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dots: {
    fontSize: 18,
    color: '#adaaaa',
    letterSpacing: 1,
  },
})