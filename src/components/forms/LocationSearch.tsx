"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, MapPin, Search } from "lucide-react";
import { nominatimClient, type NominatimResult } from "@/lib/nominatim-client";
import type { StructuredLocation } from "@/types/calendar";
import { toast } from "sonner";

interface LocationSearchProps {
  value?: StructuredLocation;
  onChangeAction: (location: StructuredLocation | undefined) => void;
  placeholder?: string;
}

/**
 * LocationSearch Component
 *
 * Searches locations using Nominatim OSM API and returns structured location data
 */
export function LocationSearch({
  value,
  onChangeAction,
  placeholder = "Search for a location...",
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<NominatimResult | null>(
    null,
  );

  // Load initial display value
  useEffect(() => {
    if (value?.name) {
      setQuery(value.name);
    }
  }, [value]);

  // Debounced search
  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await nominatimClient.search(searchQuery);
      setResults(searchResults);
      setIsOpen(true);
    } catch (error) {
      toast.error("Failed to search locations");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        searchLocations(query);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, searchLocations]);

  const handleSelectResult = (result: NominatimResult) => {
    setSelectedResult(result);
    setQuery(nominatimClient.getFormattedAddress(result));
    setIsOpen(false);

    // Create structured location
    const structuredLocation: StructuredLocation = {
      uri: nominatimClient.createGeoUri(
        parseFloat(result.lat),
        parseFloat(result.lon),
      ),
      name: nominatimClient.getFormattedAddress(result),
      description: result.display_name,
      osm_id: result.osm_id.toString(),
    };

    onChangeAction(structuredLocation);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSelectedResult(null);
    onChangeAction(undefined);
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Loading State */}
      {isSearching && (
        <div className="absolute z-10 w-full mt-1 p-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-lg">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Searching...
          </div>
        </div>
      )}

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && !isSearching && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.place_id}
              onClick={() => handleSelectResult(result)}
              className="w-full px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {nominatimClient.getFormattedAddress(result)}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {result.display_name}
                  </div>
                </div>
                {selectedResult?.place_id === result.place_id && (
                  <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Location Info */}
      {value && value.uri && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {value.name}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-1">
                {value.uri}
              </div>
              {value.osm_id && (
                <a
                  href={`https://www.openstreetmap.org/${
                    selectedResult?.osm_type || "node"
                  }/${value.osm_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                >
                  View on OpenStreetMap →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
