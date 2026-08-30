import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

/**
 * The one place HTTP status codes get decided from errors. Controllers
 * and services just throw — a ZodError from `.parse()`, an AppError
 * subclass, or anything else — and this maps it to a response shape.
 * Must stay 4-arity (err, req, res, next) or Express won't register it
 * as an error handler.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "validation_error",
      issues: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.name, message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "internal_error", message: "Something went wrong" });
};
