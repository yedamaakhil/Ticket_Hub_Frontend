import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import BlurCircle from "./BlurCircle";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-hot-toast";

function DateSelection({ dateTime, id }) {
    
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);

    const onBookHandler = () => {
        if (!selected) {
            return toast.error("Please select a date before booking.");
        }
        // Fixed: Navigate to the correct path
        navigate(`/movies/${id}/${selected}`);
        scrollTo(0, 0);
    };

    // Fixed: Add null check for dateTime
    if (!dateTime || Object.keys(dateTime).length === 0) {
        return (
            <div id="dateSelect" className="pt-30">
                <div className="flex flex-col items-center justify-center gap-10 
                relative p-8 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-gray-400">No show timings available</p>
                </div>
            </div>
        );
    }

    return (
        <div id="dateSelect" className="pt-30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10 
            relative p-8 bg-primary/10 border border-primary/20 rounded-lg">
                <BlurCircle top="-100px" left="-100px" />
                <BlurCircle top="100px" right="0px" />
                <div>
                    <p className='text-lg font-semibold'>Select a Date</p>
                    <div className="flex items-center gap-6 text-sm mt-5">
                        <ChevronLeftIcon width={28} className="cursor-pointer hover:text-primary" />
                        <span className="grid grid-cols-3 md:flex flex-wrap md:max-w-lg gap-4">
                            {Object.keys(dateTime).map((date) => (
                                <button 
                                    onClick={() => setSelected(date)} 
                                    key={date}
                                    className={`flex flex-col items-center justify-center h-14 w-14 aspect-square rounded cursor-pointer
                                    ${selected === date ? "bg-primary text-white" : "border border-primary/70 hover:bg-primary/20"}
                                    `}
                                >
                                    <span>{new Date(date).getDate()}</span>
                                    <span>{new Date(date).toLocaleDateString("en-US", { month: "short" })}</span>
                                </button>
                            ))}
                        </span>
                        <ChevronRightIcon width={28} className="cursor-pointer hover:text-primary" />
                    </div>
                </div>
                <button 
                    onClick={onBookHandler} 
                    className='bg-primary text-white px-8 py-2.5 mt-4 sm:mt-6 rounded-full hover:bg-primary/90 transition-all cursor-pointer w-full sm:w-auto'
                >
                    Book Now
                </button>
            </div>
        </div>
    );
}

export default DateSelection;