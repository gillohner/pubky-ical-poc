/**
 * Nexus API Response Types
 *
 * Types for the Pubky Nexus API responses
 */

// Bootstrap response types
export interface NexusUser {
  details: {
    name?: string;
    bio?: string;
    id: string; // public key
    links?: Array<{ title?: string; url: string }>;
    status?: string | null;
    image?: string; // URI to file
    indexed_at: number;
  };
  counts: {
    tagged: number;
    tags: number;
    unique_tags: number;
    posts: number;
    replies: number;
    following: number;
    followers: number;
    friends: number;
    bookmarks: number;
  };
  tags: Array<{
    label: string;
    taggers: string[];
    taggers_count: number;
    relationship: boolean;
  }>;
  relationship: {
    following: boolean;
    followed_by: boolean;
    muted: boolean;
  };
}

export interface NexusBootstrapResponse {
  users: NexusUser[];
  posts: any[]; // Can be typed more specifically if needed
  list: {
    stream: string[];
    influencers: string[];
    recommended: string[];
    hot_tags: any[];
  };
}

// File response types
export interface NexusFile {
  id: string;
  uri: string;
  owner_id: string;
  indexed_at: number;
  created_at: number;
  src: string; // pubky:// URI to blob
  name?: string;
  size?: number;
  content_type?: string;
  urls: string; // JSON string with main, feed, small
  metadata?: string | null;
}

export interface NexusFileUrls {
  main?: string;
  feed?: string;
  small?: string;
}

export interface NexusFileResponse {
  files: NexusFile[];
}

// Helper type for parsed file URLs
export interface ParsedNexusFile extends Omit<NexusFile, "urls"> {
  urls: NexusFileUrls;
}
