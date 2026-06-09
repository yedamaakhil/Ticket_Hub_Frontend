import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { ArrowRight, ClapperboardIcon } from "lucide-react";

function HeroSection() {

    const navigate = useNavigate();

    return (
        <div className='flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 
        bg-[url("/popcornImage.png")] bg-cover bg-center h-screen'>
            <img src={assets.marvelLogo} alt="" className='max-h-11 lg:h-11 mt-20' />
            <h1 className='text-5xl md:text-[60px] md:leading-18 font-bold max-w-150 text-start text-white'>
                Your Movie Adventure <br /> Starts Here
            </h1>

            <div className='flex items-center gap-4 text-sm text-gray-300 font-medium'>
                <ClapperboardIcon/>
                <span className='font-extrabold tracking-wider' > Action | Adventure | Comedy | Drama | Suspense | Thrillers..</span>
            </div>

            <p className='text-lg text-gray-300 text-start max-w-2xl'>
                Book your tickets in advance and skip the queues. Experience the magic of cinema with us.
            </p>
            <button onClick={()=> navigate('/movies')} className='flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition 
            rounded-full font-medium cursor-pointer mt-4 text-gray-100' >Book Now
            <ArrowRight className='w-5 h-5' />
            </button>
        </div>
    );
}

export default HeroSection;