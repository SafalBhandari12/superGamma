import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Express } from "express";
import { auth } from "./auth.js";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { decksRouter } from "./routes/decksRoutes.js";

const app: Express = express();
// Behind Vercel's edge (and the web app's rewrite proxy) — trust X-Forwarded-* for req.ip / protocol.
app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(cors({ origin: config.webOrigin, credentials: true }));

// Better Auth reads its own request body — must be mounted before express.json().
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json({ limit: "100kb" }));

app.use("/api/decks", requireAuth, apiLimiter, decksRouter);

// Must be registered last — Express identifies error middleware by arity.
app.use(errorHandler);

// On Vercel the platform invokes the exported app; locally we listen ourselves.
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`api listening on :${config.port}`);
  });
}

export default app;
