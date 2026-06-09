// ─────────────────────────────────────────────────────────────────────────────
//  movieStore.js  —  Central persistent movie store
//
//  WHY THIS EXISTS:
//  assets.js is a static JS file. addMovieToDummyData() only mutates the
//  in-memory array — it resets on every page refresh. This store uses
//  localStorage so added movies survive refreshes AND are visible to users.
//
//  HOW IT WORKS:
//  1. dummyShowsData (assets.js)  = your permanent base movies
//  2. localStorage["tixrush_movies"] = admin-added movies (persistent)
//  3. getAllMovies() = dummyShowsData + localStorage movies combined
//
//  USAGE in any component:
//  import { getAllMovies, addMovie, removeMovie, updateMovie } from "../lib/movieStore";
//  const movies = getAllMovies();   // always up-to-date merged list
// ─────────────────────────────────────────────────────────────────────────────

import { dummyShowsData } from "../assets/assets";

const STORAGE_KEY = "tixrush_movies";

// ─────────────────────────────────────────────
//  READ
// ─────────────────────────────────────────────

/** Returns admin-added movies from localStorage */
export const getStoredMovies = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

/**
 * Returns ALL movies: base dummyShowsData + admin-added ones.
 * This is what every component should call instead of importing dummyShowsData directly.
 */
export const getAllMovies = () => {
    const stored = getStoredMovies();
    // Put admin-added movies first so they appear at the top
    return [...stored, ...dummyShowsData];
};

/**
 * Find a single movie by id or _id
 */
export const findMovieById = (id) => {
    return getAllMovies().find(
        (m) => String(m.id) === String(id) || String(m._id) === String(id)
    );
};

// ─────────────────────────────────────────────
//  WRITE
// ─────────────────────────────────────────────

/**
 * Save admin-added movies list back to localStorage
 */
const saveStoredMovies = (movies) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
    } catch (e) {
        console.error("movieStore: failed to save to localStorage", e);
    }
};

/**
 * Add a new movie (called by AddMovie admin page).
 * Generates a unique id and saves to localStorage.
 *
 * @param {object} movieData - movie object matching dummyShowsData shape
 * @returns {object} - the saved movie with id assigned
 */
export const addMovie = (movieData) => {
    const stored  = getStoredMovies();

    // Generate unique numeric id (higher than any existing id)
    const allIds  = getAllMovies().map((m) => Number(m.id) || 0);
    const newId   = Math.max(...allIds, 100000) + 1;

    const movie = {
        ...movieData,
        _id:        String(newId),
        id:         newId,
        vote_count: movieData.vote_count ?? 0,
        addedAt:    new Date().toISOString(),
        addedBy:    "admin",
    };

    saveStoredMovies([movie, ...stored]); // newest first
    return movie;
};

/**
 * Update an existing admin-added movie
 * 
 * @param {number|string} id - The ID of the movie to update
 * @param {object} updatedData - The updated movie data
 * @returns {object|null} - The updated movie or null if not found or is base movie
 */
export const updateMovie = (id, updatedData) => {
    const stored = getStoredMovies();
    const movieIndex = stored.findIndex(
        (m) => String(m.id) === String(id) || String(m._id) === String(id)
    );
    
    // Check if movie exists in stored (admin-added) movies
    if (movieIndex === -1) {
        console.warn("updateMovie: Movie not found or is a base movie (cannot edit base movies)");
        return null;
    }
    
    const existingMovie = stored[movieIndex];
    
    // Preserve original ID and metadata, update only the provided fields
    const updatedMovie = {
        ...existingMovie,
        ...updatedData,
        id: existingMovie.id,           // Preserve original ID
        _id: existingMovie._id,         // Preserve original _id
        addedAt: existingMovie.addedAt, // Preserve original added date
        addedBy: existingMovie.addedBy, // Preserve original added by
        updatedAt: new Date().toISOString(), // Add update timestamp
    };
    
    // Create new array with the updated movie
    const newStored = [...stored];
    newStored[movieIndex] = updatedMovie;
    saveStoredMovies(newStored);
    
    console.log("✅ Movie updated in localStorage:", updatedMovie);
    return updatedMovie;
};

/**
 * Remove a movie by id from localStorage (cannot remove base movies).
 * @returns {boolean} true if removed, false if it was a base movie
 */
export const removeMovie = (id) => {
    const stored  = getStoredMovies();
    const isStored = stored.some(
        (m) => String(m.id) === String(id) || String(m._id) === String(id)
    );
    if (!isStored) return false; // base movies can't be removed via this fn

    saveStoredMovies(
        stored.filter((m) => String(m.id) !== String(id) && String(m._id) !== String(id))
    );
    return true;
};

/**
 * Clear all admin-added movies (reset localStorage to base data only)
 */
export const clearStoredMovies = () => {
    localStorage.removeItem(STORAGE_KEY);
};

/**
 * Count of admin-added movies
 */
export const getStoredMovieCount = () => getStoredMovies().length;

/**
 * Total movies count (base + stored)
 */
export const getTotalMovieCount = () => getAllMovies().length;