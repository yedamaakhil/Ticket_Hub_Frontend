import { useMovies } from "../hooks/useMovies";
import BlurCircle from "../Components/BlurCircle";
import MovieCard from "../Components/MovieCard";

// Static movies in assets.js have IDs 1–14.
// Added movies use Date.now() as ID (> 1,000,000,000,000).
// So anything above 1000 is an "added" movie.
const STATIC_ID_THRESHOLD = 1000;

function Movies() {
  const { movies } = useMovies();

  // Added movies (from backend/admin) — newest first
  const addedMovies = [...movies.filter(m => m.id > STATIC_ID_THRESHOLD)]
    .sort((a, b) => b.id - a.id);

  // Static movies (from assets.js) — original order preserved
  const staticMovies = movies.filter(m => m.id <= STATIC_ID_THRESHOLD);

  const sorted = [...addedMovies, ...staticMovies];

  return movies.length > 0 ? (
    <div className='relative my-24 sm:my-40 mb-40 sm:mb-60 px-4 sm:px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
      <h1 className="text-3xl font-bold text-gray-200 mb-8">All Movies</h1><br /><br />
      <BlurCircle top="80px" right="-10px" />
      <BlurCircle bottom="400px" left="-10px" />
      <BlurCircle bottom="80px" right="200px" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sorted.map((movie) => (
          <MovieCard className="bg-white rounded-lg shadow-md overflow-hidden" movie={movie} key={movie.id} />
        ))}
      </div>
    </div>
  ) : (
    <div className="px-4 sm:px-6 md:px-16 lg:px-24 xl:px-44 py-12 md:py-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">All Movies</h1>
      <p className="text-gray-600">No movies available.</p>
    </div>
  );
}

export default Movies;