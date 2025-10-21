/**
 * useProfile Hook
 *
 * React hook for fetching and managing profile data.
 * Handles loading states, caching, and cleanup.
 */

import { useEffect, useRef, useState } from "react";
import { getResolvedProfile } from "@/services/profile-service";
import type { ResolvedProfile } from "@/types/profile";

interface UseProfileOptions {
  /**
   * Enable automatic fetching on mount and when publicKey changes
   * @default true
   */
  enabled?: boolean;

  /**
   * Cache resolved profiles in session storage
   * @default true
   */
  cacheInSession?: boolean;
}

interface UseProfileReturn {
  profile: ResolvedProfile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage user profile data
 *
 * @param publicKey - The user's public key (null to skip fetching)
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const { profile, isLoading } = useProfile(user?.publicKey);
 *
 * if (isLoading) return <Spinner />;
 * return <div>{profile?.name}</div>;
 * ```
 */
export function useProfile(
  publicKey: string | null | undefined,
  options: UseProfileOptions = {},
): UseProfileReturn {
  const { enabled = true, cacheInSession = true } = options;

  const [profile, setProfile] = useState<ResolvedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track the current request to prevent race conditions
  const currentRequestRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const fetchProfile = async (pk: string) => {
    // Set this as the current request
    const requestId = `${pk}-${Date.now()}`;
    currentRequestRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      // Check session cache first
      if (cacheInSession) {
        const cached = sessionStorage.getItem(`profile-cache-${pk}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as ResolvedProfile;
            console.log("👤 HOOK: Using cached profile for:", pk);

            // Only update if this is still the current request
            if (currentRequestRef.current === requestId && mountedRef.current) {
              setProfile(parsed);
              setIsLoading(false);
            }
            return;
          } catch {
            // Invalid cache, continue to fetch
          }
        }
      }

      // Fetch from service
      const resolved = await getResolvedProfile(pk);

      // Only update if this is still the current request and component is mounted
      if (currentRequestRef.current !== requestId || !mountedRef.current) {
        console.log("👤 HOOK: Request cancelled or component unmounted");
        return;
      }

      if (resolved) {
        setProfile(resolved);

        // Cache in session storage
        if (cacheInSession) {
          try {
            sessionStorage.setItem(
              `profile-cache-${pk}`,
              JSON.stringify(resolved),
            );
          } catch {
            // Session storage quota exceeded, ignore
          }
        }
      } else {
        setProfile(null);
        setError(new Error("Profile not found"));
      }
    } catch (err) {
      if (currentRequestRef.current === requestId && mountedRef.current) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setProfile(null);
      }
    } finally {
      if (currentRequestRef.current === requestId && mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !publicKey) {
      setProfile(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    fetchProfile(publicKey);

    return () => {
      mountedRef.current = false;
      currentRequestRef.current = null;
    };
  }, [publicKey, enabled, cacheInSession]);

  const refetch = async () => {
    if (publicKey) {
      await fetchProfile(publicKey);
    }
  };

  return { profile, isLoading, error, refetch };
}




