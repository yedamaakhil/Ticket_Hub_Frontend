import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import Barcode from "react-barcode";

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export default function MyShows() {
  const { user } = useUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/bookings/user/${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch bookings (${res.status})`);
        return res.json();
      })
      .then((data) => { 
      setBookings([...data].sort((a, b) => b.id - a.id)); 
        setLoading(false); 
      })
      .catch((err) => { 
        setError(err.message); 
        setLoading(false); 
      });
  }, [user]);

  // FIXED: Simple time formatter that doesn't duplicate AM/PM
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    
    // If time already has AM/PM, return it as is (just clean it up)
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      return timeStr.trim();
    }
    
    // Otherwise, convert from 24-hour format
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    let displayHour = hour % 12;
    displayHour = displayHour === 0 ? 12 : displayHour;
    
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  if (loading)
    return (
      <div className="pt-20 sm:pt-24 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading your shows...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="pt-20 sm:pt-24 flex items-center justify-center min-h-screen px-4">
        <p className="text-red-300 text-lg sm:text-2xl text-center">No shows available. Is the server running?</p>
      </div>
    );

  if (bookings.length === 0)
    return (
      <div className="pt-20 sm:pt-24 flex flex-col items-center justify-center min-h-screen gap-3 px-4">
        <span className="text-5xl sm:text-6xl">🎟️</span>
        <h3 className="text-gray-300 font-semibold text-lg">No shows yet</h3>
        <p className="text-gray-500 text-sm text-center">Your booked show tickets will appear here.</p>
      </div>
    );

  return (
    <div className="pt-24 sm:pt-32 md:pt-36 max-w-5xl mx-auto px-4 pb-12">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray mt-1">My Shows</h2>
      </div>

      <div className="flex flex-col gap-5">
        {bookings.map((booking) => (
          <div
            key={booking.id || booking._id}
            className={`flex flex-col sm:flex-row rounded-2xl overflow-hidden bg-white/5 border transition-transform duration-200 hover:-translate-y-0.5 ${
              booking.status === "CANCELLED"
                ? "border-red-500/30 opacity-60"
                : "border-primary/20 hover:border-primary/40"
            }`}
          >
            {/* Poster */}
            <div className="relative w-full sm:w-32 sm:min-w-[128px] h-48 sm:h-auto bg-gray-900 overflow-hidden">
              {booking.moviePosterPath ? (
                <img
                  src={
                    booking.moviePosterPath.startsWith("http")
                      ? booking.moviePosterPath
                      : `https://image.tmdb.org/t/p/w200${booking.moviePosterPath}`
                  }
                  alt={booking.movieTitle}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-5xl">
                  🎬
                </div>
              )}
              {booking.status === "CANCELLED" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="-rotate-[30deg] bg-red-600/90 text-white text-[10px] font-black tracking-widest px-2 py-0.5 rounded whitespace-nowrap">
                    CANCELLED
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-between p-4 min-w-0">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-bold text-base leading-tight truncate">
                    {booking.movieTitle || "Unknown Movie"}
                  </h3>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                      booking.status === "CONFIRMED"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {booking.status || "CONFIRMED"}
                  </span>
                </div>

                <p className="text-gray-500 text-xs mb-3 truncate">
                  {booking.movieGenres || ""}
                  {booking.movieRuntime
                    ? ` · ${Math.floor(booking.movieRuntime / 60)}h ${booking.movieRuntime % 60}m`
                    : ""}
                  {booking.movieLanguage ? ` · ${booking.movieLanguage.toUpperCase()}` : ""}
                </p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Date</p>
                    <p className="text-sm font-semibold text-gray-200">{formatDate(booking.showDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Time</p>
                    <p className="text-sm font-semibold text-gray-200">{formatTime(booking.showTime)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Theater</p>
                    <p className="text-sm font-semibold text-gray-200 truncate">
                      {booking.theaterName || booking.theater || "AVD Cinemas"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Screen</p>
                    <p className="text-sm font-semibold text-gray-200">
                      {booking.screenName || booking.screen || "Screen 1"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10 flex-wrap">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Seats</p>
                  <p className="text-sm font-semibold text-primary">
                    {booking.seats?.join(", ") || "N/A"}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Total Paid</p>
                  <p className="text-lg font-bold text-white">₹{booking.totalPrice}</p>
                </div>
              </div>

              <p className="text-[10px] text-gray-600 font-mono mt-2">
                Ref: {booking.bookingRef}
              </p>
            </div>

            {/* Horizontal tear — mobile only */}
            <div className="flex sm:hidden items-center px-4 py-1">
              <div className="w-5 h-5 rounded-full bg-gray-950 border border-white/10 -ml-8" />
              <div className="flex-1 border-t border-dashed border-white/10 mx-1" />
              <div className="w-5 h-5 rounded-full bg-gray-950 border border-white/10 -mr-8" />
            </div>

            {/* Vertical tear — desktop only */}
            <div className="hidden sm:flex relative w-5 min-w-[20px] flex-col items-center justify-between bg-black/20">
              <div className="w-4 h-4 rounded-full bg-gray-950 border border-white/10 -mt-2" />
              <div className="flex-1 border-l border-dashed border-white/10 my-1" />
              <div className="w-4 h-4 rounded-full bg-gray-950 border border-white/10 -mb-2" />
            </div>

            {/* Barcode */}
            <div className="flex flex-col items-center justify-center px-4 py-5 bg-white/[0.03] sm:min-w-[150px]">
              <div className="bg-white rounded-lg p-2">
                <Barcode
                  value={booking.bookingRef || "INVALID"}
                  width={1.2}
                  height={55}
                  fontSize={9}
                  displayValue={true}
                  background="#ffffff"
                  lineColor="#000000"
                />
              </div>
              <p className="text-[9px] text-gray-600 font-mono mt-2 text-center break-all max-w-[160px] sm:max-w-[130px]">
                {booking.transactionId || ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}