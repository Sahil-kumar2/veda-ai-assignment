/**
 * ApiError - Custom error class for application-level HTTP errors.
 *
 * Extends the native Error so it works with instanceof checks in the
 * global error handler middleware.
 *
 * Usage:
 *   throw new ApiError(404, "Assignment not found");
 *   throw new ApiError(400, "Validation failed", ["title is required"]);
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors: string[] = [],
    stack?: string
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // Distinguish predictable API errors from unexpected crashes

    // Preserve the original stack trace if provided (useful for wrapping errors)
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
