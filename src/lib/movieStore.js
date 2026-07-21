import { dummyShowsData } from "../assets/assets";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

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

// ★ Static movies returned instantly, no network wait
export const getStaticMovies = () => dummyShowsData;

export const getAllMovies = async () => {
  const dbMovies = await fetchDbMovies();
  return [...dbMovies, ...dummyShowsData];
};

export const findMovieById = async (id) => {
  const all = await getAllMovies();
  return all.find((m) => String(m.id) === String(id) || String(m._id) === String(id));
};

export const addMovie = async (movieData) => {
  const res = await fetch(`${API_URL}/movies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movieData),
  });
  if (!res.ok) throw new Error(`Failed to add movie (${res.status})`);
  return await res.json();
};

export const updateMovie = async (id, updatedData) => {
  const res = await fetch(`${API_URL}/movies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) return null;
  return await res.json();
};

export const removeMovie = async (id) => {
  const res = await fetch(`${API_URL}/movies/${id}`, { method: "DELETE" });
  return res.ok;
};

export const getStoredMovieCount = async () => (await fetchDbMovies()).length;
export const getTotalMovieCount = async () => (await getAllMovies()).length;
export const getStoredMovies = async () => await fetchDbMovies();