import { supabase } from "@/lib/supabase/client";
import { useFriendsStore } from "@/store/useFriendsStore";
import { useEffect } from "react";


export function useFriendsRealtime() {
    const {friends,patchNowPlaying} = useFriendsStore();
    
    useEffect(()=>{
        if(friends.length===0) return;

        const friendIds = friends.map(f=>f.id);

        const channel = supabase
            .channel('friends-now-playing')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'now_playing',
                    filter: `user_id=in.(${friendIds.join(',')})`
                },
                (payload)=>{
                    const row=payload.new as any
                    const userId= row?.user_id
                    if(!userId) return;

                    if(payload.eventType==='DELETE'){
                        patchNowPlaying(userId,null)
                    }
                    else{
                        patchNowPlaying(userId, {
                            video_id:   row.video_id,
                            title:      row.title,
                            artist:     row.artist,
                            thumbnail:  row.thumbnail,
                            is_playing: row.is_playing,
                            updated_at: row.updated_at
                        })
                    }
                }
            )
            .subscribe()

        return ()=> {supabase.removeChannel(channel)}
    },[friends.length])
}