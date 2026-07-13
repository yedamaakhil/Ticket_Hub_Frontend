// ─────────────────────────────────────────────────────────────────────────────
//  movieStore.js — now backed by the real database via the backend API.
//  Movies added by admin are visible to every user on every device immediately,
//  since they're fetched from the server instead of a per-browser localStorage.
// ─────────────────────────────────────────────────────────────────────────────

import { dummyShowsData } from "../assets/assets";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

/** Fetch admin-added movies from the backend */
export const fetchDbMovies = async () => {
  try {
    const res = await fetch(`${API_URL}/movies`);
    if (!res.ok) throw new Error(`Failed to fetch movies (${res.status})`);
    return await res.json();
  } catch (err) {
    console.error("movieStore: failed to fetch DB movies", err);
    return [];
  }
};

/**
 * Returns ALL movies: base dummyShowsData + DB movies (admin-added).
 * This is async now — callers must await it.
 */
export const getAllMovies = async () => {
  const dbMovies = await fetchDbMovies();
  return [...dbMovies, ...dummyShowsData];
};

export const findMovieById = async (id) => {
  const all = await getAllMovies();
  return all.find((m) => String(m.id) === String(id) || String(m._id) === String(id));
};

/** Add a new movie via the backend */
export const addMovie = async (movieData) => {
  const res = await fetch(`${API_URL}/movies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movieData),
  });
  if (!res.ok) throw new Error(`Failed to add movie (${res.status})`);
  return await res.json();
};

/** Update an existing admin-added movie via the backend */
export const updateMovie = async (id, updatedData) => {
  const res = await fetch(`${API_URL}/movies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) return null;
  return await res.json();
};

/** Remove a movie via the backend (cannot remove base dummy movies) */
export const removeMovie = async (id) => {
  const res = await fetch(`${API_URL}/movies/${id}`, { method: "DELETE" });
  return res.ok;
};

/** Count of admin-added (DB) movies */
export const getStoredMovieCount = async () => (await fetchDbMovies()).length;

/** Total movies count (base + DB) */
export const getTotalMovieCount = async () => (await getAllMovies()).length;

/** Admin-added movies only (for the "Show Added" list in AddMovie.jsx) */
export const getStoredMovies = async () => await fetchDbMovies();