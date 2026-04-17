// Use the pre-bundled web version of youtubei.js to avoid Metro resolution/cycle issues.
let innertubeInstance: any = null;

async function getInnertube() {
  if (!innertubeInstance) {
    // @ts-ignore
    const { Innertube } = require("youtubei.js/web.bundle");
    innertubeInstance = await Innertube.create({
      generate_session_locally: true,
    });
  }
  return innertubeInstance;
}



/**
 * Extract a direct audio stream URL for a YouTube video.
 */
export async function extractAudioUrl(videoId: string): Promise<string> {
  const yt = await getInnertube();
  const info = await yt.getBasicInfo(videoId);

  // Find the best audio-only adaptive format
  const audioFormats = info.streaming_data?.adaptive_formats?.filter(
    (f: any) => f.mime_type?.startsWith("audio/")
  );

  if (!audioFormats || audioFormats.length === 0) {
    throw new Error("No audio streams available for this video");
  }

  // Sort by bitrate descending and pick the best
  const best = audioFormats.sort(
    (a: any, b: any) => (b.bitrate ?? 0) - (a.bitrate ?? 0)
  )[0];

  const url = best.decipher(yt.session.player);
  if (!url) {
    throw new Error("Failed to decipher audio URL");
  }

  return url;
}

/**
 * Search YouTube for songs directly from the client.
 */
export async function searchYouTube(query: string) {
  const yt = await getInnertube();
  const results = await yt.search(query, { type: "video" });

  return (results.videos || []).slice(0, 10).map((video: any) => ({
    video_id: video.id,
    title: video.title?.text ?? "Unknown",
    artist: video.author?.name ?? "Unknown Artist",
    thumbnail: video.thumbnails?.[0]?.url ?? "",
    duration_sec: video.duration?.seconds ?? 0,
  }));
}


