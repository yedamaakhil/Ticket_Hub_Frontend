import { useState, useEffect, useCallback } from "react";
import { getStaticMovies, fetchDbMovies } from "../lib/movieStore";

export function useMovies() {
  // Start with static movies already loaded — instant, no spinner needed for these
  const [movies, setMovies] = useState(getStaticMovies());
  const [loading, setLoading] = useState(false); // false = static movies are ready right away

  const refresh = useCallback(async () => {
    // Don't block the UI — static movies are already showing.
    // Just fetch DB movies in the background and merge them in when ready.
    const dbMovies = await fetchDbMovies();
    setMovies([...dbMovies, ...getStaticMovies()]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { movies, loading, refresh };
}