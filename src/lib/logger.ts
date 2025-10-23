/**
 * Centralized logging utility
 * 
 * Provides consistent logging throughout the application with:
 * - Environment-aware behavior (dev-only logs)
 * - Type-safe log levels
 * - Service-specific formatting
 * - Easy integration with external logging services (Sentry, LogRocket)
 */

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isClient = typeof window !== "undefined";

  /**
   * Log debug information (development only)
   */
  debug(message: string, data?: unknown) {
    if (this.isDevelopment && this.isClient) {
      console.log(`🐛 DEBUG: ${message}`, data);
    }
  }

  /**
   * Log informational messages (development only)
   */
  info(message: string, data?: unknown) {
    if (this.isDevelopment && this.isClient) {
      console.log(`ℹ️ INFO: ${message}`, data);
    }
  }

  /**
   * Log warnings (always logged)
   */
  warn(message: string, data?: unknown) {
    if (this.isClient) {
      console.warn(`⚠️ WARNING: ${message}`, data);
    }
  }

  /**
   * Log errors (always logged)
   */
  error(message: string, error?: unknown) {
    if (this.isClient) {
      console.error(`❌ ERROR: ${message}`, error);
    }
  }

  /**
   * Service-specific logging with emoji prefixes
   * 
   * @param service - Service name (e.g., "profile", "calendar", "auth")
   * @param message - Log message
   * @param data - Additional data
   */
  service(service: string, message: string, data?: unknown) {
    const emoji = this.getServiceEmoji(service);
    if (this.isDevelopment && this.isClient) {
      console.log(`${emoji} ${service.toUpperCase()}: ${message}`, data);
    }
  }

  private getServiceEmoji(service: string): string {
    const emojiMap: Record<string, string> = {
      profile: "👤",
      calendar: "📅",
      event: "🎉",
      auth: "🔐",
      image: "🖼️",
      api: "🌐",
      storage: "💾",
      nexus: "🔄",
    };
    return emojiMap[service.toLowerCase()] || "📋";
  }
}

// Export singleton instance
export const logger = new Logger();
