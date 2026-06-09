// ─────────────────────────────────────────────────────────────────────────────
//  useMovies.js  —  React hook for always-fresh movie list
//
//  Usage in any component:
//    import { useMovies } from "../hooks/useMovies";
//    const { movies, totalCount, storedCount, refresh } = useMovies();
//
//  This returns base dummyShowsData PLUS any movies the admin added,
//  and automatically re-renders when localStorage changes (e.g. admin adds movie
//  in another tab, or the admin panel updates).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { getAllMovies, getStoredMovieCount, getTotalMovieCount } from "../lib/movieStore";

export function useMovies() {
    const [movies, setMovies] = useState(() => getAllMovies());

    const refresh = useCallback(() => {
        setMovies(getAllMovies());
    }, []);

    // Re-read whenever localStorage changes (cross-tab or same-tab after admin adds)
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "tixrush_movies" || e.key === null) {
                refresh();
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [refresh]);

    return {
        movies,
        totalCount:  getTotalMovieCount(),
        storedCount: getStoredMovieCount(),
        refresh,
    };
}

// ── Convenience: find one movie by id ──
export function useMovie(id) {
    const { movies } = useMovies();
    return movies.find(
        (m) => String(m.id) === String(id) || String(m._id) === String(id)
    ) ?? null;
}