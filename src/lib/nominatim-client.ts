/**
 * Nominatim OSM API Client
 * For location search and geocoding
 */

import { AppError, ErrorCode } from "@/types/errors";
import { logError } from "@/lib/error-logger";

export interface NominatimResult {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  boundingbox?: string[];
}

export interface NominatimReverseResult {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

class NominatimClient {
  private baseUrl = "https://nominatim.openstreetmap.org";
  private userAgent = "Calky/1.0 (Pubky iCalendar App)";

  /**
   * Search for locations by query string
   */
  async search(query: string, limit = 5): Promise<NominatimResult[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          "User-Agent": this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      return data as NominatimResult[];
    } catch (error) {
      const appError = new AppError({
        code: ErrorCode.NETWORK_ERROR,
        message: "Failed to search locations",
        details: error,
      });

      logError(appError, {
        action: "nominatimSearch",
        metadata: { query },
      });

      throw appError;
    }
  }

  /**
   * Reverse geocode coordinates to location
   */
  async reverse(
    lat: number,
    lon: number,
  ): Promise<NominatimReverseResult | null> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        format: "json",
        addressdetails: "1",
      });

      const response = await fetch(`${this.baseUrl}/reverse?${params}`, {
        headers: {
          "User-Agent": this.userAgent,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No result found
        }
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      return data as NominatimReverseResult;
    } catch (error) {
      const appError = new AppError({
        code: ErrorCode.NETWORK_ERROR,
        message: "Failed to reverse geocode location",
        details: error,
      });

      logError(appError, {
        action: "nominatimReverse",
        metadata: { lat, lon },
      });

      throw appError;
    }
  }

  /**
   * Get formatted address from result
   */
  getFormattedAddress(
    result: NominatimResult | NominatimReverseResult,
  ): string {
    if (!result.address) {
      return result.display_name;
    }

    const parts: string[] = [];

    if (result.address.road && result.address.house_number) {
      parts.push(`${result.address.road} ${result.address.house_number}`);
    } else if (result.address.road) {
      parts.push(result.address.road);
    }

    if (result.address.city) {
      parts.push(result.address.city);
    }

    if (result.address.state) {
      parts.push(result.address.state);
    }

    if (result.address.country) {
      parts.push(result.address.country);
    }

    return parts.length > 0 ? parts.join(", ") : result.display_name;
  }

  /**
   * Create geo: URI from coordinates
   */
  createGeoUri(lat: number, lon: number): string {
    return `geo:${lat},${lon}`;
  }

  /**
   * Parse geo: URI to coordinates
   */
  parseGeoUri(uri: string): { lat: number; lon: number } | null {
    const match = uri.match(/^geo:([-\d.]+),([-\d.]+)$/);
    if (!match) return null;

    return {
      lat: parseFloat(match[1]),
      lon: parseFloat(match[2]),
    };
  }
}

// Export singleton instance
export const nominatimClient = new NominatimClient();

