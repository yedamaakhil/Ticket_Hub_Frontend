import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/react";
import {
  MessageCircleIcon,
  XIcon,
  SendIcon,
  BotIcon,
  UserIcon,
  FilmIcon,
  RefreshCwIcon,
} from "lucide-react";
import { dummyShowsData, dummyDateTimeData } from "../assets/assets";
import { getAllMovies } from "../lib/movieStore";
const API_URL = import.meta.env.VITE_API_URL || "https://tickethub-api-m6x7.onrender.com";

// ─────────────────────────────────────────────────────────────────────────────
//  MovieChatbot — AI assistant for TixRush
//
//  Powered by Claude (claude-sonnet-4-6) via the Anthropic API.
//  The system prompt gives Claude full knowledge of:
//    • All movies in the database (titles, genres, cast, runtime, ratings)
//    • Show timings and dates from dummyDateTimeData
//    • Ticket pricing tiers (Economy / Standard / Premium)
//    • Tax structure (GST 8%, Entertainment 2%, Conv fee ₹13/seat)
//    • How to book: Movies → Select date → Select seats → Pay via Razorpay
//
//  Place this file at:  src/Components/MovieChatbot.jsx
//  Import and add <MovieChatbot /> once anywhere in your App.jsx or layout.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  Build a compact movies summary for the system prompt
// ─────────────────────────────────────────────────────────────────────────────
const buildMovieSummary = () => {
  const movies = getAllMovies();
  return movies
    .slice(0, 20) // Keep prompt size reasonable
    .map((m) => {
      const genres  = m.genres?.map((g) => g.name).join(", ") ?? "—";
      const cast    = m.casts?.slice(0, 3).map((c) => c.name).join(", ") ?? "—";
      const runtime = m.runtime ? `${Math.floor(m.runtime / 60)}h ${m.runtime % 60}m` : "—";
      return `• ${m.title} (${m.release_date?.split("-")[0] ?? "?"}) | ${genres} | ${runtime} | ⭐${m.vote_average?.toFixed(1)} | Cast: ${cast} | Theater: ${m.theater ?? "AVD Cinemas"}, Screen ${m.screen ?? "1"} | Language: ${m.original_language ?? "Telugu"}`;
    })
    .join("\n");
};

const buildShowtimeSummary = () => {
  return Object.entries(dummyDateTimeData)
    .map(([date, slots]) => {
      const shows = slots.map((s) => {
        const movie = dummyShowsData.find((m) => String(m._id) === String(s.showId) || String(m.id) === String(s.showId));
        return `${s.time} — ${movie?.title ?? "Unknown"}`;
      }).join(", ");
      return `${date}: ${shows}`;
    })
    .join("\n");
};

const SYSTEM_PROMPT = () => `You are TicketHub, the friendly AI assistant for TicketHub — an Indian movie ticket booking platform. You help users discover movies, check showtimes, understand pricing, and navigate the booking process.

## Your personality
- Warm, enthusiastic about movies, concise
- Use emojis sparingly but naturally 🎬🎟️
- Always respond in the same language the user writes in
- Keep answers short unless detailed info is asked for

## Movies currently showing
${buildMovieSummary()}

## Showtimes
${buildShowtimeSummary()}

## Theaters
- AVD Cinemas (Screens 1–3)
- PVR Cinemas (Screens 1–4)
- INOX Leisure (Screens 1–3)
- Cinepolis (Screens 1–3)

## Ticket pricing
- Economy (Rows A–B): ₹150/seat
- Standard (Rows C–J): ₹300/seat
- Premium (Rows K–R): ₹500/seat
- Taxes: GST 8% + Cinema Dev Tax 2% + Convenience fee ₹13/seat (+8% GST)

## How to book
1. Go to Movies page → pick a movie
2. Select a date and show time
3. Choose seats on the seat map
4. Proceed to Payment → pay via Razorpay (UPI, Card, Net Banking, Wallet)
5. Booking confirmation + email sent instantly

## What you can help with
- Recommend movies by genre, mood, language, cast
- Tell users what's playing on a specific date/time
- Explain pricing and taxes
- Guide through the booking flow
- Answer FAQs about cancellations, tickets, showtimes

## What you cannot do
- You cannot access a specific user's booking history in this chat
- You cannot make bookings directly (direct them to the website)
- Keep all responses under 150 words unless the user asks for something detailed

Always be helpful and steer the conversation back to movies and bookings on TixRush.`;

// ─────────────────────────────────────────────────────────────────────────────
//  Quick reply suggestions
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_REPLIES = [
  "What movies are playing today?",
  "Recommend an action movie 🎬",
  "How much do tickets cost?",
  "How do I book tickets?",
  "What payment methods are accepted?",
  "Which movies are in Telugu?",
];

