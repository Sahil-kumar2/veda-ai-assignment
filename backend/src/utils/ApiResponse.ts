/**
 * ApiResponse - Standard success response shape.
 *
 * Ensures every successful API response has a consistent structure
 * that the frontend can reliably consume.
 *
 * Usage:
 *   res.status(200).json(new ApiResponse(200, "Fetched", data));
 */
export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T;

  constructor(statusCode: number, message: string, data: T) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}
