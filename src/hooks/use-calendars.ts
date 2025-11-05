/**
 * Calendar React Query Hooks
 *
 * Custom hooks for fetching calendar data from Nexus with caching.
 * Uses React Query for efficient data management.
 */

import { useQuery } from "@tanstack/react-query";
import {
  streamCalendars,
  getUserCalendars,
  getCalendar,
  streamEvents,
  getCalendarEvents,
} from "@/lib/nexus-client";
import { NexusCalendar, NexusEvent, StreamCalendarsParams, StreamEventsParams } from "@/lib/nexus-types";

// ============================================================================
// Query Keys
// ============================================================================

export const calendarKeys = {
  all: ["calendars"] as const,
  lists: () => [...calendarKeys.all, "list"] as const,
  list: (params: StreamCalendarsParams) => [...calendarKeys.lists(), params] as const,
  user: (userId: string) => [...calendarKeys.all, "user", userId] as const,
  detail: (authorId: string, calendarId: string) => 
    [...calendarKeys.all, "detail", authorId, calendarId] as const,
};

export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (params: StreamEventsParams) => [...eventKeys.lists(), params] as const,
  calendar: (calendarId: string) => [...eventKeys.all, "calendar", calendarId] as const,
};

// ============================================================================
// Calendar Hooks
// ============================================================================

/**
 * Fetch all calendars (global stream)
 * Useful for calendar discovery page
 */
export function useCalendars(params: StreamCalendarsParams = {}) {
  return useQuery({
    queryKey: calendarKeys.list(params),
    queryFn: () => streamCalendars(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Fetch calendars for a specific user (filtered by admin)
 * Useful for "My Calendars" page
 */
export function useUserCalendars(userId: string | undefined) {
  return useQuery({
    queryKey: calendarKeys.user(userId || ""),
    queryFn: () => {
      if (!userId) throw new Error("User ID is required");
      return getUserCalendars(userId);
    },
    enabled: !!userId, // Only run if userId exists
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Fetch a specific calendar by ID
 */
export function useCalendar(authorId: string | undefined, calendarId: string | undefined) {
  return useQuery({
    queryKey: calendarKeys.detail(authorId || "", calendarId || ""),
    queryFn: () => {
      if (!authorId || !calendarId) {
        throw new Error("Author ID and Calendar ID are required");
      }
      return getCalendar(authorId, calendarId);
    },
    enabled: !!authorId && !!calendarId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ============================================================================
// Event Hooks
// ============================================================================

/**
 * Fetch all events (global stream)
 */
export function useEvents(params: StreamEventsParams = {}) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => streamEvents(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Fetch events for a specific calendar
 */
export function useCalendarEvents(
  calendarId: string | undefined,
  params: Omit<StreamEventsParams, "calendar"> = {}
) {
  return useQuery({
    queryKey: eventKeys.calendar(calendarId || ""),
    queryFn: () => {
      if (!calendarId) throw new Error("Calendar ID is required");
      return getCalendarEvents(calendarId, params);
    },
    enabled: !!calendarId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ============================================================================
// Helper Functions to Convert Nexus Types to Serializable Types
// ============================================================================

/**
 * Convert NexusCalendar to SerializableCalendar format
 * This ensures compatibility with existing components like CalendarCard
 */
export function nexusCalendarToSerializable(nexusCalendar: NexusCalendar) {
  return {
    uri: nexusCalendar.uri,
    authorId: nexusCalendar.author,
    calendarId: nexusCalendar.id,
    calendar: {
      name: nexusCalendar.name,
      timezone: nexusCalendar.timezone,
      color: nexusCalendar.color,
      image_uri: nexusCalendar.image_uri,
      x_pubky_admins: nexusCalendar.x_pubky_admins || undefined,
      created: nexusCalendar.created?.toString(),
    },
  };
}

/**
 * Convert array of NexusCalendar to SerializableCalendarListItem array
 */
export function nexusCalendarsToSerializable(nexusCalendars: NexusCalendar[]) {
  return nexusCalendars.map(nexusCalendarToSerializable);
}
