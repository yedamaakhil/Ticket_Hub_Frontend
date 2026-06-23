import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPinIcon, 
  ClockIcon, 
  TicketIcon, 
  WifiIcon, 
  CoffeeIcon, 
  CarIcon,
  AccessibilityIcon,
  ChevronRightIcon,
  StarIcon,
  PhoneIcon,
  FilmIcon
} from 'lucide-react';
import BlurCircle from '../Components/BlurCircle';
import { assets } from '../assets/assets';
import { useMovies } from '../hooks/useMovies';
import { THEATERS, getScreensForTheater } from '../../lib/theaterdata';

const Theaters = () => {
  const navigate = useNavigate();
  const { movies } = useMovies(); // Get all movies (base + admin-added)
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedScreen, setSelectedScreen] = useState(null);

  // Build theater list from shared config, expanding each theater's screens.
  const theaters = THEATERS.map((t) => ({
    ...t,
    screens: getScreensForTheater(t.name),
  }));

  // Get movies for a specific theater and screen from ALL movies (base + admin-added)
  const getMoviesForScreen = (theaterName, screenId) => {
    return movies.filter(movie => 
      movie.theater === theaterName && String(movie.screen) === String(screenId)
    );
  };

  const getAmenityIcon = (amenity) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return <WifiIcon className="w-4 h-4" />;
    if (amenityLower.includes('food')) return <CoffeeIcon className="w-4 h-4" />;
    if (amenityLower.includes('parking')) return <CarIcon className="w-4 h-4" />;
    if (amenityLower.includes('wheel')) return <AccessibilityIcon className="w-4 h-4" />;
    return <TicketIcon className="w-4 h-4" />;
  };

  const handleTheaterClick = (theater) => {
    setSelectedTheater(theater);
    setSelectedScreen(null); // Reset selected screen when clicking a new theater
  };

  const handleScreenClick = (theater, screen, e) => {
    e.stopPropagation();
    setSelectedTheater(theater);
    setSelectedScreen(screen);
  };

  const handleMovieClick = (movie) => {
    // Navigate to movie details page with movie data
    navigate(`/movie-details/${movie.id}`, { 
      state: { 
        movie: movie,
        theater: selectedTheater?.name,
        screen: selectedScreen?.name
      } 
    });
    window.scrollTo(0, 0);
  };

  return (
    <div className="px-4 sm:px-6 md:px-16 lg:px-40 pt-24 sm:pt-30 md:pt-40 lg:pt-50 pb-12 min-h-screen">
      <BlurCircle top="0" left="0" />
      <BlurCircle bottom="0" right="200px" />

      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-primary text-sm font-medium uppercase tracking-wider">Choose Your Experience</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Premium Theaters
        </h1>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
          Book tickets at the best theaters in town. Experience movies like never before with our premium facilities.
        </p>
      </div>

      {/* Theater Cards */}
      <div className="space-y-6">
        {theaters.map((theater) => (
          <div
            key={theater.id}
            className={`bg-primary/5 border rounded-2xl overflow-hidden transition-all duration-300
              ${selectedTheater?.id === theater.id 
                ? 'border-primary shadow-lg shadow-primary/20 scale-[1.01]' 
                : 'border-primary/20 hover:border-primary/40 hover:scale-[1.01]'}`}
          >
            <div className="flex flex-col lg:flex-row">
              {/* Theater Image - Clickable */}
              <div 
                className="lg:w-80 h-48 lg:h-auto relative overflow-hidden cursor-pointer"
                onClick={() => handleTheaterClick(theater)}
              >
                <img 
                  src={theater.image} 
                  alt={theater.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-xs font-semibold">{theater.rating}</span>
                    <span className="text-xs text-gray-400">({theater.totalReviews})</span>
                  </div>
                </div>
                {theater.name === "AVD Cinemas" && (
                  <div className="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full">
                    <span className="text-xs font-bold">Premium Partner</span>
                  </div>
                )}
              </div>

              {/* Theater Details */}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h2 
                      className="text-2xl font-bold text-white mb-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleTheaterClick(theater)}
                    >
                      {theater.name}
                      {theater.name === "AVD Cinemas" && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-400 text-sm mb-3">
                      <MapPinIcon className="w-4 h-4 shrink-0" />
                      <span>{theater.location}, {theater.city} - {theater.pinCode}</span>
                      <span className="text-primary">• {theater.distance}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-400 text-sm mb-4">
                      <ClockIcon className="w-4 h-4 shrink-0" />
                      <span>{theater.timings}</span>
                      <span className="text-primary">• {theater.priceRange}</span>
                    </div>
                  </div>
                  <button 
                    className="flex items-center gap-2 px-5 py-2 bg-primary/20 hover:bg-primary/30 
                    rounded-lg transition text-primary text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `tel:${theater.contact}`;
                    }}
                  >
                    <PhoneIcon className="w-4 h-4" />
                    Call Now
                  </button>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-3 mb-5">
                  {theater.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
                      {getAmenityIcon(amenity)}
                      <span className="text-xs text-gray-300">{amenity}</span>
                    </div>
                  ))}
                </div>

                {/* Screens */}
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-3">
                    Available Screens ({theater.screens.length}):
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {theater.screens.map((screen) => {
                      const movieCount = getMoviesForScreen(theater.name, screen.id).length;
                      return (
                        <button
                          key={screen.id}
                          onClick={(e) => handleScreenClick(theater, screen, e)}
                          className={`group relative px-4 py-2 rounded-lg transition-all duration-200 ${
                            selectedScreen?.id === screen.id && selectedTheater?.id === theater.id
                              ? 'bg-primary text-white'
                              : 'bg-primary/10 hover:bg-primary/20'
                          }`}
                        >
                          <div className="text-left">
                            <p className="text-sm font-semibold">
                              {screen.name}
                              {movieCount > 0 && (
                                <span className="ml-1.5 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                                  {movieCount}
                                </span>
                              )}
                            </p>
                            <p className="text-xs opacity-80">{screen.features.join(" • ")}</p>
                            <p className="text-xs mt-1 opacity-70">Capacity: {screen.capacity}</p>
                          </div>
                          <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 
                          opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Movies Playing in Selected Screen - Only for this theater */}
                {selectedTheater?.id === theater.id && selectedScreen && (
                  <div className="mt-5 pt-4 border-t border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <FilmIcon className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-white">
                        Now Showing on {selectedScreen.name}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getMoviesForScreen(theater.name, selectedScreen.id).map((movie) => (
                        <div
                          key={movie.id}
                          className="bg-primary/10 rounded-xl overflow-hidden hover:bg-primary/20 transition-all duration-200 cursor-pointer group"
                          onClick={() => handleMovieClick(movie)}
                        >
                          <div className="flex">
                            <img 
                              src={movie.poster_path} 
                              alt={movie.title}
                              className="w-24 h-32 object-cover"
                            />
                            <div className="flex-1 p-3">
                              <h4 className="font-semibold text-white text-sm line-clamp-2">
                                {movie.title}
                              </h4>
                              <div className="flex items-center gap-1 mt-1">
                                <StarIcon className="w-3 h-3 text-primary fill-primary" />
                                <span className="text-xs text-gray-300">{movie.vote_average}</span>
                                <span className="text-xs text-gray-500">({movie.runtime} min)</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                {movie.original_language} • {movie.release_date?.split('-')[0]}
                              </p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-primary font-medium">View Details</span>
                                <ChevronRightIcon className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {getMoviesForScreen(theater.name, selectedScreen.id).length === 0 && (
                      <div className="text-center py-8 bg-primary/5 rounded-xl">
                        <p className="text-gray-400">No movies currently showing on this screen</p>
                        <p className="text-sm text-gray-500 mt-1">Check back later for upcoming shows</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Message when theater is selected but no screen */}
                {selectedTheater?.id === theater.id && !selectedScreen && (
                  <div className="mt-5 pt-4 border-t border-primary/20">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <FilmIcon className="w-4 h-4 text-primary" />
                      <span>✨ Click on any screen to see available movies</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AVD Cinemas Special Section */}
      <div className="mt-12 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-2xl p-8 border border-primary/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src={assets.marvelLogo} alt="AVD Cinemas" className="w-16 h-16 object-contain" />
            <div>
              <h3 className="text-2xl font-bold text-white">Why Choose AVD Cinemas?</h3>
              <p className="text-gray-300 mt-1">Experience cinema like never before</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">4K</p>
              <p className="text-xs text-gray-400">Projection</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">Dolby</p>
              <p className="text-xs text-gray-400">Atmos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">Recliner</p>
              <p className="text-xs text-gray-400">Seats</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">4DX</p>
              <p className="text-xs text-gray-400">Experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>• Food and beverages are allowed inside the theater • Online booking fees may apply •</p>
        <p className="mt-2">For group bookings and corporate shows, please contact the theater directly.</p>
      </div>
    </div>
  );
};

export default Theaters;