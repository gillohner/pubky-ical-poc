import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncates a pubky URI to fit within available space
 * Shows the beginning and end of the URI with ellipsis in the middle
 * @param uri - The pubky URI to truncate
 * @param maxLength - Maximum length before truncation (default: 50)
 * @returns Truncated URI string
 */
export function truncatePubkyUri(uri: string, maxLength: number = 50): string {
  if (!uri || uri.length <= maxLength) {
    return uri;
  }

  // For pubky:// URIs, preserve the protocol and show meaningful parts
  if (uri.startsWith("pubky://")) {
    const protocol = "pubky://";
    const remainingLength = maxLength - protocol.length - 3; // 3 for "..."

    if (remainingLength < 10) {
      // If too short, just show protocol + first few chars
      return `${protocol}${
        uri.slice(
          protocol.length,
          protocol.length + Math.max(4, remainingLength),
        )
      }...`;
    }

    // Show first part and last part
    const firstPart = uri.slice(
      protocol.length,
      protocol.length + Math.floor(remainingLength / 2),
    );
    const lastPart = uri.slice(-Math.floor(remainingLength / 2));
    return `${protocol}${firstPart}...${lastPart}`;
  }

  // For other URIs, use standard truncation
  const firstPart = uri.slice(0, Math.floor(maxLength / 2));
  const lastPart = uri.slice(-Math.floor(maxLength / 2));
  return `${firstPart}...${lastPart}`;
}
