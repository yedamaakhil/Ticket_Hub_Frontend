import { useEffect, useState } from "react";
import Loading from "../../Components/Loading";
import Title from "../../Components/Admin/Title";
import BlurCircle from "../../Components/BlurCircle";
import {
    SearchIcon,
    TicketIcon,
    XCircleIcon,
    RefreshCwIcon,
    CheckCircleIcon,
    AlertCircleIcon,
    UsersIcon,
    IndianRupee,
    CalendarIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { getAllMovies } from "../../lib/movieStore";

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const currency = import.meta.env.VITE_CURRENCY || "₹";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const fmtDate = (d) => {
    if (!d) return "—";
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
};

const fmtTime = (t) => {
    if (!t) return "—";
    try {
        // Handle different time formats
        let hours, minutes;

        // If it's a full ISO string or Date object
        if (t.includes("T") || t.includes(":")) {
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
        if (t.match(/^\d{1,2}:\d{2}$/)) {
            [hours, minutes] = t.split(":").map(Number);
        }
        // Handle "HH:MM:SS" format
        else if (t.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
            [hours, minutes] = t.split(":").map(Number);
        }
        else {
            return t; // Return as-is if format unknown
        }

        // Validate hours and minutes
        if (isNaN(hours) || isNaN(minutes)) return t;

        // Convert to 12-hour format
        const period = hours >= 12 ? 'PM' : 'AM';
        let displayHours = hours % 12;
        displayHours = displayHours === 0 ? 12 : displayHours;

        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
        console.error("Time formatting error:", error);
        return t;
    }
};

// Format currency
const fmtCurrency = (amount) => {
    if (!amount && amount !== 0) return `${currency}0`;
    return `${currency}${Number(amount).toLocaleString("en-IN")}`;
};

// ─────────────────────────────────────────────
//  STAT CARD
// ─────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, accent = "text-primary" }) {
    return (
        <div className="flex items-center justify-between px-5 py-4 bg-primary/10
                        border border-primary/20 rounded-xl flex-1 min-w-44
                        hover:border-primary/40 transition">
            <div>
                <p className="text-xs text-gray-400 mb-1">{title}</p>
                <p className={`text-2xl font-bold ${accent}`}>{value}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${accent}`} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  STAT PILL
// ─────────────────────────────────────────────
function StatPill({ label, value, color }) {
    return (
        <div className={`px-4 py-3 rounded-xl border text-center min-w-24 ${color}`}>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs mt-0.5 opacity-70">{label}</p>
        </div>
    );
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
function ListBookings() {
    const [bookings,   setBookings]   = useState([]);
    const [usersMap,   setUsersMap]   = useState({});
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState(null);
    const [search,     setSearch]     = useState("");
    const [filter,     setFilter]     = useState("all");
    const [cancelling, setCancelling] = useState(null);
    const [source,     setSource]     = useState("—");

    // ── Fetch all bookings from admin endpoint ──
    const loadBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/bookings/all`);
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            // Sort newest first
            setBookings([...list].sort(
                (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
            ));
            setSource("Backend (/api/bookings/all)");
        } catch (err) {
            console.error("ListBookings fetch error:", err);
            setError(err.message);
            setSource("Backend error");
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch users (Clerk-resolved) and build a clerkUserId -> user map ──
    const loadUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users`);
            if (!res.ok) return;
            const data = await res.json();
            const map = {};
            (Array.isArray(data) ? data : []).forEach((u) => {
                if (u.clerkUserId) map[u.clerkUserId] = u;
            });
            setUsersMap(map);
        } catch (err) {
            console.error("Users load error:", err);
        }
    };

    // ── Resolve a display name for a booking ──
    const getUserName = (booking) => {
        const u = usersMap[booking.clerkUserId];
        if (u && u.name) return u.name;
        if (u && u.email) return u.email;
        return "—";
    };

    // ── Cancel a booking ──
    const handleCancel = async (booking) => {
        if (!window.confirm(`Are you sure you want to cancel booking #${booking.bookingRef}?\n\nThis action cannot be undone.`)) {
            return;
        }

        setCancelling(booking.id);
        try {
            const res = await fetch(`${API_URL}/bookings/${booking.id}/cancel`, {
                method: "PUT",
            });
            if (!res.ok) throw new Error(`Cancel failed (${res.status})`);

            // Update local state
            setBookings((prev) =>
                prev.map((b) =>
                    b.id === booking.id ? { ...b, status: "CANCELLED" } : b
                )
            );

            toast.success(`Booking #${booking.bookingRef ?? booking.id} cancelled.`);
        } catch (err) {
            toast.error(`Failed to cancel: ${err.message}`);
        } finally {
            setCancelling(null);
        }
    };

    useEffect(() => {
        loadBookings();
        loadUsers();
    }, []);

    // ── Stats from live bookings ──
    const confirmedCount = bookings.filter((b) => b.status?.toUpperCase() === "CONFIRMED").length;
    const cancelledCount = bookings.filter((b) => b.status?.toUpperCase() === "CANCELLED").length;
    const totalRevenue   = bookings
        .filter((b) => b.status?.toUpperCase() === "CONFIRMED")
        .reduce((s, b) => s + (b.totalPrice ?? 0), 0);
    const totalSeats     = bookings.reduce(
        (s, b) => s + (Array.isArray(b.seats) ? b.seats.length : 0), 0
    );
    const uniqueUsers    = new Set(bookings.map(b => b.clerkUserId).filter(Boolean)).size;

    // ── Filter ──
    const filtered = bookings
        .filter((b) => {
            const s = b.status?.toUpperCase();
            if (filter === "confirmed") return s === "CONFIRMED";
            if (filter === "cancelled") return s === "CANCELLED";
            return true;
        })
        .filter((b) => {
            if (!search) return true;
            const q = search.toLowerCase();
            const userName = getUserName(b).toLowerCase();
            return (
                (b.bookingRef      ?? "").toLowerCase().includes(q) ||
                (b.movieTitle      ?? "").toLowerCase().includes(q) ||
                (b.clerkUserId     ?? "").toLowerCase().includes(q) ||
                (b.theaterName     ?? "").toLowerCase().includes(q) ||
                userName.includes(q) ||
                (b.seats ?? []).some((s) => s.toLowerCase().includes(q))
            );
        });

    if (loading) return <Loading />;

    return (
        <>
            <Title text1="List" text2="Bookings" />

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <StatCard
                    title="Total Bookings"
                    value={bookings.length}
                    icon={TicketIcon}
                    accent="text-primary"
                />
                <StatCard
                    title="Total Revenue"
                    value={fmtCurrency(totalRevenue)}
                    icon={IndianRupee}
                    accent="text-green-400"
                />
                <StatCard
                    title="Total Seats"
                    value={totalSeats}
                    icon={TicketIcon}
                    accent="text-yellow-400"
                />
                <StatCard
                    title="Unique Users"
                    value={uniqueUsers}
                    icon={UsersIcon}
                    accent="text-purple-400"
                />
            </div>

            {/* ── Secondary Stats Row ── */}
            <div className="flex flex-wrap gap-3 mt-6">
                <StatPill label="Confirmed" value={confirmedCount} color="bg-green-500/10 border-green-500/20 text-green-400" />
                <StatPill label="Cancelled" value={cancelledCount} color="bg-red-500/10 border-red-500/20 text-red-400" />
                <StatPill label="Avg Booking Value" value={fmtCurrency(Math.round(totalRevenue / (confirmedCount || 1)))} color="bg-primary/10 border-primary/20 text-primary" />
                <StatPill label="Avg Seats/Booking" value={Math.round(totalSeats / (bookings.length || 1))} color="bg-purple-500/10 border-purple-500/20 text-purple-400" />
            </div>

            {/* ── Error banner ── */}
            {error && (
                <div className="mt-4 max-w-5xl p-3 bg-red-500/10 border border-red-500/20
                                rounded-lg flex items-center gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-xs">{error}</p>
                    <button
                        onClick={loadBookings}
                        className="ml-auto text-xs text-red-300 underline cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="flex flex-col sm:flex-row gap-3 mt-5 max-w-5xl">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2
                                            w-4 h-4 text-gray-500" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by booking ref, movie, user, name, seat…"
                        className="w-full pl-9 pr-4 py-2 bg-primary/10 border border-primary/20
                                   rounded-full text-sm text-white placeholder-gray-500 outline-none
                                   focus:border-primary/50 transition"
                    />
                </div>

                <div className="flex gap-1 bg-primary/10 border border-primary/20 rounded-full p-1">
                    {[["all","All Bookings"],["confirmed","Confirmed"],["cancelled","Cancelled"]].map(([val,label]) => (
                        <button
                            key={val}
                            onClick={() => setFilter(val)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer
                                ${filter === val ? "bg-primary text-white" : "text-gray-400 hover:text-white"}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => { loadBookings(); loadUsers(); }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-primary/20
                               rounded-full text-xs text-gray-400 hover:text-white
                               hover:border-primary/50 transition cursor-pointer"
                >
                    <RefreshCwIcon className="w-3.5 h-3.5" /> Refresh
                </button>
            </div>

            <p className="text-gray-500 text-xs mt-3 mb-4">
                Showing {filtered.length} of {bookings.length} bookings · Source: {source}
            </p>

            {/* ── Table ── */}
            <div className="relative max-w-7xl overflow-x-auto">
                <BlurCircle top="0" left="-5%" />

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <TicketIcon className="w-12 h-12 text-primary/30 mb-3" />
                        <p className="text-gray-400 text-sm">No bookings found.</p>
                    </div>
                ) : (
                    <table className="w-full border-collapse rounded-xl overflow-hidden text-nowrap">
                        <thead>
                            <tr className="bg-primary/20 text-left text-white text-sm">
                                <th className="p-3 pl-5 font-medium">Booking Ref · User</th>
                                <th className="p-3 font-medium">Movie</th>
                                <th className="p-3 font-medium">Show Date</th>
                                <th className="p-3 font-medium">Show Time</th>
                                <th className="p-3 font-medium">Theater · Screen</th>
                                <th className="p-3 font-medium">Language</th>
                                <th className="p-3 font-medium">Seats</th>
                                <th className="p-3 font-medium">Amount</th>
                                <th className="p-3 font-medium">Payment</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filtered.map((booking, idx) => {
                                const isCancelled = booking.status?.toUpperCase() === "CANCELLED";
                                const seats       = Array.isArray(booking.seats) ? booking.seats : [];

                                return (
                                    <tr
                                        key={booking.id ?? idx}
                                        className={`border-b border-primary/10 transition
                                            ${isCancelled
                                                ? "bg-red-500/5 opacity-70"
                                                : "bg-primary/5 even:bg-primary/10 hover:bg-primary/15"}`}
                                    >
                                        {/* Booking Ref + User name */}
                                        <td className="p-3 pl-5">
                                            <span className="font-mono text-xs text-primary font-semibold">
                                                {booking.bookingRef ?? `#${booking.id}`}
                                            </span>
                                            <p className="text-white text-xs mt-0.5 max-w-40 truncate" title={getUserName(booking)}>
                                                {getUserName(booking)}
                                            </p>
                                            <p className="text-gray-600 text-[10px] mt-0.5">
                                                {fmtDate(booking.createdAt)}
                                            </p>
                                        </td>

                                        {/* Movie */}
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                {booking.moviePosterPath && (
                                                    <img
                                                        src={booking.moviePosterPath}
                                                        alt={booking.movieTitle}
                                                        className="w-6 h-9 object-cover rounded flex-shrink-0"
                                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                    />
                                                )}
                                                <div>
                                                    <p className="text-white font-medium max-w-36 truncate text-xs">
                                                        {booking.movieTitle ?? "—"}
                                                    </p>
                                                    {booking.movieLanguage && (
                                                        <p className="text-gray-600 text-[10px]">{booking.movieLanguage}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Show Date */}
                                        <td className="p-3 text-gray-300 text-xs">
                                            {fmtDate(booking.showDate)}
                                        </td>

                                        {/* Show Time */}
                                        <td className="p-3 text-gray-300 text-xs whitespace-nowrap">
                                            {fmtTime(booking.showTime)}
                                        </td>

                                        {/* Theater */}
                                        <td className="p-3 text-gray-400 text-xs">
                                            {booking.theaterName ?? "—"}
                                            {booking.screenName && (
                                                <span className="text-gray-600 text-[10px] block"> · {booking.screenName}</span>
                                            )}
                                        </td>

                                        {/* Language */}
                                        <td className="p-3 text-gray-400 text-xs">
                                            {booking.movieLanguage ?? "—"}
                                        </td>

                                        {/* Seats */}
                                        <td className="p-3">
                                            <div className="flex gap-1 flex-wrap max-w-32">
                                                {seats.slice(0, 5).map((s) => (
                                                    <span
                                                        key={s}
                                                        className="text-xs px-1.5 py-0.5 rounded
                                                                   bg-primary/20 text-primary font-mono"
                                                    >
                                                        {s}
                                                    </span>
                                                ))}
                                                {seats.length > 5 && (
                                                    <span className="text-xs text-gray-500">
                                                        +{seats.length - 5}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-600 text-[10px] mt-0.5">
                                                {seats.length} seat{seats.length !== 1 ? "s" : ""}
                                            </p>
                                        </td>

                                        {/* Amount */}
                                        <td className="p-3 font-bold text-white whitespace-nowrap">
                                            {fmtCurrency(booking.totalPrice)}
                                        </td>

                                        {/* Payment method */}
                                        <td className="p-3 text-gray-400 text-xs">
                                            {booking.paymentMethod ?? "—"}
                                        </td>

                                        {/* Status */}
                                        <td className="p-3">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap
                                                ${isCancelled
                                                    ? "bg-red-500/15 text-red-400"
                                                    : "bg-green-500/15 text-green-400"}`}>
                                                {isCancelled ? "Cancelled" : "Confirmed"}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        <td className="p-3">
                                            {isCancelled ? (
                                                <span className="text-gray-600 text-xs flex items-center gap-1 whitespace-nowrap">
                                                    <XCircleIcon className="w-3.5 h-3.5" /> Cancelled
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleCancel(booking)}
                                                    disabled={cancelling === booking.id}
                                                    className="flex items-center gap-1.5 text-xs text-red-400
                                                               hover:text-red-300 transition cursor-pointer
                                                               disabled:opacity-50 px-2 py-1 rounded-lg
                                                               hover:bg-red-500/10 disabled:cursor-not-allowed whitespace-nowrap"
                                                >
                                                    {cancelling === booking.id ? (
                                                        <span className="w-3.5 h-3.5 border border-red-400
                                                                         border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <XCircleIcon className="w-3.5 h-3.5" />
                                                    )}
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}

export default ListBookings;