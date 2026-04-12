import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


export async function upsertSong(song) {
  const { data, error } = await supabase
    .from("songs")
    .upsert(
      {
        video_id: song.videoId,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
        duration_sec: song.duration,
      },
      { onConflict: "video_id" }
    )
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function insertPlayHistory(videoId) {
  const { data: song, error: lookupErr } = await supabase
    .from("songs")
    .select("id")
    .eq("video_id", videoId)
    .single();

  if (lookupErr || !song) {
    console.error("Could not find song for play_history:", lookupErr);
    return;
  }

  const { error } = await supabase
    .from("play_history")
    .insert({ song_id: song.id });

  if (error) throw error;
}

export default supabase;
