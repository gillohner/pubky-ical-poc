/**
 * Calendar Image Utilities
 *
 * Handles fetching and resolving calendar images from Nexus
 */

import { NexusClient } from "@/lib/nexus-client";

/**
 * Resolve calendar image URL from Nexus
 *
 * @param imageUri - The image URI from calendar (e.g., pubky://user/pub/pubky.app/files/abc123)
 * @param publicKey - The user's public key
 * @param size - Image size variant (default: "main" for calendar banners)
 * @returns Image URL or null if not found/failed
 */
export async function resolveCalendarImageUrl(
  imageUri: string | null | undefined,
  publicKey: string,
  size: "small" | "feed" | "main" = "main",
): Promise<string | null> {
  if (!imageUri) {
    return null;
  }

  try {
    const nexusClient = new NexusClient();

    // Extract file ID from URI
    // Format: pubky://publickey/pub/pubky.app/files/FILE_ID
    const parts = imageUri.split("/");
    const fileId = parts[parts.length - 1];

    if (!fileId) {
      throw new Error("Invalid file URI format");
    }

    // Fetch file metadata from Nexus
    const files = await nexusClient.getFiles(publicKey, [fileId]);

    if (!files || files.length === 0) {
      console.warn("Calendar image file not found in Nexus:", imageUri);
      return null;
    }

    // Get image URL from Nexus
    const imageUrl = nexusClient.getFileImageUrl(files[0], size);

    if (imageUrl) {
      console.log("✅ Resolved calendar image:", imageUrl);
      return imageUrl;
    }

    return null;
  } catch (error) {
    // Only log in development to avoid noise
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to resolve calendar image:", imageUri, error);
    }

    // Silently return null - this is expected when image doesn't exist yet
    // or when Nexus hasn't indexed it yet
    return null;
  }
}

/**
 * Hook-friendly version for use in React components
 */
export function useCalendarImage(
  imageUri: string | null | undefined,
  publicKey: string,
): {
  imageUrl: string | null;
  isLoading: boolean;
} {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!imageUri) {
      setImageUrl(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    resolveCalendarImageUrl(imageUri, publicKey)
      .then((url) => {
        if (mounted) {
          setImageUrl(url);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        // Catch any unhandled promise rejections
        if (mounted) {
          console.warn("Error in useCalendarImage:", error);
          setImageUrl(null);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [imageUri, publicKey]);

  return { imageUrl, isLoading };
}

// Note: Import React for the hook
import React from "react";
