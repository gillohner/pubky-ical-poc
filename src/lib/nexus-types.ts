/**
 * Nexus API Types
 *
 * TypeScript types matching the Nexus API response structures.
 * These correspond to the Rust models in nexus-common/src/models/calendar/
 */

/**
 * Location details for an event
 * Matches the Location type from pubky-app-specs
 */
export interface NexusLocation {
  address?: string;
  lat?: number;
  lon?: number;
  uri?: string;
  name?: string;
}

/**
 * RSVP status for an attendee
 */
export type RsvpStatus = 
  | "NEEDS_ACTION"
  | "ACCEPTED"
  | "DECLINED"
  | "TENTATIVE"
  | "DELEGATED";

/**
 * Calendar details from Nexus
 * Matches CalendarDetails from nexus-common/src/models/calendar/details.rs
 */
export interface NexusCalendar {
  id: string; // Calendar ID
  indexed_at: number; // When indexed by Nexus
  author: string; // Author's public key
  uri: string; // Full pubky URI
  name?: string;
  timezone?: string;
  color?: string;
  description?: string | null;
  url?: string | null;
  image_uri?: string;
  x_pubky_admins?: string[] | null; // List of admin public keys
  created?: number; // Unix timestamp in milliseconds
}

/**
 * Event details from Nexus
 * Matches EventDetails from nexus-common/src/models/event/details.rs
 */
export interface NexusEvent {
  id: string; // Event ID
  indexed_at: number; // When indexed by Nexus
  author: string; // Author's public key
  uri: string; // Full pubky URI
  calendar: string; // Calendar ID
  summary?: string;
  description?: string;
  location?: NexusLocation;
  start_date: number; // Unix timestamp
  end_date: number; // Unix timestamp
  all_day?: boolean;
  recurrence_rule?: string;
  recurrence_id?: string;
  status?: string;
  organizer?: string;
  created?: number;
  last_modified?: number;
  sequence?: number;
  transparency?: boolean;
  url?: string;
  tags?: string[];
}

/**
 * Attendee details from Nexus
 * Matches AttendeeDetails from nexus-common/src/models/attendee/details.rs
 */
export interface NexusAttendee {
  id: string; // Attendee ID
  indexed_at: number; // When indexed by Nexus
  author: string; // Author's public key
  uri: string; // Full pubky URI
  event: string; // Event ID
  pubky?: string; // Public key of attendee
  email?: string;
  name?: string;
  rsvp?: RsvpStatus;
  role?: string;
  delegated_to?: string;
  delegated_from?: string;
}

/**
 * Alarm details from Nexus
 * Matches AlarmDetails from nexus-common/src/models/alarm/details.rs
 */
export interface NexusAlarm {
  id: string; // Alarm ID
  indexed_at: number; // When indexed by Nexus
  author: string; // Author's public key
  uri: string; // Full pubky URI
  event: string; // Event ID
  trigger: string; // Duration before event (e.g., "-PT15M")
  action: string; // "DISPLAY", "EMAIL", etc.
  description?: string;
  summary?: string;
  attendees?: string[]; // Public keys
  repeat?: number;
  duration?: string;
}

/**
 * Stream query parameters for calendars
 */
export interface StreamCalendarsParams {
  skip?: number;
  limit?: number;
  admin?: string; // Filter by admin public key
}

/**
 * Stream query parameters for events
 */
export interface StreamEventsParams {
  skip?: number;
  limit?: number;
  calendar?: string; // Filter by calendar ID
  status?: string; // Filter by event status
  start_date?: number; // Filter by start date (Unix timestamp)
  end_date?: number; // Filter by end date (Unix timestamp)
  location?: string; // Filter by location (JSON string or search query)
  tags?: string; // Comma-separated tags
}
