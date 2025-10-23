/**
 * Avatar utility functions
 */

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
  if (publicKey.length <= maxLength) return publicKey;
  return `${publicKey.substring(0, maxLength)}...`;
}

/**
 * Get the bio for a user (with fallback to empty string)
 */
export function getBio(bio: string | undefined): string {
  return bio || "";
}
