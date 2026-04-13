import { joinSharedPlaylist } from "@/lib/utils/playlistHelpers"
import { useState } from "react"
import { Alert, TextInput, TouchableOpacity, View,Text } from "react-native"

export default function JoinPlaylistScreen({ navigation }: any) {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const join = async () => {
        if (code.trim().length !== 6) {
            setError('Enter the 6-character code')
            return
        }
        setLoading(true)
        setError('')
        const result = await joinSharedPlaylist(code)
        setLoading(false)

        if (result === 'success') {
            Alert.alert('Joined!', 'Playlist added to your library.')
            navigation.goBack()
        } else if (result === 'not_found') {
            setError('Code not found or sharing disabled')
        } else if (result === 'already_joined') {
            setError('You already have this playlist')
        }
    }

    return (
        <View style={{ flex:1, padding:24 }}>
            <Text style={{ fontSize:22, fontWeight:'500', marginBottom:8 }}>Join a playlist</Text>
            <Text style={{ color:'#adaaaa', marginBottom:24 }}>Ask your friend for the 6-character code</Text>
            <TextInput
                placeholder="Enter code e.g. AB12CD"
                value={code}
                onChangeText={t => setCode(t.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                style={{ borderWidth:0.5, borderRadius:8, padding:14, fontSize:20,
                letterSpacing:6, textAlign:'center', marginBottom:12 }}
            />
            {error ? <Text style={{ color:'#E24B4A', marginBottom:12, fontSize:13 }}>{error}</Text> : null}
            <TouchableOpacity
                onPress={join}
                disabled={loading}
                style={{ backgroundColor:'#1D9E75', borderRadius:8, padding:14, alignItems:'center' }}
            >
                <Text style={{ color:'#fff', fontWeight:'500' }}>{loading ? 'Joining...' : 'Join playlist'}</Text>
            </TouchableOpacity>
        </View>
    )
}