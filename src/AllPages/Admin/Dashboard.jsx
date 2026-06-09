import { useState, useEffect } from "react";
import Title from "../../Components/Admin/Title";
import BlurCircle from "../../Components/BlurCircle";
import {
    ChartLineIcon,
    IndianRupee,
    PlayCircleIcon,
    UsersIcon,
    StarIcon,
    RefreshCwIcon,
    TicketIcon,
    CheckCircleIcon,
    XCircleIcon,
    FilmIcon,
    CalendarIcon,
    ClockIcon,
    TrendingUpIcon,
    AlertCircleIcon,
    ArmchairIcon,
    EyeIcon,
    DollarSignIcon,
    PercentIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { getAllMovies } from "../../lib/movieStore";

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const currency = import.meta.env.VITE_CURRENCY || "₹";
const DEFAULT_TOTAL_SEATS = 180; // Standard screen capacity (18 rows × 10 seats)

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const fmt = (n) => {
    if (!n && n !== 0) return `${currency}0`;
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
    }).format(n);
};

const fmtNumber = (n) => {
    if (!n && n !== 0) return "0";
    return new Intl.NumberFormat("en-IN").format(n);
};

const fmtDate = (d) => {
    if (!d) return "—";
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
        });
    } catch {
        return "—";
    }
};

const fmtTime = (t) => {
    if (!t) return "—";
    try {
        let hours, minutes;
        
        // If it's a full ISO string or Date object
        if (typeof t === 'string' && (t.includes("T") || t.includes(":"))) {
            const date = new Date(t);
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString("en-IN", { 
                    hour: "2-digit", 
                    minute: "2-digit",
                    hour12: true 
                });
            }
        }
        
        // Handle "HH:MM" format (24-hour)
        if (typeof t === 'string' && t.match(/^\d{1,2}:\d{2}$/)) {
            [hours, minutes] = t.split(":").map(Number);
        }
        // Handle "HH:MM:SS" format
        else if (typeof t === 'string' && t.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
            [hours, minutes] = t.split(":").map(Number);
        }
        else {
            return String(t);
        }
        
        if (isNaN(hours) || isNaN(minutes)) return String(t);
        
        const period = hours >= 12 ? 'PM' : 'AM';
        let displayHours = hours % 12;
        displayHours = displayHours === 0 ? 12 : displayHours;
        
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
        console.error("Time formatting error:", error);
        return String(t);
    }
};

// Get total seats for a show with proper fallback
const getTotalSeatsForShow = (show) => {
    if (show.totalSeats && show.totalSeats > 0) {
        return show.totalSeats;
    }
    if (show.screen?.totalSeats) {
        return show.screen.totalSeats;
    }
    return DEFAULT_TOTAL_SEATS;
};

// Calculate occupancy rate
const calculateOccupancy = (booked, total) => {
    if (!total || total === 0) return 0;
    return Math.round((booked / total) * 100);
};

// Get occupancy color based on percentage
const getOccupancyColor = (percentage) => {
    if (percentage >= 90) return "text-red-400";
    if (percentage >= 70) return "text-yellow-400";
    if (percentage >= 50) return "text-blue-400";
    return "text-green-400";
};

// Get occupancy bar color
const getOccupancyBarColor = (percentage) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    if (percentage >= 50) return "bg-blue-500";
    return "bg-green-500";
};

// Resolve movie from all movies (base + admin-added)
const resolveMovie = (movieId) => {
    const allMovies = getAllMovies();
    return allMovies.find((m) => String(m.id) === String(movieId) || String(m._id) === String(movieId));
};

