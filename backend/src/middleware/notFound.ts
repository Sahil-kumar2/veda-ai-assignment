import { Request, Response, NextFunction } from "express";

/**
 * notFound - 404 fallthrough middleware.
 *
 * Catches any request that didn't match a registered route and
 * returns a consistent 404 JSON response.
 * Must be registered AFTER all routes and BEFORE the error handler.
 */
const notFound = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route not found: [${req.method}] ${req.originalUrl}`,
    errors: [],
  });
};

export default notFound;
