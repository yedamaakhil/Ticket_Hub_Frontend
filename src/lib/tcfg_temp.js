// ─────────────────────────────────────────────
//  SHARED THEATER + SCREEN CONFIG
//  Single source of truth used by BOTH:
//   - AddMovie (admin) → builds theater + screen dropdowns
//   - Theaters (public) → renders theaters and their screens
//
//  Keep screen `id` values as strings so they match movie.screen consistently.
//  Each theater has up to 5 screens. AddMovie disables screens a theater
//  does not have.
// ─────────────────────────────────────────────

// Master catalog of every screen type that can exist.
// `id` must match what gets stored on a movie (movie.screen).
export const SCREEN_CATALOG = {
  "1":     { id: "1",     name: "Screen 1",     capacity: 180, features: ["4K", "Dolby Atmos"] },
  "2":     { id: "2",     name: "Screen 2",     capacity: 180, features: ["3D", "Dolby 7.1"] },
  "3":     { id: "3",     name: "Screen 3",     capacity: 180, features: ["4K", "Recliners"] },
  "4":     { id: "4",     name: "Screen 4",     capacity: 180, features: ["Dolby 7.1"] },
  "5":     { id: "5",     name: "Screen 5",     capacity: 180, features: ["2K", "Standard"] },
  "IMAX":  { id: "IMAX",  name: "IMAX Screen",  capacity: 180, features: ["IMAX", "3D", "Dolby Atmos"] },
  "4DX":   { id: "4DX",   name: "4DX Screen",   capacity: 180, features: ["4DX", "Motion Seats", "Wind & Fog"] },
  "Dolby": { id: "Dolby", name: "Dolby Cinema", capacity: 180, features: ["Dolby Vision", "Dolby Atmos"] },
};

// Each theater + the screen ids it actually has (max 5).
export const THEATERS = [
  {
    id: 1,
    name: "AVD Cinemas",
    location: "Downtown Mall, 3rd Floor",
    city: "Hyderabad",
    pinCode: "500001",
    distance: "2.5 km",
    rating: 4.8,
    totalReviews: 12500,
    amenities: ["Parking", "WiFi", "Food Court", "Wheelchair Access", "AC", "Recliner Seats"],
    screenIds: ["1", "2", "IMAX", "4DX", "Dolby"],
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800",
    contact: "+91 40 1234 5678",
    timings: "10:00 AM - 12:00 AM",
    priceRange: "₹150 - ₹500",
  },
  {
    id: 2,
    name: "PVR Cinemas",
    location: "City Center Mall",
    city: "Hyderabad",
    pinCode: "500034",
    distance: "5.8 km",
    rating: 4.6,
    totalReviews: 8900,
    amenities: ["Parking", "WiFi", "Food Court", "Wheelchair Access", "AC"],
    screenIds: ["1", "2", "3", "4", "IMAX"],
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
    contact: "+91 40 8765 4321",
    timings: "9:00 AM - 11:30 PM",
    priceRange: "₹200 - ₹600",
  },
  {
    id: 3,
    name: "INOX Leisure",
    location: "Galleria Mall",
    city: "Hyderabad",
    pinCode: "500081",
    distance: "8.2 km",
    rating: 4.7,
    totalReviews: 7200,
    amenities: ["Parking", "WiFi", "Food Court", "Wheelchair Access", "AC", "Luxury Seats"],
    screenIds: ["1", "2", "3", "IMAX", "Dolby"],
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800",
    contact: "+91 40 9876 5432",
    timings: "10:30 AM - 11:30 PM",
    priceRange: "₹180 - ₹550",
  },
  {
    id: 4,
    name: "Cinepolis",
    location: "Forum Sujana Mall",
    city: "Hyderabad",
    pinCode: "500095",
    distance: "10.5 km",
    rating: 4.5,
    totalReviews: 5600,
    amenities: ["Parking", "WiFi", "Food Court", "Wheelchair Access", "AC"],
    screenIds: ["1", "2", "3", "4", "4DX"],
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800",
    contact: "+91 40 5678 1234",
    timings: "10:00 AM - 12:00 AM",
    priceRange: "₹170 - ₹520",
  },
  {
    id: 5,
    name: "Carnival Cinemas",
    location: "Manjeera Mall",
    city: "Hyderabad",
    pinCode: "500072",
    distance: "12.0 km",
    rating: 4.4,
    totalReviews: 4100,
    amenities: ["Parking", "WiFi", "Food Court", "Wheelchair Access", "AC"],
    screenIds: ["1", "2", "3", "4", "5"],
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
    contact: "+91 40 2468 1357",
    timings: "10:00 AM - 11:30 PM",
    priceRange: "₹160 - ₹500",
  },
];

// All screen ids that appear in any theater (for the AddMovie dropdown ordering).
export const ALL_SCREEN_IDS = ["1", "2", "3", "4", "5", "IMAX", "4DX", "Dolby"];

// Helper: full screen objects for a theater (by name).
export const getScreensForTheater = (theaterName) => {
  const t = THEATERS.find((th) => th.name === theaterName);
  if (!t) return [];
  return t.screenIds.map((id) => SCREEN_CATALOG[id]).filter(Boolean);
};

// Helper: just the screen ids a theater has (by name).
export const getScreenIdsForTheater = (theaterName) => {
  const t = THEATERS.find((th) => th.name === theaterName);
  return t ? t.screenIds : [];
};

// Helper: theater names list (for dropdowns).
export const THEATER_NAMES = THEATERS.map((t) => t.name);