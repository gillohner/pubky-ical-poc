/**
 * Calendar Fetch Service
 *
 * Abstracts calendar data fetching to prepare for Nexus API integration.
 * Currently fetches from homeserver, but will be updated to use Nexus endpoints.
 */

import { PubkyAppCalendar } from "pubky-app-specs";
import { PubkyClient } from "@/lib/pubky-client";
import { AppError, ErrorCode } from "@/types/errors";
import { logError } from "@/lib/error-logger";

/**
 * Fetch calendar metadata
 *
 * TODO: Update to fetch from Nexus API endpoint once available
 * Nexus endpoint will be: GET /calendar/:author_id/:calendar_id
 *
 * @param authorId - The public key of the calendar owner
 * @param calendarId - The calendar ID (timestamp-based)
 * @returns Calendar metadata or null if not found
 */
export async function fetchCalendarMetadata(
  authorId: string,
  calendarId: string,
): Promise<PubkyAppCalendar | null> {
  try {
    // TODO: Replace with Nexus API call
    // const response = await fetch(`${NEXUS_API_URL}/calendar/${authorId}/${calendarId}`);
    // const data = await response.json();
    // return PubkyAppCalendar.fromJson(data);

    // For now, fetch directly from homeserver
    const calendarUri =
      `pubky://${authorId}/pub/pubky.app/calendar/${calendarId}`;
    const client = PubkyClient.getInstance();
    const response = await client.get(calendarUri);

    if (!response) {
      return null;
    }

    const text = new TextDecoder().decode(response);
    const calendarData = JSON.parse(text);
    const calendar = PubkyAppCalendar.fromJson(calendarData);

    return calendar;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError({
      code: ErrorCode.HOMESERVER_ERROR,
      message: "Failed to fetch calendar metadata",
      details: error,
    });

    logError(appError, {
      action: "fetchCalendarMetadata",
      metadata: { authorId, calendarId },
    });

    throw appError;
  }
}

/**
 * Parse author ID and calendar ID from a calendar URI
 *
 * @param calendarUri - Full calendar URI (e.g., "pubky://author/pub/pubky.app/calendar/id")
 * @returns Object with authorId and calendarId
 */
export function parseCalendarUri(calendarUri: string): {
  authorId: string;
  calendarId: string;
} {
  const match = calendarUri.match(
    /^pubky:\/\/([^/]+)\/pub\/pubky\.app\/calendar\/(.+)$/,
  );

  if (!match) {
    throw new AppError({
      code: ErrorCode.INVALID_DATA,
      message: "Invalid calendar URI format",
      details: { calendarUri },
    });
  }

  return {
    authorId: match[1],
    calendarId: match[2],
  };
}

/**
 * Build a calendar URI from author ID and calendar ID
 *
 * @param authorId - The public key of the calendar owner
 * @param calendarId - The calendar ID
 * @returns Full calendar URI
 */
export function buildCalendarUri(
  authorId: string,
  calendarId: string,
): string {
  return `pubky://${authorId}/pub/pubky.app/calendar/${calendarId}`;
}

