import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import { LibraryState, Playlist, Song } from "@/types/song";


export const useLibraryStore = create<LibraryState>()((set, get) => ({
    likedIds: new Set(),
    playlists: [],
    recentlyHistory: [],
    isLoading: false,

    loadLibrary: async () => {
        set({isLoading: true})
        const {data: {user}} = await supabase.auth.getUser();
        if(!user) {
            set({ isLoading: false });
            return;
        }

        const {data: liked} = await supabase
            .from('liked_songs')
            .select('songs(video_id)')
            .eq('user_id', user.id);

        const likedIds = new Set<string>(
            liked?.map((item: any) => item.songs?.video_id) || []
        );

        const { data: playlists } = await supabase
            .from('playlists')
            .select('*, playlist_songs(count)')
            .eq('owner_id', user.id)
            .order('updated_at', { ascending: false })

        // Load recent history
        const { data: history } = await supabase
            .from('play_history')
            .select('songs(*)')
            .eq('user_id', user.id)
            .order('played_at', { ascending: false })
            .limit(20)

        set({
            likedIds,
            playlists: (playlists as any[])?.map(p => ({
                id: p.id,
                name: p.name,
                cover_url: p.cover_url,
                owner_id: p.owner_id,
                song_count: p.playlist_songs?.[0]?.count || 0
            })) ?? [],
            recentlyHistory: history?.map((h: any) => h.songs) ?? [],
            isLoading: false
        })

    },

    likeSong: async (song: Song) => {
        set(s => ({ likedIds: new Set([...s.likedIds, song.video_id]) }))

        const { data: { user } } = await supabase.auth.getUser();
        
        // Upsert song into 'songs' table first
        const { data: songData, error: songError } = await supabase
            .from('songs')
            .upsert({
                video_id: song.video_id,
                title: song.title,
                artist: song.artist,
                thumbnail: song.thumbnail,
                duration_sec: song.duration_sec
            }, { onConflict: 'video_id' })
            .select('id')
            .single();

        if (songError || !songData) {
            console.error("Error upserting song:", songError);
            return;
        }

        await supabase
            .from('liked_songs')
            .insert({ user_id: user?.id, song_id: songData.id });
    },

    unlikeSong: async (video_id: string) => {
        
        set(s => {
            const next = new Set(s.likedIds)
            next.delete(video_id)
            return { likedIds: next }
        })

        const { data: { user }} = await supabase.auth.getUser();
        const { data: songRow } = await supabase
            .from('songs')
            .select('id')
            .eq('video_id', video_id)
            .single();

        if(!songRow) return;

        await supabase
            .from('liked_songs')
            .delete()
            .eq('user_id', user?.id)
            .eq('song_id', songRow.id);
    },

    addPlaylist: (playlist: Playlist) => {
        set(s => ({ playlists: [playlist, ...s.playlists] }));
    },

    removePlaylist: (id: string) => {
        set(s => ({ playlists: s.playlists.filter(p => p.id !== id) }));
    },

    addToHistory: async (song: Song) => {
        set(s => ({
            recentlyHistory: [song, ...s.recentlyHistory.filter(h => h.video_id !== song.video_id)].slice(0, 20)
        }));

        const { data: { user } } = await supabase.auth.getUser();
        
        // Upsert song into 'songs' table first
        const { data: songData } = await supabase
            .from('songs')
            .upsert({
                video_id: song.video_id,
                title: song.title,
                artist: song.artist,
                thumbnail: song.thumbnail,
                duration_sec: song.duration_sec
            }, { onConflict: 'video_id' })
            .select('id')
            .single();

        if (!songData) return;

        await supabase
            .from('play_history')
            .insert({ user_id: user?.id, song_id: songData.id });
    }
}));