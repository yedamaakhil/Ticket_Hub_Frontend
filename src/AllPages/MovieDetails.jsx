import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dummyDateTimeData, dummyTrailers } from "../assets/assets";
import BlurCircle from "../Components/BlurCircle";
import { HeartIcon, PlayCircleIcon, StarIcon, XIcon } from "lucide-react";
import timeFormat from "../lib/TimeFormat";
import DateSelection from "../Components/DateSelection";
import MovieCard from "../Components/MovieCard";
import Loading from "../Components/Loading";
import { useMovies } from "../hooks/useMovies";
import { isFavourite, toggleFavourite, getFavourites } from "../lib/favouriteStore";
import toast from "react-hot-toast";

function MovieDetails() {

  const navigate = useNavigate();
  const { movies } = useMovies();
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [isFav, setIsFav] = useState(false);
  const [favouriteCount, setFavouriteCount] = useState(0);

  const checkFavouriteStatus = () => {
    if (movie?.show) {
      const favStatus = isFavourite(movie.show.id);
      setIsFav(favStatus);
    }
  };

  const handleFavouriteToggle = () => {
    if (!movie?.show) return;

    const wasAdded = toggleFavourite(movie.show);

    if (wasAdded) {
      setIsFav(true);
      toast.success(`${movie.show.title} added to favourites!`, {
        icon: '❤️',
        duration: 2000,
      });
    } else {
      setIsFav(false);
      toast.success(`${movie.show.title} removed from favourites!`, {
        icon: '💔',
        duration: 2000,
      });
    }

    setFavouriteCount(getFavourites().length);
  };

  const getmovieDetails = () => {
    const movieData = movies.find((movie) => String(movie.id) === String(id));

    if (movieData) {
      setMovie({
        show: movieData,
        datetime: dummyDateTimeData
      });
    } else {
      setMovie(null);
    }
  };

  const getTrailerForMovie = (movieTitle, movieTrailerUrl) => {
    if (movieTrailerUrl && movieTrailerUrl.trim() !== "") {
      return { videoUrl: movieTrailerUrl };
    }

    const trailerMap = {
      "Kalki 2898 AD": dummyTrailers[0],
      "Pushpa 2: The Rule": dummyTrailers[1],
      "Devara: Part 1": dummyTrailers[2],
      "Salaar: Part 2 - Shouryaanga Parvam": dummyTrailers[3],
      "Game Changer": dummyTrailers[4],
      "OG (They Call Him OG)": dummyTrailers[5],
      "Kingdom": dummyTrailers[6],
      "Dhurandhar The Revenge": dummyTrailers[7],
      "Kgf Chapter 2": dummyTrailers[8],
      "Arjun Reddy": dummyTrailers[9],
      "Dacoit": dummyTrailers[10],
      "Hanu-Man": dummyTrailers[11],
      "Animal": dummyTrailers[12],
      "RRR": dummyTrailers[13],
    };

    let trailer = trailerMap[movieTitle];

    if (!trailer) {
      for (const [key, value] of Object.entries(trailerMap)) {
        if (movieTitle?.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(movieTitle?.toLowerCase())) {
          trailer = value;
          break;
        }
      }
    }

    return trailer || dummyTrailers[0];
  };

  const handleWatchTrailer = () => {
    if (movie && movie.show) {
      const trailer = getTrailerForMovie(movie.show.title, movie.show.trailerUrl);
      setTrailerUrl(trailer.videoUrl);
      setShowTrailer(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const handleCloseTrailer = () => {
    setShowTrailer(false);
    setTrailerUrl("");
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    if (movies.length > 0) {
      getmovieDetails();
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [id, movies]);

  useEffect(() => {
    checkFavouriteStatus();
  }, [movie]);

  if (!movie && movies.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <p className="text-gray-400">Movie not found</p>
        <button
          onClick={() => navigate('/movies')}
          className="px-6 py-2 bg-primary rounded-full text-sm"
        >
          Back to Movies
        </button>
      </div>
    );
  }

  if (!movie) return <Loading />;

  return (
    <div className="px-4 sm:px-6 md:px-16 lg:px-40 pt-20 sm:pt-30 md:pt-40 lg:pt-50 pb-12">

      {/* Trailer Modal - Fixed in middle with proper sizing like trailer section */}
      {showTrailer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={handleCloseTrailer}
        >
          <div 
            className="relative w-full max-w-[480px] bg-black rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCloseTrailer}
              className="absolute top-2 right-2 z-20 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white hover:text-primary transition-colors duration-200"
              aria-label="Close trailer"
            >
              <XIcon className="w-5 h-5" />
            </button>
            
            {/* Video container with 16:9 aspect ratio */}
            <div className="relative w-full pt-[56.25%]">
              <iframe
                src={`${trailerUrl}?autoplay=1&rel=0&controls=1&showinfo=0&modestbranding=1`}
                title="Movie Trailer"
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 max-w-6xl mx-auto">
        <img
          src={movie.show.poster_path}
          alt={movie.show.title}
          className='md:mx-0 rounded-xl h-72 sm:h-96 md:h-104 max-w-56 sm:max-w-64 md:max-w-70 w-full object-cover mx-auto'
        />

        <div className="relative flex flex-col gap-3 px-1 sm:px-0">
          <BlurCircle top="-100px" left="-100px" />
          <p className='text-primary text-sm sm:text-xl' >{movie.show.original_language || "Telugu"}</p>
          <h1 className='text-xl sm:text-3xl md:text-4xl font-semibold max-w-96 text-balance' >{movie.show.title}</h1>
          <div className="flex items-center gap-2 text-gray-300 text-sm sm:text-base" >
            <StarIcon className='w-4 h-4 sm:w-5 sm:h-5 text-primary fill-primary' />
            {movie.show.vote_average?.toFixed(1) || "N/A"} User Rating
          </div>
          <p className='text-gray-400 mt-2 text-xs sm:text-sm leading-relaxed max-w-xl' >{movie.show.overview}</p>
          <p className="text-white font-semibold sm:text-lg mt-3 sm:mt-4 text-sm" >
            {movie.show.runtime ? timeFormat(movie.show.runtime) : "N/A"} | {movie.show.genres?.map((genre) =>
              genre.name).join(", ")} | {movie.show.release_date?.split("-")[0]}
          </p>

          {/* Action buttons — wrap on mobile instead of overflowing */}
          <div className="flex items-center gap-3 sm:gap-4 mt-4 flex-wrap" >
            <button
              onClick={handleWatchTrailer}
              className='flex items-center gap-2 px-4 sm:px-7 py-2.5 sm:py-3
              text-xs sm:text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md
              font-medium cursor-pointer active:scale-95 whitespace-nowrap' >
              <PlayCircleIcon className='w-4 h-4 sm:w-5 sm:h-5' />
              Watch Trailer
            </button>
            <a href="#dateSelect" className='px-6 sm:px-10 py-2.5 sm:py-3 text-xs sm:text-sm bg-primary hover:bg-primary-dull
            transition rounded-md font-medium cursor-pointer active:scale-95 whitespace-nowrap' >
              Buy Tickets
            </a>
            <button
              onClick={handleFavouriteToggle}
              className='bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95 hover:bg-gray-600 shrink-0'
            >
              <HeartIcon className={`w-5 h-5 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
          </div>
        </div>
      </div>

      <p className='text-base sm:text-lg font-medium mt-14 sm:mt-20' >Movie Cast</p>
      <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 mt-6 sm:mt-8' >
        {movie.show.casts?.slice(0, 12).map((cast, index) => (
          <div key={index} className='flex flex-col gap-2 items-center text-center' >
            <img
              src={cast.profile_path || "https://via.placeholder.com/128x128?text=No+Image"}
              alt={cast.name}
              className='rounded-full p-1.5 sm:p-2 h-16 w-16 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 object-cover bg-gray-800'
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/128x128?text=No+Image";
              }}
            />
            <p className='text-[10px] sm:text-xs md:text-sm font-bold text-gray-100 mt-1 sm:mt-2 text-center line-clamp-2' >{cast.name}</p>
          </div>
        ))}
      </div>

      <DateSelection dateTime={movie.datetime} id={movie.show.id} />

      <p className='text-base sm:text-lg font-medium mt-14 sm:mt-20 mb-6 sm:mb-8'>You May Also Like</p>
      <div className='flex flex-wrap max-sm:justify-center gap-4 sm:gap-8' >
        {movies.filter(m => m.id !== movie.show.id).slice(0, 4).map((movie) => (
          <MovieCard className="bg-white rounded-lg shadow-md overflow-hidden" movie={movie} key={movie.id} />
        ))}
      </div>
      <BlurCircle top="1650px" left="300px" />
      <div className="flex justify-center mt-14 sm:mt-20" >
        <button onClick={()=>{navigate('/movies'); scrollTo(0,0)}} className='px-8 sm:px-10 py-2.5 sm:py-3 text-sm bg-primary hover:bg-primary-dull
        transition rounded-md font-medium cursor-pointer' >Show More</button>
      </div>

    </div>
  );
}

export default MovieDetails;