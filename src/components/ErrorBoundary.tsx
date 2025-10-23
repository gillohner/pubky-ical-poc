"use client";

import React, { Component, ReactNode } from "react";
import { AppError, ErrorCode, isAppError } from "@/types/errors";
import { logError, logFatal } from "@/lib/error-logger";
import { Button } from "@/components/ui/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | AppError | null;
}

/**
 * Global Error Boundary Component
 *
 * Catches errors in the component tree and displays a fallback UI.
 * Logs all errors to the error logger.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Determine severity
    const isFatal = this.isFatalError(error);

    // Log to error logger
    if (isFatal) {
      logFatal(error, {
        component: errorInfo.componentStack?.split("\n")[1]?.trim(),
        metadata: { errorInfo },
      });
    } else {
      logError(error, {
        component: errorInfo.componentStack?.split("\n")[1]?.trim(),
        metadata: { errorInfo },
      });
    }
  }

  /**
   * Determine if an error is fatal (requires full page reload)
   */
  private isFatalError(error: Error): boolean {
    if (isAppError(error)) {
      return [
        ErrorCode.AUTH_EXPIRED,
        ErrorCode.NEXUS_API_ERROR,
      ].includes(error.code);
    }

    // Check for critical errors by message patterns
    const message = error.message.toLowerCase();
    return (
      message.includes("chunk") ||
      message.includes("failed to fetch") ||
      message.includes("network")
    );
  }

  /**
   * Reset error state and call optional onReset callback
   */
  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  /**
   * Reload the page
   */
  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const isFatal = this.isFatalError(error!);
      const userMessage = isAppError(error)
        ? error.getUserMessage()
        : "Something went wrong. Please try again.";

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 space-y-4">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-neutral-100">
              {isFatal ? "Critical Error" : "Oops! Something went wrong"}
            </h2>

            {/* Message */}
            <p className="text-center text-neutral-600 dark:text-neutral-400">
              {userMessage}
            </p>

            {/* Error details (development only) */}
            {process.env.NODE_ENV === "development" && error && (
              <details className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded text-sm">
                <summary className="cursor-pointer font-semibold mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="overflow-auto text-xs">
                  {error.stack || error.message}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4">
              {isFatal
                ? (
                  <Button onClick={this.handleReload} className="w-full">
                    Reload Page
                  </Button>
                )
                : (
                  <>
                    <Button onClick={this.handleReset} className="w-full">
                      Try Again
                    </Button>
                    <Button
                      onClick={this.handleReload}
                      variant="outline"
                      className="w-full"
                    >
                      Reload Page
                    </Button>
                  </>
                )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
