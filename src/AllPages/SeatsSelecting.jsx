import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assets, dummyDateTimeData } from '../assets/assets';
import Loading from '../Components/Loading';
import { ArrowRightIcon, ClockIcon, InfoIcon, LockIcon } from 'lucide-react';
import BlurCircle from '../Components/BlurCircle';
import toast from 'react-hot-toast';
import { useAuth, useUser } from '@clerk/react';
import IsoTimeFormate from '../lib/IsoTimeFormate';
import { useMovies } from '../hooks/useMovies';
import { useSeatLock, getOrCreateSessionId } from '../hooks/useSeatLock';

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const TOTAL_ROWS          = 18;
const SEATS_PER_ROW       = 10;
const MAX_SEATS_PER_BOOKING = 6;

const SEAT_PRICING = {
  economy:  { rows: ["A","B"],                                price: 150, label: "Economy"  },
  standard: { rows: ["C","D","E","F","G","H","I","J"],        price: 300, label: "Standard" },
  premium:  { rows: ["K","L","M","N","O","P","Q","R"],        price: 500, label: "Premium"  },
};

const GROUP_ROWS = [
  ["A","B"],
  ["C","D","E","F","G","H","I","J"],
  ["K","L","M","N","O","P","Q","R"],
];

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const getSeatTier  = (row) => {
  if (SEAT_PRICING.premium.rows.includes(row))  return "premium";
  if (SEAT_PRICING.standard.rows.includes(row)) return "standard";
  return "economy";
};
const getSeatPrice = (row) => SEAT_PRICING[getSeatTier(row)].price;

