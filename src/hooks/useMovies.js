import { useState, useEffect, useCallback } from "react";
import { getAllMovies } from "../lib/movieStore";

export function useMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await getAllMovies();
    setMovies(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { movies, loading, refresh };
}