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
        navigate(`/movies/${id}/${selected}`);
        scrollTo(0, 0);
    };

    if (!dateTime || Object.keys(dateTime).length === 0) {
        return (
            <div id="dateSelect" className="pt-20 sm:pt-30">
                <div className="flex flex-col items-center justify-center gap-10
                relative p-6 sm:p-8 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-gray-400 text-sm sm:text-base">No show timings available</p>
                </div>
            </div>
        );
    }

    return (
        <div id="dateSelect" className="pt-20 sm:pt-30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10
            relative p-5 sm:p-8 bg-primary/10 border border-primary/20 rounded-lg">
                <BlurCircle top="-100px" left="-100px" />
                <BlurCircle top="100px" right="0px" />
                <div className="w-full md:w-auto">
                    <p className='text-base sm:text-lg font-semibold text-center md:text-left'>Select a Date</p>
                    <div className="flex items-center gap-2 sm:gap-6 text-sm mt-4 sm:mt-5">
                        <ChevronLeftIcon width={22} className="hidden sm:block cursor-pointer hover:text-primary shrink-0" />
                        <span className="grid grid-cols-4 xs:grid-cols-5 sm:flex flex-wrap gap-2 sm:gap-4 justify-items-center flex-1">
                            {Object.keys(dateTime).map((date) => (
                                <button
                                    onClick={() => setSelected(date)}
                                    key={date}
                                    className={`flex flex-col items-center justify-center h-12 w-12 sm:h-14 sm:w-14 aspect-square rounded cursor-pointer text-xs sm:text-sm
                                    ${selected === date ? "bg-primary text-white" : "border border-primary/70 hover:bg-primary/20"}
                                    `}
                                >
                                    <span>{new Date(date).getDate()}</span>
                                    <span>{new Date(date).toLocaleDateString("en-US", { month: "short" })}</span>
                                </button>
                            ))}
                        </span>
                        <ChevronRightIcon width={22} className="hidden sm:block cursor-pointer hover:text-primary shrink-0" />
                    </div>
                </div>
                <button
                    onClick={onBookHandler}
                    className='bg-primary text-white px-6 sm:px-8 py-2.5 mt-2 sm:mt-6 rounded-full hover:bg-primary/90 transition-all cursor-pointer w-full sm:w-auto text-sm'
                >
                    Book Now
                </button>
            </div>
        </div>
    );
}

export default DateSelection;