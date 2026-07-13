import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BlurCircle from "./BlurCircle";
import { useMovies } from "../hooks/useMovies";
import MovieCard from "./MovieCard";

function ShowAllMovies() {
    const navigate = useNavigate();
    const { movies } = useMovies();
    const sorted = [...movies].sort((a, b) => b.id - a.id);

    return (
        <div className='px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden'>

            <div className='relative flex items-center justify-between pt-20 pb-10'>
                <BlurCircle top='0' right='-80px' />
                <h3 className='text-gray-100 font-extrabold text-lg'>Available Movies</h3>
                <button onClick={() => navigate('/movies')} className='group flex items-center gap-2 text-sm 
                text-gray-300 font-bold cursor-pointer'>
                    View All
                    <ArrowRight className='group-hover:translate-x-0.5 transition w-4.5 h-4.5' />
                </button>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                {sorted.slice(0, 4).map((show) => (
                    <MovieCard key={show.id} movie={show} />
                ))}
            </div>

            <div className='flex justify-center mt-20'>
                <button onClick={() => { navigate('/movies'); scrollTo(0, 0); }} className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition 
                rounded-md font-medium cursor-pointer'>
                    Show All Movies
                </button>
            </div>
        </div>
    );
}
export default ShowAllMovies;