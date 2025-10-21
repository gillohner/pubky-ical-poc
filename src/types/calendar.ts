/**
 * Calendar and Event types based on pubky-app-specs
 * Following RFC 5545, RFC 7986, RFC 9073 iCalendar standards
 */

// Re-export types from pubky-app-specs
export type { PubkyAppCalendar, PubkyAppEvent } from "pubky-app-specs";

/**
 * Event status values (RFC 5545)
 */
export type EventStatus = "CONFIRMED" | "TENTATIVE" | "CANCELLED";

/**
 * Organizer object structure
 */
export interface EventOrganizer {
  uri: string; // Pubky URI
  name?: string; // Display name
}

/**
 * Conference object structure (RFC 7986)
 */
export interface EventConference {
  uri: string; // Conference URL (e.g., Jitsi, Zoom)
  label?: string; // Display label
}

/**
 * Structured location object (RFC 9073)
 */
export interface StructuredLocation {
  uri?: string; // geo: URI (e.g., "geo:47.366667,8.550000")
  name?: string; // Location name
  description?: string; // Additional details
  osm_id?: string; // OpenStreetMap ID for lookups
  bitcoin_accepted?: boolean; // Custom: Bitcoin payment support
}

/**
 * Styled description object (RFC 9073)
 */
export interface StyledDescription {
  fmttype: string; // MIME type (e.g., "text/html", "text/markdown")
  value: string; // Rich text content
}

/**
 * Form data for calendar creation/editing
 */
export interface CalendarFormData {
  name: string;
  color?: string;
  timezone?: string;
  imageFile?: File;
  x_pubky_admins?: string[]; // Array of admin pubky URIs
}

/**
 * Form data for event creation/editing
 */
export interface EventFormData {
  summary: string;
  dtstart: Date;
  dtend?: Date;
  status?: EventStatus;
  categories?: string[];
  description?: string; // Plain text, will be converted to styled_description
  location?: string; // Plain text location
  structuredLocation?: StructuredLocation;
  conferenceUri?: string;
  conferenceLabel?: string;
  rrule?: string;
  imageFile?: File;
  calendarUri?: string; // Link to parent calendar
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Helper to parse organizer JSON
 */
export function parseOrganizer(organizerJson?: string): EventOrganizer | null {
  if (!organizerJson) return null;
  try {
    return JSON.parse(organizerJson);
  } catch {
    return null;
  }
}

/**
 * Helper to parse conference JSON
 */
export function parseConference(
  conferenceJson?: string,
): EventConference | null {
  if (!conferenceJson) return null;
  try {
    return JSON.parse(conferenceJson);
  } catch {
    return null;
  }
}

/**
 * Helper to parse structured location JSON
 */
export function parseStructuredLocation(
  locationJson?: string,
): StructuredLocation | null {
  if (!locationJson) return null;
  try {
    return JSON.parse(locationJson);
  } catch {
    return null;
  }
}

/**
 * Helper to parse styled description JSON
 */
export function parseStyledDescription(
  descriptionJson?: string,
): StyledDescription | null {
  if (!descriptionJson) return null;
  try {
    return JSON.parse(descriptionJson);
  } catch {
    return null;
  }
}

/**
 * Helper to create organizer JSON
 */
export function createOrganizerJson(uri: string, name?: string): string {
  return JSON.stringify({ uri, name });
}

/**
 * Helper to create conference JSON
 */
export function createConferenceJson(uri: string, label?: string): string {
  return JSON.stringify({ uri, label });
}

/**
 * Helper to create structured location JSON
 */
export function createStructuredLocationJson(
  location: StructuredLocation,
): string {
  return JSON.stringify(location);
}

/**
 * Helper to create styled description JSON
 */
export function createStyledDescriptionJson(
  value: string,
  fmttype = "text/html",
): string {
  return JSON.stringify({ fmttype, value });
}
