import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { decksRouter } from "./routes/decksRoutes.js";

const app = express();
app.use(cors({ origin: config.webOrigin }));
app.use(express.json());

app.use("/api/decks", decksRouter);

// Must be registered last — Express identifies error middleware by arity.
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`api listening on :${config.port}`);
});
