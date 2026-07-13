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
const DEFAULT_TOTAL_SEATS = 180;

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

        if (typeof t === 'string' && t.match(/^\d{1,2}:\d{2}$/)) {
            [hours, minutes] = t.split(":").map(Number);
        }
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

const getTotalSeatsForShow = (show) => {
    if (show.totalSeats && show.totalSeats > 0) {
        return show.totalSeats;
    }
    if (show.screen?.totalSeats) {
        return show.screen.totalSeats;
    }
    return DEFAULT_TOTAL_SEATS;
};

const calculateOccupancy = (booked, total) => {
    if (!total || total === 0) return 0;
    return Math.round((booked / total) * 100);
};

const getOccupancyColor = (percentage) => {
    if (percentage >= 90) return "text-red-400";
    if (percentage >= 70) return "text-yellow-400";
    if (percentage >= 50) return "text-blue-400";
    return "text-green-400";
};

const getOccupancyBarColor = (percentage) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    if (percentage >= 50) return "bg-blue-500";
    return "bg-green-500";
};

// ★ FIX: resolveMovie now takes the movies list as a parameter instead of
//   calling getAllMovies() synchronously (which returns a Promise, not an array,
//   causing "Ll(...).find is not a function" crash).
const resolveMovie = (movieId, moviesList) => {
    if (!Array.isArray(moviesList)) return null;
    return moviesList.find(
        (m) => String(m.id) === String(movieId) || String(m._id) === String(movieId)
    );
};

