import { useEffect, useState } from "react";
import Loading from "../../Components/Loading";
import Title from "../../Components/Admin/Title";
import BlurCircle from "../../Components/BlurCircle";
import {
    SearchIcon,
    FilmIcon,
    RefreshCwIcon,
    StarIcon,
    Trash2Icon,
    ClockIcon,
    CalendarIcon,
    MapPinIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { getAllMovies, getStoredMovies, removeMovie } from "../../lib/movieStore";
import { dummyShowsData } from "../../assets/assets";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const timeFormat = (mins) => {
    if (!mins) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
};

const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
};

// ─────────────────────────────────────────────
//  STAT PILL - Responsive
// ─────────────────────────────────────────────
function StatPill({ label, value, color }) {
    return (
        <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl border text-center min-w-[70px] sm:min-w-24 ${color}`}>
            <p className="text-base sm:text-xl font-bold">{value}</p>
            <p className="text-[8px] sm:text-xs mt-0.5 opacity-70">{label}</p>
        </div>
    );
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
function ListMovies() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [removing, setRemoving] = useState(null);
    const [storedIds, setStoredIds] = useState(new Set());

    const loadMovies = async () => {
        setLoading(true);
        try {
            const [allMovies, stored] = await Promise.all([
                getAllMovies(),
                getStoredMovies(),
            ]);
            setMovies(allMovies);
            setStoredIds(new Set(stored.map((m) => m.id)));
        } catch (err) {
            console.error("ListMovies load error:", err);
            toast.error("Failed to load movies");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (movie) => {
        const isBaseMovie = dummyShowsData.some((m) => m.id === movie.id);
        let warningMessage = `Are you sure you want to delete "${movie.title}"?\n\n`;

        if (isBaseMovie) {
            warningMessage += `⚠️ This is a BASE MOVIE from dummyShowsData.\n`;
            warningMessage += `Deleting it will add it to an internal blocklist and it will NOT be visible to users.\n\n`;
            warningMessage += `This action cannot be undone.`;
        } else {
            warningMessage += `This is an admin-added movie.\n`;
            warningMessage += `This action cannot be undone and the movie will no longer be visible to users.`;
        }

        if (!window.confirm(warningMessage)) return;

        setRemoving(movie.id);
        try {
            if (isBaseMovie) {
                const blockedMovies = JSON.parse(localStorage.getItem("tixrush_blocked_movies") || "[]");
                if (!blockedMovies.includes(movie.id)) {
                    blockedMovies.push(movie.id);
                    localStorage.setItem("tixrush_blocked_movies", JSON.stringify(blockedMovies));
                }
                toast.success(`"${movie.title}" has been hidden from users.`);
            } else {
                const removed = await removeMovie(movie.id);
                if (!removed) {
                    toast.error("Failed to remove movie");
                    return;
                }
                toast.success(`"${movie.title}" removed successfully.`);
            }
            await loadMovies();
        } catch (err) {
            toast.error(`Failed to remove: ${err.message}`);
        } finally {
            setRemoving(null);
        }
    };

    const handleDeleteAllAdminAdded = async () => {
        if (!window.confirm("Are you sure you want to delete ALL admin-added movies?\n\nThis action cannot be undone.")) {
            return;
        }
        try {
            const stored = await getStoredMovies();
            await Promise.all(stored.map((m) => removeMovie(m.id)));
            toast.success("All admin-added movies have been deleted.");
            await loadMovies();
        } catch (err) {
            toast.error(`Failed to delete: ${err.message}`);
        }
    };

    const handleResetBlockedMovies = () => {
        if (!window.confirm("Are you sure you want to reset all hidden base movies?\n\nThis will make all original movies visible again to users.")) {
            return;
        }
        try {
            localStorage.removeItem("tixrush_blocked_movies");
            toast.success("All base movies are now visible again.");
            loadMovies();
        } catch (err) {
            toast.error(`Failed to reset: ${err.message}`);
        }
    };

    const getVisibleMovies = () => {
        const blockedMovies = JSON.parse(localStorage.getItem("tixrush_blocked_movies") || "[]");
        const blockedSet = new Set(blockedMovies);
        return movies.map((movie) => ({
            ...movie,
            isBlocked: blockedSet.has(movie.id) && dummyShowsData.some((dm) => dm.id === movie.id),
        }));
    };

    useEffect(() => {
        loadMovies();
    }, []);

    const visibleMovies = getVisibleMovies();

    const totalMovies     = visibleMovies.length;
    const baseMoviesCount = visibleMovies.filter((m) => dummyShowsData.some((dm) => dm.id === m.id)).length;
    const adminAddedCount = storedIds.size;
    const blockedCount    = visibleMovies.filter((m) => m.isBlocked).length;
    const avgRating       = visibleMovies.reduce((sum, m) => sum + (m.vote_average || 0), 0) / (totalMovies || 1);
    const totalRuntime    = visibleMovies.reduce((sum, m) => sum + (m.runtime || 0), 0);

    const filtered = visibleMovies.filter((m) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            m.title?.toLowerCase().includes(q) ||
            m.original_language?.toLowerCase().includes(q) ||
            m.genres?.some((g) => g.name.toLowerCase().includes(q)) ||
            m.theater?.toLowerCase().includes(q)
        );
    });

    if (loading) return <Loading />;

    return (
        <>
            <Title text1="List" text2="Movies" />

            {/* ── Stats ── */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
                <StatPill label="Total"        value={totalMovies}              color="bg-primary/10 border-primary/20 text-primary" />
                <StatPill label="Base"         value={baseMoviesCount}          color="bg-blue-500/10 border-blue-500/20 text-blue-400" />
                <StatPill label="Admin Added"  value={adminAddedCount}          color="bg-green-500/10 border-green-500/20 text-green-400" />
                <StatPill label="Blocked"      value={blockedCount}             color="bg-red-500/10 border-red-500/20 text-red-400" />
                <StatPill label="Avg Rating"   value={avgRating.toFixed(1)}     color="bg-yellow-500/10 border-yellow-500/20 text-yellow-400" />
                <StatPill label="Total Runtime" value={timeFormat(totalRuntime)} color="bg-purple-500/10 border-purple-500/20 text-purple-400" />
            </div>

            {/* ── Info Banner ── */}
            <div className="mt-3 sm:mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-[10px] sm:text-xs">
                    📋 Showing <strong>{filtered.length}</strong> of <strong>{totalMovies}</strong> movies.
                    <br className="sm:hidden" />
                    <span className="hidden sm:inline"> </span>
                    ✅ <strong>Any movie can be deleted</strong> — Base movies are hidden, admin-added are removed.
                </p>
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-5 max-w-5xl">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search movies..."
                        className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 bg-primary/10 border border-primary/20
                                   rounded-full text-xs sm:text-sm text-white placeholder-gray-500 outline-none
                                   focus:border-primary/50 transition"
                    />
                </div>

                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                    <button
                        onClick={loadMovies}
                        className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 border border-primary/20
                                   rounded-full text-[10px] sm:text-xs text-gray-400 hover:text-white
                                   hover:border-primary/50 transition cursor-pointer flex-1 sm:flex-none"
                    >
                        <RefreshCwIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    {adminAddedCount > 0 && (
                        <button
                            onClick={handleDeleteAllAdminAdded}
                            className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 border border-red-500/30
                                       rounded-full text-[10px] sm:text-xs text-red-400 hover:text-red-300
                                       hover:border-red-500/50 transition cursor-pointer flex-1 sm:flex-none"
                        >
                            <Trash2Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Delete All Admin</span>
                        </button>
                    )}

                    {blockedCount > 0 && (
                        <button
                            onClick={handleResetBlockedMovies}
                            className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 border border-yellow-500/30
                                       rounded-full text-[10px] sm:text-xs text-yellow-400 hover:text-yellow-300
                                       hover:border-yellow-500/50 transition cursor-pointer flex-1 sm:flex-none"
                        >
                            <RefreshCwIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Reset Hidden</span>
                        </button>
                    )}
                </div>
            </div>

            <p className="text-gray-500 text-[10px] sm:text-xs mt-2 sm:mt-3 mb-3 sm:mb-4">
                Showing {filtered.length} of {totalMovies} movies
            </p>

            {/* ── Movies Grid ── */}
            <div className="relative">
                <BlurCircle top="0" left="-5%" />

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
                        <FilmIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary/30 mb-3" />
                        <p className="text-gray-400 text-xs sm:text-sm">No movies found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                        {filtered.map((movie) => {
                            const isAdminAdded = storedIds.has(movie.id);
                            const isBaseMovie  = dummyShowsData.some((dm) => dm.id === movie.id);
                            const isBlocked    = movie.isBlocked;

                            let borderColor = "border-primary/20 hover:border-primary/40";
                            let badge = null;

                            if (isBlocked) {
                                borderColor = "border-red-500/50 hover:border-red-500/80 bg-red-500/5";
                                badge = (
                                    <div className="absolute top-2 right-2 bg-red-500/90 text-white text-[8px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold">
                                        Hidden
                                    </div>
                                );
                            } else if (isAdminAdded) {
                                borderColor = "border-green-500/30 hover:border-green-500/60";
                                badge = (
                                    <div className="absolute top-2 right-2 bg-green-500/90 text-white text-[8px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold">
                                        Admin
                                    </div>
                                );
                            } else if (isBaseMovie) {
                                badge = (
                                    <div className="absolute top-2 right-2 bg-blue-500/80 text-white text-[8px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                        Base
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={movie.id}
                                    className={`bg-primary/5 border rounded-xl overflow-hidden
                                               transition-all duration-300 hover:-translate-y-1
                                               ${borderColor}
                                               ${isBlocked ? "opacity-75" : ""}`}
                                >
                                    {/* Poster */}
                                    <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                                        <img
                                            src={movie.poster_path}
                                            alt={movie.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://placehold.co/300x450/1a1a2e/6b7280?text=No+Poster";
                                            }}
                                        />
                                        {badge}
                                        {isBlocked && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="bg-red-500/90 text-white text-[8px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold">
                                                    Hidden
                                                </div>
                                            </div>
                                        )}
                                        {movie.vote_average > 0 && !isBlocked && (
                                            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-0.5 sm:gap-1">
                                                <StarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary fill-primary" />
                                                <span className="text-white text-[9px] sm:text-xs font-semibold">
                                                    {movie.vote_average.toFixed(1)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="p-3 sm:p-4">
                                        <h3 className="text-white font-bold text-sm sm:text-base truncate">
                                            {movie.title}
                                        </h3>

                                        <p className="text-gray-400 text-[10px] sm:text-xs mt-1 line-clamp-2">
                                            {movie.overview || "No description available."}
                                        </p>

                                        <div className="mt-2 sm:mt-3 space-y-1">
                                            <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-xs text-gray-500">
                                                <CalendarIcon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                                <span>{fmtDate(movie.release_date)}</span>
                                                <span className="text-gray-600">•</span>
                                                <ClockIcon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                                <span>{timeFormat(movie.runtime)}</span>
                                            </div>

                                            <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-xs text-gray-500">
                                                <span className="text-primary text-[10px]">🎭</span>
                                                <span className="truncate">
                                                    {movie.genres?.map((g) => g.name).join(", ") || "—"}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-xs text-gray-500">
                                                <span className="text-primary text-[10px]">🌐</span>
                                                <span>{movie.original_language || "—"}</span>
                                            </div>

                                            {(movie.theater || movie.screen) && (
                                                <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-xs text-gray-500">
                                                    <MapPinIcon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                                    <span className="truncate">
                                                        {movie.theater || "—"} · Screen {movie.screen || "—"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-primary/20 flex justify-between items-center">
                                            <button
                                                onClick={() => window.open(`/movie-details/${movie.id}`, "_blank")}
                                                className="text-[10px] sm:text-xs text-primary hover:text-primary/80 transition py-1"
                                            >
                                                View →
                                            </button>

                                            <button
                                                onClick={() => handleRemove(movie)}
                                                disabled={removing === movie.id}
                                                className={`flex items-center gap-1 text-[10px] sm:text-xs transition cursor-pointer
                                                    disabled:opacity-50 py-1 px-1.5 sm:px-2 rounded-lg
                                                    ${isBlocked
                                                        ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                                        : "text-red-400 hover:text-red-300 hover:bg-red-500/10"}`}
                                            >
                                                {removing === movie.id ? (
                                                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                )}
                                                {isBlocked ? "Restore" : "Delete"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

export default ListMovies;