// ─────────────────────────────────────────────────────────────────────────────
//  Message bubble
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isBot = msg.role === "assistant";
  return (
    <div className={`flex gap-2.5 ${isBot ? "items-start" : "items-end flex-row-reverse"}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                       ${isBot
                         ? "bg-primary/20 border border-primary/40"
                         : "bg-white/10 border border-white/20"}`}>
        {isBot
          ? <BotIcon className="w-4 h-4 text-primary" />
          : <UserIcon className="w-3.5 h-3.5 text-gray-300" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                       ${isBot
                         ? "bg-white/5 border border-white/10 text-gray-100 rounded-tl-sm"
                         : "bg-primary text-white rounded-tr-sm"}`}>
        {msg.content}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Typing indicator
// ─────────────────────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40
                      flex items-center justify-center flex-shrink-0">
        <BotIcon className="w-4 h-4 text-primary" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main Chatbot Component
// ─────────────────────────────────────────────────────────────────────────────
export default function MovieChatbot() {
  const { user } = useUser();

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    {
      role:    "assistant",
      content: `Hey${user?.firstName ? ` ${user.firstName}` : ""}! 👋 I'm Assistant Bot, your TicketHub movie assistant.\n\nI can help you find movies, check showtimes, understand pricing, or guide you through booking. What would you like to know? 🎬`,
    },
  ]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setInput("");
    setError(null);

    const userMsg   = { role: "user", content: userText };
    const newMsgs   = [...messages, userMsg];
    setMessages(newMsgs);
    setLoading(true);

    try {
      // Build messages array for Claude (exclude the initial greeting from history
      // to keep context clean — only send actual conversation turns)
      const history = newMsgs.map((m) => ({
        role:    m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messages: history,
    }),
    });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `API error ${res.status}`);
      }

      const data = await res.json();
        if (!data.success) {
        throw new Error(data.reply);
        }

        setMessages((prev) => [
        ...prev,
        {
            role: "assistant",
            content: data.reply,
    },
    ]);

    } catch (err) {
      console.error("TicketHub error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role:    "assistant",
        content: `Hey${user?.firstName ? ` ${user.firstName}` : ""}! 👋 I'm TixBot. How can I help you today? 🎬`,
      },
    ]);
    setError(null);
    setInput("");
  };

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="Open chat"
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-2xl
                    flex items-center justify-center transition-all duration-300
                    active:scale-95 cursor-pointer
                    ${open
                      ? "bg-gray-800 border border-white/10 rotate-0"
                      : "bg-primary hover:bg-primary-dull shadow-primary/40"}`}
      >
        {open
          ? <XIcon className="w-5 h-5 text-white" />
          : <MessageCircleIcon className="w-6 h-6 text-white" />}

        {/* Pulse ring (only when closed) */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        )}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-40 w-[360px] max-w-[calc(100vw-24px)]
                     flex flex-col rounded-2xl overflow-hidden shadow-2xl
                     border border-white/10 bg-[#0d1017]"
          style={{ height: "520px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3
                          bg-gradient-to-r from-primary/20 to-primary/5
                          border-b border-white/10 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary/25 border border-primary/50
                            flex items-center justify-center">
              <FilmIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">Assistant Bot</p>
              <p className="text-green-400 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Online · AI Assistant
              </p>
            </div>
            <button
              onClick={resetChat}
              title="New conversation"
              className="text-gray-500 hover:text-gray-300 transition cursor-pointer p-1"
            >
              <RefreshCwIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-white transition cursor-pointer p-1"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {loading && <TypingDots />}

            {error && (
              <div className="text-red-400 text-xs text-center py-2 px-3
                              bg-red-500/10 rounded-xl border border-red-500/20">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick replies — show only after first message */}
          {messages.length <= 2 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {QUICK_REPLIES.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-primary/30
                             text-primary hover:bg-primary/15 transition cursor-pointer
                             bg-primary/5"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2 px-3 py-3 border-t border-white/10
                          flex-shrink-0 bg-[#0a0d12]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about movies, showtimes, pricing…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl
                         px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none
                         focus:border-primary/50 transition disabled:opacity-50
                         max-h-28 leading-5"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full bg-primary hover:bg-primary-dull flex-shrink-0
                         flex items-center justify-center transition cursor-pointer
                         active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SendIcon className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pb-2 flex-shrink-0">
            <p className="text-gray-700 text-xs">Powered by Claude AI · TicketHub</p>
          </div>
        </div>
      )}
    </>
  );
}