// ─────────────────────────────────────────────
//  TIER STYLES
// ─────────────────────────────────────────────
const TIER_STYLES = {
  economy: {
    base:     "border-primary/60 bg-primary/5",
    selected: "bg-primary text-white border-primary shadow-lg shadow-primary/30",
    hover:    "hover:bg-primary/20 hover:scale-105",
  },
  standard: {
    base:     "border-yellow-500/60 bg-yellow-500/5",
    selected: "bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/30",
    hover:    "hover:bg-yellow-500/20 hover:scale-105",
  },
  premium: {
    base:     "border-green-500/60 bg-green-500/5",
    selected: "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30",
    hover:    "hover:bg-green-500/20 hover:scale-105",
  },
};

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
function SeatsSelecting() {
  const { id, date }  = useParams();
  const { getToken }  = useAuth();
  const { isSignedIn, user } = useUser();
  const { movies }    = useMovies();
  const navigate      = useNavigate();

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime,  setSelectedTime]  = useState(null);
  const [show,          setShow]          = useState(null);
  const [dateAvailable, setDateAvailable] = useState(true);

  // Stable session id — Clerk userId when signed in, else a UUID from sessionStorage
  const sessionId = useMemo(
    () => getOrCreateSessionId(user?.id),
    [user?.id]
  );

  // ── Seat locking hook ────────────────────────────────────────────────────
  const { seatStatus, lockSeats, releaseLocks } = useSeatLock({
    movieId:   id,
    date,
    time:      selectedTime?.time,
    sessionId,
    enabled:   !!selectedTime,
  });

  const { bookedSeats, lockedByOthers } = seatStatus;
  // Seats that are simply unavailable to click
  const unavailableSeats = useMemo(
    () => new Set([...bookedSeats, ...lockedByOthers]),
    [bookedSeats, lockedByOthers]
  );

  // ── Load show / date ─────────────────────────────────────────────────────
  const getShow = () => {
    const movieData = movies.find((m) => String(m.id) === String(id));
    if (!movieData) { setDateAvailable(false); toast.error("Movie not found"); return; }

    const dateTimeData = dummyDateTimeData[date] || [];
    if (dateTimeData.length === 0) {
      setDateAvailable(false);
      toast.error("No shows available for this date");
      return;
    }

    setDateAvailable(true);
    const enhanced = dateTimeData.map((slot, i) => ({
      ...slot,
      displayTime: IsoTimeFormate(slot.time),
      theater:     movieData.theater || "AVD Cinemas",
      screen:      movieData.screen  || String(i + 1),
    }));
    setShow({ movie: movieData, dateTime: { [date]: enhanced } });
  };

  useEffect(() => { if (movies.length > 0) getShow(); }, [id, date, movies]);

  // When user switches time slot, clear selection and let the hook re-lock
  useEffect(() => { setSelectedSeats([]); }, [selectedTime]);

  // ── Seat click ───────────────────────────────────────────────────────────
  const handleSeatClick = async (seatId) => {
    if (!selectedTime) {
      toast.error("Please select a show time first", { icon: "⏰", duration: 3000 });
      return;
    }
    if (unavailableSeats.has(seatId)) {
      const isLocked = lockedByOthers.includes(seatId);
      toast.error(
        isLocked ? `Seat ${seatId} is being selected by another user` : `Seat ${seatId} is already booked`,
        { icon: isLocked ? "🔒" : "❌", duration: 2000 }
      );
      return;
    }
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= MAX_SEATS_PER_BOOKING) {
      toast.error(`Max ${MAX_SEATS_PER_BOOKING} seats per booking`, { icon: "⚠️", duration: 3000 });
      return;
    }

    const next = selectedSeats.includes(seatId)
      ? selectedSeats.filter((s) => s !== seatId)
      : [...selectedSeats, seatId];

    setSelectedSeats(next);
    // Lock the new selection immediately
    await lockSeats(next);
  };

  // ── Seat renderer ────────────────────────────────────────────────────────
  const renderSeat = (row, i) => {
    const seatId    = `${row}${i + 1}`;
    const tier      = getSeatTier(row);
    const styles    = TIER_STYLES[tier];
    const isSelected = selectedSeats.includes(seatId);
    const isBooked   = bookedSeats.includes(seatId);
    const isLocked   = lockedByOthers.includes(seatId);

    let className = `h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded border text-[10px] sm:text-xs
                     font-medium transition-all duration-200 flex items-center justify-center `;

    if (isBooked) {
      className += "border-red-500/40 bg-red-500/20 text-red-400/50 cursor-not-allowed line-through";
    } else if (isLocked) {
      // Another user has this seat — amber with lock icon
      className += "border-amber-500/60 bg-amber-500/20 text-amber-400 cursor-not-allowed";
    } else if (isSelected) {
      className += `${styles.selected} cursor-pointer transform scale-105`;
    } else {
      className += `${styles.base} ${styles.hover} text-gray-300 cursor-pointer`;
    }

    return (
      <button
        key={seatId}
        onClick={() => handleSeatClick(seatId)}
        disabled={isBooked || isLocked}
        title={
          isBooked ? `Seat ${seatId} — Booked`
          : isLocked ? `Seat ${seatId} — Reserved by another user`
          : `Seat ${seatId} — ${SEAT_PRICING[tier].label} ₹${getSeatPrice(row)}`
        }
        className={className}
      >
        {isBooked ? "✕" : isLocked ? <LockIcon className="w-3 h-3" /> : i + 1}
      </button>
    );
  };

  const renderRow = (row, count = SEATS_PER_ROW) => (
    <div key={row} className="flex gap-2 mt-2 min-w-max">
      <span className="text-xs text-gray-500 w-5 shrink-0 self-center">{row}</span>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: count }, (_, i) => renderSeat(row, i))}
      </div>
    </div>
  );

  // ── Proceed ──────────────────────────────────────────────────────────────
  const handleProceed = () => {
    if (!isSignedIn) {
      toast.error("Please login to proceed!", { icon: "🔒", duration: 3000 });
      return;
    }
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat", { icon: "💺", duration: 3000 });
      return;
    }
    if (!selectedTime) {
      toast.error("Please select a show time", { icon: "⏰", duration: 3000 });
      return;
    }

    navigate("/payment", {
      state: {
        movie:         show.movie,
        selectedSeats,
        selectedTime:  { ...selectedTime },
        selectedDate:  date,
        totalPrice:    selectedSeats.reduce((s, seat) => s + getSeatPrice(seat[0]), 0),
        sessionId,     // ★ passed to Payment so it can release locks on failure
      },
    });
    window.scrollTo(0, 0);
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalSeats     = TOTAL_ROWS * SEATS_PER_ROW;
  const availableSeats = totalSeats - bookedSeats.length - lockedByOthers.length;

  if (!show && movies.length > 0 && !dateAvailable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <p className="text-gray-400">Movie or show not available for this date</p>
        <button onClick={() => navigate("/movies")}
          className="px-6 py-2 bg-primary rounded-full text-sm hover:bg-primary-dull transition">
          Back to Movies
        </button>
      </div>
    );
  }

  return show ? (
    <div className="flex flex-col md:flex-row px-3 sm:px-6 md:px-16 lg:px-40 py-20 sm:py-30 md:pt-50 gap-5 sm:gap-8">

      {/* ── Show Timings Sidebar ── */}
      <div className="w-full md:w-72 bg-primary/10 border border-primary/20 rounded-xl py-5 sm:py-6 h-max md:sticky md:top-30">
        <div className="px-4 sm:px-6 pb-3 border-b border-primary/20">
          <p className="text-base sm:text-lg font-semibold">Show Timings</p>
          <p className="text-xs text-gray-400 mt-1">{date}</p>
        </div>
        <div className="mt-4 space-y-1">
          {show.dateTime[date]?.map((item) => (
            <div
              key={item.time}
              onClick={() => setSelectedTime(item)}
              className={`flex items-center gap-3 px-4 sm:px-6 py-3 w-full cursor-pointer
                transition-all duration-200
                ${selectedTime?.time === item.time ? "bg-primary text-white shadow-lg" : "hover:bg-primary/20"}`}
            >
              <ClockIcon className="w-4 h-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">{item.displayTime || item.time}</p>
                <p className="text-xs opacity-75">{item.theater} • Screen {item.screen}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Seat Selection Area ── */}
      <div className="relative flex-1 flex flex-col items-center">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0"   right="0" />

        <div className="text-center space-y-2 mb-4 px-1">
          <p className="text-primary text-base sm:text-lg font-medium">Now Booking</p>
          <h1 className="text-xl sm:text-3xl font-bold mt-1">{show.movie.title}</h1>
          <p className="text-gray-400 text-xs sm:text-sm">
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

        <h1 className="text-lg sm:text-2xl font-bold mb-4 mt-4">Select your seats</h1>

        <div className="relative w-full max-w-3xl px-2">
          <img className="w-full h-auto rounded-lg" src={assets.screenImage} alt="screen" />
          <p className="text-gray-400 text-xs sm:text-sm text-center mt-2">SCREEN THIS SIDE</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 mt-4 text-xs flex-wrap justify-center
                        p-3 bg-primary/5 rounded-lg mx-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-green-500 bg-green-500/20" />
            <span className="text-gray-300">Premium (K-R) — ₹500</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-yellow-500 bg-yellow-500/20" />
            <span className="text-gray-300">Standard (C-J) — ₹300</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-primary bg-primary/20" />
            <span className="text-gray-300">Economy (A-B) — ₹150</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-red-500 bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-xs">✕</span>
            </div>
            <span className="text-gray-300">Booked</span>
          </div>
          {/* ★ NEW — locked by another user */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-amber-500 bg-amber-500/20 flex items-center justify-center">
              <LockIcon className="w-2.5 h-2.5 text-amber-400" />
            </div>
            <span className="text-gray-300">Being selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary shadow-lg" />
            <span className="text-gray-300">Selected</span>
          </div>
        </div>

        {/* Seat Grid */}
        <div className="w-full overflow-x-auto pb-2">
          <div className="flex flex-col items-center mt-4 text-xs text-gray-300 min-w-max px-2 mx-auto">

            <div className="mb-4 w-full">
              <div className="text-center mb-2">
                <span className="text-xs px-3 py-1 bg-primary/20 rounded-full">Economy Class</span>
              </div>
              <div className="flex justify-center">
                <div>{GROUP_ROWS[0].map((row) => renderRow(row))}</div>
              </div>
            </div>

            <div className="mb-4 w-full">
              <div className="text-center mb-2">
                <span className="text-xs px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-400">Standard Class</span>
              </div>
              <div className="flex flex-col md:grid md:grid-cols-2 gap-2 md:gap-4 items-center">
                {GROUP_ROWS[1].map((row) => renderRow(row))}
              </div>
            </div>

            <div className="w-full">
              <div className="text-center mb-2">
                <span className="text-xs px-3 py-1 bg-green-500/20 rounded-full text-green-400">Premium Class</span>
              </div>
              <div className="flex flex-col md:grid md:grid-cols-2 gap-2 md:gap-4 items-center">
                {GROUP_ROWS[2].map((row) => renderRow(row))}
              </div>
            </div>

          </div>
        </div>

        {/* Selection summary */}
        {selectedSeats.length > 0 && (
          <div className="mt-8 p-4 bg-primary/10 rounded-xl text-center space-y-2 max-w-md mx-auto">
            <p className="text-sm text-gray-300">
              Selected Seats:{" "}
              <span className="text-white font-bold">{selectedSeats.join(", ")}</span>
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <p>Seats: <span className="text-white font-bold">{selectedSeats.length}</span></p>
              <p>Total:{" "}
                <span className="text-primary font-bold text-lg">
                  ₹{selectedSeats.reduce((s, seat) => s + getSeatPrice(seat[0]), 0)}
                </span>
              </p>
            </div>
            {MAX_SEATS_PER_BOOKING - selectedSeats.length > 0 && (
              <p className="text-xs text-gray-400">
                You can select {MAX_SEATS_PER_BOOKING - selectedSeats.length} more seat(s)
              </p>
            )}
          </div>
        )}

        {selectedTime && (
          <div className="mt-4 text-xs text-gray-500 flex items-center gap-2 text-center">
            <InfoIcon className="w-3 h-3 shrink-0" />
            <span>{availableSeats} of {totalSeats} seats available</span>
            {lockedByOthers.length > 0 && (
              <span className="text-amber-400">· {lockedByOthers.length} being selected by others</span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleProceed}
          disabled={selectedSeats.length === 0 || !selectedTime}
          className={`flex items-center justify-center gap-2 mt-8 px-6 sm:px-8 py-3 text-sm
            rounded-full font-medium w-full max-w-xs sm:w-auto transition-all duration-200 active:scale-95
            ${selectedSeats.length > 0 && selectedTime
              ? "bg-primary hover:bg-primary-dull cursor-pointer shadow-lg shadow-primary/30"
              : "bg-gray-700 cursor-not-allowed opacity-50"}`}
        >
          {selectedSeats.length > 0
            ? `Proceed to Payment — ₹${selectedSeats.reduce((s, seat) => s + getSeatPrice(seat[0]), 0)}`
            : !selectedTime ? "Select a show time first" : "Select seats to continue"}
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>

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