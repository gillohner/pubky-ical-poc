/**
 * Nexus API Client
 *
 * Handles all requests to the Pubky Nexus API
 * 
 * 🔄 HOMESERVER TODO: Many methods in this file interact with Nexus for indexed data.
 * When implementing direct homeserver integration, consider:
 * - Using homeserver for direct calendar/event reads (bypassing Nexus indexing delay)
 * - Keeping Nexus for discovery, search, and cross-user data
 * - Profile data should continue using Nexus as the source of truth
 */

import { getAppConfig } from "./config";
import type {
  NexusBootstrapResponse,
  NexusFile,
  NexusFileUrls,
  ParsedNexusFile,
} from "@/types/nexus";

export class NexusClient {
  private static instance: NexusClient;
  private baseUrl: string;

  private constructor() {
    const config = getAppConfig();
    this.baseUrl = config.nexusApiUrl;
  }

  public static getInstance(): NexusClient {
    if (!NexusClient.instance) {
      NexusClient.instance = new NexusClient();
    }
    return NexusClient.instance;
  }

  /**
   * Fetch bootstrap data for a given public key
   * 
   * 🔄 HOMESERVER TODO: Bootstrap data is indexed by Nexus. Consider:
   * - Using this for initial page load and discovery
   * - Fetching individual items from homeserver for real-time updates
   */
  public async getBootstrap(
    publicKey: string,
  ): Promise<NexusBootstrapResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v0/bootstrap/${publicKey}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        console.error(
          `Nexus bootstrap error: ${response.status} for ${publicKey}`,
        );
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Nexus bootstrap fetch error:", error);
      return null;
    }
  }

  /**
   * Fetch file metadata by URIs
   * 
   * 🔄 HOMESERVER TODO: File metadata can be fetched directly from homeserver
   * once uploaded. Use Nexus for:
   * - Serving optimized image variants (small, feed, main)
   * - Files from other users that may not be directly accessible
   */
  public async getFilesByIds(uris: string[]): Promise<NexusFile[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v0/files/by_ids`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris }),
      });

      if (!response.ok) {
        console.error(`Nexus files error: ${response.status}`);
        return null;
      }

      const files: NexusFile[] = await response.json();
      return files;
    } catch (error) {
      console.error("Nexus files fetch error:", error);
      return null;
    }
  }

  /**
   * Get image URL for a file with specified size
   * @param file Nexus file metadata
   * @param size 'small' | 'feed' | 'main' - defaults to 'small' for profiles
   */
  public getFileImageUrl(
    file: NexusFile | ParsedNexusFile,
    size: "small" | "feed" | "main" = "small",
  ): string | null {
    try {
      let urls: NexusFileUrls;

      if (typeof file.urls === "string") {
        urls = JSON.parse(file.urls) as NexusFileUrls;
      } else {
        urls = file.urls;
      }

      const path = urls[size] || urls.main || urls.feed || urls.small;
      if (!path) return null;

      return `${this.baseUrl}/static/files/${path}`;
    } catch (error) {
      console.error("Error parsing file URLs:", error);
      return null;
    }
  }

  /**
   * Parse a Nexus file's URL JSON string
   */
  public parseFileUrls(file: NexusFile): ParsedNexusFile {
    try {
      const urls = JSON.parse(file.urls) as NexusFileUrls;
      return { ...file, urls };
    } catch (error) {
      console.error("Error parsing file URLs:", error);
      return { ...file, urls: {} };
    }
  }
}

// Export singleton instance
export const nexusClient = NexusClient.getInstance();
