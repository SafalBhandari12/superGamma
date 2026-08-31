import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "../auth.js";

/** Every route behind this needs a live Better Auth session cookie. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ error: "unauthorized", message: "Sign in required" });
    return;
  }
  req.user = session.user;
  req.session = session.session;
  next();
}
