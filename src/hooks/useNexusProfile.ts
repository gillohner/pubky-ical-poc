"use client";

/**
 * useNexusProfile Hook
 *
 * React Query hook for fetching profile data from Nexus API
 * Provides automatic caching, background refetching, and error handling
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getResolvedProfile } from "@/services/profile-service";
import type { ResolvedProfile } from "@/types/profile";

interface UseNexusProfileOptions {
  /**
   * Whether to fetch the profile data
   */
  enabled?: boolean;
}

/**
 * Hook to fetch user profile data using React Query
 *
 * @param publicKey - The user's public key (null to skip fetching)
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const { data: profile, isLoading, error } = useNexusProfile(user?.publicKey);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <div>Error loading profile</div>;
 * return <div>{profile?.name}</div>;
 * ```
 */
export function useNexusProfile(
  publicKey: string | null | undefined,
  options?: UseNexusProfileOptions,
): UseQueryResult<ResolvedProfile | null, Error> {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: ["profile", publicKey],
    queryFn: async () => {
      if (!publicKey) return null;
      return await getResolvedProfile(publicKey);
    },
    enabled: enabled && !!publicKey,
    // Profile data is fairly stable, cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    // Keep in cache for 30 minutes even if unused
    gcTime: 30 * 60 * 1000,
  });
}
