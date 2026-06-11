import React, { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BlurCircle from '../Components/BlurCircle';
import toast from 'react-hot-toast';
import { useAuth, useUser } from '@clerk/react';
import {
  CalendarIcon, ClockIcon, TicketIcon,
  CreditCardIcon, ArrowLeftIcon, TagIcon,
} from 'lucide-react';
import IsoTimeFormate from '../lib/IsoTimeFormate';
import RazorpayModal from '../Components/RazorpayModal';
import TaxBreakdown from '../Components/TaxBreakdown';
import { API_BASE } from '../lib/config';

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────

const SEAT_PRICING = {
  economy:  { rows: ["A","B"],                                price: 150, label: "Economy"  },
  standard: { rows: ["C","D","E","F","G","H","I","J"],        price: 300, label: "Standard" },
  premium:  { rows: ["K","L","M","N","O","P","Q","R"],        price: 500, label: "Premium"  },
};

const TAX_RATES = {
  GST:             0.08,
  ENTERTAINMENT:   0.02,
  CONVENIENCE_FEE: 13,
  CONVENIENCE_GST: 0.08,
};

const TIER_COLORS = {
  economy:  "text-primary border-primary/60 bg-primary/10",
  standard: "text-yellow-400 border-yellow-400/60 bg-yellow-400/10",
  premium:  "text-green-400 border-green-400/60 bg-green-400/10",
};

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const timeFormat = (mins) => {
  if (!mins) return "N/A";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const getSeatTier = (row) => {
  if (SEAT_PRICING.premium.rows.includes(row))  return "premium";
  if (SEAT_PRICING.standard.rows.includes(row)) return "standard";
  return "economy";
};

const getSeatPrice = (row) => SEAT_PRICING[getSeatTier(row)].price;

// ─────────────────────────────────────────────
//  EMPTY STATE
// ─────────────────────────────────────────────
const NoBooking = ({ navigate }) => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4">
    <TicketIcon className="w-16 h-16 text-primary/40" />
    <h2 className="text-xl font-semibold text-gray-300">No booking found</h2>
    <p className="text-gray-500 text-sm">Please book a movie first.</p>
    <button
      onClick={() => navigate('/movies')}
      className="mt-4 px-8 py-3 bg-primary hover:bg-primary-dull text-sm font-medium
                 rounded-full transition cursor-pointer active:scale-95"
    >
      Browse Movies
    </button>
  </div>
);

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
function Payment() {
  const navigate     = useNavigate();
  const { state }    = useLocation();
  const { getToken } = useAuth();
  const { user }     = useUser();

  const [showRazorpay, setShowRazorpay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!state) return <NoBooking navigate={navigate} />;

  const { movie, selectedSeats, selectedTime, selectedDate, totalPrice } = state;

  // ── Tax calculation ──
  const { baseTotal, grandTotal, taxes } = useMemo(() => {
    const base = selectedSeats.reduce((s, seat) => s + getSeatPrice(seat[0]), 0);
    const gst  = Math.round(base * TAX_RATES.GST);
    const ent  = Math.round(base * TAX_RATES.ENTERTAINMENT);
    const conv = selectedSeats.length * TAX_RATES.CONVENIENCE_FEE;
    const cGst = Math.round(conv * TAX_RATES.CONVENIENCE_GST);
    return {
      baseTotal:  base,
      grandTotal: base + gst + ent + conv + cGst,
      taxes:      { gst, entertainmentTax: ent, convBase: conv, convGST: cGst },
    };
  }, [selectedSeats]);

  const formattedDate = new Date(selectedDate).toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // ── Called by RazorpayModal after payment is VERIFIED on backend ──────────
  // paymentMethod = "UPI" | "CARD" | "NET_BANKING"
  // razorpayPayId = "pay_xxxxx" from Razorpay
  const handlePaymentSuccess = useCallback(async (paymentMethod, razorpayPayId) => {
    setIsProcessing(true);
    setShowRazorpay(false);
    const loadingToast = toast.loading("Saving your booking…");

    try {
      const token        = await getToken();
      const primaryEmail = user?.primaryEmailAddress?.emailAddress
                        ?? user?.emailAddresses?.[0]?.emailAddress
                        ?? "";

      if (!primaryEmail) {
        toast.error("No email on your account — add an email in your profile to receive tickets.", { id: loadingToast });
        setIsProcessing(false);
        return;
      }

      const payload = {
        movieId:           movie.id,
        showDate:          selectedDate,
        showTime:          selectedTime.time,
        seats:             selectedSeats,
        seatPrices:        Object.fromEntries(selectedSeats.map(s => [s, getSeatPrice(s[0])])),
        totalPrice:        grandTotal,
        paymentMethod,
        razorpayPaymentId: razorpayPayId ?? "",
        movieTitle:        movie.title,
        moviePosterPath:   movie.poster_path,
        movieGenres:       movie.genres?.map(g => g.name).join(", ") ?? "",
        movieRuntime:      movie.runtime,
        movieLanguage:     movie.original_language ?? "Telugu",
        theaterName:       selectedTime.theater ?? movie.theater ?? "Cineplex",
        screenName:        selectedTime.screen ? `Screen ${selectedTime.screen}` : "Screen 1",
        userEmail:         primaryEmail,
        clerkUserId:       user?.id ?? "",
      };

      const res = await fetch(`${API_BASE}/api/bookings`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 409) {
          toast.error("These seats are no longer available!", { id: loadingToast });
          setTimeout(() => navigate("/movies"), 2000);
          return;
        }
        throw new Error(errData.message || `Server error ${res.status}`);
      }

      const data = await res.json();

      if (data.emailSent) {
        toast.success("Booking confirmed! 🎉 Ticket sent to your email.", {
          id: loadingToast, duration: 3000,
        });
      } else {
        toast.success("Booking confirmed! 🎉 (Email could not be sent — check My Bookings)", {
          id: loadingToast, duration: 4000,
        });
      }

      setTimeout(() => {
        navigate("/my-bookings/confirmation", {
          state: {
            movie, selectedSeats, selectedTime, selectedDate,
            totalPrice:    grandTotal,
            bookingRef:    data.bookingRef,
            transactionId: data.transactionId,
            bookingId:     data.id,
            userEmail:     primaryEmail,
            emailSent:     data.emailSent,
            emailPreviewUrl: data.emailPreviewUrl,
          },
        });
      }, 1500);

    } catch (err) {
      console.error("Booking save error:", err);
      toast.error(`Booking failed: ${err.message}`, { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  }, [movie, selectedSeats, selectedTime, selectedDate, grandTotal, user, getToken, navigate]);

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="px-4 sm:px-6 md:px-16 lg:px-40 py-24 sm:py-30 md:pt-40 min-h-screen">
      <BlurCircle top="0" left="0" />
      <BlurCircle bottom="0" right="0" />

      {showRazorpay && (
        <RazorpayModal
          totalPrice={grandTotal}
          movieTitle={movie.title}
          onClose={() => setShowRazorpay(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        disabled={isProcessing}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm
                   mb-8 transition cursor-pointer disabled:opacity-40"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="mb-10">
        <p className="text-primary text-sm font-medium">Review &amp; Pay</p>
        <h1 className="text-3xl font-bold mt-1">Booking Summary</h1>
        {user?.primaryEmailAddress?.emailAddress && (
          <p className="text-gray-500 text-sm mt-2 flex items-center gap-1.5">
            📧 Confirmation will be sent to{" "}
            <span className="text-primary font-medium">
              {user.primaryEmailAddress.emailAddress}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-5xl">

        {/* LEFT — Booking card */}
        <div className="flex-1 bg-primary/10 border border-primary/20 rounded-2xl overflow-hidden">

          {/* Movie */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 p-4 sm:p-6 border-b border-primary/20">
            <img
              src={movie.poster_path}
              alt={movie.title}
              className="w-full sm:w-28 h-48 sm:h-40 object-cover rounded-xl flex-shrink-0 mx-auto sm:mx-0 max-w-[200px] sm:max-w-none"
            />
            <div className="flex flex-col justify-center gap-2">
              <h2 className="text-xl font-bold text-white">{movie.title}</h2>
              <p className="text-gray-400 text-xs">
                {movie.genres?.map(g => g.name).join(", ")}
              </p>
              <p className="text-gray-400 text-xs">
                {timeFormat(movie.runtime)} &nbsp;|&nbsp; {movie.release_date?.split("-")[0]}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-gray-400">Rating:</span>
                <span className="text-xs text-primary font-semibold">
                  ⭐ {movie.vote_average?.toFixed(1) || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex gap-6 px-6 py-5 border-b border-primary/20">
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

          {/* Seats */}
          <div className="px-6 py-5 border-b border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <TicketIcon className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-white">Selected Seats</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedSeats.map(seatId => (
                <span
                  key={seatId}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border
                              ${TIER_COLORS[getSeatTier(seatId[0])]}`}
                >
                  {seatId}
                </span>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <TagIcon className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-white">Price Breakdown</p>
            </div>
            <TaxBreakdown
              totalPrice={baseTotal}
              gst={taxes.gst}
              entertainmentTax={taxes.entertainmentTax}
              convBase={taxes.convBase}
              convGST={taxes.convGST}
              grandTotal={grandTotal}
              selectedSeats={selectedSeats}
              seatPricing={SEAT_PRICING}
              getSeatTier={getSeatTier}
            />
          </div>
        </div>

        {/* RIGHT — Payment card */}
        <div className="lg:w-80 bg-primary/10 border border-primary/20 rounded-2xl p-6
                        h-max lg:sticky lg:top-30 space-y-5">

          <div className="flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-white">Payment</h2>
          </div>

          {/* Amount */}
          <div className="bg-primary/10 rounded-xl p-4 text-center border border-primary/20">
            <p className="text-gray-400 text-xs mb-1">Amount to Pay</p>
            <p className="text-3xl font-bold text-white">
              ₹{grandTotal.toLocaleString("en-IN")}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} · incl. all taxes
            </p>
          </div>

          {/* Email */}
          {user?.primaryEmailAddress?.emailAddress && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-green-400 text-xs font-medium">📧 Confirmation email</p>
              <p className="text-gray-500 text-xs mt-1 break-all">
                {user.primaryEmailAddress.emailAddress}
              </p>
            </div>
          )}

          {/* Supported methods */}
          <div className="flex justify-center gap-2 flex-wrap">
            {["UPI","VISA","Mastercard","RuPay","NetBanking"].map(m => (
              <span key={m} className="text-xs text-gray-500 border border-gray-700/60
                                       rounded px-2 py-0.5 bg-white/5">
                {m}
              </span>
            ))}
          </div>

          {/* Pay button */}
          <button
            onClick={() => setShowRazorpay(true)}
            disabled={isProcessing}
            className="w-full py-3.5 bg-primary hover:bg-primary-dull text-white
                       font-semibold text-sm rounded-full transition cursor-pointer
                       active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent
                                 rounded-full animate-spin" />
                Saving booking…
              </>
            ) : (
              `Pay ₹${grandTotal.toLocaleString("en-IN")} via Razorpay`
            )}
          </button>

          <p className="text-gray-500 text-xs text-center">
            🔒 Powered by Razorpay · 256-bit SSL
          </p>
        </div>
      </div>
    </div>
  );
}

export default Payment;