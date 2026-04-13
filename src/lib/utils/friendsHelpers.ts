import { useAuth } from "@/context/AuthProvider";
import { supabase } from "../supabase/client";
import { Song } from "@/types/song";

const APP_SCHEME = process.env.EXPO_PUBLIC_APP_SCHEME!;

export async function generateInviteLink(): Promise<string> {
    const {data: {user}} = await supabase.auth.getUser();
    if(!user) throw new Error("Not loggedIn");

    const { data: token } = await supabase.from('invite_tokens')
        .insert({ created_by: user.id })
        .select('token')
        .single()

    if (!token) throw new Error('Failed to create invite')

    return `${APP_SCHEME}://invite?token=${token.token}`
}


export async function acceptInvite(token: string): Promise<'success' | 'expired' | 'already_friends' | 'self'> {
    const {data: {user}} = await supabase.auth.getUser();
    if(!user) throw new Error("Not loggedIn");


    const { data: invite } = await supabase
        .from('invite_tokens')
        .select('*')
        .eq('token', token)
        .single()

    if (!invite) return 'expired'
    if (invite.used_by) return 'expired'
    if (new Date(invite.expires_at) < new Date()) return 'expired'
    if (invite.created_by === user.id) return 'self'

    const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(requester.eq.${user.id},addressee.eq.${invite.created_by}),and(requester.eq.${invite.created_by},addressee.eq.${user.id})`)
        .single()

    if (existing) return 'already_friends'

    await supabase.from('friendships').insert({
        requester: invite.created_by,
        addressee: user.id,
        status: 'accepted'
    })

    await supabase.from('invite_tokens').update({
        used_by: user.id,
        used_at: new Date().toISOString()
    }).eq('token', token)

    return 'success'
}


export async function updateNowPlaying(song: Song|null) {
    const {data: {user}} = await supabase.auth.getUser();
    if(!user) throw new Error("Not loggedIn");

    if(!song){
        await supabase.from('now_playing')
            .update({is_playing: false, updated_at: new Date().toISOString()})
            .eq('user_id',user.id)
        return;
    }

    await supabase.from('now_playing').upsert({
        user_id:    user.id,
        video_id:   song.video_id,
        title:      song.title,
        artist:     song.artist,
        thumbnail:  song.thumbnail,
        is_playing: true,
        updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    // TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
    // const song = event.track?.extras?.song ?? null
    // updateNowPlaying(song)  // non-blocking, fire and forget
    // })

    // TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
    // if (event.state === State.Paused || event.state === State.Stopped) {
    updateNowPlaying(null)

}
