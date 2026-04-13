export type Song ={
  video_id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration_sec: number;
  audio_url?: string;
}


export type Playlist = {
    id: string;
    name: string;
    cover_url: string | null;
    owner_id: string;
    song_count?: number;
}

export type LibraryState = {
  likedIds: Set<string>;
  playlists: Playlist[];
  recentlyHistory: Song[];
  isLoading: boolean;

  loadLibrary: () => Promise<void>;
  likeSong: (song: Song) => Promise<void>;
  unlikeSong: (video_id: string) => Promise<void>;
  addPlaylist: (playlist: Playlist) => void;
  removePlaylist: (id: string) => void;
  addToHistory: (song: Song) => void;
  
}