// ─────────────────────────────────────────────
//  STAT CARD
// ─────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, accent = "text-primary", loading, tooltip, trend }) {
    return (
        <div className="flex items-center justify-between px-5 py-4 bg-primary/10
                        border border-primary/20 rounded-xl flex-1 min-w-44
                        hover:border-primary/40 transition group relative">
            <div>
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    {title}
                    {tooltip && (
                        <span className="cursor-help text-gray-500 text-[10px] group-hover:text-gray-300">ⓘ</span>
                    )}
                </p>
                {loading
                    ? <div className="h-8 w-24 bg-primary/20 rounded animate-pulse" />
                    : <p className={`text-2xl font-bold ${accent}`}>{value}</p>}
                {trend && !loading && (
                    <p className="text-[10px] text-gray-500 mt-1">{trend}</p>
                )}
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${accent}`} />
            </div>
            {tooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 
                                bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 
                                transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {tooltip}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
//  ACTIVE SHOW CARD
// ─────────────────────────────────────────────
function ShowCard({ show }) {
    const movie = resolveMovie(show.movieId);
    const booked = Number(show.occupiedSeatsCount ?? 0);
    const total = getTotalSeatsForShow(show);
    const occupancy = calculateOccupancy(booked, total);
    const available = total - booked;
    const occupancyColor = getOccupancyColor(occupancy);
    const barColor = getOccupancyBarColor(occupancy);
    // FIXED: Only show ticket price if it's a valid positive number
    const ticketPriceNum = Number(show.ticketPrice);
    const hasValidTicketPrice = !isNaN(ticketPriceNum) && ticketPriceNum > 0;

    return (
        <div className="w-44 rounded-xl overflow-hidden pb-3 bg-primary/10 border
                        border-primary/20 hover:-translate-y-1 transition duration-300 flex-shrink-0">
            {movie?.poster_path ? (
                <img
                    src={movie.poster_path}
                    alt={movie.title}
                    className="h-60 w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
            ) : (
                <div className="h-60 w-full bg-gray-800 flex items-center justify-center">
                    <FilmIcon className="w-10 h-10 text-gray-600" />
                </div>
            )}

            <p className="font-semibold p-2 pb-1 truncate text-sm text-white">
                {movie?.title ?? `Movie #${show.movieId}`}
            </p>

            <div className="flex items-center justify-between px-2 mb-1">
                {movie?.vote_average > 0 && (
                    <p className="flex items-center gap-1 text-xs text-gray-400">
                        <StarIcon className="w-3.5 h-3.5 text-primary fill-primary" />
                        {movie.vote_average.toFixed(1)}
                    </p>
                )}
                <p className={`text-xs font-semibold ${occupancyColor}`}>
                    {available} left
                </p>
            </div>

            <div className="px-2 space-y-1">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <CalendarIcon className="w-3 h-3" /> {fmtDate(show.showDate)}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <ClockIcon className="w-3 h-3" /> {fmtTime(show.showTime)}
                </div>
            </div>

            <div className="px-2 mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                    <span>Seats</span>
                    <span>{booked}/{total}</span>
                </div>
                <div className="w-full bg-primary/10 rounded-full h-1.5">
                    <div
                        className={`${barColor} h-1.5 rounded-full transition-all`}
                        style={{ width: `${occupancy}%` }}
                    />
                </div>
            </div>

            {/* Only show ticket price if it's a valid positive number */}
            {hasValidTicketPrice && (
                <div className="px-2 mt-2 pt-1 border-t border-primary/20">
                    <p className="text-xs text-primary font-semibold">
                        {fmt(ticketPriceNum)}/ticket
                    </p>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
//  RECENT BOOKING ROW
// ─────────────────────────────────────────────
function BookingRow({ booking, idx }) {
    const seatCount = Array.isArray(booking.seats) ? booking.seats.length : 0;
    const isPaid = booking.status?.toUpperCase() === "CONFIRMED";
    const isCancelled = booking.status?.toUpperCase() === "CANCELLED";
    const seatNumbers = Array.isArray(booking.seats) ? booking.seats.slice(0, 3).join(", ") : "";
    const hasMoreSeats = Array.isArray(booking.seats) && booking.seats.length > 3;

    return (
        <div className="flex items-center justify-between p-3 bg-primary/5
                        hover:bg-primary/10 rounded-lg transition group">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-gray-500 text-xs w-5 flex-shrink-0">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">
                        {booking.movieTitle ?? "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-gray-500 text-xs">
                            {seatCount} seat{seatCount !== 1 ? "s" : ""}
                        </p>
                        {seatNumbers && (
                            <>
                                <span className="text-gray-600 text-[10px]">•</span>
                                <p className="text-gray-500 text-[10px] truncate" title={booking.seats?.join(", ")}>
                                    {seatNumbers}{hasMoreSeats ? "..." : ""}
                                </p>
                            </>
                        )}
                        <span className="text-gray-600 text-[10px]">•</span>
                        <p className={`text-xs font-medium ${isCancelled ? "text-red-400" : isPaid ? "text-green-400" : "text-yellow-400"}`}>
                            {booking.status ?? "—"}
                        </p>
                    </div>
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
                <p className="text-primary text-sm font-semibold">{fmt(booking.totalPrice ?? 0)}</p>
                <p className="text-gray-500 text-xs">{fmtDate(booking.showDate)}</p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  MAIN DASHBOARD
// ─────────────────────────────────────────────
function Dashboard() {
    const [stats, setStats] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [shows, setShows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // ── Fetch all dashboard data in parallel ──
    const loadAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, bookingsRes, showsRes] = await Promise.all([
                fetch(`${API_URL}/bookings/stats`),
                fetch(`${API_URL}/bookings/all`),
                fetch(`${API_URL}/shows/active`),
            ]);

            if (!statsRes.ok) throw new Error(`Stats: ${statsRes.status}`);
            if (!bookingsRes.ok) throw new Error(`Bookings: ${bookingsRes.status}`);

            const statsData = await statsRes.json();
            const bookingsData = await bookingsRes.json();
            const showsData = showsRes.ok ? await showsRes.json() : [];

            setStats(statsData);
            setBookings(
                [...(Array.isArray(bookingsData) ? bookingsData : [])]
                    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
            );
            setShows(Array.isArray(showsData) ? showsData : []);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Dashboard load error:", err);
            setError(err.message);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        const interval = setInterval(loadAll, 60_000);
        return () => clearInterval(interval);
    }, []);

    // ── Derived Calculations ──
    const totalSeatsBooked = bookings.reduce((s, b) => s + (b.seats?.length ?? 0), 0);
    const successRate = stats?.totalBookings > 0
        ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
        : 0;
    const avgValue = stats?.totalBookings > 0
        ? Math.round(stats.totalRevenue / stats.totalBookings)
        : 0;
    const cancellationRate = stats?.totalBookings > 0
        ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100)
        : 0;

    // Occupancy across all shows (using DEFAULT_TOTAL_SEATS if not provided)
    const { totalOcc, totalCap } = shows.reduce(
        (acc, s) => ({
            totalOcc: acc.totalOcc + (s.occupiedSeatsCount ?? 0),
            totalCap: acc.totalCap + getTotalSeatsForShow(s),
        }),
        { totalOcc: 0, totalCap: 0 }
    );
    const occupancyRate = totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0;
    const occupancyColor = getOccupancyColor(occupancyRate);
    const occupancyBarColor = getOccupancyBarColor(occupancyRate);

    // Revenue per seat
    const revenuePerSeat = totalSeatsBooked > 0 
        ? Math.round((stats?.totalRevenue ?? 0) / totalSeatsBooked)
        : 0;

    // Average seats per booking
    const avgSeatsPerBooking = stats?.totalBookings > 0
        ? (totalSeatsBooked / stats.totalBookings).toFixed(1)
        : 0;

    // Unique movies count
    const uniqueMoviesCount = new Set(shows.map((s) => s.movieId)).size;

    // Total revenue potential (if all seats were sold)
    const totalRevenuePotential = shows.reduce((total, show) => {
        const ticketPrice = (show.ticketPrice && Number(show.ticketPrice) > 0) ? Number(show.ticketPrice) : 200;
        const totalSeats = getTotalSeatsForShow(show);
        return total + (ticketPrice * totalSeats);
    }, 0);
    
    const revenueUtilization = totalRevenuePotential > 0
        ? Math.round(((stats?.totalRevenue ?? 0) / totalRevenuePotential) * 100)
        : 0;

    // ─────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────
    return (
        <>
            <Title text1="Admin" text2="Dashboard" />

            <div className="relative mt-6">
                <BlurCircle top="-100px" left="0" />

                {/* ── Toolbar ── */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-lg">
                        <p className="text-xs text-gray-300">🎬 Live Dashboard · Backend Connected</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-primary/10 border border-primary/20 px-3 py-2 rounded-lg hidden sm:block">
                            <p className="text-xs text-gray-400">Screen Capacity</p>
                            <p className="text-sm text-primary font-semibold">{DEFAULT_TOTAL_SEATS} seats/screen</p>
                        </div>
                        <button
                            onClick={loadAll}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-primary/20
                                       hover:bg-primary/30 border border-primary/30 rounded-lg
                                       text-sm text-primary transition cursor-pointer
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            {loading ? "Refreshing…" : "Refresh"}
                        </button>
                    </div>
                </div>

                {/* ── Error banner ── */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20
                                    rounded-xl flex items-center gap-3">
                        <AlertCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-red-400 text-sm">{error}</p>
                        <button
                            onClick={loadAll}
                            className="ml-auto text-xs text-red-300 underline cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* ── Primary Stat Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Total Revenue"
                        value={fmt(stats?.totalRevenue ?? 0)}
                        icon={IndianRupee}
                        accent="text-green-400"
                        loading={loading}
                        tooltip="Total revenue from all confirmed bookings"
                        trend={`${revenueUtilization}% of potential`}
                    />
                    <StatCard
                        title="Total Bookings"
                        value={fmtNumber(stats?.totalBookings ?? 0)}
                        icon={TicketIcon}
                        loading={loading}
                        tooltip="Total number of bookings (all statuses)"
                        trend={`${avgSeatsPerBooking} seats/booking avg`}
                    />
                    <StatCard
                        title="Unique Users"
                        value={fmtNumber(stats?.totalUsers ?? 0)}
                        icon={UsersIcon}
                        accent="text-purple-400"
                        loading={loading}
                        tooltip="Number of unique users who made bookings"
                    />
                    <StatCard
                        title="Active Shows"
                        value={shows.length}
                        icon={PlayCircleIcon}
                        accent="text-yellow-400"
                        loading={loading}
                        tooltip="Currently active movie shows"
                    />
                </div>

                {/* ── Secondary Stats Row ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
                    {[
                        { label: "Confirmed", value: stats?.completedBookings ?? 0, color: "text-green-400", icon: CheckCircleIcon },
                        { label: "Cancelled", value: stats?.cancelledBookings ?? 0, color: "text-red-400", icon: XCircleIcon },
                        { label: "Avg Value", value: fmt(avgValue), color: "text-primary", icon: TrendingUpIcon },
                        { label: "Success Rate", value: `${successRate}%`, color: "text-green-400", icon: PercentIcon },
                        { label: "Cancellation Rate", value: `${cancellationRate}%`, color: "text-red-400", icon: XCircleIcon },
                        { label: "Revenue/Seat", value: fmt(revenuePerSeat), color: "text-primary", icon: DollarSignIcon },
                    ].map(({ label, value, color, icon: Icon }) => (
                        <div
                            key={label}
                            className="bg-primary/5 border border-primary/20 rounded-xl
                                       px-3 py-2 text-center group hover:bg-primary/10 transition"
                        >
                            <Icon className={`w-4 h-4 ${color} mx-auto mb-1 opacity-60`} />
                            <p className="text-gray-500 text-[10px] mb-0.5">{label}</p>
                            {loading
                                ? <div className="h-5 w-12 bg-primary/20 rounded animate-pulse mx-auto" />
                                : <p className={`text-sm font-bold ${color}`}>{value}</p>}
                        </div>
                    ))}
                </div>

                {/* ── Occupancy Bar ── */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8">
                    <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                        <p className="text-white font-medium text-sm flex items-center gap-2">
                            <ArmchairIcon className="w-4 h-4 text-primary" />
                            Overall Seat Occupancy
                        </p>
                        <div className="flex items-center gap-3">
                            {!loading && (
                                <>
                                    <span className={`text-xs font-bold ${occupancyColor}`}>
                                        {totalOcc}/{totalCap} seats
                                    </span>
                                    <span className="text-primary font-bold text-xl">{occupancyRate}%</span>
                                </>
                            )}
                            {loading && <div className="h-6 w-16 bg-primary/20 rounded animate-pulse" />}
                        </div>
                    </div>
                    <div className="w-full bg-primary/10 rounded-full h-3">
                        <div
                            className={`${occupancyBarColor} h-3 rounded-full transition-all duration-700`}
                            style={{ width: loading ? "0%" : `${occupancyRate}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs mt-2">
                        <span>{fmtNumber(totalOcc)} seats booked</span>
                        <span>out of {fmtNumber(totalCap)} total seats</span>
                        <span>across {shows.length} shows</span>
                    </div>
                    <p className="text-gray-600 text-[10px] mt-2">
                        * Based on {DEFAULT_TOTAL_SEATS} seats per screen (18 rows × 10 seats)
                    </p>
                </div>

                {/* ── Two-column section ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                    {/* Recent Bookings */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                                <TicketIcon className="w-4 h-4 text-primary" />
                                Recent Bookings
                            </h3>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                Total: {fmtNumber(stats?.totalBookings ?? 0)}
                            </span>
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <div key={i} className="h-14 bg-primary/10 rounded-lg animate-pulse" />
                                ))
                            ) : bookings.length > 0 ? (
                                bookings.slice(0, 8).map((b, i) => (
                                    <BookingRow key={b.id ?? i} booking={b} idx={i} />
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm text-center py-10">
                                    No bookings yet
                                </p>
                            )}
                        </div>

                        {/* Summary footer */}
                        {!loading && bookings.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-primary/20 grid grid-cols-4 gap-2 text-center">
                                {[
                                    ["Paid", stats?.completedBookings ?? 0, "text-green-400"],
                                    ["Cancelled", stats?.cancelledBookings ?? 0, "text-red-400"],
                                    ["Pending", (stats?.totalBookings ?? 0) - (stats?.completedBookings ?? 0) - (stats?.cancelledBookings ?? 0), "text-yellow-400"],
                                    ["Seats", totalSeatsBooked, "text-primary"],
                                ].map(([label, val, cls]) => (
                                    <div key={label}>
                                        <p className={`font-bold ${cls}`}>{val}</p>
                                        <p className="text-gray-500 text-[10px]">{label}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Active Shows Panel */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                                <FilmIcon className="w-4 h-4 text-primary" />
                                Active Shows Details
                            </h3>
                            <div className="flex gap-2">
                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                    {shows.length} show{shows.length !== 1 ? "s" : ""}
                                </span>
                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                    {uniqueMoviesCount} movie{uniqueMoviesCount !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="h-20 bg-primary/10 rounded-xl animate-pulse" />
                                ))
                            ) : shows.length > 0 ? (
                                shows.map((show, i) => {
                                    const movie = resolveMovie(show.movieId);
                                    const booked = show.occupiedSeatsCount ?? 0;
                                    const total = getTotalSeatsForShow(show);
                                    const occupancy = calculateOccupancy(booked, total);
                                    const available = total - booked;
                                    const barColor = getOccupancyBarColor(occupancy);
                                    // FIXED: Only show ticket price if it's a valid positive number
                                    const ticketPriceNum = Number(show.ticketPrice);
                                    const hasValidTicketPrice = !isNaN(ticketPriceNum) && ticketPriceNum > 0;

                                    return (
                                        <div
                                            key={show.id ?? i}
                                            className="flex gap-3 p-3 bg-primary/5 border
                                                       border-primary/10 rounded-xl hover:border-primary/30 transition group"
                                        >
                                            {movie?.poster_path && (
                                                <img
                                                    src={movie.poster_path}
                                                    alt={movie.title}
                                                    className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-semibold truncate group-hover:text-primary transition">
                                                    {movie?.title ?? `Movie #${show.movieId}`}
                                                </p>
                                                <div className="flex gap-3 mt-1 flex-wrap">
                                                    <span className="text-gray-500 text-[10px] flex items-center gap-1">
                                                        <CalendarIcon className="w-3 h-3" />
                                                        {fmtDate(show.showDate)}
                                                    </span>
                                                    <span className="text-gray-500 text-[10px] flex items-center gap-1">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {fmtTime(show.showTime)}
                                                    </span>
                                                </div>
                                                <div className="mt-1.5">
                                                    <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                                                        <span>
                                                            {booked}/{total} seats
                                                            <span className="ml-1 text-gray-500">
                                                                ({available} available)
                                                            </span>
                                                        </span>
                                                        <span className="text-primary font-medium">{occupancy}%</span>
                                                    </div>
                                                    <div className="w-full bg-primary/10 rounded-full h-1">
                                                        <div
                                                            className={`${barColor} h-1 rounded-full transition-all`}
                                                            style={{ width: `${occupancy}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Only show ticket price if it's a valid positive number */}
                                                {hasValidTicketPrice && (
                                                    <p className="text-[10px] text-primary mt-1">
                                                        {fmt(ticketPriceNum)}/ticket
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-gray-500 text-sm text-center py-10">
                                    No active shows
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Summary Footer ── */}
                <div className="p-5 bg-gradient-to-r from-primary/10 to-transparent
                                border border-primary/20 rounded-xl">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { label: "Avg Booking Value", value: fmt(avgValue), icon: TrendingUpIcon },
                            { label: "Total Seats Booked", value: fmtNumber(totalSeatsBooked), icon: ArmchairIcon },
                            { label: "Unique Movies", value: uniqueMoviesCount, icon: FilmIcon },
                            { label: "Overall Occupancy", value: `${occupancyRate}%`, icon: PercentIcon },
                            { label: "Total Seat Capacity", value: fmtNumber(totalCap), icon: ArmchairIcon },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-primary/60" />
                                <div>
                                    <p className="text-gray-400 text-[10px] mb-0.5">{label}</p>
                                    {loading
                                        ? <div className="h-5 w-16 bg-primary/20 rounded animate-pulse" />
                                        : <p className="text-white text-sm font-bold">{value}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Dashboard;