/**
 * Calendar Image Utilities
 *
 * Handles fetching and resolving calendar images from Nexus
 */

import { NexusClient } from "@/lib/nexus-client";
import { extractFileId } from "@/utils/pubky-uri";
import { logger } from "@/lib/logger";

/**
 * Resolve calendar image URL from Nexus
 *
 * @param imageUri - The image URI from calendar (e.g., pubky://user/pub/pubky.app/files/abc123)
 * @param size - Image size variant (default: "main" for calendar banners)
 * @returns Image URL or null if not found/failed
 */
export async function resolveCalendarImageUrl(
  imageUri: string | null | undefined,
  size: "small" | "feed" | "main" = "main",
): Promise<string | null> {
  if (!imageUri) return null;

  try {
    const fileId = extractFileId(imageUri);
    if (!fileId) {
      logger.warn("Invalid file URI format", { imageUri });
      return null;
    }

    const nexusClient = NexusClient.getInstance();
    const files = await nexusClient.getFilesByIds([imageUri]);

    if (!files || files.length === 0) {
      logger.debug("Calendar image not found in Nexus", { imageUri });
      return null;
    }

    const imageUrl = nexusClient.getFileImageUrl(files[0], size);
    if (imageUrl) {
      logger.service("image", "Resolved calendar image", { imageUrl });
    }

    return imageUrl;
  } catch (error) {
    logger.error("Failed to resolve calendar image", { imageUri, error });
    return null;
  }
}

/**
 * React hook for resolving calendar images
 */
import { useEffect, useState } from "react";

export function useCalendarImage(
  imageUri: string | null | undefined,
): {
  imageUrl: string | null;
  isLoading: boolean;
} {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!imageUri) {
      setImageUrl(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    resolveCalendarImageUrl(imageUri)
      .then((url) => {
        if (mounted) {
          setImageUrl(url);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (mounted) {
          logger.error("Error in useCalendarImage hook", { error });
          setImageUrl(null);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [imageUri]);

  return { imageUrl, isLoading };
}
