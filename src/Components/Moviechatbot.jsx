import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  MessageCircleIcon,
  XIcon,
  SendIcon,
  BotIcon,
  UserIcon,
  RefreshCwIcon,
} from "lucide-react";
import { dummyShowsData, dummyDateTimeData } from "../assets/assets";
import { getAllMovies } from "../lib/movieStore";

const API_URL =
  import.meta.env.VITE_API_URL || "https://tickethub-api-m6x7.onrender.com";

// ─── Prompt helpers (used server-side too, kept here for reference) ───
const buildMovieSummary = () => {
  const movies = getAllMovies();
  return movies
    .slice(0, 20)
    .map((m) => {
      const genres = m.genres?.map((g) => g.name).join(", ") ?? "—";
      const cast = m.casts?.slice(0, 3).map((c) => c.name).join(", ") ?? "—";
      const runtime = m.runtime
        ? `${Math.floor(m.runtime / 60)}h ${m.runtime % 60}m`
        : "—";
      return `• ${m.title} (${m.release_date?.split("-")[0] ?? "?"}) | ${genres} | ${runtime} | ⭐${m.vote_average?.toFixed(1)} | Cast: ${cast}`;
    })
    .join("\n");
};

const buildShowtimeSummary = () =>
  Object.entries(dummyDateTimeData)
    .map(([date, slots]) => {
      const shows = slots
        .map((s) => {
          const movie = dummyShowsData.find(
            (m) =>
              String(m._id) === String(s.showId) ||
              String(m.id) === String(s.showId)
          );
          return `${s.time} — ${movie?.title ?? "Unknown"}`;
        })
        .join(", ");
      return `${date}: ${shows}`;
    })
    .join("\n");

const QUICK_REPLIES = [
  "What movies are playing today?",
  "Recommend an action movie 🎬",
  "How much do tickets cost?",
  "How do I book tickets?",
];

function MessageBubble({ msg }) {
  const isBot = msg.role === "assistant";
  return (
    <div className={`flex gap-2 ${isBot ? "" : "flex-row-reverse"}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isBot ? "bg-primary/20" : "bg-white/10"
        }`}
      >
        {isBot ? (
          <BotIcon className="w-4 h-4 text-primary" />
        ) : (
          <UserIcon className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
          isBot
            ? "bg-white/5 text-gray-100 rounded-tl-sm"
            : "bg-primary text-white rounded-tr-sm"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
        <BotIcon className="w-4 h-4 text-primary" />
      </div>
      <div className="bg-white/5 px-3 py-2 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MovieChatbot() {
  const { user } = useUser();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hey${user?.firstName ? ` ${user.firstName}` : ""}! 👋 I'm Assistant Bot, your TicketHub movie assistant.\n\nI can help you find movies, check showtimes, understand pricing, or guide you through booking. What would you like to know? 🎬`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setInput("");
    setError(null);

    const userMsg = { role: "user", content: userText };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const history = newMsgs.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // IMPORTANT: backend is mapped at /api/chat and API_URL has no trailing /api
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          clerkUserId: user?.id ?? null,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.reply || "Chatbot failed to respond.");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
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
        role: "assistant",
        content: `Hey${user?.firstName ? ` ${user.firstName}` : ""}! 👋 I'm Assistant Bot. How can I help you today? 🎬`,
      },
    ]);
    setError(null);
    setInput("");
  };

  return (
    <>
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="Open chat"
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-2xl
                    flex items-center justify-center transition-all duration-300
                    active:scale-95 cursor-pointer
                    ${
                      open
                        ? "bg-gray-800 border border-white/10"
                        : "bg-primary hover:bg-primary-dull shadow-primary/40"
                    }`}
      >
        {open ? (
          <XIcon className="w-6 h-6 text-white" />
        ) : (
          <MessageCircleIcon className="w-6 h-6 text-white" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-3 border-b border-white/10 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <BotIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">Assistant Bot</p>
              <p className="text-gray-400 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Online · AI Assistant
              </p>
            </div>
            <button
              onClick={resetChat}
              aria-label="Reset chat"
              className="text-gray-500 hover:text-white transition p-1"
            >
              <RefreshCwIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-gray-500 hover:text-white transition p-1"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && <TypingDots />}
            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && !loading && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2 flex-shrink-0">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/15 transition bg-primary/5"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2 p-3 border-t border-white/10 flex-shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about movies, showtimes, pricing…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/50 transition disabled:opacity-50 max-h-28 leading-5"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="w-9 h-9 rounded-full bg-primary hover:bg-primary-dull flex-shrink-0 flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SendIcon className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="text-center pb-2 flex-shrink-0">
            <p className="text-gray-700 text-xs">
              Powered by Claude AI · TicketHub
            </p>
          </div>
        </div>
      )}
    </>
  );
}
