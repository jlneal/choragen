import { HttpStatus } from "./http-status.js";

/**
 * Structured API error for consistent error responses
 */
export class ApiError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    options?: {
      code?: string;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = options?.code;
    this.details = options?.details;
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }

  static badRequest(message: string, details?: Record<string, unknown>) {
    return new ApiError(message, HttpStatus.BAD_REQUEST, { details });
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(message, HttpStatus.FORBIDDEN);
  }

  static notFound(message = "Not found") {
    return new ApiError(message, HttpStatus.NOT_FOUND);
  }

  static conflict(message: string, details?: Record<string, unknown>) {
    return new ApiError(message, HttpStatus.CONFLICT, { details });
  }

  static internal(message = "Internal server error", cause?: Error) {
    return new ApiError(message, HttpStatus.INTERNAL_SERVER_ERROR, { cause });
  }
}
