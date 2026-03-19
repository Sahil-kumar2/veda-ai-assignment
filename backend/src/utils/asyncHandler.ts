import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * asyncHandler - Higher-order function that wraps async route handlers.
 *
 * Eliminates the need for try/catch in every controller by automatically
 * catching rejected promises and forwarding them to Express's next(err).
 *
 * Usage:
 *   router.get("/", asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation();
 *     res.json(data);
 *   }));
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
