import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assets, dummyDateTimeData } from '../assets/assets';
import Loading from '../Components/Loading';
import { ArrowRightIcon, ClockIcon, InfoIcon } from 'lucide-react';
import BlurCircle from '../Components/BlurCircle';
import toast from 'react-hot-toast';
import { useAuth, useUser } from '@clerk/react';
import IsoTimeFormate from '../lib/IsoTimeFormate';
import { useMovies } from '../hooks/useMovies';

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

// Constants
const TOTAL_ROWS = 18; // A through R
const SEATS_PER_ROW = 10;
const MAX_SEATS_PER_BOOKING = 6; // Changed from 5 to 6 for better flexibility

function SeatsSelecting() {
  const { id, date } = useParams();
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const { movies } = useMovies(); // Get all movies (base + admin-added)
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [dateAvailable, setDateAvailable] = useState(true);

  // All rows from A to R
  const allRows = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R"];
  
  // Group rows for better display
  const groupRows = [
    ["A","B"],      // Economy (rows A-B)
    ["C","D","E","F","G","H","I","J"], // Standard (rows C-J)
    ["K","L","M","N","O","P","Q","R"]  // Premium (rows K-R)
  ];
  
  const navigate = useNavigate();

  const seatPricing = {
    economy:  { rows: ["A","B"], price: 150, label: "Economy", color: "primary" },
    standard: { rows: ["C","D","E","F","G","H","I","J"], price: 300, label: "Standard", color: "yellow" },
    premium:  { rows: ["K","L","M","N","O","P","Q","R"], price: 500, label: "Premium", color: "green" },
  };

  const getSeatTier = (row) => {
    if (seatPricing.premium.rows.includes(row)) return "premium";
    if (seatPricing.standard.rows.includes(row)) return "standard";
    return "economy";
  };

  const getSeatPrice = (row) => seatPricing[getSeatTier(row)].price;
  
  const getTotalPrice = () =>
    selectedSeats.reduce((total, seatId) => total + getSeatPrice(seatId[0]), 0);

  const getShow = async () => {
    // Search in ALL movies (base + admin-added) from useMovies
    const movieData = movies.find((movie) => String(movie.id) === String(id));
    
    if (movieData) {
      // Check if the selected date has shows
      const dateTimeData = dummyDateTimeData[date] || [];
      
      if (dateTimeData.length === 0) {
        setDateAvailable(false);
        toast.error("No shows available for this date");
        return;
      }
      
      setDateAvailable(true);
      const enhancedDateTime = dateTimeData.map((slot, index) => ({
        ...slot,
        time: slot.time,
        displayTime: IsoTimeFormate(slot.time),
        theater: movieData.theater || "AVD Cinemas",
        screen: movieData.screen || String(index + 1)
      }));
      setShow({ 
        movie: movieData, 
        dateTime: { [date]: enhancedDateTime } 
      });
    } else {
      setDateAvailable(false);
      toast.error("Movie not found");
    }
  };

  const loadBookedSeats = async (timeObj) => {
    if (!timeObj) return;
    setLoadingSeats(true);
    try {
      const token = await getToken();
      const timeParam = encodeURIComponent(timeObj.time);
      const res = await fetch(
        `${API_URL}/seats/booked?movieId=${id}&date=${date}&time=${timeParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!res.ok) {
        throw new Error(`Failed to load seats: ${res.status}`);
      }
      
      const data = await res.json();
      setBookedSeats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load booked seats", err);
      toast.error("Failed to load seat availability");
      setBookedSeats([]);
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast.error("Please select a show time first", {
        icon: '⏰',
        duration: 3000
      });
    }
    
    if (bookedSeats.includes(seatId)) {
      return toast.error(`Seat ${seatId} is already booked!`, {
        icon: '❌',
        duration: 2000
      });
    }
    
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= MAX_SEATS_PER_BOOKING) {
      return toast.error(`You can only select up to ${MAX_SEATS_PER_BOOKING} seats per booking`, {
        icon: '⚠️',
        duration: 3000
      });
    }
    
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((seat) => seat !== seatId)
        : [...prev, seatId]
    );
  };

  const tierStyles = {
    economy: {
      base: "border-primary/60 bg-primary/5",
      selected: "bg-primary text-white border-primary shadow-lg shadow-primary/30",
      hover: "hover:bg-primary/20 hover:scale-105",
    },
    standard: {
      base: "border-yellow-500/60 bg-yellow-500/5",
      selected: "bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/30",
      hover: "hover:bg-yellow-500/20 hover:scale-105",
    },
    premium: {
      base: "border-green-500/60 bg-green-500/5",
      selected: "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30",
      hover: "hover:bg-green-500/20 hover:scale-105",
    },
  };

  const renderSeats = (row, count = SEATS_PER_ROW) => {
    const tier = getSeatTier(row);
    const styles = tierStyles[tier];

    return (
      <div key={row} className="flex gap-2 mt-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 w-5">{row}</span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {Array.from({ length: count }, (_, i) => {
              const seatId = `${row}${i + 1}`;
              const isSelected = selectedSeats.includes(seatId);
              const isBooked = bookedSeats.includes(seatId);

              return (
                <button
                  key={seatId}
                  onClick={() => handleSeatClick(seatId)}
                  disabled={isBooked}
                  title={isBooked ? `Seat ${seatId} - Already Booked` : `Seat ${seatId} - ${seatPricing[tier].label} - ₹${getSeatPrice(row)}`}
                  className={`h-8 w-8 rounded border text-xs font-medium transition-all duration-200
                    ${isBooked
                      ? "border-red-500/40 bg-red-500/20 text-red-400/50 cursor-not-allowed line-through"
                      : isSelected
                        ? `${styles.selected} cursor-pointer transform scale-105`
                        : `${styles.base} ${styles.hover} text-gray-300 cursor-pointer`
                    }`}
                >
                  {isBooked ? "✕" : i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (movies.length > 0) {
      getShow();
    }
  }, [id, date, movies]);

  useEffect(() => {
    if (selectedTime) {
      loadBookedSeats(selectedTime);
      setSelectedSeats([]);
    }
  }, [selectedTime]);

  const handleProceed = () => {
    if (!isSignedIn) {
      return toast.error("Please login to proceed with booking!", { 
        duration: 3000,
        icon: '🔒'
      });
    }
    
    if (selectedSeats.length === 0) {
      return toast.error("Please select at least one seat", {
        icon: '💺',
        duration: 3000
      });
    }
    
    if (!selectedTime) {
      return toast.error("Please select a show time", {
        icon: '⏰',
        duration: 3000
      });
    }

    // Navigate to payment with all booking details
    navigate('/payment', {
      state: {
        movie: show.movie,
        selectedSeats,
        selectedTime: {
          ...selectedTime,
          time: selectedTime.time,
          displayTime: selectedTime.displayTime,
        },
        selectedDate: date,
        totalPrice: getTotalPrice(),
      }
    });
    window.scrollTo(0, 0);
  };

  // Calculate seat statistics
  const totalSeats = TOTAL_ROWS * SEATS_PER_ROW;
  const availableSeats = totalSeats - bookedSeats.length;
  const selectedSeatsCount = selectedSeats.length;
  const remainingSeatsAllowed = MAX_SEATS_PER_BOOKING - selectedSeatsCount;

  // Show loading while movies are being fetched
  if (!show && movies.length > 0 && !dateAvailable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-400">Movie or show not available for this date</p>
        <button
          onClick={() => navigate('/movies')}
          className="px-6 py-2 bg-primary rounded-full text-sm hover:bg-primary-dull transition"
        >
          Back to Movies
        </button>
      </div>
    );
  }

  return show ? (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50 gap-8'>
      {/* Show Timings Sidebar */}
      <div className='w-full md:w-72 bg-primary/10 border border-primary/20 rounded-xl py-6 h-max md:sticky md:top-30'>
        <div className="px-6 pb-3 border-b border-primary/20">
          <p className='text-lg font-semibold'>Show Timings</p>
          <p className='text-xs text-gray-400 mt-1'>{date}</p>
        </div>
        <div className='mt-4 space-y-1'>
          {show.dateTime[date]?.map((item) => (
            <div
              key={item.time}
              onClick={() => setSelectedTime(item)}
              className={`flex items-center gap-3 px-6 py-3 w-full cursor-pointer 
              transition-all duration-200 ${
                selectedTime?.time === item.time
                  ? "bg-primary text-white shadow-lg"
                  : "hover:bg-primary/20"
              }`}
            >
              <ClockIcon className='w-4 h-4' />
              <div>
                <p className='text-sm font-medium'>{item.displayTime || item.time}</p>
                <p className='text-xs opacity-75'>{item.theater} • Screen {item.screen}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seat Selection Area */}
      <div className='relative flex-1 flex flex-col items-center'>
        <BlurCircle top='-100px' left='-100px' />
        <BlurCircle bottom='0' right='0' />

        {/* Movie Info */}
        <div className="text-center space-y-2 mb-4">
          <p className="text-primary text-lg font-medium">Now Booking</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{show.movie.title}</h1>
          <p className="text-gray-400 text-sm">
            {show.movie.genres?.map((g) => g.name).join(", ")} &nbsp;|&nbsp;
            {show.movie.release_date?.split("-")[0]}
          </p>
          {selectedTime && (
            <div className="mt-2 p-2 bg-primary/10 rounded-lg inline-block">
              <p className="text-xs text-gray-300">
                📍 {selectedTime.theater} · Screen {selectedTime.screen} · 
                ⏰ {selectedTime.displayTime || selectedTime.time}
              </p>
            </div>
          )}
        </div>
        
        <br />

        <h1 className='text-2xl font-bold mb-4'>Select your seats</h1>
        
        {/* Screen Image */}
        <div className="relative w-full max-w-3xl">
          <img className='w-full h-auto rounded-lg' src={assets.screenImage} alt="screen" />
          <p className='text-gray-400 text-sm text-center mt-2'>SCREEN THIS SIDE</p>
        </div>
        
        <br />

        {/* Seat Legend */}
        <div className="flex items-center gap-4 mb-6 text-xs flex-wrap justify-center p-3 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-green-500 bg-green-500/20" />
            <span className="text-gray-300">Premium (K-R) — ₹500</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-yellow-500 bg-yellow-500/20" />
            <span className="text-gray-300">Standard (C-J) — ₹300</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-primary bg-primary/20" />
            <span className="text-gray-300">Economy (A-B) — ₹150</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-red-500 bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-xs">✕</span>
            </div>
            <span className="text-gray-300">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary shadow-lg" />
            <span className="text-gray-300">Selected</span>
          </div>
        </div>

        {/* Seat Grid */}
        {loadingSeats ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center mt-4 text-xs text-gray-300 w-full overflow-x-auto">
            {/* Economy Section (Rows A-B) */}
            <div className="mb-4 w-full">
              <div className="text-center mb-2">
                <span className="text-xs px-3 py-1 bg-primary/20 rounded-full">Economy Class</span>
              </div>
              <div className="flex justify-center">
                <div>
                  {groupRows[0]?.map((row, index) => (
                    <div key={index}>{renderSeats(row)}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Standard Section (Rows C-J) */}
            <div className="mb-4 w-full">
              <div className="text-center mb-2">
                <span className="text-xs px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-400">Standard Class</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupRows[1]?.map((row, idx) => (
                  <div key={idx}>{renderSeats(row)}</div>
                ))}
              </div>
            </div>

            {/* Premium Section (Rows K-R) */}
            <div className="w-full">
              <div className="text-center mb-2">
                <span className="text-xs px-3 py-1 bg-green-500/20 rounded-full text-green-400">Premium Class</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupRows[2]?.map((row, idx) => (
                  <div key={idx}>{renderSeats(row)}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Seat Summary */}
        {selectedSeats.length > 0 && (
          <div className="mt-8 p-4 bg-primary/10 rounded-xl text-center space-y-2 max-w-md mx-auto">
            <p className="text-sm text-gray-300">
              Selected Seats:{" "}
              <span className="text-white font-bold">
                {selectedSeats.join(", ")}
              </span>
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <p>
                Seats: <span className="text-white font-bold">{selectedSeats.length}</span>
              </p>
              <p>
                Total:{" "}
                <span className="text-primary font-bold text-lg">₹{getTotalPrice()}</span>
              </p>
            </div>
            {remainingSeatsAllowed > 0 && (
              <p className="text-xs text-gray-400">
                You can select {remainingSeatsAllowed} more seat{remainingSeatsAllowed !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Seat Availability Info */}
        {selectedTime && !loadingSeats && (
          <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
            <InfoIcon className="w-3 h-3" />
            <span>{availableSeats} of {totalSeats} seats available</span>
          </div>
        )}

        {/* Proceed Button */}
        <button
          type="button"
          onClick={handleProceed}
          disabled={selectedSeats.length === 0 || !selectedTime}
          className={`flex items-center gap-2 mt-8 px-8 py-3 text-sm rounded-full font-medium 
            transition-all duration-200 active:scale-95
            ${selectedSeats.length > 0 && selectedTime
              ? "bg-primary hover:bg-primary-dull cursor-pointer shadow-lg shadow-primary/30"
              : "bg-gray-700 cursor-not-allowed opacity-50"
            }`}
        >
          {selectedSeats.length > 0
            ? `Proceed to Payment — ₹${getTotalPrice()}`
            : !selectedTime ? "Select a show time first" : "Select seats to continue"}
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
        
        {/* Back to Movie Button */}
        <button
          onClick={() => navigate(`/movie-details/${id}`)}
          className="mt-4 text-xs text-gray-500 hover:text-primary transition"
        >
          ← Back to Movie Details
        </button>
      </div>
    </div>
  ) : (<Loading />);
}

export default SeatsSelecting;