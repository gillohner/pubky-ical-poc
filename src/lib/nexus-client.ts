/**
 * Nexus API Client
 *
 * Client for interacting with the Pubky Nexus backend.
 * Handles all HTTP requests to Nexus endpoints.
 */

import {
  NexusCalendar,
  NexusEvent,
  NexusAttendee,
  NexusAlarm,
  StreamCalendarsParams,
  StreamEventsParams,
} from "./nexus-types";

const NEXUS_API_URL = process.env.NEXT_PUBLIC_NEXUS_API_URL || "http://localhost:8080";

/**
 * Generic fetch wrapper with error handling
 */
async function nexusFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${NEXUS_API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Nexus API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Nexus API request failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, unknown> | StreamCalendarsParams | StreamEventsParams): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// ============================================================================
// Calendar Endpoints
// ============================================================================

/**
 * Stream calendars with optional filtering
 * GET /v0/stream/calendars
 */
export async function streamCalendars(
  params: StreamCalendarsParams = {}
): Promise<NexusCalendar[]> {
  const queryString = buildQueryString(params);
  return nexusFetch<NexusCalendar[]>(`/v0/stream/calendars${queryString}`);
}

/**
 * Get a specific calendar by ID
 * GET /v0/calendar/:author_id/:calendar_id
 */
export async function getCalendar(
  authorId: string,
  calendarId: string
): Promise<NexusCalendar> {
  return nexusFetch<NexusCalendar>(`/v0/calendar/${authorId}/${calendarId}`);
}

// ============================================================================
// Event Endpoints
// ============================================================================

/**
 * Stream events with optional filtering
 * GET /v0/stream/events
 */
export async function streamEvents(
  params: StreamEventsParams = {}
): Promise<NexusEvent[]> {
  const queryString = buildQueryString(params);
  return nexusFetch<NexusEvent[]>(`/v0/stream/events${queryString}`);
}

/**
 * Get a specific event by ID
 * GET /v0/event/:author_id/:event_id
 */
export async function getEvent(
  authorId: string,
  eventId: string
): Promise<NexusEvent> {
  return nexusFetch<NexusEvent>(`/v0/event/${authorId}/${eventId}`);
}

// ============================================================================
// Attendee Endpoints
// ============================================================================

/**
 * Get a specific attendee by ID
 * GET /v0/attendee/:author_id/:attendee_id
 */
export async function getAttendee(
  authorId: string,
  attendeeId: string
): Promise<NexusAttendee> {
  return nexusFetch<NexusAttendee>(`/v0/attendee/${authorId}/${attendeeId}`);
}

// ============================================================================
// Alarm Endpoints
// ============================================================================

/**
 * Get a specific alarm by ID
 * GET /v0/alarm/:author_id/:alarm_id
 */
export async function getAlarm(
  authorId: string,
  alarmId: string
): Promise<NexusAlarm> {
  return nexusFetch<NexusAlarm>(`/v0/alarm/${authorId}/${alarmId}`);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get all calendars for a specific user (admin)
 */
export async function getUserCalendars(userId: string): Promise<NexusCalendar[]> {
  return streamCalendars({ admin: userId });
}

/**
 * Get all events for a specific calendar
 */
export async function getCalendarEvents(
  calendarId: string,
  params: Omit<StreamEventsParams, "calendar"> = {}
): Promise<NexusEvent[]> {
  return streamEvents({ ...params, calendar: calendarId });
}

/**
 * Get events within a date range
 */
export async function getEventsByDateRange(
  startDate: Date,
  endDate: Date,
  params: Omit<StreamEventsParams, "start_date" | "end_date"> = {}
): Promise<NexusEvent[]> {
  return streamEvents({
    ...params,
    start_date: startDate.getTime(),
    end_date: endDate.getTime(),
  });
}
