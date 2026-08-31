import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { auth } from "./auth.js";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { decksRouter } from "./routes/decksRoutes.js";

const app = express();
app.use(cors({ origin: config.webOrigin, credentials: true }));

// Better Auth reads its own request body — must be mounted before express.json().
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

app.use("/api/decks", apiLimiter, requireAuth, decksRouter);

// Must be registered last — Express identifies error middleware by arity.
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`api listening on :${config.port}`);
});
