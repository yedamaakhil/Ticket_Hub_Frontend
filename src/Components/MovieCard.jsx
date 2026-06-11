import { StarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import timeFormat from "../lib/TimeFormat";

function MovieCard({ movie }) {

    const navigate = useNavigate();

  return (
    <div className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl
    hover:-translate-y-1 transition duration-300 w-full sm:w-66 max-w-sm mx-auto sm:mx-0' >

      <img onClick={() => {navigate(`/movie-details/${movie.id}`); scrollTo(0, 0);}} 
      src={movie.backdrop_path} alt="" className='rounded-lg h-52 w-full object-cover
      object-right-bottom cursor-pointer' />

      <h2 className='font-bold text-gray-100 mt-2 truncate' >{movie.title}</h2>

      <p className='text-sm text-gray-400 mt-2' >
        {new Date(movie.release_date).getFullYear()}  •  {movie.genres.slice(0, 2).map((genre) => genre.name).join(' | ')}  • {timeFormat(movie.runtime)}
      </p>

      <div className='flex items-center justify-between mt-4 pb-3' >
        <button onClick={() => {navigate(`/movie-details/${movie.id}`);scrollTo(0, 0);}}
        className='px-4 py-2 text-xs bg-primary hover:bg-primary-dull
        transition rounded-full font-medium cursor-pointer' >
          Buy Tickets
        </button>
        <p className='flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1' >
            <StarIcon className='w-4 h-4 text-primary fill-primary' /> 
            {movie.vote_average.toFixed(1)}
        </p>
      </div>

    </div>
  );
}

export default MovieCard;