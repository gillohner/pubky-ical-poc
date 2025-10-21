/**
 * Utility functions for parsing and handling Pubky URIs
 */

/**
 * Parse a calendar URI and extract author_id and calendar_id
 *
 * @param calendarUri - Format: pubky://author_id/pub/pubky.app/calendar/calendar_id
 * @returns Object with authorId and calendarId, or null if invalid
 */
export function parseCalendarUri(
  calendarUri: string,
): { authorId: string; calendarId: string } | null {
  const parts = calendarUri.split("/");
  if (parts.length >= 7 && parts[0] === "pubky:") {
    const authorId = parts[2].replace("pubky://", "");
    const calendarId = parts[6];
    return { authorId, calendarId };
  }
  return null;
}

/**
 * Parse an event URI and extract author_id and event_id
 *
 * @param eventUri - Format: pubky://author_id/pub/pubky.app/event/event_id
 * @returns Object with authorId and eventId, or null if invalid
 */
export function parseEventUri(
  eventUri: string,
): { authorId: string; eventId: string } | null {
  const parts = eventUri.split("/");
  if (parts.length >= 7 && parts[0] === "pubky:") {
    const authorId = parts[2].replace("pubky://", "");
    const eventId = parts[6];
    return { authorId, eventId };
  }
  return null;
}

/**
 * Build a calendar page URL from a calendar URI
 *
 * @param calendarUri - The calendar URI
 * @returns The page URL path, or null if invalid URI
 */
export function getCalendarPageUrl(calendarUri: string): string | null {
  const parsed = parseCalendarUri(calendarUri);
  if (!parsed) return null;
  return `/calendar/${parsed.authorId}/${parsed.calendarId}`;
}

/**
 * Build an event page URL from an event URI
 *
 * @param eventUri - The event URI
 * @returns The page URL path, or null if invalid URI
 */
export function getEventPageUrl(eventUri: string): string | null {
  const parsed = parseEventUri(eventUri);
  if (!parsed) return null;
  return `/event/${parsed.authorId}/${parsed.eventId}`;
}
