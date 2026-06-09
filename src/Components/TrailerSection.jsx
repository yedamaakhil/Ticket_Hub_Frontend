import React, { useState } from "react";
import { dummyTrailers } from "../assets/assets";
import BlurCircle from "./BlurCircle";
import { PlayCircleIcon } from "lucide-react";

function TrailerSection() {

    const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0]);

    return (
        <div className='px-4 sm:px-6 md:px-16 lg:px-24 xl:px-44 py-12 md:py-20 overflow-hidden' >

            <p className='text-gray-300 font-medium text-lg max-w-[960px] mx-auto'>Trailers</p>

            <div className='relative mt-4 md:mt-6' >
                <BlurCircle top="-100px" right="-100px"/>
                <div className="relative w-full aspect-video max-w-[960px] mx-auto">
                    <iframe 
                        src={currentTrailer.videoUrl} 
                        className='absolute top-0 left-0 w-full h-full rounded-lg'
                        title="trailer"
                        allowFullScreen
                    />
                </div>
                <BlurCircle bottom="-150px" left="-100px"/>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 lg:gap-8 mt-6 md:mt-10 max-w-3xl mx-auto' >
                {dummyTrailers.slice(0, 4).map((trailer, index) => (
                    <div key={trailer.image} onClick={() => {setCurrentTrailer(trailer);scrollTo(100,1350)}}
                        className={`relative transition-all duration-300 cursor-pointer 
                        ${currentTrailer.title === trailer.title ? "border-b-2 border-transparent" : "border-transparent"}`} >
                        <div className="relative aspect-[4/3] w-45 h-24 rounded-lg overflow-hidden">
                            <img 
                                src={trailer.image} 
                                alt="" 
                                className='w-full h-full object-cover brightness-75 hover:brightness-100 transition duration-300' 
                            />
                            <PlayCircleIcon 
                                strokeWidth={1.6} 
                                className='absolute top-1/2 left-1/2 w-5 sm:w-6 md:w-8 h-5 sm:h-6 md:h-8 
                                transform -translate-x-1/2 -translate-y-1/2 text-gray-300' 
                            />
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

export default TrailerSection;