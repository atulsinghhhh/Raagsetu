import { useAuth } from "@/context/AuthProvider";
import { supabase } from "../supabase/client";
import { useLibraryStore } from "@/store/useLibraryStore";
import { Share } from "react-native";

const APP=process.env.EXPO_PUBLIC_APP_SCHEME

export async function sharePlaylist(playlistId: string): Promise<string> {
    const code = Math.random().toString(36).substring(2,8).toUpperCase();

    await supabase.from('playlists').update({
        is_shared: true,
        share_code: code
    }).eq('id', playlistId)

    const link=`${APP}://playlist?code=${code}`;
    await Share.share({
        message: `Join my playlist on [APP]: ${link}\n\nOr enter code: ${code}`
    })

    return code
}

export async function joinSharedPlaylist(code: string): Promise<'success' | 'not_found' | 'already_joined'> {
    const {data: {user}} = await supabase.auth.getUser();
    if(!user) return 'not_found';

    const { data: playlist } = await supabase
        .from('playlists')
        .select('id, name, cover_url, owner_id')
        .eq('share_code', code.toUpperCase())
        .eq('is_shared', true)
        .single()

    if (!playlist) return 'not_found'
    if (playlist.owner_id === user.id) return 'already_joined'

    const { error } = await supabase
        .from('playlist_collaborators')
        .insert({ playlist_id: playlist.id, user_id: user.id, role: 'editor' })

    if (error?.code === '23505') return 'already_joined'

    useLibraryStore.getState().addPlaylist(playlist)
    return 'success'
}