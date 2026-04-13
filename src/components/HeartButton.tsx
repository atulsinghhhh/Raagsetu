import { useLibraryStore } from "@/store/useLibraryStore";
import { Song } from "@/types/song";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";


type props = {song: Song; size?: number;}

export function HeartButton({song, size = 24}: props) {
    const { likedIds, likeSong, unlikeSong } = useLibraryStore();
    const isLiked = likedIds.has(song.video_id);

    const toggleLike = () => {
        if(isLiked) {
            unlikeSong(song.video_id);
        } else {
            likeSong(song);
        }
    }

    return (
        <TouchableOpacity
            onPress={toggleLike}
            hitSlop={{top:8,bottom:8,left:8,right:8}}
        >
            <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={size}
                color={isLiked ? "#22c55e" : "white"}
            />


        </TouchableOpacity>
    )
}