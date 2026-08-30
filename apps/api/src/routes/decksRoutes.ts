import { Router, type Router as RouterType } from "express";
import { generateDeckHandler, getDeckHandler } from "../controllers/decksController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const decksRouter: RouterType = Router();

decksRouter.post("/generate", asyncHandler(generateDeckHandler));
decksRouter.get("/:id", asyncHandler(getDeckHandler));
