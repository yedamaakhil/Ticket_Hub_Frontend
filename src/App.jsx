import React from 'react';
import NavBar from './Components/NavBar';
import Footer from './Components/Footer';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Home from './AllPages/Home';
import Movies from './AllPages/Movies';
import Favourite from './AllPages/Favourite';
import SeatsSelecting from './AllPages/SeatsSelecting';
import MovieDetails from './AllPages/MovieDetails';
import { Toaster } from 'react-hot-toast';
import Contact from './AllPages/Contact';
import BookingConfirmation from './AllPages/BookingConfirmation';
import LandingPage from './AllPages/LandingPage';
import { useUser } from '@clerk/react';
import Loading from './Components/Loading';
import Layout from './AllPages/Admin/Layout';
import Dashboard from './AllPages/Admin/Dashboard';
import Payment from './AllPages/Payment';
import MyBookings from './AllPages/MyBookings';
import MyShows from './AllPages/MyShows';
import Theaters from './AllPages/Theaters';
import AddMovie from './AllPages/Admin/Addmovie';
import ListMovies from './AllPages/Admin/ListMovies';
import ListBookings from './AllPages/Admin/ListBookings';
import MovieChatbot from './Components/MovieChatbot'; // ← Import MovieChatbot

function App() {

  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();

  const isAdminRoute   = location.pathname.startsWith('/admin');
  const isLandingRoute = location.pathname === '/' || location.pathname === '/landing';

  // Hide NavBar and Footer on landing and admin pages
  const showNavFooter = !isAdminRoute && !isLandingRoute;

  if (!isLoaded) return <Loading />;

  return (
    <>
      <Toaster />
      {showNavFooter && <NavBar />}
      <Routes>
        <Route path="/"                         element={<LandingPage />} />
        <Route path="/landing"                  element={<LandingPage />} />
        <Route path="/home"                     element={<Home />} />
        <Route path="/movies"                   element={<Movies />} />
        <Route path="/movie-details/:id"        element={<MovieDetails />} />
        <Route path="/movies/:id/:date"         element={<SeatsSelecting />} />
        <Route path="/payment"                  element={isSignedIn ? <Payment />           : <Navigate to="/" replace />} />
        <Route path="/my-bookings"              element={isSignedIn ? <MyBookings />        : <Navigate to="/" replace />} />
        <Route path="/my-bookings/confirmation" element={isSignedIn ? <BookingConfirmation />: <Navigate to="/" replace />} />
        <Route path="/shows"                    element={isSignedIn ? <MyShows />           : <Navigate to="/" replace />} />
        <Route path="/theaters"                 element={<Theaters />} />
        <Route path="/favourite"                element={isSignedIn ? <Favourite />         : <Navigate to="/" replace />} />
        <Route path="/contact"                  element={isSignedIn ? <Contact />           : <Navigate to="/" replace />} />
        <Route path="/admin/*"                  element={<Layout/>}> 
               <Route index element={<Dashboard/>} />
               <Route path='add-movies' element={<AddMovie/>} />
               <Route path='list-bookings' element={<ListBookings/>} />
               <Route path='list-movies' element={<ListMovies/>} />
        </Route>
        <Route path="*"                         element={<Navigate to={isSignedIn ? "/home" : "/"} replace />} />
      </Routes>
      {showNavFooter && <Footer />}
      <MovieChatbot />   {/* ← Added MovieChatbot component */}
    </>
  );
}

export default App;