/**
 * Profile Service
 *
 * Abstract layer for fetching profile data from Nexus API.
 * Nexus is the required backend infrastructure for the app.
 */

import { nexusClient } from "@/lib/nexus-client";
import type { PubkyProfile, ResolvedProfile } from "@/types/profile";
import { AppError, ErrorCode, toAppError } from "@/types/errors";
import { logError, logWarning } from "@/lib/error-logger";

/**
 * Fetch raw profile data from Nexus API
 *
 * @param publicKey - The user's public key
 * @returns Profile data
 * @throws {AppError} If the request fails or profile not found
 */
export async function fetchProfileData(
  publicKey: string,
): Promise<PubkyProfile> {
  console.log("📋 SERVICE: Fetching profile from Nexus for:", publicKey);

  try {
    const bootstrap = await nexusClient.getBootstrap(publicKey);

    if (bootstrap && bootstrap.users.length > 0) {
      // Find the user in the bootstrap response
      const nexusUser = bootstrap.users.find((u) => u.details.id === publicKey);

      if (nexusUser) {
        console.log(
          "📋 SERVICE: Fetched from Nexus →",
          "name:",
          nexusUser.details.name,
          "hasImage:",
          !!nexusUser.details.image,
        );

        // Convert Nexus user format to PubkyProfile
        const profile: PubkyProfile = {
          name: nexusUser.details.name,
          bio: nexusUser.details.bio,
          image: nexusUser.details.image, // This is a URI to the file
          links: nexusUser.details.links,
        };

        return profile;
      }
    }

    // Profile not found
    const notFoundError = new AppError({
      code: ErrorCode.NEXUS_NOT_FOUND,
      message: `Profile not found for publicKey: ${publicKey}`,
      publicKey,
    });

    logWarning("Profile not found in Nexus", { userId: publicKey });
    throw notFoundError;
  } catch (error) {
    // If it's already an AppError, rethrow it
    if (error instanceof AppError) {
      throw error;
    }

    // Convert to AppError
    const appError = new AppError({
      code: ErrorCode.NEXUS_API_ERROR,
      message: "Failed to fetch profile from Nexus",
      details: error,
      publicKey,
    });

    logError(appError, {
      userId: publicKey,
      action: "fetchProfileData",
    });

    throw appError;
  }
}

/**
 * Resolve image URL from Nexus
 *
 * @param imageUri - The image URI from Nexus (file URI)
 * @param publicKey - The user's public key (for context)
 * @returns Image URL for display, or null
 */
export async function resolveImageUrl(
  imageUri: string | undefined,
  publicKey?: string,
): Promise<string | null> {
  if (!imageUri) return null;

  console.log("🖼️ SERVICE: Resolving image:", imageUri.substring(0, 50));

  try {
    // Handle Nexus file URIs
    if (imageUri.startsWith("pubky://") && imageUri.includes("/files/")) {
      console.log("🖼️ SERVICE: Fetching from Nexus files API");

      const files = await nexusClient.getFilesByIds([imageUri]);

      if (files && files.length > 0) {
        const file = files[0];
        const imageUrl = nexusClient.getFileImageUrl(file, "small");

        if (imageUrl) {
          console.log("🖼️ SERVICE: Got Nexus image URL");
          return imageUrl;
        }
      }
    }

    // For http(s) URLs (if any), return as-is
    if (imageUri.startsWith("http://") || imageUri.startsWith("https://")) {
      return imageUri;
    }

    console.log("🖼️ SERVICE: Could not resolve image URI");
    return null;
  } catch (error) {
    console.error("🖼️ SERVICE: Image resolve error:", error);
    return null;
  }
}

/**
 * Get a fully resolved profile ready for display
 * Fetches from Nexus API
 *
 * @param publicKey - The user's public key
 * @returns Resolved profile with displayable image URL, or null if not found
 * @throws {AppError} If the request fails (but not if profile doesn't exist)
 */
export async function getResolvedProfile(
  publicKey: string,
): Promise<ResolvedProfile | null> {
  console.log("👤 SERVICE: Getting resolved profile for:", publicKey);

  try {
    // Fetch raw profile data
    const profile = await fetchProfileData(publicKey);

    // Resolve image URL if present (don't throw on image errors)
    let imageUrl: string | null = null;
    try {
      imageUrl = await resolveImageUrl(profile.image, publicKey);
    } catch (error) {
      // Log but don't fail the whole profile fetch if image resolution fails
      logWarning("Failed to resolve image URL", {
        userId: publicKey,
        metadata: { imageUri: profile.image, error },
      });
    }

    // Normalize links
    const links = profile.links
      ? Array.isArray(profile.links)
        ? profile.links.filter(
          (link): link is { title?: string; url: string } =>
            typeof link === "object" && "url" in link,
        )
        : []
      : [];

    return {
      publicKey,
      name: profile.name,
      bio: profile.bio,
      links,
      imageUrl: imageUrl || undefined,
    };
  } catch (error) {
    // If profile not found, return null instead of throwing
    if (error instanceof AppError && error.code === ErrorCode.NEXUS_NOT_FOUND) {
      return null;
    }

    // Rethrow other errors
    throw error;
  }
}

/**
 * Cleans up any object URLs stored in sessionStorage for a given public key.
 * Should be called on logout or when a user's profile changes.
 * @param publicKey The public key of the user whose avatar URL should be revoked.
 */
export function cleanupAvatarUrl(publicKey: string) {
  // Note: With Nexus, we use direct URLs so no cleanup needed
  // But keep this for backward compatibility with blob: URLs
  console.log("🖼️ SERVICE: Cleanup called for", publicKey);
}
