import { useEffect, useState } from "react";
import { searchSongs } from "@/lib/api";
import { Song } from "@/types/song";

/**
 * Debounced search hook.
 * Calls the backend /search endpoint after a 300 ms pause in typing.
 */
export function useSearch(query: string) {
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await searchSongs(trimmed);
        setResults(data);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading };
}
