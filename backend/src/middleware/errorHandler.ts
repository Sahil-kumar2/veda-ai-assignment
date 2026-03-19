import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

/**
 * Global error handler middleware.
 *
 * Must be registered LAST in app.ts (after all routes).
 * Express identifies it as an error handler by its 4-argument signature.
 *
 * Handles two categories of errors:
 *  1. ApiError (operational) — predictable errors thrown intentionally (e.g., 404, 400)
 *  2. Unknown errors        — unexpected crashes, logged and returned as 500
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof MulterError) {
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "One or more files exceed the maximum allowed size"
        : `Upload error: ${err.message}`;
    logger.warn(`[${req.method}] ${req.path} - ${statusCode}: ${message}`);
    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors: [err.code],
    });
    return;
  }

  // Determine if this is a known, operational API error
  if (err instanceof ApiError) {
    logger.error(`[${req.method}] ${req.path} - ${err.statusCode}: ${err.message}`);

    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  // Unknown / unexpected errors (programming bugs, third-party failures, etc.)
  logger.error(`[${req.method}] ${req.path} - Unhandled error: ${err.message}`);
  logger.error(err.stack ?? "No stack trace available");

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal server error",
    errors: [],
  });
};

export default errorHandler;
