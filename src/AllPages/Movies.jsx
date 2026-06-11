import { useMovies } from "../hooks/useMovies";
import BlurCircle from "../Components/BlurCircle";
import MovieCard from "../Components/MovieCard";

function Movies() {
  const { movies } = useMovies();
  
  return movies.length > 0 ? (
    <div className='relative my-24 sm:my-40 mb-40 sm:mb-60 px-4 sm:px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]' >
          <h1 className="text-3xl font-bold text-gray-200 mb-8" >All Movies</h1><br /><br />   
          <BlurCircle top="80px" right="-10px" /> 
          <BlurCircle bottom="400px" left="-10px" /> 
          <BlurCircle bottom="80px" right="200px" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" >
            {movies.map((movie) => ( 
              <MovieCard className="bg-white rounded-lg shadow-md overflow-hidden" movie={movie} key={movie.id} />
            ))}
          </div>
    </div>
  ) : (
    <div className="px-4 sm:px-6 md:px-16 lg:px-24 xl:px-44 py-12 md:py-20" >
      <h1 className="text-3xl font-bold text-gray-800 mb-8" >All Movies</h1>
      <p className="text-gray-600" >No movies available.</p>
    </div>
  );
}

export default Movies;