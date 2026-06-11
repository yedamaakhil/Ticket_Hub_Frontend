import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { sendBookingConfirmationEmail } from "./services/emailService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");

const PORT = process.env.PORT || 8080;
const TOTAL_SEATS_PER_SHOW = 180;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, "[]");
}

function readBookings() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeBookings(bookings) {
  ensureDataDir();
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

function generateBookingRef() {
  return `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function generateTransactionId() {
  return `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function getBookedSeats(movieId, showDate, showTime) {
  return readBookings()
    .filter(
      (b) =>
        b.status === "CONFIRMED" &&
        String(b.movieId) === String(movieId) &&
        b.showDate === showDate &&
        b.showTime === showTime
    )
    .flatMap((b) => b.seats || []);
}

function computeStats(bookings) {
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const cancelled = bookings.filter((b) => b.status === "CANCELLED");
  return {
    totalBookings: bookings.length,
    completedBookings: confirmed.length,
    cancelledBookings: cancelled.length,
    totalRevenue: confirmed.reduce((s, b) => s + (b.totalPrice || 0), 0),
    totalSeatsBooked: confirmed.reduce((s, b) => s + (b.seats?.length || 0), 0),
  };
}

function computeActiveShows(bookings) {
  const showMap = new Map();
  for (const b of bookings.filter((x) => x.status === "CONFIRMED")) {
    const key = `${b.movieId}|${b.showDate}|${b.showTime}`;
    if (!showMap.has(key)) {
      showMap.set(key, {
        movieId: b.movieId,
        movieTitle: b.movieTitle,
        showDate: b.showDate,
        showTime: b.showTime,
        theaterName: b.theaterName,
        screenName: b.screenName,
        occupiedSeatsCount: 0,
        totalSeats: TOTAL_SEATS_PER_SHOW,
      });
    }
    const show = showMap.get(key);
    show.occupiedSeatsCount += b.seats?.length || 0;
  }
  return Array.from(showMap.values());
}

// ── Health ──
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "tickethub-api" });
});

// ── Booked seats ──
app.get("/api/seats/booked", (req, res) => {
  const { movieId, date, time } = req.query;
  if (!movieId || !date || !time) {
    return res.status(400).json({ message: "movieId, date, and time are required" });
  }
  res.json(getBookedSeats(movieId, date, time));
});

// ── Create booking + send email ──
app.post("/api/bookings", async (req, res) => {
  const body = req.body;
  const {
    movieId, showDate, showTime, seats,
    totalPrice, paymentMethod, razorpayPaymentId,
    movieTitle, moviePosterPath, movieGenres, movieRuntime, movieLanguage,
    theaterName, screenName, userEmail, clerkUserId,
  } = body;

  if (!movieId || !showDate || !showTime || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ message: "Invalid booking payload" });
  }

  const booked = getBookedSeats(movieId, showDate, showTime);
  const conflict = seats.filter((s) => booked.includes(s));
  if (conflict.length > 0) {
    return res.status(409).json({ message: "Seats no longer available", conflict });
  }

  const bookingRef = generateBookingRef();
  const transactionId = generateTransactionId();

  const booking = {
    id: uuidv4(),
    bookingRef,
    transactionId,
    clerkUserId: clerkUserId || "",
    movieId,
    showDate,
    showTime,
    seats,
    totalPrice: totalPrice ?? 0,
    paymentMethod: paymentMethod || "ONLINE",
    razorpayPaymentId: razorpayPaymentId || "",
    movieTitle: movieTitle || "Movie",
    moviePosterPath: moviePosterPath || "",
    movieGenres: movieGenres || "",
    movieRuntime: movieRuntime ?? null,
    movieLanguage: movieLanguage || "",
    theaterName: theaterName || "Cineplex",
    screenName: screenName || "Screen 1",
    userEmail: userEmail || "",
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  };

  const bookings = readBookings();
  bookings.push(booking);
  writeBookings(bookings);

  const emailResult = await sendBookingConfirmationEmail(booking);

  res.status(201).json({
    bookingRef,
    transactionId,
    id: booking.id,
    emailSent: emailResult.sent,
    emailPreviewUrl: emailResult.previewUrl || null,
    emailError: emailResult.reason || null,
  });
});

// ── Resend confirmation email ──
app.post("/api/bookings/:id/resend-email", async (req, res) => {
  const bookings = readBookings();
  const booking = bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  const emailResult = await sendBookingConfirmationEmail(booking);
  res.json({
    emailSent: emailResult.sent,
    emailPreviewUrl: emailResult.previewUrl || null,
    emailError: emailResult.reason || null,
  });
});

// ── User bookings ──
app.get("/api/bookings/user/:userId", (req, res) => {
  const bookings = readBookings()
    .filter((b) => b.clerkUserId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(bookings);
});

// ── All bookings (admin) ──
app.get("/api/bookings/all", (_req, res) => {
  const bookings = readBookings().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(bookings);
});

// ── Stats (admin) ──
app.get("/api/bookings/stats", (_req, res) => {
  res.json(computeStats(readBookings()));
});

// ── Active shows (admin) ──
app.get("/api/shows/active", (_req, res) => {
  res.json(computeActiveShows(readBookings()));
});

// ── Cancel booking ──
app.put("/api/bookings/:id/cancel", (req, res) => {
  const bookings = readBookings();
  const idx = bookings.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Booking not found" });
  if (bookings[idx].status === "CANCELLED") {
    return res.status(400).json({ message: "Already cancelled" });
  }
  bookings[idx].status = "CANCELLED";
  bookings[idx].cancelledAt = new Date().toISOString();
  writeBookings(bookings);
  res.json(bookings[idx]);
});

// ── Razorpay: create order ──
app.post("/api/razorpay/create-order", (req, res) => {
  const { amount, currency = "INR", receipt, notes } = req.body;
  if (!amount) return res.status(400).json({ message: "amount is required" });

  const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_mock";
  const orderId = `order_${crypto.randomBytes(8).toString("hex")}`;

  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    // Real Razorpay integration would go here
    console.log("ℹ️ Razorpay keys set — integrate razorpay SDK for production");
  }

  res.json({
    orderId,
    amount,
    currency,
    keyId,
    receipt: receipt || orderId,
    notes: notes || {},
  });
});

// ── Razorpay: verify payment ──
app.post("/api/razorpay/verify-payment", (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId) {
    return res.status(400).json({ success: false, message: "Missing payment details" });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (secret && razorpaySignature) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expected !== razorpaySignature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } else {
    console.log("ℹ️ Mock payment verification (set RAZORPAY_KEY_SECRET for real verification)");
  }

  res.json({ success: true, paymentId: razorpayPaymentId, orderId: razorpayOrderId });
});

app.listen(PORT, () => {
  ensureDataDir();
  console.log(`🚀 TicketHub API running on http://localhost:${PORT}`);
});
