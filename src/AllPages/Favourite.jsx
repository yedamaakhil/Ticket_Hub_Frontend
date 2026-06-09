import { useState, useEffect } from "react";
import { useMovies } from "../hooks/useMovies";
import BlurCircle from "../Components/BlurCircle";
import MovieCard from "../Components/MovieCard";
import { getFavourites } from "../lib/favouriteStore";
import { HeartIcon } from "lucide-react";

function Favourite() {
  const { movies } = useMovies();
  const [favouriteMovies, setFavouriteMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load favourites from localStorage
  useEffect(() => {
    const loadFavourites = () => {
      const favIds = getFavourites();
      // Filter movies that are in favourites
      const favMovies = movies.filter(movie => 
        favIds.some(fav => String(fav.id) === String(movie.id))
      );
      setFavouriteMovies(favMovies);
      setLoading(false);
    };

    if (movies.length > 0) {
      loadFavourites();
    }
  }, [movies]);

  // Listen for storage changes (in case user adds favourites from another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const favIds = getFavourites();
      const favMovies = movies.filter(movie => 
        favIds.some(fav => String(fav.id) === String(movie.id))
      );
      setFavouriteMovies(favMovies);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [movies]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return favouriteMovies.length > 0 ? (
    <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
      <div className="flex items-center gap-3 mb-8">
        <HeartIcon className="w-8 h-8 text-red-500 fill-red-500" />
        <h1 className="text-3xl font-bold text-gray-200">
          Your Favourite Movies ({favouriteMovies.length})
        </h1>
      </div><br />
      
      <BlurCircle top="400px" right="-10px" /> 
      <BlurCircle bottom="500px" left="-10px" /> 
      <BlurCircle bottom="30px" right="800px" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favouriteMovies.map((movie) => (
          <MovieCard 
            className="bg-white rounded-lg shadow-md overflow-hidden" 
            movie={movie} 
            key={movie.id} 
          />
        ))}
      </div>
    </div>
  ) : (
    <div className="px-4 sm:px-6 md:px-16 lg:px-24 xl:px-44 py-12 md:py-20 min-h-[60vh] flex flex-col items-center justify-center">
      <HeartIcon className="w-20 h-20 text-gray-600 mb-4" />
      <h1 className="text-3xl font-bold text-gray-200 mb-4">No Favourites Yet</h1>
      <p className="text-gray-400 mb-8 text-center">
        Start adding movies to your favourites and they will appear here!
      </p>
      <button
        onClick={() => window.location.href = '/movies'}
        className="px-6 py-2 bg-primary hover:bg-primary-dull rounded-lg transition"
      >
        Browse Movies
      </button>
    </div>
  );
}

export default Favourite;