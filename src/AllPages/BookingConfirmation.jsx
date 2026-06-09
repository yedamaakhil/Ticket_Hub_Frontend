import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BlurCircle from '../Components/BlurCircle';
import IsoTimeFormate from '../lib/IsoTimeFormate';
import {
  CalendarIcon,
  ClockIcon,
  TicketIcon,
  CheckCircleIcon,
  HomeIcon,
  DownloadIcon,
} from 'lucide-react';
import BookingBarcode from '../Components/BookingBarcode';

const timeFormat = (mins) => {
  if (!mins) return "N/A";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

function ConfirmationTaxBreakdown({ totalPrice, selectedSeats, getSeatTier, seatPricing }) {
  const [openFees, setOpenFees] = useState(false);

  const gst              = Math.round(totalPrice * 0.05);
  const entertainmentTax = Math.round(totalPrice * 0.02);
  const convBase         = selectedSeats.length * 13;
  const convGST          = Math.round(convBase * 0.08);
  const totalFees        = gst + entertainmentTax + convBase + convGST;
  const grandTotal       = totalPrice + totalFees;

  return (
    <div className="space-y-2 pt-3 border-t border-primary/20">
      {["economy", "standard", "premium"].map((tier) => {
        const tierSeats = selectedSeats.filter(s => getSeatTier(s[0]) === tier);
        if (tierSeats.length === 0) return null;
        return (
          <div key={tier} className="flex justify-between text-sm">
            <span className="text-gray-400">{seatPricing[tier].label} × {tierSeats.length}</span>
            <span className="text-gray-300">₹{tierSeats.length * seatPricing[tier].price}</span>
          </div>
        );
      })}

      <div>
        <button
          onClick={() => setOpenFees(p => !p)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-1.5">
            <svg
              className={`w-3.5 h-3.5 text-primary transition-transform duration-200 ${openFees ? "rotate-180" : "rotate-0"}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-sm text-gray-400">Convenience Fee</span>
          </div>
          <span className="text-sm text-gray-300">₹{totalFees}</span>
        </button>

        {openFees && (
          <div className="mt-1 mb-2 space-y-1.5 pl-5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Base Amount (₹13 × {selectedSeats.length} seats)</span>
              <span>₹{convBase}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>IGST on Convenience Fee @ 18%</span>
              <span>₹{convGST}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>GST (IGST) @ 18% on tickets</span>
              <span>₹{gst}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Cinema Development Tax @ 2%</span>
              <span>₹{entertainmentTax}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 font-semibold border-t border-primary/10 pt-1.5 mt-0.5">
              <span>Total Convenience Fee</span>
              <span>₹{totalFees}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-primary/20">
        <p className="text-gray-400 text-sm">Total Paid</p>
        <p className="text-white text-xl font-bold">₹{grandTotal}</p>
      </div>
    </div>
  );
}

function BookingConfirmation() {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <TicketIcon className="w-16 h-16 text-primary/40" />
        <h2 className="text-xl font-semibold text-gray-300">No booking found</h2>
        <button
          onClick={() => navigate('/movies')}
          className="mt-4 px-8 py-3 bg-primary hover:bg-primary-dull text-sm
          font-medium rounded-full transition cursor-pointer active:scale-95"
        >
          Browse Movies
        </button>
      </div>
    );
  }

  const {
    movie,
    selectedSeats,
    selectedTime,
    selectedDate,
    totalPrice,
    bookingRef,
    transactionId,
  } = state;

  const seatPricing = {
    economy:  { rows: ["A","B"],                                price: 150, label: "Economy"  },
    standard: { rows: ["C","D","E","F","G","H","I","J"],        price: 300, label: "Standard" },
    premium:  { rows: ["K","L","M","N","O","P","Q","R"],        price: 500, label: "Premium"  },
  };

  const getSeatTier = (row) => {
    if (seatPricing.premium.rows.includes(row))  return "premium";
    if (seatPricing.standard.rows.includes(row)) return "standard";
    return "economy";
  };

  const tierColors = {
    economy:  "text-primary border-primary/60 bg-primary/10",
    standard: "text-yellow-400 border-yellow-400/60 bg-yellow-400/10",
    premium:  "text-green-400 border-green-400/60 bg-green-400/10",
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString("en-IN", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });

  return (
    <div className="px-6 md:px-16 lg:px-40 py-30 md:pt-40 min-h-screen">
      <BlurCircle top="0"    left="0"  />
      <BlurCircle bottom="0" right="0" />

      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 
        flex items-center justify-center mb-4">
          <CheckCircleIcon className="w-10 h-10 text-green-400" />
        </div>
        <p className="text-green-400 text-sm font-medium">Payment Successful</p>
        <h1 className="text-3xl font-bold mt-2">Booking Confirmed!</h1>
        <p className="text-gray-400 text-sm mt-2">
          Booking ID: <span className="text-primary font-semibold">{bookingRef}</span>
        </p>
        {transactionId && (
          <p className="text-gray-500 text-xs mt-1 font-mono">
            Transaction: {transactionId}
          </p>
        )}
      </div>

      <div className="max-w-lg mx-auto">
        <div className="bg-primary/10 border border-primary/20 rounded-2xl overflow-hidden">

          <div className="flex gap-5 p-6 border-b border-primary/20">
            <img
              src={movie.poster_path}
              alt={movie.title}
              className="w-24 h-36 object-cover rounded-xl flex-shrink-0"
            />
            <div className="flex flex-col justify-center gap-2">
              <h2 className="text-lg font-bold text-white">{movie.title}</h2>
              <p className="text-gray-400 text-xs">
                {movie.genres?.map((g) => g.name).join(", ")}
              </p>
              <p className="text-gray-400 text-xs">
                {timeFormat(movie.runtime)} &nbsp;|&nbsp;
                {movie.release_date?.split("-")[0]}
              </p>
              <span className="text-xs text-primary font-semibold">
                ⭐ {movie.vote_average?.toFixed(1) || "N/A"}
              </span>
            </div>
          </div>

          <div className="relative flex items-center px-4 py-1">
            <div className="w-6 h-6 rounded-full bg-black absolute -left-3" />
            <div className="flex-1 border-t-2 border-dashed border-primary/20" />
            <div className="w-6 h-6 rounded-full bg-black absolute -right-3" />
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="flex justify-between">
              <div className="flex items-start gap-3">
                <CalendarIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs mb-1">Date</p>
                  <p className="text-white text-sm font-medium">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ClockIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs mb-1">Time</p>
                  <p className="text-white text-sm font-medium">
                    {IsoTimeFormate(selectedTime.time)}
                  </p>
                </div>
              </div>
            </div>

            {/* Theater and Screen Information - ADD THIS SECTION */}
            {(selectedTime.theater || selectedTime.screen) && (
              <div className="flex justify-between">
                <div className="flex items-start gap-3">
                  <TicketIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Theater & Screen</p>
                    <p className="text-white text-sm font-medium">
                      {selectedTime.theater || selectedTime.theaterName || "AVD Cinemas"} · {selectedTime.screen || selectedTime.screenName || "Screen 1"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <TicketIcon className="w-4 h-4 text-primary" />
                <p className="text-xs text-gray-400">Seats</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seatId) => {
                  const tier = getSeatTier(seatId[0]);
                  return (
                    <span
                      key={seatId}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${tierColors[tier]}`}
                    >
                      {seatId}
                    </span>
                  );
                })}
              </div>
            </div>

            <ConfirmationTaxBreakdown
              totalPrice={totalPrice}
              selectedSeats={selectedSeats}
              getSeatTier={getSeatTier}
              seatPricing={seatPricing}
            />
          </div>

          <div className="relative flex items-center px-4 py-1">
            <div className="w-6 h-6 rounded-full bg-black absolute -left-3" />
            <div className="flex-1 border-t-2 border-dashed border-primary/20" />
            <div className="w-6 h-6 rounded-full bg-black absolute -right-3" />
          </div>

          <div className="flex flex-col items-center py-6 gap-2">
            <BookingBarcode value={bookingRef} />
            <p className="text-gray-400 text-xs mt-1 tracking-widest font-mono">{bookingRef}</p>
          </div>

          <div className="flex flex-col items-center pb-6 gap-1">
            <p className="text-white text-base font-semibold tracking-wide">Enjoy your show!</p>
            <p className="text-gray-500 text-xs">Please arrive 15 minutes before showtime</p>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => { navigate('/'); scrollTo(0, 0); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 
            border border-primary/40 hover:bg-primary/10 text-sm font-medium 
            rounded-full transition cursor-pointer active:scale-95"
          >
            <HomeIcon className="w-4 h-4" />
            Go Home
          </button>
          <button
            onClick={() => { navigate('/my-bookings'); scrollTo(0, 0); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 
            border border-primary/40 hover:bg-primary/10 text-sm font-medium 
            rounded-full transition cursor-pointer active:scale-95"
          >
            My Bookings
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-3 
            bg-primary hover:bg-primary-dull text-sm font-medium 
            rounded-full transition cursor-pointer active:scale-95"
          >
            <DownloadIcon className="w-4 h-4" />
            Download Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;