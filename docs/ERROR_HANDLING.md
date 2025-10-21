# Error Handling Guide

## Overview

Calky uses a standardized error handling system with proper error types,
logging, and user-friendly error boundaries. This ensures consistent error
handling across the application and makes debugging easier.

## Error Architecture

```
Component throws error
    ↓
Error Boundary catches it
    ↓
Error Logger logs it
    ↓
User sees friendly message
```

## Error Types

### AppError Class

All application errors use the `AppError` class from `@/types/errors`:

```typescript
import { AppError, ErrorCode } from "@/types/errors";

throw new AppError({
  code: ErrorCode.NEXUS_API_ERROR,
  message: "Failed to fetch profile",
  details: originalError,
  publicKey: "user123",
});
```

### Error Codes

```typescript
enum ErrorCode {
  // Network
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",

  // API
  NEXUS_API_ERROR = "NEXUS_API_ERROR",
  NEXUS_NOT_FOUND = "NEXUS_NOT_FOUND",
  HOMESERVER_ERROR = "HOMESERVER_ERROR",

  // Auth
  AUTH_FAILED = "AUTH_FAILED",
  AUTH_EXPIRED = "AUTH_EXPIRED",
  UNAUTHORIZED = "UNAUTHORIZED",

  // Data
  INVALID_DATA = "INVALID_DATA",
  PARSE_ERROR = "PARSE_ERROR",

  // Generic
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}
```

## Error Boundaries

### Global Error Boundary

The root layout wraps the entire app in an `ErrorBoundary`:

```typescript
// src/app/layout.tsx
<ErrorBoundary>
  <QueryProvider>
    <TopNav />
    <main>{children}</main>
  </QueryProvider>
</ErrorBoundary>;
```

This catches all unhandled errors and displays a user-friendly fallback UI.

### Component-Level Error Boundaries

For specific components that need custom error handling:

```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

function MyPage() {
  return (
    <ErrorBoundary
      fallback={<div>Failed to load this section. Please refresh.</div>}
    >
      <CriticalComponent />
    </ErrorBoundary>
  );
}
```

### HOC Pattern

Wrap components with error boundaries using the HOC:

```typescript
import { withErrorBoundary } from "@/components/ErrorBoundary";

const SafeComponent = withErrorBoundary(MyComponent);
```

## Error Logging

### Logging Functions

Use the error logger from `@/lib/error-logger`:

```typescript
import { logError, logInfo, logWarning } from "@/lib/error-logger";

// Log an error
try {
  await riskyOperation();
} catch (error) {
  logError(error, {
    component: "ProfileCard",
    action: "fetchProfile",
    userId: publicKey,
  });
  throw error; // Or handle gracefully
}

// Log a warning
logWarning("Profile image not found", {
  userId: publicKey,
  metadata: { imageUri },
});

// Log info (development only)
logInfo("Profile loaded successfully", {
  userId: publicKey,
});
```

### Log Context

Always provide context when logging:

```typescript
interface ErrorLogContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}
```

### Development vs Production

- **Development**: All logs go to console and localStorage
- **Production**: Only errors/fatals are logged (ready for external service)

### Viewing Stored Errors (Development)

```typescript
import { errorLogger } from "@/lib/error-logger";

// In browser console
const errors = errorLogger.getStoredErrors();
console.table(errors);

// Clear errors
errorLogger.clearStoredErrors();
```

## Service Layer Error Handling

Services throw `AppError` instead of returning null:

```typescript
// ❌ OLD: Return null
export async function fetchProfile(publicKey: string): Promise<Profile | null> {
  try {
    const data = await api.get(publicKey);
    return data;
  } catch {
    return null; // Silent failure
  }
}

// ✅ NEW: Throw AppError
export async function fetchProfile(publicKey: string): Promise<Profile> {
  try {
    const data = await api.get(publicKey);
    return data;
  } catch (error) {
    const appError = new AppError({
      code: ErrorCode.NEXUS_API_ERROR,
      message: "Failed to fetch profile",
      details: error,
      publicKey,
    });

    logError(appError, {
      action: "fetchProfile",
      userId: publicKey,
    });

    throw appError;
  }
}
```

### Partial Failures

For operations where some failures are acceptable (like image loading):

```typescript
export async function getResolvedProfile(publicKey: string) {
  // Fetch profile (must succeed)
  const profile = await fetchProfileData(publicKey);

  // Fetch image (can fail)
  let imageUrl: string | null = null;
  try {
    imageUrl = await resolveImageUrl(profile.image);
  } catch (error) {
    // Log but don't throw - profile can still be used
    logWarning("Failed to resolve image", {
      userId: publicKey,
      metadata: { error },
    });
  }

  return { ...profile, imageUrl };
}
```

## Component Error Handling

### React Query Hook Errors

React Query automatically handles errors:

```typescript
function ProfileCard({ publicKey }: { publicKey: string }) {
  const { data: profile, error, isError } = useNexusProfile(publicKey);

  if (isError) {
    // Error is automatically logged by React Query
    const userMessage = error instanceof AppError
      ? error.getUserMessage()
      : "Failed to load profile";

    return <ErrorState message={userMessage} />;
  }

  return <div>{profile.name}</div>;
}
```

### Manual Error Handling

For non-React Query operations:

```typescript
import { toast } from "sonner";
import { isAppError } from "@/types/errors";

async function handleAction() {
  try {
    await performAction();
    toast.success("Action completed");
  } catch (error) {
    const message = isAppError(error)
      ? error.getUserMessage()
      : "An unexpected error occurred";

    toast.error(message);

    // Error is already logged by the service layer
  }
}
```

