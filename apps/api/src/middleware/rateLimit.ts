import type { Request } from "express";
import rateLimit from "express-rate-limit";

/** These run after requireAuth, so key by account rather than IP (behind Vercel's proxies every request can share an IP). */
const byUser = (req: Request) => req.user.id;

/** Baseline for everything under /api/decks. Auth routes have their own limiter, configured in auth.ts. */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  keyGenerator: byUser,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "Too many requests — slow down." },
});

/** Tighter cap on the LLM-backed endpoint specifically — each call is an expensive generation. */
export const generateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 3,
  keyGenerator: byUser,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "Too many deck generations — try again in a minute." },
});
