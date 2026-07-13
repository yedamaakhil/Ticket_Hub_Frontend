import { useState, useEffect, useCallback, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

/**
 * useSeatLock — manages temporary seat reservation for one show slot.
 *
 * @param {object} opts
 *   movieId   — numeric movie id
 *   date      — "YYYY-MM-DD"
 *   time      — show time string (same format used by the backend)
 *   sessionId — Clerk userId or a UUID from sessionStorage
 *   enabled   — start polling only when a time slot is selected
 *
 * Returns:
 *   seatStatus  — { bookedSeats, lockedByOthers, myLocks }
 *   lockSeats   — async (seats: string[]) → replaces the current lock set
 *   releaseLocks— async () → clears all locks for this session
 *   refreshNow  — async () → force-refresh status immediately
 */
export function useSeatLock({ movieId, date, time, sessionId, enabled }) {
  const [seatStatus, setSeatStatus] = useState({
    bookedSeats:    [],
    lockedByOthers: [],
    myLocks:        [],
  });

  // Keep a ref so the cleanup effect always has the latest values
  const paramsRef = useRef({ movieId, date, time, sessionId });
  useEffect(() => {
    paramsRef.current = { movieId, date, time, sessionId };
  }, [movieId, date, time, sessionId]);

  // ── Fetch status from backend ─────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    if (!enabled || !time || !sessionId) return;
    try {
      const res = await fetch(
        `${API_URL}/seats/status?movieId=${movieId}&date=${date}&time=${encodeURIComponent(time)}&sessionId=${encodeURIComponent(sessionId)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setSeatStatus({
        bookedSeats:    data.bookedSeats    ?? [],
        lockedByOthers: data.lockedByOthers ?? [],
        myLocks:        data.myLocks        ?? [],
      });
    } catch {
      // silently ignore network blips during polling
    }
  }, [movieId, date, time, sessionId, enabled]);

  // ── Poll every 3 s while this component is mounted with a time selected ───
  useEffect(() => {
    if (!enabled) return;
    fetchStatus();
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
  }, [fetchStatus, enabled]);

  // ── Lock / update seats on backend ───────────────────────────────────────
  const lockSeats = useCallback(async (seats) => {
    if (!time || !sessionId) return;
    try {
      await fetch(`${API_URL}/seats/lock`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ movieId, date, time, sessionId, seats }),
      });
    } catch {
      // non-blocking; worst case another user picks the same seat and the
      // DB constraint will catch it at booking time
    }
  }, [movieId, date, time, sessionId]);

  // ── Release all locks (unmount / payment failure) ─────────────────────────
  const releaseLocks = useCallback(async () => {
    const { movieId: m, date: d, time: t, sessionId: s } = paramsRef.current;
    if (!t || !s) return;
    try {
      // Empty seats list = clear all locks for this session
      await fetch(`${API_URL}/seats/lock`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ movieId: m, date: d, time: t, sessionId: s, seats: [] }),
      });
    } catch {
      // best-effort; backend will expire locks after 10 min anyway
    }
  }, []); // intentionally no deps — uses ref

  // ── Auto-release on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      releaseLocks();
    };
  }, [releaseLocks]);

  return { seatStatus, lockSeats, releaseLocks, refreshNow: fetchStatus };
}

/**
 * getOrCreateSessionId — returns the Clerk userId when signed in,
 * otherwise a stable UUID stored in sessionStorage.
 */
export function getOrCreateSessionId(clerkUserId) {
  if (clerkUserId) return clerkUserId;
  const key = "tixhub_seat_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}