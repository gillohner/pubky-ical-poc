/**
 * Calendar List Service
 *
 * Abstracts calendar listing/discovery to prepare for Nexus API integration.
 * Currently fetches from homeserver, but will be updated to use Nexus endpoints.
 */

import { PubkyClient } from "@/lib/pubky-client";
import { PubkyAppCalendar } from "pubky-app-specs";
import { AppError, ErrorCode } from "@/types/errors";
import { logError } from "@/lib/error-logger";
import { SerializableCalendar, SerializableCalendarListItem } from "@/types/calendar-serializable";

export type CalendarListItem = SerializableCalendarListItem;

/**
 * Convert PubkyAppCalendar to SerializableCalendar
 * Converts BigInt to string for Next.js serialization
 */
function toSerializableCalendar(calendar: PubkyAppCalendar): SerializableCalendar {
  return {
    name: calendar.name,
    timezone: calendar.timezone || undefined,
    color: calendar.color || undefined,
    image_uri: calendar.image_uri || undefined,
    x_pubky_admins: calendar.x_pubky_admins || undefined,
    created: calendar.created?.toString(), // Convert BigInt to string
  };
}

/**
 * Fetch all calendars for a specific user
 *
 * TODO: Update to fetch from Nexus API endpoint once available
 * Nexus endpoint will be: GET /user/:user_id/calendars
 * This will return paginated, indexed calendar data with better performance
 *
 * @param userId - The public key of the user
 * @returns Array of calendar items
 */
export async function fetchUserCalendars(
  userId: string,
): Promise<CalendarListItem[]> {
  try {
    // TODO: Replace with Nexus API call
    // const response = await fetch(`${NEXUS_API_URL}/user/${userId}/calendars`);
    // const data = await response.json();
    // return data.calendars.map(c => ({
    //   uri: c.uri,
    //   authorId: userId,
    //   calendarId: c.id,
    //   calendar: PubkyAppCalendar.fromJson(c.data)
    // }));

    // For now, list calendars directly from homeserver
    const client = PubkyClient.getInstance();
    // Convert to address format for SDK 0.6.0 (pubky<pk>/path instead of pubky://<pk>/path)
    const baseAddress = `pubky${userId}/pub/pubky.app/calendar/`;

    // List returns full URLs, not just IDs
    const calendarUrls = await client.list(baseAddress);

    if (!calendarUrls || calendarUrls.length === 0) {
      return [];
    }

    const calendars: CalendarListItem[] = [];

    for (const calendarUri of calendarUrls) {
      try {
        // Convert the URI to address format for public read
        const address = calendarUri.replace("pubky://", "pubky");
        const response = await client.get(address);

        if (response) {
          const text = new TextDecoder().decode(response);
          const calendarData = JSON.parse(text);
          const calendar = PubkyAppCalendar.fromJson(calendarData);

          // Extract just the ID from the URL
          const calendarId = calendarUri.split("/").pop() || "";

          calendars.push({
            uri: calendarUri,
            authorId: userId,
            calendarId,
            calendar: toSerializableCalendar(calendar), // Convert to serializable
          });
        }
      } catch (error) {
        logError(
          new AppError({
            code: ErrorCode.INVALID_DATA,
            message: `Failed to parse calendar ${calendarUri}`,
            details: error,
          }),
          {
            action: "fetchUserCalendars",
            userId,
            metadata: { calendarUri },
          },
        );
      }
    }

    return calendars;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError({
      code: ErrorCode.HOMESERVER_ERROR,
      message: "Failed to fetch user calendars",
      details: error,
    });

    logError(appError, {
      action: "fetchUserCalendars",
      userId,
    });

    throw appError;
  }
}

/**
 * Fetch featured/public calendars from the network
 *
 * TODO: Update to fetch from Nexus API endpoint once available
 * Nexus endpoint will be: GET /calendars/featured or /calendars/public
 * This will return curated, indexed calendar data from across the network
 *
 * @returns Array of featured calendar items
 */
export async function fetchFeaturedCalendars(): Promise<CalendarListItem[]> {
  // TODO: Implement Nexus API call for featured calendars
  // const response = await fetch(`${NEXUS_API_URL}/calendars/featured`);
  // const data = await response.json();
  // return data.calendars;

  // For now, return empty array
  // In production, this would query Nexus for popular/featured calendars
  return [];
}

/**
 * Search calendars by name or description
 *
 * TODO: Update to use Nexus API search endpoint once available
 * Nexus endpoint will be: GET /calendars/search?q=query
 * This will provide full-text search across all indexed calendars
 *
 * @param query - Search query string
 * @returns Array of matching calendar items
 */
export async function searchCalendars(
  query: string,
): Promise<CalendarListItem[]> {
  // TODO: Implement Nexus API search
  // const response = await fetch(`${NEXUS_API_URL}/calendars/search?q=${encodeURIComponent(query)}`);
  // const data = await response.json();
  // return data.results;

  // For now, return empty array
  // In production, this would use Nexus full-text search
  return [];
}
