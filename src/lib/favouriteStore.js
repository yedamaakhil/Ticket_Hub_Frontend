// lib/favouriteStore.js
const FAVOURITES_KEY = "tixrush_favourites";

// Get all favourite movies
export const getFavourites = () => {
    try {
        const raw = localStorage.getItem(FAVOURITES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

// Add a movie to favourites
export const addToFavourites = (movie) => {
    const favourites = getFavourites();
    
    // Check if movie already exists
    const exists = favourites.some(fav => String(fav.id) === String(movie.id));
    
    if (!exists) {
        const newFavourites = [movie, ...favourites];
        localStorage.setItem(FAVOURITES_KEY, JSON.stringify(newFavourites));
        return true; // Added successfully
    }
    return false; // Already exists
};

// Remove a movie from favourites
export const removeFromFavourites = (movieId) => {
    const favourites = getFavourites();
    const newFavourites = favourites.filter(fav => String(fav.id) !== String(movieId));
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(newFavourites));
    return true;
};

// Check if a movie is in favourites
export const isFavourite = (movieId) => {
    const favourites = getFavourites();
    return favourites.some(fav => String(fav.id) === String(movieId));
};

// Toggle favourite status
export const toggleFavourite = (movie) => {
    if (isFavourite(movie.id)) {
        removeFromFavourites(movie.id);
        return false; // Removed
    } else {
        addToFavourites(movie);
        return true; // Added
    }
};

// Get favourite movies count
export const getFavouritesCount = () => {
    return getFavourites().length;
};