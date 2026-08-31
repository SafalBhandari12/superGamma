import { Router, type Router as RouterType } from "express";
import {
  generateDeckHandler,
  getDeckHandler,
  listDecksHandler,
  listThemesHandler,
  rethemeDeckHandler,
} from "../controllers/decksController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { generateLimiter } from "../middleware/rateLimit.js";

export const decksRouter: RouterType = Router();

decksRouter.get("/themes", asyncHandler(listThemesHandler));
decksRouter.post("/generate", generateLimiter, asyncHandler(generateDeckHandler));
decksRouter.get("/", asyncHandler(listDecksHandler));
decksRouter.get("/:id", asyncHandler(getDeckHandler));
decksRouter.patch("/:id/theme", asyncHandler(rethemeDeckHandler));
