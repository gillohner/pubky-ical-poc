/**
 * Serializable calendar types for Next.js client components
 *
 * Next.js requires props passed to client components to be serializable.
 * PubkyAppCalendar contains BigInt (for timestamps) which cannot be serialized,
 * so we use these plain object types for component props.
 */

export interface SerializableCalendar {
  name?: string;
  timezone?: string;
  color?: string;
  image_uri?: string;
  x_pubky_admins?: string[];
  created?: string; // Stored as string to avoid BigInt serialization issues
  [key: string]: unknown;
}

export interface SerializableCalendarListItem {
  uri: string;
  authorId: string;
  calendarId: string;
  calendar: SerializableCalendar;
}
