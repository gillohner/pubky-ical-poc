/**
 * Validation utilities for Calendar and Event forms
 * Based on RFC 5545 requirements and pubky-app-specs
 */

import type {
  CalendarFormData,
  EventFormData,
  ValidationResult,
} from "@/types/calendar";

const MAX_NAME_LENGTH = 255;
const MAX_SUMMARY_LENGTH = 255;

/**
 * Validate calendar form data
 */
export function validateCalendarForm(data: CalendarFormData): ValidationResult {
  const errors: Record<string, string> = {};

  // Name is required
  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Calendar name is required";
  } else if (data.name.length > MAX_NAME_LENGTH) {
    errors.name =
      `Calendar name must be less than ${MAX_NAME_LENGTH} characters`;
  }

  // Color validation (if provided)
  if (data.color && !isValidColor(data.color)) {
    errors.color =
      "Invalid color format. Use hex (#RRGGBB) or named CSS colors";
  }

  // Timezone validation (if provided)
  if (data.timezone && !isValidTimezone(data.timezone)) {
    errors.timezone =
      "Invalid timezone. Use IANA timezone identifiers (e.g., Europe/Zurich)";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate event form data
 */
export function validateEventForm(data: EventFormData): ValidationResult {
  const errors: Record<string, string> = {};

  // Summary is required
  if (!data.summary || data.summary.trim().length === 0) {
    errors.summary = "Event title is required";
  } else if (data.summary.length > MAX_SUMMARY_LENGTH) {
    errors.summary =
      `Event title must be less than ${MAX_SUMMARY_LENGTH} characters`;
  }

  // Start date is required
  if (!data.dtstart) {
    errors.dtstart = "Start date/time is required";
  }

  // End date must be after start date
  if (data.dtstart && data.dtend && data.dtend <= data.dtstart) {
    errors.dtend = "End date/time must be after start date/time";
  }

  // Validate RRULE if provided
  if (data.rrule && !isValidRRule(data.rrule)) {
    errors.rrule = "Invalid recurrence rule format";
  }

  // Validate conference URL if provided
  if (data.conferenceUri && !isValidUrl(data.conferenceUri)) {
    errors.conferenceUri = "Invalid conference URL";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate CSS color
 */
function isValidColor(color: string): boolean {
  // Hex color
  if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
    return true;
  }

  // RGB/RGBA
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(,\s*[\d.]+)?\s*\)$/i.test(color)) {
    return true;
  }

  // Named colors (basic check)
  const namedColors = [
    "black",
    "white",
    "red",
    "green",
    "blue",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "gray",
    "grey",
  ];
  if (namedColors.includes(color.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Validate IANA timezone
 */
function isValidTimezone(timezone: string): boolean {
  try {
    // Use Intl.DateTimeFormat to validate timezone
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate RFC 5545 RRULE
 * Basic validation - checks for required FREQ parameter
 */
function isValidRRule(rrule: string): boolean {
  // Must start with FREQ=
  if (!rrule.startsWith("FREQ=")) {
    return false;
  }

  // Valid frequencies
  const validFreqs = [
    "SECONDLY",
    "MINUTELY",
    "HOURLY",
    "DAILY",
    "WEEKLY",
    "MONTHLY",
    "YEARLY",
  ];
  const freqMatch = rrule.match(/FREQ=(\w+)/);

  if (!freqMatch || !validFreqs.includes(freqMatch[1])) {
    return false;
  }

  return true;
}

/**
 * Validate URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate event UID
 * Format: <timestamp>-<random>@pubky
 */
export function generateEventUid(publicKey: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}@${publicKey}`;
}

/**
 * Convert Date to Unix microseconds
 */
export function dateToMicroseconds(date: Date): number {
  return date.getTime() * 1000;
}

/**
 * Convert Unix microseconds to Date
 */
export function microsecondsToDate(microseconds: number): Date {
  return new Date(microseconds / 1000);
}

/**
 * Get user's current timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

/**
 * Format date for input (YYYY-MM-DDTHH:MM)
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse date from input (YYYY-MM-DDTHH:MM)
 */
export function parseDateFromInput(input: string): Date | null {
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
}

