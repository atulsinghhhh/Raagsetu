import { supabase } from "./client"

export async function savePlayHistory(video_id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

    const { data: song } = await supabase
        .from('songs')
        .select('id')
        .eq('video_id', video_id)
        .single()

    if (!song) return

    await supabase.from('play_history').insert({
        user_id: user.id,
        song_id: song.id
    })
    
}
