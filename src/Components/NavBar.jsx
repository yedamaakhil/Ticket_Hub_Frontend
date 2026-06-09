import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from "lucide-react";
import { useClerk, UserButton, useUser } from '@clerk/react';
import { getAllMovies } from '../lib/movieStore'; // Import the movieStore

function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [totalMovies, setTotalMovies] = useState(0);
  const searchRef = useRef(null);
  
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  // Load all movies (including admin-added ones from localStorage)
  const loadMovies = () => {
    const movies = getAllMovies(); // This gets base + stored movies
    setAllMovies(movies);
    setTotalMovies(movies.length);
    return movies;
  };

  // Initial load
  useEffect(() => {
    loadMovies();
  }, []);

  // Handle search - filter movies based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    // Search through all movies (including admin added)
    const filteredMovies = allMovies.filter(movie => 
      movie.title?.toLowerCase().includes(query) ||
      movie.theater?.toLowerCase().includes(query) ||
      movie.original_language?.toLowerCase().includes(query) ||
      movie.genres?.some(genre => genre.name?.toLowerCase().includes(query))
    ).map(movie => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      theater: movie.theater,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      addedBy: movie.addedBy, // To identify admin-added movies
      addedAt: movie.addedAt
    }));
    
    setSearchResults(filteredMovies);
  }, [searchQuery, allMovies]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchClick = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // Refresh movies to get latest admin additions
      const freshMovies = loadMovies();
      console.log(`📽️ Search opened - ${freshMovies.length} movies available (including admin-added)`);
      // Focus on input after opening
      setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movie-details/${movieId}`);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Highlight matching text
  const highlightText = (text, query) => {
    if (!query.trim() || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="bg-yellow-500/30 text-yellow-300 font-semibold">{part}</span> : 
        part
    );
  };

  // Format date for display
  const formatYear = (dateString) => {
    if (!dateString) return 'Coming Soon';
    return dateString.split('-')[0];
  };

  return (
    <>
      <div className='fixed top-5 left-0 z-50 w-full flex items-center 
        justify-between px-6 md:px-16 lg:px-36 py-5'>
        
        <Link to='/' className='max-md:flex-1'>
          <img src={assets.a} alt="Logo" className='w-90 h-auto' />
        </Link>

        <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium
          max-md:text-lg z-50 flex flex-col md:flex-row items-center
          max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen
          min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border
          border-gray-300/20 overflow-hidden transition-[width] duration-300
          ${isMenuOpen ? 'max-md:w-full' : 'max-md:w-0'} 
          md:absolute md:left-1/2 md:transform md:-translate-x-1/2`}>

          <XIcon className='md:hidden absolute top-6 right-6 w-6 h-6 
            cursor-pointer' onClick={() => setIsMenuOpen(!isMenuOpen)} />

          <Link onClick={() => { window.scrollTo(0, 0); setIsMenuOpen(false) }} to='/home'>Home</Link>
          <Link onClick={() => { window.scrollTo(0, 0); setIsMenuOpen(false) }} to='/movies'>Movies</Link>
          <Link onClick={() => { window.scrollTo(0, 0); setIsMenuOpen(false) }} to='/shows'>My Shows</Link>
          <Link onClick={() => { window.scrollTo(0, 0); setIsMenuOpen(false) }} to='/theaters'>Theaters</Link>
          <Link onClick={() => { window.scrollTo(0, 0); setIsMenuOpen(false) }} to='/favourite'>Favourites</Link>
          <Link onClick={() => { window.scrollTo(0, 0); setIsMenuOpen(false) }} to='/contact'>Contact Us</Link>
        </div>

        <div className='flex items-center gap-8 relative' ref={searchRef}>
          {/* Search Icon */}
          <SearchIcon 
            className='max-md:hidden w-6 h-6 cursor-pointer hover:scale-110 transition-transform' 
            onClick={handleSearchClick}
          />

          {/* Search Modal/Dropdown */}
          {isSearchOpen && (
            <div className='absolute top-full right-0 mt-2 w-96 bg-black/95 backdrop-blur-lg 
              rounded-lg border border-gray-300/30 shadow-2xl overflow-hidden z-50
              animate-in slide-in-from-top-2 duration-200'>
              
              {/* Search Input Box */}
              <div className='p-4 border-b border-gray-300/20 bg-black/50'>
                <div className='relative'>
                  <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    id='search-input'
                    type='text'
                    placeholder='Search for movies...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full pl-10 pr-4 py-2.5 bg-white/10 rounded-lg text-white 
                      placeholder:text-gray-400 focus:outline-none focus:ring-2 
                      focus:ring-primary focus:bg-white/15 transition-all'
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2'
                    >
                      <XIcon className='w-4 h-4 text-gray-400 hover:text-white' />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results */}
              <div className='max-h-96 overflow-y-auto'>
                {searchQuery.trim() === '' ? (
                  <div className='p-8 text-center text-gray-400'>
                    <SearchIcon className='w-12 h-12 mx-auto mb-3 opacity-50' />
                    <p className='text-sm'>Search for your favorite movies</p>
                    <p className='text-xs mt-2 text-gray-500'>
                      {totalMovies} movies available (including admin additions)
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className='p-8 text-center text-gray-400'>
                    <p className='text-4xl mb-2'>😕</p>
                    <p className='mb-2'>No movies found</p>
                    <p className='text-sm'>Try searching with different keywords</p>
                  </div>
                ) : (
                  <>
                    <div className='p-2'>
                      <div className='px-2 py-1 text-xs font-semibold text-primary uppercase tracking-wider'>
                        Found {searchResults.length} movie{searchResults.length !== 1 ? 's' : ''}
                      </div>
                      {searchResults.map((movie) => (
                        <div
                          key={movie.id}
                          onClick={() => handleMovieClick(movie.id)}
                          className='px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer 
                            transition-all duration-200 flex items-center gap-3 group'
                        >
                          {/* Movie Poster */}
                          <div className='w-12 h-16 rounded overflow-hidden bg-gray-800 flex-shrink-0 relative'>
                            <img 
                              src={movie.poster_path} 
                              alt={movie.title}
                              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/48x64?text=No+Image';
                              }}
                            />
                            {/* Admin badge for admin-added movies */}
                            {movie.addedBy === 'admin' && (
                              <div className='absolute top-0 right-0 bg-primary/80 text-white text-[8px] px-1 rounded-bl'>
                                Admin
                              </div>
                            )}
                          </div>
                          
                          {/* Movie Details */}
                          <div className='flex-1 min-w-0'>
                            <p className='text-white font-medium truncate group-hover:text-primary transition-colors'>
                              {highlightText(movie.title, searchQuery)}
                            </p>
                            <div className='flex items-center gap-2 mt-1'>
                              <span className='text-xs text-gray-400'>
                                {movie.theater || 'Various Theaters'}
                              </span>
                              <span className='text-xs text-gray-500'>•</span>
                              <span className='text-xs text-gray-400'>
                                {formatYear(movie.release_date)}
                              </span>
                            </div>
                            {movie.vote_average && (
                              <div className='flex items-center gap-1 mt-1'>
                                <span className='text-yellow-500 text-xs'>★</span>
                                <span className='text-xs text-gray-400'>
                                  {movie.vote_average.toFixed(1)}/10
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Arrow indicator */}
                          <div className='opacity-0 group-hover:opacity-100 transition-opacity'>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* View All Results Footer */}
                    {searchResults.length > 0 && (
                      <div className='p-2 border-t border-gray-300/20'>
                        <button 
                          onClick={() => {
                            navigate('/movies');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className='w-full text-center text-sm text-primary hover:text-primary/80 py-2 
                            hover:bg-white/5 rounded-lg transition-colors'
                        >
                          View all {searchResults.length} results →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Login/User Button */}
          {
            !user ? (
              <button onClick={openSignIn} className='px-4 py-1 sm:px-7 sm:py-2 bg-primary
                hover:bg-primary-dull transition rounded-full font-medium 
                cursor-pointer'>Login</button>
            ) : (
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action label="My Bookings" labelIcon={<TicketPlus width={15} />}
                    onClick={() => navigate('/my-bookings')} />
                </UserButton.MenuItems>
              </UserButton>
            )
          }
        </div>

        <MenuIcon className='max-md:ml-4 md:hidden w-8 h-8 cursor-pointer' 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        />
      </div>
    </>
  );
}

export default NavBar;