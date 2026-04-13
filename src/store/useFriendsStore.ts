import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";

type NowPlaying = {
    video_id: string;
    title: string;
    artist: string;
    thumbnail: string;
    is_playing: boolean;
    updated_at: string;
};

type Friend = {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
    now_playing: NowPlaying | null;
    friendship_id: string;
};

type FriendsStore = {
    friends: Friend[];
    pendingCount: number;
    isLoading: boolean;
    loadFriends: () => Promise<void>;
    patchNowPlaying: (userId: string, np: NowPlaying | null) => void;
    removeFriend: (friendId: string) => void;
};

export const useFriendsStore = create<FriendsStore>()((set, get) => ({
    friends: [],
    pendingCount: 0,
    isLoading: false,

    loadFriends: async () => {
        set({ isLoading: true });

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
        set({ isLoading: false });
        return;
        }

        const { data } = await supabase
        .from("friendships")
        .select(`
            id,
            requester_profile:profiles!requester(id,username,name,avatar_url),
            addressee_profile:profiles!addressee(id,username,name,avatar_url),
            requester, 
            addressee
        `)
        .eq("status", "accepted")
        .or(`requester.eq.${user.id},addressee.eq.${user.id}`);

        const friendIds = (data ?? []).map((f: any) => ({
        id: f.requester === user.id ? f.addressee : f.requester,
        profile:
            f.requester === user.id
            ? f.addressee_profile
            : f.requester_profile,
        friendship_id: f.id,
        }));

        const ids = friendIds.map((f) => f.id);

        const { data: nowPlayingRows } = ids.length
        ? await supabase
            .from("now_playing")
            .select("*")
            .in("user_id", ids)
        : { data: [] };

        const npMap = Object.fromEntries(
            (nowPlayingRows ?? []).map((np: any) => [np.user_id, np])
        );

        const friends: Friend[] = friendIds.map((f) => ({
            id: f.id,
            username: f.profile?.username ?? "",
            name: f.profile?.name ?? "",
            avatar_url: f.profile?.avatar_url ?? "",
            now_playing: npMap[f.id] ?? null,
            friendship_id: f.friendship_id,
        }));

        const { count } = await supabase
            .from("friendships")
            .select("*", { count: "exact", head: true })
            .eq("addressee", user.id)
            .eq("status", "pending");

        set({
            friends,
            pendingCount: count ?? 0,
            isLoading: false,
        });
    },

    patchNowPlaying: (userId, np) => {
        set((s) => ({
            friends: s.friends.map((f) =>
                f.id === userId ? { ...f, now_playing: np } : f
            ),
        }));
    },

    removeFriend: (friendId) =>
        set((s) => ({
        friends: s.friends.filter((f) => f.id !== friendId),
    })),
}));