import { useState, useEffect } from "react";
import Title from "../../Components/Admin/Title";
import BlurCircle from "../../Components/BlurCircle";
import {
    PlusCircleIcon,
    XIcon,
    CheckCircleIcon,
    ImageIcon,
    VideoIcon,
    UsersIcon,
    CalendarIcon,
    TagIcon,
    LanguagesIcon,
    StarIcon,
    InfoIcon,
    Trash2Icon,
    RefreshCwIcon,
    EditIcon,
    SaveIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    addMovie,
    getAllMovies,
    getStoredMovies,
    removeMovie,
    getStoredMovieCount,
    getTotalMovieCount,
    updateMovie,
} from "../../lib/movieStore";

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const GENRES = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy",
    "Horror", "Romance", "Science Fiction", "Thriller",
    "Crime", "Mystery", "Animation", "Documentary", "History",
];

const LANGUAGES = [
    "Telugu", "Hindi", "Tamil", "English",
    "Malayalam", "Kannada", "Bengali", "Marathi",
];

const THEATERS = ["AVD Cinemas", "PVR Cinemas", "INOX Leisure", "Cinepolis", "Carnival Cinemas"];
const SCREENS  = ["1", "2", "3", "4", "IMAX", "4DX", "Dolby"];

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const timeFormat = (mins) => {
    if (!mins) return "";
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const EMPTY_FORM = {
    id:                  "",
    title:              "",
    overview:           "",
    poster_path:        "",
    backdrop_path:      "",
    trailerUrl:         "",
    release_date:       "",
    original_language:  "Telugu",
    tagline:            "",
    runtime:            "",
    vote_average:       "",
    theater:            "AVD Cinemas",
    screen:             "1",
};

// ─────────────────────────────────────────────
//  CAST ROW
// ─────────────────────────────────────────────
function CastRow({ index, cast, onUpdate, onRemove }) {
    return (
        <div className="flex gap-2 flex-wrap items-start mb-2">
            <input
                placeholder="Actor Name *"
                value={cast.name}
                onChange={(e) => onUpdate(index, "name", e.target.value)}
                className="flex-1 min-w-36 px-3 py-2 bg-primary/10 border border-primary/20
                           rounded-lg text-sm text-white placeholder-gray-500 outline-none
                           focus:border-primary/60 transition"
            />
            <input
                placeholder="Character"
                value={cast.character}
                onChange={(e) => onUpdate(index, "character", e.target.value)}
                className="flex-1 min-w-36 px-3 py-2 bg-primary/10 border border-primary/20
                           rounded-lg text-sm text-white placeholder-gray-500 outline-none
                           focus:border-primary/60 transition"
            />
            <input
                placeholder="Profile Image URL"
                value={cast.profile_path}
                onChange={(e) => onUpdate(index, "profile_path", e.target.value)}
                className="flex-[2] min-w-48 px-3 py-2 bg-primary/10 border border-primary/20
                           rounded-lg text-sm text-white placeholder-gray-500 outline-none
                           focus:border-primary/60 transition"
            />
            <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-2 text-red-400 hover:text-red-300 transition cursor-pointer"
            >
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────
//  STORED MOVIE CHIP (for the "Movies Added" section)
// ─────────────────────────────────────────────
function StoredMovieRow({ movie, onRemove, onEdit }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/15
                        rounded-xl hover:border-primary/30 transition">
            <img
                src={movie.poster_path}
                alt={movie.title}
                className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                onError={(e) => { e.currentTarget.style.opacity = "0.2"; }}
            />
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{movie.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                    ID: {movie.id} · {movie.release_date?.split("-")[0]}
                    {movie.original_language ? ` · ${movie.original_language}` : ""}
                    {movie.vote_average ? ` · ⭐ ${movie.vote_average}` : ""}
                </p>
                <p className="text-gray-600 text-xs mt-0.5">
                    🏛 {movie.theater} · Screen {movie.screen}
                </p>
                <p className="text-green-500 text-xs mt-0.5">
                    ✅ Visible to users
                </p>
            </div>
            <div className="flex gap-1">
                <button
                    onClick={() => onEdit(movie)}
                    className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10
                               rounded-lg transition cursor-pointer flex-shrink-0"
                    title="Edit movie"
                >
                    <EditIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onRemove(movie.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10
                               rounded-lg transition cursor-pointer flex-shrink-0"
                    title="Remove movie"
                >
                    <Trash2Icon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  SECTION CARD WRAPPER
// ─────────────────────────────────────────────
function Section({ icon: Icon, title, children }) {
    return (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                {title}
            </h3>
            {children}
        </div>
    );
}

const inputCls = "w-full px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-primary/60 transition";

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
function AddMovie() {
    const [form,           setForm]           = useState(EMPTY_FORM);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [casts,          setCasts]          = useState([{ name: "", character: "", profile_path: "" }]);
    const [submitting,     setSubmitting]     = useState(false);
    const [success,        setSuccess]        = useState(false);
    const [previewImg,     setPreviewImg]     = useState(null);
    const [storedMovies,   setStoredMovies]   = useState([]);
    const [showAdded,      setShowAdded]      = useState(false);
    const [isEditMode,     setIsEditMode]     = useState(false);
    const [editingMovieId, setEditingMovieId] = useState(null);

    // Load admin-added movies from localStorage on mount
    useEffect(() => {
        setStoredMovies(getStoredMovies());
    }, []);

    // ── Form field handler ──
    const set = (key) => (e) => {
        const val = e.target.value;
        setForm((f) => ({ ...f, [key]: val }));
        if (key === "poster_path") setPreviewImg(val || null);
    };

    // ── Genre toggle ──
    const toggleGenre = (g) =>
        setSelectedGenres((prev) =>
            prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
        );

    // ── Cast handlers ──
    const updateCast   = (i, field, val) =>
        setCasts((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
    const addCast      = () => setCasts((prev) => [...prev, { name: "", character: "", profile_path: "" }]);
    const removeCast   = (i) => {
        if (casts.length === 1) { toast.error("At least one cast member required"); return; }
        setCasts((prev) => prev.filter((_, idx) => idx !== i));
    };

    // ── Validate ──
    const validate = () => {
        if (!form.title.trim())         { toast.error("Movie title is required");       return false; }
        if (!form.overview.trim())      { toast.error("Overview is required");          return false; }
        if (!form.poster_path.trim())   { toast.error("Poster image URL is required");  return false; }
        if (!form.backdrop_path.trim()) { toast.error("Backdrop image URL is required"); return false; }
        if (!form.release_date)         { toast.error("Release date is required");      return false; }
        if (!form.runtime || Number(form.runtime) <= 0) { toast.error("Valid runtime required"); return false; }
        if (selectedGenres.length === 0){ toast.error("Select at least one genre");     return false; }
        if (!casts.some((c) => c.name.trim())) { toast.error("Add at least one cast member"); return false; }
        return true;
    };

    // ── Reset form ──
    const resetForm = () => {
        setForm(EMPTY_FORM);
        setSelectedGenres([]);
        setCasts([{ name: "", character: "", profile_path: "" }]);
        setPreviewImg(null);
        setIsEditMode(false);
        setEditingMovieId(null);
    };

    // ── Load movie data into form for editing ──
    const loadMovieForEdit = (movie) => {
        setForm({
            id:                 movie.id,
            title:              movie.title || "",
            overview:           movie.overview || "",
            poster_path:        movie.poster_path || "",
            backdrop_path:      movie.backdrop_path || "",
            trailerUrl:         movie.trailerUrl || "",
            release_date:       movie.release_date || "",
            original_language:  movie.original_language || "Telugu",
            tagline:            movie.tagline || "",
            runtime:            movie.runtime || "",
            vote_average:       movie.vote_average || "",
            theater:            movie.theater || "AVD Cinemas",
            screen:             movie.screen || "1",
        });
        
        // Load genres
        if (movie.genres && Array.isArray(movie.genres)) {
            setSelectedGenres(movie.genres.map(g => g.name));
        } else {
            setSelectedGenres([]);
        }
        
        // Load casts
        if (movie.casts && Array.isArray(movie.casts) && movie.casts.length > 0) {
            setCasts(movie.casts.map(cast => ({
                name: cast.name || "",
                character: cast.character || "",
                profile_path: cast.profile_path || "",
            })));
        } else {
            setCasts([{ name: "", character: "", profile_path: "" }]);
        }
        
        setPreviewImg(movie.poster_path || null);
        setIsEditMode(true);
        setEditingMovieId(movie.id);
        
        toast.success(`Editing "${movie.title}"`, { duration: 3000 });
    };

    // ── Submit: Add new movie or Update existing ──
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);

        // Build movie object
        const movieData = {
            title:             form.title.trim(),
            overview:          form.overview.trim(),
            poster_path:       form.poster_path.trim(),
            backdrop_path:     form.backdrop_path.trim(),
            release_date:      form.release_date,
            original_language: form.original_language,
            tagline:           form.tagline.trim() || "Coming Soon",
            vote_average:      form.vote_average ? parseFloat(form.vote_average) : 0,
            vote_count:        0,
            runtime:           parseInt(form.runtime),
            theater:           form.theater,
            screen:            form.screen,
            genres:            selectedGenres.map((name, i) => ({ id: 200 + i, name })),
            casts:             casts
                                   .filter((c) => c.name.trim())
                                   .map((c) => ({
                                       name:         c.name.trim(),
                                       character:    c.character.trim() || "TBA",
                                       profile_path: c.profile_path.trim() ||
                                                     "https://placehold.co/150x150/1a1a2e/6b7280?text=No+Photo",
                                   })),
        };

        if (form.trailerUrl.trim()) {
            movieData.trailerUrl = form.trailerUrl.trim();
        }

        let saved;
        
        if (isEditMode && editingMovieId) {
            // Update existing movie
            saved = updateMovie(editingMovieId, movieData);
            if (saved) {
                toast.success(`"${movieData.title}" updated successfully! 🎬`, { duration: 4000 });
            } else {
                toast.error("Failed to update movie. Movie not found or is a base movie.");
                setSubmitting(false);
                return;
            }
        } else {
            // Add new movie
            saved = addMovie(movieData);
            toast.success(`"${movieData.title}" added! Visible to users now. 🎬`, { duration: 4000 });
        }

        // Refresh stored list
        setStoredMovies(getStoredMovies());
        console.log("✅ Movie saved:", saved);
        console.log("📦 All movies now:", getAllMovies().length);
        
        setSuccess(true);
        setSubmitting(false);
        setShowAdded(true);

        // Reset form after 2s
        setTimeout(() => {
            resetForm();
            setSuccess(false);
        }, 2000);
    };

    // ── Remove a stored movie ──
    const handleRemove = (id) => {
        if (!window.confirm("Are you sure you want to remove this movie? This action cannot be undone.")) {
            return;
        }
        const removed = removeMovie(id);
        if (removed) {
            setStoredMovies(getStoredMovies());
            toast.success("Movie removed.");
            if (editingMovieId === id) {
                resetForm();
            }
        } else {
            toast.error("Base movies cannot be removed.");
        }
    };

    // ── Cancel edit mode ──
    const handleCancelEdit = () => {
        resetForm();
        toast("Edit mode cancelled", { icon: "📝" });
    };

    // ─────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────
    return (
        <>
            <Title text1={isEditMode ? "Update" : "Add"} text2="Movie" />

            {/* ── Header stats ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-6 mb-6 max-w-4xl">
                <div className="flex gap-3">
                    <div className="bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-lg text-center">
                        <p className="text-primary font-bold text-xl">{getTotalMovieCount()}</p>
                        <p className="text-gray-500 text-xs">Total Movies</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-lg text-center">
                        <p className="text-green-400 font-bold text-xl">{getStoredMovieCount()}</p>
                        <p className="text-gray-500 text-xs">Admin Added</p>
                    </div>
                </div>

                {storedMovies.length > 0 && (
                    <button
                        onClick={() => setShowAdded((p) => !p)}
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-primary
                                   border border-primary/20 hover:border-primary/50 px-3 py-2
                                   rounded-full transition cursor-pointer"
                    >
                        <RefreshCwIcon className="w-3.5 h-3.5" />
                        {showAdded ? "Hide" : "Show"} Added Movies ({storedMovies.length})
                    </button>
                )}
            </div>

            {/* ── Info banner ── */}
            <div className="max-w-4xl mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-blue-400 text-sm font-semibold mb-1">
                    {isEditMode ? "✏️ Editing Mode" : "💾 Add New Movie"}
                </p>
                <p className="text-gray-400 text-xs leading-relaxed">
                    {isEditMode 
                        ? "You are currently editing an existing movie. Make your changes and click 'Update Movie' to save."
                        : "Movies you add here are saved to localStorage. They persist across page refreshes and are immediately visible to users."
                    }
                </p>
            </div>

            {/* ── Admin-added movies list ── */}
            {showAdded && storedMovies.length > 0 && (
                <div className="max-w-4xl mb-8">
                    <p className="text-sm font-medium text-gray-300 mb-3">
                        Admin-Added Movies (Click Edit to modify)
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {storedMovies.map((m) => (
                            <StoredMovieRow 
                                key={m.id} 
                                movie={m} 
                                onRemove={handleRemove}
                                onEdit={loadMovieForEdit}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
                <BlurCircle top="-60px" left="0" />

                {/* Basic Info with ID Field */}
                <Section icon={InfoIcon} title="Basic Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isEditMode && (
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-400 mb-1.5 block">Movie ID (Auto-generated, Read-only)</label>
                                <input
                                    value={form.id}
                                    disabled
                                    className={`${inputCls} opacity-60 cursor-not-allowed`}
                                />
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-400 mb-1.5 block">Movie Title *</label>
                            <input
                                value={form.title}
                                onChange={set("title")}
                                placeholder="e.g. Kalki 2898 AD"
                                className={inputCls}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-400 mb-1.5 block">Tagline</label>
                            <input
                                value={form.tagline}
                                onChange={set("tagline")}
                                placeholder="e.g. The Legend Awakens"
                                className={inputCls}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-400 mb-1.5 block">Overview / Description *</label>
                            <textarea
                                value={form.overview}
                                onChange={set("overview")}
                                rows={4}
                                placeholder="Movie description…"
                                className={`${inputCls} resize-none`}
                            />
                        </div>
                    </div>
                </Section>

                {/* Images & Media */}
                <Section icon={ImageIcon} title="Images & Media">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block">Poster Image URL *</label>
                            <input
                                value={form.poster_path}
                                onChange={set("poster_path")}
                                placeholder="https://example.com/poster.jpg"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block">Backdrop Image URL *</label>
                            <input
                                value={form.backdrop_path}
                                onChange={set("backdrop_path")}
                                placeholder="https://example.com/backdrop.jpg"
                                className={inputCls}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1">
                                <VideoIcon className="w-3 h-3" /> Trailer URL (YouTube embed)
                            </label>
                            <input
                                value={form.trailerUrl}
                                onChange={set("trailerUrl")}
                                placeholder="https://www.youtube.com/embed/VIDEO_ID"
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {previewImg && (
                        <div className="mt-4 flex items-start gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-2">Poster Preview</p>
                                <img
                                    src={previewImg}
                                    alt="Preview"
                                    className="w-28 h-40 object-cover rounded-xl border border-primary/20"
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        toast.error("Invalid image URL");
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </Section>

                {/* Movie Details */}
                <Section icon={CalendarIcon} title="Movie Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block">Release Date *</label>
                            <input type="date" value={form.release_date} onChange={set("release_date")} className={inputCls} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block">Runtime (minutes) *</label>
                            <input
                                type="number" min="1" max="400"
                                value={form.runtime}
                                onChange={set("runtime")}
                                placeholder="180"
                                className={inputCls}
                            />
                            {form.runtime && (
                                <p className="text-gray-600 text-xs mt-1">{timeFormat(parseInt(form.runtime))}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block">Original Language *</label>
                            <div className="relative">
                                <LanguagesIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <select value={form.original_language} onChange={set("original_language")} className={`${inputCls} pl-9 cursor-pointer`}>
                                    {LANGUAGES.map((l) => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block">Rating (0–10)</label>
                            <div className="relative">
                                <StarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                                <input
                                    type="number" step="0.1" min="0" max="10"
                                    value={form.vote_average}
                                    onChange={set("vote_average")}
                                    placeholder="8.5"
                                    className={`${inputCls} pl-9`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block">Theater</label>
                            <select value={form.theater} onChange={set("theater")} className={`${inputCls} cursor-pointer`}>
                                {THEATERS.map((t) => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block">Screen</label>
                            <select value={form.screen} onChange={set("screen")} className={`${inputCls} cursor-pointer`}>
                                {SCREENS.map((s) => <option key={s} value={s} className="bg-gray-900">Screen {s}</option>)}
                            </select>
                        </div>
                    </div>
                </Section>

                {/* Genres */}
                <Section icon={TagIcon} title="Genres *">
                    <div className="flex flex-wrap gap-2">
                        {GENRES.map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => toggleGenre(g)}
                                className={`px-3 py-1.5 rounded-full text-sm transition cursor-pointer
                                    ${selectedGenres.includes(g)
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "bg-primary/10 text-gray-300 hover:bg-primary/20"}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                    {selectedGenres.length > 0 && (
                        <p className="text-gray-500 text-xs mt-3">
                            Selected: {selectedGenres.join(", ")}
                        </p>
                    )}
                </Section>

                {/* Cast */}
                <Section icon={UsersIcon} title="Cast & Crew *">
                    <div className="space-y-2">
                        {casts.map((cast, i) => (
                            <CastRow
                                key={i}
                                index={i}
                                cast={cast}
                                onUpdate={updateCast}
                                onRemove={removeCast}
                            />
                        ))}
                        <button
                            type="button"
                            onClick={addCast}
                            className="text-primary hover:text-primary/80 text-sm flex items-center
                                       gap-1 transition cursor-pointer mt-2"
                        >
                            <PlusCircleIcon className="w-4 h-4" /> Add Cast Member
                        </button>
                    </div>
                </Section>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pb-6">
                    {isEditMode && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-10 py-3 rounded-full text-sm
                                       font-semibold transition cursor-pointer active:scale-95
                                       bg-gray-700 hover:bg-gray-600 text-white"
                        >
                            <XIcon className="w-4 h-4" />
                            Cancel Edit
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={submitting || success}
                        className={`flex items-center gap-2 px-10 py-3 rounded-full text-sm
                                    font-semibold transition cursor-pointer active:scale-95
                                    disabled:opacity-60 disabled:cursor-not-allowed
                                    ${success
                                        ? "bg-green-500/20 border border-green-500/40 text-green-400"
                                        : "bg-primary hover:bg-primary-dull text-white shadow-lg shadow-primary/20"}`}
                    >
                        {submitting ? (
                            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{isEditMode ? "Updating…" : "Adding…"}</>
                        ) : success ? (
                            <><CheckCircleIcon className="w-4 h-4" />{isEditMode ? "Movie Updated!" : "Movie Added!"}</>
                        ) : (
                            <>{isEditMode ? <SaveIcon className="w-4 h-4" /> : <PlusCircleIcon className="w-4 h-4" />}{isEditMode ? "Update Movie" : "Add Movie"}</>
                        )}
                    </button>
                </div>
            </form>
        </>
    );
}

export default AddMovie;