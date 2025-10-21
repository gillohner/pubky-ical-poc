/**
 * Error logging utility
 *
 * Centralized error logging that can be easily extended to use
 * external services (Sentry, LogRocket, etc.)
 */

import { AppError, ErrorCode, isAppError } from "@/types/errors";

export interface ErrorLogContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * Log an error with context
   */
  logError(
    error: Error | AppError,
    context?: ErrorLogContext,
    level: LogLevel = LogLevel.ERROR,
  ) {
    const errorData = this.formatError(error, context);

    // Console logging (always in development, conditional in production)
    if (this.isDevelopment || level === LogLevel.FATAL) {
      this.logToConsole(errorData, level);
    }

    // TODO: Send to external logging service in production
    // Example: Sentry.captureException(error, { contexts: { custom: errorData } });

    // Store in local storage for debugging (development only)
    if (this.isDevelopment) {
      this.storeErrorLocally(errorData);
    }
  }

  /**
   * Log an info message
   */
  logInfo(message: string, context?: ErrorLogContext) {
    if (this.isDevelopment) {
      console.log(`ℹ️ INFO: ${message}`, context);
    }
  }

  /**
   * Log a warning
   */
  logWarning(message: string, context?: ErrorLogContext) {
    if (this.isDevelopment) {
      console.warn(`⚠️ WARNING: ${message}`, context);
    }
    // TODO: Send warnings to logging service
  }

  /**
   * Format error for logging
   */
  private formatError(error: Error | AppError, context?: ErrorLogContext) {
    const baseData = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      context,
    };

    if (isAppError(error)) {
      return {
        ...baseData,
        type: "AppError",
        code: error.code,
        details: error.details,
        publicKey: error.publicKey,
        userMessage: error.getUserMessage(),
      };
    }

    return {
      ...baseData,
      type: error.name || "Error",
    };
  }

  /**
   * Log to console with appropriate level
   */
  private logToConsole(errorData: unknown, level: LogLevel) {
    const prefix = this.getLogPrefix(level);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, errorData);
        break;
      case LogLevel.INFO:
        console.info(prefix, errorData);
        break;
      case LogLevel.WARN:
        console.warn(prefix, errorData);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, errorData);
        break;
    }
  }

  /**
   * Get log prefix emoji
   */
  private getLogPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "🐛 DEBUG:";
      case LogLevel.INFO:
        return "ℹ️ INFO:";
      case LogLevel.WARN:
        return "⚠️ WARNING:";
      case LogLevel.ERROR:
        return "❌ ERROR:";
      case LogLevel.FATAL:
        return "💀 FATAL:";
    }
  }

  /**
   * Store error in localStorage for debugging (development only)
   */
  private storeErrorLocally(errorData: unknown) {
    try {
      const key = "app-error-log";
      const existing = localStorage.getItem(key);
      const logs = existing ? JSON.parse(existing) : [];

      logs.push(errorData);

      // Keep only last 50 errors
      if (logs.length > 50) {
        logs.shift();
      }

      localStorage.setItem(key, JSON.stringify(logs));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }

  /**
   * Get stored error logs (development only)
   */
  getStoredErrors(): unknown[] {
    if (!this.isDevelopment) return [];

    try {
      const key = "app-error-log";
      const existing = localStorage.getItem(key);
      return existing ? JSON.parse(existing) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear stored error logs
   */
  clearStoredErrors() {
    try {
      localStorage.removeItem("app-error-log");
    } catch {
      // Silently fail
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

/**
 * Helper functions for common logging patterns
 */

export function logError(error: Error | AppError, context?: ErrorLogContext) {
  errorLogger.logError(error, context, LogLevel.ERROR);
}

export function logFatal(error: Error | AppError, context?: ErrorLogContext) {
  errorLogger.logError(error, context, LogLevel.FATAL);
}

export function logWarning(message: string, context?: ErrorLogContext) {
  errorLogger.logWarning(message, context);
}

export function logInfo(message: string, context?: ErrorLogContext) {
  errorLogger.logInfo(message, context);
}