## User-Friendly Error Messages

### AppError.getUserMessage()

All `AppError` instances have user-friendly messages:

```typescript
const error = new AppError({
  code: ErrorCode.NETWORK_ERROR,
  message: "fetch failed: timeout",
});

console.log(error.message); // Technical: "fetch failed: timeout"
console.log(error.getUserMessage()); // User-friendly: "Unable to connect. Please check your internet connection."
```

### Custom Messages

Override default messages for specific contexts:

```typescript
if (isError) {
  const customMessage = error.code === ErrorCode.NEXUS_NOT_FOUND
    ? "This user doesn't exist"
    : error.getUserMessage();

  return <ErrorState message={customMessage} />;
}
```

## Error Boundary UI

The global error boundary shows:

### Non-Fatal Errors

- Icon
- "Oops! Something went wrong"
- User-friendly message
- "Try Again" button
- "Reload Page" button (secondary)
- Error details (development only)

### Fatal Errors

- Icon
- "Critical Error"
- User-friendly message
- "Reload Page" button only
- Error details (development only)

### Fatal Error Detection

Errors are considered fatal if:

- `ErrorCode` is `AUTH_EXPIRED` or `NEXUS_API_ERROR`
- Message contains "chunk", "failed to fetch", or "network"

## Best Practices

### 1. Always Provide Context

```typescript
// ❌ Bad
logError(error);

// ✅ Good
logError(error, {
  component: "ProfileCard",
  action: "loadProfile",
  userId: publicKey,
  metadata: { imageUri },
});
```

### 2. Use Specific Error Codes

```typescript
// ❌ Bad
throw new AppError({
  code: ErrorCode.UNKNOWN_ERROR,
  message: "Something went wrong",
});

// ✅ Good
throw new AppError({
  code: ErrorCode.NEXUS_NOT_FOUND,
  message: `Profile not found for publicKey: ${publicKey}`,
  publicKey,
});
```

### 3. Don't Swallow Errors

```typescript
// ❌ Bad
try {
  await fetchProfile();
} catch {
  // Silent failure
}

// ✅ Good
try {
  await fetchProfile();
} catch (error) {
  logError(error, { action: "fetchProfile" });
  throw error; // Or handle gracefully with user feedback
}
```

### 4. Log Before Throwing

Services should log errors before throwing:

```typescript
export async function fetchData() {
  try {
    return await api.get();
  } catch (error) {
    const appError = toAppError(error);
    logError(appError, { action: "fetchData" }); // Log it
    throw appError; // Then throw it
  }
}
```

### 5. Show User Feedback

Always provide user feedback for errors:

```typescript
// ❌ Bad
try {
  await saveProfile();
} catch (error) {
  logError(error);
  // User sees nothing
}

// ✅ Good
try {
  await saveProfile();
  toast.success("Profile saved");
} catch (error) {
  logError(error);
  toast.error(isAppError(error) ? error.getUserMessage() : "Failed to save");
}
```

## Testing Error Handling

### Unit Tests

```typescript
import { AppError, ErrorCode } from "@/types/errors";

describe("fetchProfileData", () => {
  it("throws AppError on API failure", async () => {
    // Mock API to fail
    mockApi.getBootstrap.mockRejectedValue(new Error("Network error"));

    await expect(fetchProfileData("pk123")).rejects.toThrow(AppError);
    await expect(fetchProfileData("pk123")).rejects.toMatchObject({
      code: ErrorCode.NEXUS_API_ERROR,
    });
  });

  it("throws NEXUS_NOT_FOUND when profile doesn't exist", async () => {
    mockApi.getBootstrap.mockResolvedValue({ users: [] });

    await expect(fetchProfileData("pk123")).rejects.toMatchObject({
      code: ErrorCode.NEXUS_NOT_FOUND,
    });
  });
});
```

### Component Tests

```typescript
import { render, screen } from "@testing-library/react";
import { AppError, ErrorCode } from "@/types/errors";

test("displays error message when profile fails to load", () => {
  const error = new AppError({
    code: ErrorCode.NEXUS_API_ERROR,
    message: "Failed to fetch",
  });

  jest.spyOn(hooks, "useNexusProfile").mockReturnValue({
    data: null,
    error,
    isError: true,
  });

  render(<ProfileCard publicKey="pk123" />);

  expect(screen.getByText(/unable to fetch data/i)).toBeInTheDocument();
});
```

### Error Boundary Tests

```typescript
test("error boundary catches component errors", () => {
  const ThrowError = () => {
    throw new Error("Test error");
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>,
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## Integration with External Services

### Ready for Sentry/LogRocket

The error logger is ready to integrate with external services:

```typescript
// src/lib/error-logger.ts

class ErrorLogger {
  logError(error: Error, context?: ErrorLogContext) {
    // Console logging
    this.logToConsole(errorData, level);

    // TODO: Add Sentry integration
    if (typeof window !== "undefined" && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: { custom: errorData },
        tags: {
          component: context?.component,
          action: context?.action,
        },
      });
    }

    // TODO: Add LogRocket integration
    if (typeof window !== "undefined" && window.LogRocket) {
      window.LogRocket.captureException(error, {
        tags: { ...context },
      });
    }
  }
}
```

## Summary

- ✅ Use `AppError` for all application errors
- ✅ Provide specific `ErrorCode` values
- ✅ Log errors with context before throwing
- ✅ Use `ErrorBoundary` to catch unhandled errors
- ✅ Show user-friendly messages with `getUserMessage()`
- ✅ Don't swallow errors silently
- ✅ Always provide user feedback (toasts, error states)
- ✅ Ready for external logging service integration
