/**
 * Centralized Nexus API Helper
 * 
 * Simple utility functions for constructing Nexus URLs and handling API calls.
 * Replaces complex hook-based approaches with direct functions.
 * 
 * HOMESERVER TODO: Functions marked with "🔄 HOMESERVER" need to be replaced
 * with direct homeserver calls once the homeserver integration is complete.
 */

import { getAppConfig } from "./config";

const config = getAppConfig();
const NEXUS_BASE = config.nexusApiUrl;

/**
 * Get Nexus image URL for a file
 * 
 * @param authorId - The author's public key
 * @param fileId - The file ID (last part of pubky:// URI)
 * @param size - Image size variant: "small" (profile pics), "feed" (thumbnails), "main" (full)
 * @returns Full Nexus image URL
 */
export function getNexusImageUrl(
  authorId: string,
  fileId: string,
  size: "small" | "feed" | "main" = "small"
): string {
  return `${NEXUS_BASE}/static/files/${authorId}/${fileId}/${size}`;
}

/**
 * Get Nexus profile URL
 * 
 * @param publicKey - The user's public key
 * @returns Full Nexus profile endpoint URL
 */
export function getNexusProfileUrl(publicKey: string): string {
  return `${NEXUS_BASE}/v0/profile/${publicKey}`;
}

/**
 * Get Pubky.app profile page URL
 * 
 * @param publicKey - The user's public key
 * @returns Full profile page URL
 */
export function getPubkyProfilePageUrl(publicKey: string): string {
  return `${config.pubkyProfileUrl}/${publicKey}`;
}

/**
 * Extract file ID from a pubky:// URI
 * 
 * @param uri - Full pubky URI like "pubky://user/pub/pubky.app/files/abc123"
 * @returns File ID or null if invalid
 */
export function extractFileId(uri: string | null | undefined): string | null {
  if (!uri) return null;
  
  const parts = uri.split("/");
  return parts[parts.length - 1] || null;
}

/**
 * Extract public key from a pubky:// URI
 * 
 * @param uri - Full pubky URI like "pubky://user/pub/pubky.app/files/abc123"
 * @returns Public key or null if invalid
 */
export function extractPublicKey(uri: string | null | undefined): string | null {
  if (!uri || !uri.startsWith("pubky://")) return null;
  
  const withoutProtocol = uri.replace("pubky://", "");
  const publicKey = withoutProtocol.split("/")[0];
  return publicKey || null;
}

/**
 * 🔄 HOMESERVER: Fetch data from homeserver
 * TODO: Replace with actual homeserver fetch implementation
 * 
 * @param uri - Full pubky:// URI to fetch
 * @returns Parsed data or null
 */
export async function fetchFromHomeserver<T>(uri: string): Promise<T | null> {
  console.warn("🔄 HOMESERVER FETCH:", uri);
  console.warn("TODO: Replace with actual homeserver fetch");
  
  // Temporary: Return null until homeserver integration is complete
  return null;
}

/**
 * 🔄 HOMESERVER: Save data to homeserver
 * TODO: Replace with actual homeserver save implementation
 * 
 * @param uri - Full pubky:// URI to save to
 * @param data - Data to save
 * @returns Success boolean
 */
export async function saveToHomeserver(uri: string, data: unknown): Promise<boolean> {
  console.warn("🔄 HOMESERVER SAVE:", uri);
  console.warn("TODO: Replace with actual homeserver save");
  
  // Temporary: Return false until homeserver integration is complete
  return false;
}

/**
 * 🔄 HOMESERVER: Delete data from homeserver
 * TODO: Replace with actual homeserver delete implementation
 * 
 * @param uri - Full pubky:// URI to delete
 * @returns Success boolean
 */
export async function deleteFromHomeserver(uri: string): Promise<boolean> {
  console.warn("🔄 HOMESERVER DELETE:", uri);
  console.warn("TODO: Replace with actual homeserver delete");
  
  // Temporary: Return false until homeserver integration is complete
  return false;
}

/**
 * Fetch profile data from Nexus
 * Uses Nexus as the source of truth for profile information
 * 
 * @param publicKey - The user's public key
 * @returns Profile data or null
 */
export async function fetchNexusProfile(publicKey: string): Promise<{
  name?: string;
  bio?: string;
  image?: string;
  links?: Array<{ title: string; url: string }>;
} | null> {
  try {
    const response = await fetch(getNexusProfileUrl(publicKey), {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Nexus profile error: ${response.status} for ${publicKey}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Nexus profile fetch error:", error);
    return null;
  }
}

/**
 * Fetch bootstrap data from Nexus for a user
 * Bootstrap contains calendars, events, and other user data indexed by Nexus
 * 
 * @param publicKey - The user's public key
 * @returns Bootstrap data or null
 */
export async function fetchNexusBootstrap(publicKey: string): Promise<unknown | null> {
  try {
    const response = await fetch(`${NEXUS_BASE}/v0/bootstrap/${publicKey}`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Nexus bootstrap error: ${response.status} for ${publicKey}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Nexus bootstrap fetch error:", error);
    return null;
  }
}
