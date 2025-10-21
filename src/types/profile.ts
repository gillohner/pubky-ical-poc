/**
 * Profile-related type definitions
 */

export interface PubkyProfile {
  name?: string;
  bio?: string;
  image?: string; // pubky://... or http(s) URL
  links?: Array<{ title?: string; url: string }> | string[];
}

export interface ResolvedProfile {
  publicKey: string;
  name?: string;
  bio?: string;
  imageUrl?: string; // Resolved blob URL for display
  links?: Array<{ title?: string; url: string }>;
}




