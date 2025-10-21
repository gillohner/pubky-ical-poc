/**
 * Avatar utility functions
 *
 * Helpers for managing avatar URLs and cleanup
 */

/**
 * Revoke a blob URL and clean up session storage
 *
 * @param storageKey - The session storage key containing the blob URL
 */
export function cleanupAvatarUrl(storageKey: string = "pubky-avatar-url") {
  try {
    const url = sessionStorage.getItem(storageKey);
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
    sessionStorage.removeItem(storageKey);
  } catch {
    // Ignore errors
  }
}

/**
 * Store an avatar URL in session storage
 *
 * @param url - The blob URL to store
 * @param storageKey - The session storage key
 */
export function storeAvatarUrl(
  url: string,
  storageKey: string = "pubky-avatar-url",
) {
  try {
    sessionStorage.setItem(storageKey, url);
  } catch {
    // Session storage quota exceeded, ignore
  }
}

/**
 * Get the display name for a user
 * Prefers name, falls back to truncated public key
 *
 * @param name - The user's display name
 * @param publicKey - The user's public key
 * @param maxLength - Maximum length for public key truncation
 * @returns Display name string
 */
export function getDisplayName(
  name: string | undefined,
  publicKey: string,
  maxLength: number = 12,
): string {
  if (name) return name;

  // Truncate public key for display
  if (publicKey.length <= maxLength) return publicKey;
  return `${publicKey.substring(0, maxLength)}...`;
}




