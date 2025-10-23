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

import { logger } from "@/lib/logger";

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
  logger.service("profile", "Fetching from Nexus", { publicKey });

  try {
    const bootstrap = await nexusClient.getBootstrap(publicKey);

    if (bootstrap && bootstrap.users.length > 0) {
      const nexusUser = bootstrap.users.find((u) => u.details.id === publicKey);

      if (nexusUser) {
        logger.service("profile", "Found in Nexus", {
          name: nexusUser.details.name,
          hasImage: !!nexusUser.details.image,
        });

        return {
          name: nexusUser.details.name,
          bio: nexusUser.details.bio,
          image: nexusUser.details.image,
          links: nexusUser.details.links,
        };
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
    if (error instanceof AppError) throw error;

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
 * @returns Image URL for display, or null
 */
export async function resolveImageUrl(
  imageUri: string | undefined,
): Promise<string | null> {
  if (!imageUri) return null;

  logger.service("image", "Resolving image", { imageUri: imageUri.substring(0, 50) });

  try {
    // Handle Nexus file URIs
    if (imageUri.startsWith("pubky://") && imageUri.includes("/files/")) {
      const files = await nexusClient.getFilesByIds([imageUri]);

      if (files && files.length > 0) {
        const imageUrl = nexusClient.getFileImageUrl(files[0], "small");
        if (imageUrl) {
          logger.service("image", "Resolved from Nexus", { imageUrl });
          return imageUrl;
        }
      }
    }

    // For http(s) URLs, return as-is
    if (imageUri.startsWith("http://") || imageUri.startsWith("https://")) {
      return imageUri;
    }

    logger.debug("Could not resolve image URI", { imageUri });
    return null;
  } catch (error) {
    logger.error("Image resolve error", { imageUri, error });
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
  logger.service("profile", "Getting resolved profile", { publicKey });

  try {
    const profile = await fetchProfileData(publicKey);

    // Resolve image URL if present (don't throw on image errors)
    let imageUrl: string | null = null;
    try {
      imageUrl = await resolveImageUrl(profile.image);
    } catch (error) {
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
    // If profile not found, return null
    if (error instanceof AppError && error.code === ErrorCode.NEXUS_NOT_FOUND) {
      return null;
    }
    throw error;
  }
}