// ─────────────────────────────────────────────
//  STAT CARD
// ─────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, accent = "text-primary", loading, tooltip, trend, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between px-4 sm:px-5 py-4 bg-primary/10
                        border border-primary/20 rounded-xl flex-1 min-w-[140px] sm:min-w-44
                        hover:border-primary/40 transition group relative
                        ${onClick ? "cursor-pointer hover:bg-primary/20" : ""}`}
        >
            <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-400 mb-1 flex items-center gap-1 truncate">
                    {title}
                    {tooltip && (
                        <span className="cursor-help text-gray-500 text-[10px] group-hover:text-gray-300">ⓘ</span>
                    )}
                </p>
                {loading
                    ? <div className="h-6 sm:h-8 w-16 sm:w-24 bg-primary/20 rounded animate-pulse" />
                    : <p className={`text-lg sm:text-2xl font-bold ${accent} truncate`}>{value}</p>}
                {trend && !loading && (
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">{trend}</p>
                )}
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 ml-2">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${accent}`} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  USERS MODAL
// ─────────────────────────────────────────────
function UsersModal({ open, onClose, users, loading }) {
    if (!open) return null;

    const copyEmails = () => {
        const emails = users.map((u) => u.email).filter(Boolean).join(", ");
        if (!emails) {
            toast.error("No emails to copy");
            return;
        }
        navigator.clipboard.writeText(emails)
            .then(() => toast.success("Emails copied to clipboard"))
            .catch(() => toast.error("Failed to copy"));
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#1a1a1a] border border-primary/30 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-primary/20 flex-wrap gap-2">
                    <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                        <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        All Users ({users.length})
                    </h3>
                    <div className="flex items-center gap-2">
                        {!loading && users.length > 0 && (
                            <button
                                onClick={copyEmails}
                                className="text-[10px] sm:text-xs bg-primary/20 hover:bg-primary/30 text-primary
                                           px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition cursor-pointer"
                            >
                                Copy emails
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition cursor-pointer"
                        >
                            <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto p-4 sm:p-5 space-y-2">
                    {loading ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="h-14 bg-primary/10 rounded-lg animate-pulse" />
                        ))
                    ) : users.length > 0 ? (
                        users.map((u, i) => (
                            <div
                                key={u.id ?? u._id ?? i}
                                className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/10
                                           rounded-lg hover:bg-primary/10 transition"
                            >
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-500/20 flex items-center justify-center
                                                text-purple-300 text-xs sm:text-sm font-semibold flex-shrink-0">
                                    {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-white text-sm font-medium truncate">
                                        {u.name ?? "Unnamed user"}
                                    </p>
                                    <p className="text-gray-400 text-xs truncate">
                                        {u.email ?? "—"}
                                    </p>
                                </div>
                                {u.role && (
                                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5
                                                     rounded-full flex-shrink-0">
                                        {u.role}
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-10">No users found</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  ACTIVE SHOW CARD
//  ★ FIX: now receives allMovies as a prop instead of calling resolveMovie()
//    which previously called getAllMovies() synchronously (returns Promise).
// ─────────────────────────────────────────────
function ShowCard({ show, allMovies }) {
    const movie = resolveMovie(show.movieId, allMovies);
    const booked = Number(show.occupiedSeatsCount ?? 0);
    const total = getTotalSeatsForShow(show);
    const occupancy = calculateOccupancy(booked, total);
    const available = total - booked;
    const occupancyColor = getOccupancyColor(occupancy);
    const barColor = getOccupancyBarColor(occupancy);
    const ticketPriceNum = Number(show.ticketPrice);
    const hasValidTicketPrice = !isNaN(ticketPriceNum) && ticketPriceNum > 0;

    return (
        <div className="w-[160px] sm:w-44 rounded-xl overflow-hidden pb-3 bg-primary/10 border
                        border-primary/20 hover:-translate-y-1 transition duration-300 flex-shrink-0">
            {movie?.poster_path ? (
                <img
                    src={movie.poster_path}
                    alt={movie.title}
                    className="h-48 sm:h-60 w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
            ) : (
                <div className="h-48 sm:h-60 w-full bg-gray-800 flex items-center justify-center">
                    <FilmIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
                </div>
            )}

            <p className="font-semibold p-2 pb-1 truncate text-xs sm:text-sm text-white">
                {movie?.title ?? `Movie #${show.movieId}`}
            </p>

            <div className="flex items-center justify-between px-2 mb-1">
                {movie?.vote_average > 0 && (
                    <p className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
                        <StarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary fill-primary" />
                        {movie.vote_average.toFixed(1)}
                    </p>
                )}
                <p className={`text-[10px] sm:text-xs font-semibold ${occupancyColor}`}>
                    {available} left
                </p>
            </div>

            <div className="px-2 space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                    <CalendarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {fmtDate(show.showDate)}
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                    <ClockIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {fmtTime(show.showTime)}
                </div>
            </div>

            <div className="px-2 mt-2">
                <div className="flex justify-between text-[10px] sm:text-xs text-gray-600 mb-0.5">
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

            {hasValidTicketPrice && (
                <div className="px-2 mt-2 pt-1 border-t border-primary/20">
                    <p className="text-[10px] sm:text-xs text-primary font-semibold">
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
        <div className="flex items-center justify-between p-2 sm:p-3 bg-primary/5
                        hover:bg-primary/10 rounded-lg transition group">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span className="text-gray-500 text-[10px] sm:text-xs w-4 sm:w-5 flex-shrink-0">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                    <p className="text-white text-xs sm:text-sm font-medium truncate">
                        {booking.movieTitle ?? "—"}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2 mt-0.5 flex-wrap">
                        <p className="text-gray-500 text-[10px] sm:text-xs">
                            {seatCount} seat{seatCount !== 1 ? "s" : ""}
                        </p>
                        {seatNumbers && (
                            <>
                                <span className="text-gray-600 text-[8px] sm:text-[10px]">•</span>
                                <p className="text-gray-500 text-[8px] sm:text-[10px] truncate" title={booking.seats?.join(", ")}>
                                    {seatNumbers}{hasMoreSeats ? "..." : ""}
                                </p>
                            </>
                        )}
                        <span className="text-gray-600 text-[8px] sm:text-[10px]">•</span>
                        <p className={`text-[10px] sm:text-xs font-medium ${isCancelled ? "text-red-400" : isPaid ? "text-green-400" : "text-yellow-400"}`}>
                            {booking.status ?? "—"}
                        </p>
                    </div>
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2 sm:ml-3">
                <p className="text-primary text-xs sm:text-sm font-semibold">{fmt(booking.totalPrice ?? 0)}</p>
                <p className="text-gray-500 text-[10px] sm:text-xs">{fmtDate(booking.showDate)}</p>
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
    const [allMovies, setAllMovies] = useState([]); // ★ FIX: movies loaded into state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const [showUsersModal, setShowUsersModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

    const loadAll = async () => {
        setLoading(true);
        setError(null);
        try {
            // ★ FIX: load movies alongside stats/bookings/shows so resolveMovie
            //   has a real array to work with (getAllMovies() is async).
            const [statsRes, bookingsRes, showsRes, moviesData] = await Promise.all([
                fetch(`${API_URL}/bookings/stats`),
                fetch(`${API_URL}/bookings/all`),
                fetch(`${API_URL}/shows/active`),
                getAllMovies(),
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
            setAllMovies(Array.isArray(moviesData) ? moviesData : []); // ★ FIX
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Dashboard load error:", err);
            setError(err.message);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await fetch(`${API_URL}/users`);
            if (!res.ok) throw new Error(`Users: ${res.status}`);
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Users load error:", err);
            toast.error("Failed to load users");
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }
    };

    const openUsersModal = () => {
        setShowUsersModal(true);
        loadUsers();
    };

    useEffect(() => {
        loadAll();
        const interval = setInterval(loadAll, 60_000);
        return () => clearInterval(interval);
    }, []);

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

    const revenuePerSeat = totalSeatsBooked > 0
        ? Math.round((stats?.totalRevenue ?? 0) / totalSeatsBooked)
        : 0;

    const avgSeatsPerBooking = stats?.totalBookings > 0
        ? (totalSeatsBooked / stats.totalBookings).toFixed(1)
        : 0;

    const uniqueMoviesCount = new Set(shows.map((s) => s.movieId)).size;

    const totalRevenuePotential = shows.reduce((total, show) => {
        const ticketPrice = (show.ticketPrice && Number(show.ticketPrice) > 0) ? Number(show.ticketPrice) : 200;
        const totalSeats = getTotalSeatsForShow(show);
        return total + (ticketPrice * totalSeats);
    }, 0);

    const revenueUtilization = totalRevenuePotential > 0
        ? Math.round(((stats?.totalRevenue ?? 0) / totalRevenuePotential) * 100)
        : 0;

    return (
        <>
            <Title text1="Admin" text2="Dashboard" />

            <div className="relative mt-4 sm:mt-6">
                <BlurCircle top="-100px" left="0" />

                {/* ── Toolbar ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                    <div className="bg-primary/10 border border-primary/20 px-3 sm:px-4 py-2 rounded-lg w-full sm:w-auto">
                        <p className="text-[10px] sm:text-xs text-gray-300">🎬 Live Dashboard · Backend Connected</p>
                        <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="bg-primary/10 border border-primary/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hidden sm:block">
                            <p className="text-[10px] text-gray-400">Screen Capacity</p>
                            <p className="text-xs sm:text-sm text-primary font-semibold">{DEFAULT_TOTAL_SEATS} seats/screen</p>
                        </div>
                        <button
                            onClick={loadAll}
                            disabled={loading}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/20
                                       hover:bg-primary/30 border border-primary/30 rounded-lg
                                       text-xs sm:text-sm text-primary transition cursor-pointer
                                       disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                        >
                            <RefreshCwIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
                            {loading ? "Refreshing…" : "Refresh"}
                        </button>
                    </div>
                </div>

                {/* ── Error banner ── */}
                {error && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20
                                    rounded-xl flex items-center gap-2 sm:gap-3 flex-wrap">
                        <AlertCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                        <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                        <button
                            onClick={loadAll}
                            className="ml-auto text-xs text-red-300 underline cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* ── Primary Stat Cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-8">
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
                        tooltip="Click to view all user details"
                        onClick={openUsersModal}
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
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-8">
                    {[
                        { label: "Confirmed", value: stats?.completedBookings ?? 0, color: "text-green-400", icon: CheckCircleIcon },
                        { label: "Cancelled", value: stats?.cancelledBookings ?? 0, color: "text-red-400", icon: XCircleIcon },
                        { label: "Avg Value", value: fmt(avgValue), color: "text-primary", icon: TrendingUpIcon },
                        { label: "Success Rate", value: `${successRate}%`, color: "text-green-400", icon: PercentIcon },
                        { label: "Cancellation", value: `${cancellationRate}%`, color: "text-red-400", icon: XCircleIcon },
                        { label: "Rev/Seat", value: fmt(revenuePerSeat), color: "text-primary", icon: DollarSignIcon },
                    ].map(({ label, value, color, icon: Icon }) => (
                        <div
                            key={label}
                            className="bg-primary/5 border border-primary/20 rounded-xl
                                       px-2 sm:px-3 py-2 sm:py-3 text-center group hover:bg-primary/10 transition"
                        >
                            <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${color} mx-auto mb-0.5 sm:mb-1 opacity-60`} />
                            <p className="text-gray-500 text-[8px] sm:text-[10px] mb-0.5 truncate">{label}</p>
                            {loading
                                ? <div className="h-4 sm:h-5 w-8 sm:w-12 bg-primary/20 rounded animate-pulse mx-auto" />
                                : <p className={`text-xs sm:text-sm font-bold ${color} truncate`}>{value}</p>}
                        </div>
                    ))}
                </div>

                {/* ── Occupancy Bar ── */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5 mb-4 sm:mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                        <p className="text-white font-medium text-xs sm:text-sm flex items-center gap-2">
                            <ArmchairIcon className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                            Overall Seat Occupancy
                        </p>
                        <div className="flex items-center gap-2 sm:gap-3">
                            {!loading && (
                                <>
                                    <span className={`text-xs sm:text-sm font-bold ${occupancyColor}`}>
                                        {totalOcc}/{totalCap} seats
                                    </span>
                                    <span className="text-primary font-bold text-lg sm:text-xl">{occupancyRate}%</span>
                                </>
                            )}
                            {loading && <div className="h-5 sm:h-6 w-12 sm:w-16 bg-primary/20 rounded animate-pulse" />}
                        </div>
                    </div>
                    <div className="w-full bg-primary/10 rounded-full h-2 sm:h-3">
                        <div
                            className={`${occupancyBarColor} h-2 sm:h-3 rounded-full transition-all duration-700`}
                            style={{ width: loading ? "0%" : `${occupancyRate}%` }}
                        />
                    </div>
                    <div className="flex flex-wrap justify-between text-gray-500 text-[10px] sm:text-xs mt-2 gap-1">
                        <span>{fmtNumber(totalOcc)} seats booked</span>
                        <span>out of {fmtNumber(totalCap)} total seats</span>
                        <span>across {shows.length} shows</span>
                    </div>
                    <p className="text-gray-600 text-[8px] sm:text-[10px] mt-1.5">
                        * Based on {DEFAULT_TOTAL_SEATS} seats per screen
                    </p>
                </div>

                {/* ── Two-column section ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-8">

                    {/* Recent Bookings */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 className="text-white font-semibold flex items-center gap-2 text-xs sm:text-sm">
                                <TicketIcon className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                Recent Bookings
                            </h3>
                            <span className="text-[10px] sm:text-xs bg-primary/20 text-primary px-1.5 sm:px-2 py-0.5 rounded-full">
                                Total: {fmtNumber(stats?.totalBookings ?? 0)}
                            </span>
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <div key={i} className="h-12 sm:h-14 bg-primary/10 rounded-lg animate-pulse" />
                                ))
                            ) : bookings.length > 0 ? (
                                bookings.slice(0, 8).map((b, i) => (
                                    <BookingRow key={b.id ?? i} booking={b} idx={i} />
                                ))
                            ) : (
                                <p className="text-gray-500 text-xs sm:text-sm text-center py-8 sm:py-10">
                                    No bookings yet
                                </p>
                            )}
                        </div>

                        {!loading && bookings.length > 0 && (
                            <div className="mt-3 sm:mt-4 pt-3 border-t border-primary/20 grid grid-cols-4 gap-1 sm:gap-2 text-center">
                                {[
                                    ["Paid", stats?.completedBookings ?? 0, "text-green-400"],
                                    ["Cancelled", stats?.cancelledBookings ?? 0, "text-red-400"],
                                    ["Pending", (stats?.totalBookings ?? 0) - (stats?.completedBookings ?? 0) - (stats?.cancelledBookings ?? 0), "text-yellow-400"],
                                    ["Seats", totalSeatsBooked, "text-primary"],
                                ].map(([label, val, cls]) => (
                                    <div key={label}>
                                        <p className={`font-bold text-xs sm:text-sm ${cls}`}>{val}</p>
                                        <p className="text-gray-500 text-[8px] sm:text-[10px]">{label}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Active Shows Panel */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                            <h3 className="text-white font-semibold flex items-center gap-2 text-xs sm:text-sm">
                                <FilmIcon className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                Active Shows
                            </h3>
                            <div className="flex gap-1 sm:gap-2 flex-wrap">
                                <span className="text-[10px] sm:text-xs bg-primary/20 text-primary px-1.5 sm:px-2 py-0.5 rounded-full">
                                    {shows.length} show{shows.length !== 1 ? "s" : ""}
                                </span>
                                <span className="text-[10px] sm:text-xs bg-primary/20 text-primary px-1.5 sm:px-2 py-0.5 rounded-full">
                                    {uniqueMoviesCount} movie{uniqueMoviesCount !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="h-16 sm:h-20 bg-primary/10 rounded-xl animate-pulse" />
                                ))
                            ) : shows.length > 0 ? (
                                shows.map((show, i) => {
                                    // ★ FIX: pass allMovies to resolveMovie
                                    const movie = resolveMovie(show.movieId, allMovies);
                                    const booked = show.occupiedSeatsCount ?? 0;
                                    const total = getTotalSeatsForShow(show);
                                    const occupancy = calculateOccupancy(booked, total);
                                    const available = total - booked;
                                    const barColor = getOccupancyBarColor(occupancy);
                                    const ticketPriceNum = Number(show.ticketPrice);
                                    const hasValidTicketPrice = !isNaN(ticketPriceNum) && ticketPriceNum > 0;

                                    return (
                                        <div
                                            key={show.id ?? i}
                                            className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-primary/5 border
                                                       border-primary/10 rounded-xl hover:border-primary/30 transition group"
                                        >
                                            {movie?.poster_path && (
                                                <img
                                                    src={movie.poster_path}
                                                    alt={movie.title}
                                                    className="w-8 h-11 sm:w-10 sm:h-14 object-cover rounded-lg flex-shrink-0"
                                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-xs sm:text-sm font-semibold truncate group-hover:text-primary transition">
                                                    {movie?.title ?? `Movie #${show.movieId}`}
                                                </p>
                                                <div className="flex gap-2 sm:gap-3 mt-0.5 flex-wrap">
                                                    <span className="text-gray-500 text-[8px] sm:text-[10px] flex items-center gap-0.5 sm:gap-1">
                                                        <CalendarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                        {fmtDate(show.showDate)}
                                                    </span>
                                                    <span className="text-gray-500 text-[8px] sm:text-[10px] flex items-center gap-0.5 sm:gap-1">
                                                        <ClockIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                        {fmtTime(show.showTime)}
                                                    </span>
                                                </div>
                                                <div className="mt-1 sm:mt-1.5">
                                                    <div className="flex justify-between text-[8px] sm:text-[10px] text-gray-600 mb-0.5">
                                                        <span>
                                                            {booked}/{total} seats
                                                            <span className="ml-0.5 sm:ml-1 text-gray-500">
                                                                ({available} avail)
                                                            </span>
                                                        </span>
                                                        <span className="text-primary font-medium">{occupancy}%</span>
                                                    </div>
                                                    <div className="w-full bg-primary/10 rounded-full h-0.5 sm:h-1">
                                                        <div
                                                            className={`${barColor} h-0.5 sm:h-1 rounded-full transition-all`}
                                                            style={{ width: `${occupancy}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                {hasValidTicketPrice && (
                                                    <p className="text-[8px] sm:text-[10px] text-primary mt-0.5">
                                                        {fmt(ticketPriceNum)}/ticket
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-gray-500 text-xs sm:text-sm text-center py-8 sm:py-10">
                                    No active shows
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Summary Footer ── */}
                <div className="p-3 sm:p-5 bg-gradient-to-r from-primary/10 to-transparent
                                border border-primary/20 rounded-xl">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        {[
                            { label: "Avg Booking Value", value: fmt(avgValue), icon: TrendingUpIcon },
                            { label: "Total Seats Booked", value: fmtNumber(totalSeatsBooked), icon: ArmchairIcon },
                            { label: "Unique Movies", value: uniqueMoviesCount, icon: FilmIcon },
                            { label: "Overall Occupancy", value: `${occupancyRate}%`, icon: PercentIcon },
                            { label: "Total Capacity", value: fmtNumber(totalCap), icon: ArmchairIcon },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="flex items-center gap-1.5 sm:gap-2">
                                <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-primary/60 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-gray-400 text-[8px] sm:text-[10px] mb-0.5 truncate">{label}</p>
                                    {loading
                                        ? <div className="h-4 sm:h-5 w-10 sm:w-16 bg-primary/20 rounded animate-pulse" />
                                        : <p className="text-white text-xs sm:text-sm font-bold truncate">{value}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <UsersModal
                open={showUsersModal}
                onClose={() => setShowUsersModal(false)}
                users={users}
                loading={usersLoading}
            />
        </>
    );
}

export default Dashboard;