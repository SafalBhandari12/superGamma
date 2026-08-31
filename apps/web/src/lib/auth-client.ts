import { createAuthClient } from "better-auth/react";

/**
 * The API and web app run on different ports in dev (different origins,
 * but both host "localhost" — so the session cookie the API sets is still
 * sent here; no proxy needed). In production, put both behind the same
 * registrable domain (e.g. app.example.com / api.example.com) or this
 * breaks — see apps/api/src/config.ts webOrigin/trustedOrigins.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  fetchOptions: {
    credentials: "include",
  },
});
