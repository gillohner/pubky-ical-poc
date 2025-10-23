/**
 * Standardized error types for the application
 */

export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",

  // API errors
  NEXUS_API_ERROR = "NEXUS_API_ERROR",
  NEXUS_NOT_FOUND = "NEXUS_NOT_FOUND",
  HOMESERVER_ERROR = "HOMESERVER_ERROR",

  // Auth errors
  AUTH_FAILED = "AUTH_FAILED",
  AUTH_EXPIRED = "AUTH_EXPIRED",
  UNAUTHORIZED = "UNAUTHORIZED",

  // Data errors
  INVALID_DATA = "INVALID_DATA",
  PARSE_ERROR = "PARSE_ERROR",
  NOT_FOUND = "NOT_FOUND",

  // Generic
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface AppErrorDetails {
  code: ErrorCode;
  message: string;
  details?: unknown;
  publicKey?: string;
  timestamp?: number;
}

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly publicKey?: string;
  public readonly timestamp: number;

  constructor(errorDetails: AppErrorDetails) {
    super(errorDetails.message);
    this.name = "AppError";
    this.code = errorDetails.code;
    this.details = errorDetails.details;
    this.publicKey = errorDetails.publicKey;
    this.timestamp = errorDetails.timestamp || Date.now();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Returns a user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case ErrorCode.NETWORK_ERROR:
        return "Unable to connect. Please check your internet connection.";
      case ErrorCode.TIMEOUT:
        return "Request timed out. Please try again.";
      case ErrorCode.NEXUS_API_ERROR:
        return "Unable to fetch data. Please try again later.";
      case ErrorCode.NEXUS_NOT_FOUND:
        return "Profile not found.";
      case ErrorCode.HOMESERVER_ERROR:
        return "Unable to save changes. Please try again.";
      case ErrorCode.AUTH_FAILED:
        return "Authentication failed. Please try logging in again.";
      case ErrorCode.AUTH_EXPIRED:
        return "Your session has expired. Please log in again.";
      case ErrorCode.UNAUTHORIZED:
        return "You don't have permission to access this resource.";
      case ErrorCode.INVALID_DATA:
        return "Invalid data received. Please refresh and try again.";
      case ErrorCode.PARSE_ERROR:
        return "Unable to process data. Please try again.";
      case ErrorCode.NOT_FOUND:
        return "Resource not found.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  /**
   * Converts the error to a plain object for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      publicKey: this.publicKey,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Helper to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Helper to convert any error to AppError
 */
export function toAppError(
  error: unknown,
  fallbackCode = ErrorCode.UNKNOWN_ERROR,
): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({
      code: fallbackCode,
      message: error.message,
      details: { originalError: error.name, stack: error.stack },
    });
  }

  return new AppError({
    code: fallbackCode,
    message: String(error),
    details: { originalError: error },
  });
}
