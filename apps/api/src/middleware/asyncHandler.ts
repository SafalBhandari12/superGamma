import type { NextFunction, Request, Response } from "express";

/**
 * Wraps an async route handler so a rejected promise (including a thrown
 * ZodError from `.parse()`) reaches `next(err)` instead of crashing the
 * process or hanging the request. Every route goes through this — a
 * route that forgets it is a route with an unhandled rejection.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
