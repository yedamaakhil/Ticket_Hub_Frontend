import { useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/react";
import { assets } from "../assets/assets";
import { ArrowRight, UserIcon, LogInIcon, TicketIcon, StarIcon, ClockIcon } from "lucide-react";
import { useEffect } from "react";

function LandingPage() {
  const navigate = useNavigate();
  const { openSignIn } = useClerk();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/home');
    }
  }, [isSignedIn, isLoaded, navigate]);

  const handleSignIn = () => {
    openSignIn({ afterSignInUrl: '/home', afterSignUpUrl: '/home' });
  };

  const handleGuestAccess = () => {
    sessionStorage.setItem('guestMode', 'true');
    navigate('/home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">

      <nav className="flex items-center justify-between gap-2 px-3 sm:px-8 md:px-20 py-3 sm:py-5
      border-b border-white/10 bg-black/50 backdrop-blur fixed top-0 w-full z-50">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <img src={assets.a} alt="TicketHub" className="h-7 sm:h-9 w-auto" />
        </div>
        <div className="flex gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleSignIn}
            className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm border border-white/30 rounded-full
            hover:bg-white/10 transition cursor-pointer whitespace-nowrap text-white shrink-0"
          >
            Login
          </button>
          <button
            onClick={handleSignIn}
            className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary hover:bg-primary-dull
            rounded-full transition cursor-pointer font-medium whitespace-nowrap text-white shrink-0"
          >
            Sign Up
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center
      px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 bg-gradient-to-b from-black via-zinc-900 to-black">

        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest
        text-primary border border-primary/30 bg-primary/10 px-3 sm:px-4 py-1.5
        rounded-full mb-5 sm:mb-6 animate-pulse text-center">
          #1 Movie Ticket Booking Platform
        </span>

        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight max-w-3xl px-1">
          Book Movie Tickets <br />
          <span className="text-primary">Instantly.</span>
        </h1>

        <p className="text-gray-400 text-sm sm:text-base md:text-lg mt-4 sm:mt-6 max-w-xl leading-relaxed px-2">
          Skip the queues. Choose your seats. Pay securely.
          Your perfect movie night is just a few clicks away.
        </p>

        <button
          onClick={handleGuestAccess}
          className="flex items-center gap-2 mt-8 sm:mt-10 px-6 sm:px-10 py-3 sm:py-4 bg-primary
          hover:bg-primary-dull rounded-full font-semibold text-sm sm:text-base
          cursor-pointer transition active:scale-95 shadow-lg shadow-primary/20"
        >
          <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          Get Started as Guest <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="mt-5 sm:mt-6">
          <button
            onClick={handleSignIn}
            className="flex items-center gap-2 text-gray-300 hover:text-white
            transition text-xs sm:text-sm group mx-auto"
          >
            <LogInIcon className="w-4 h-4 group-hover:text-primary transition shrink-0" />
            <span>Already have an account? Sign In</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition shrink-0" />
          </button>
          <p className="text-gray-500 text-xs mt-2 px-4">
            Sign in to save your bookings and get personalized recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 mt-14 sm:mt-20 max-w-4xl mx-auto w-full px-2">
          <div className="flex flex-col items-center p-5 sm:p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
              <TicketIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2 text-sm sm:text-base">Easy Booking</h3>
            <p className="text-gray-400 text-xs sm:text-sm text-center">Select your seats and book in seconds</p>
          </div>
          <div className="flex flex-col items-center p-5 sm:p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
              <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2 text-sm sm:text-base">Best Experience</h3>
            <p className="text-gray-400 text-xs sm:text-sm text-center">Premium theaters with amazing sound & picture</p>
          </div>
          <div className="flex flex-col items-center p-5 sm:p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
              <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2 text-sm sm:text-base">24/7 Support</h3>
            <p className="text-gray-400 text-xs sm:text-sm text-center">We're here to help anytime you need</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mt-12 sm:mt-16
        pt-8 sm:pt-10 border-t border-white/10 w-full max-w-xl">
          {[
            { value: "10K+", label: "Happy Users" },
            { value: "500+", label: "Movies" },
            { value: "4.9★", label: "Rating" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-primary">{s.value}</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 sm:mt-20 w-full max-w-5xl px-1">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Now Showing</h2>
            <p className="text-gray-400 text-xs sm:text-sm">Check out the latest blockbusters</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              "https://stat5.bollywoodhungama.in/wp-content/uploads/2024/06/Kalki-2898-AD-10.jpg",
              "https://media-cache.cinematerial.com/p/500x/8ai861rm/pushpa-the-rule-part-2-indian-movie-poster.jpg?v=1732858663",
              "https://m.media-amazon.com/images/M/MV5BNWY4NDgyN2QtNDRkZS00OGRjLWFhN2UtODc3Mzk2ZjQ0ZjhkXkEyXkFqcGc@._V1_.jpg",
              "https://cdn.district.in/movies-assets/images/cinema/Salaar-(1)%20(1)-3bc0e140-af31-11f0-b3dc-814b56ab3dc9.png"
            ].map((poster, index) => (
              <div key={index} className="rounded-xl overflow-hidden group cursor-pointer">
                <img
                  src={poster}
                  alt={`Movie ${index + 1}`}
                  className="w-full h-36 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <button
              onClick={handleGuestAccess}
              className="text-primary hover:text-primary-dull text-sm font-medium transition"
            >
              View All Movies →
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center py-5 sm:py-6 border-t border-white/10
      text-gray-500 text-xs px-4">
        © 2026 <span className="text-white font-medium">TicketHub</span>. All rights reserved.
      </footer>

    </div>
  );
}

export default LandingPage;