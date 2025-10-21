/**
 * Serializable calendar types for Next.js client components
 *
 * These types ensure that calendar data can be serialized and passed
 * between server and client components without issues.
 */

export interface SerializableCalendar {
  name?: string;
  timezone?: string;
  color?: string;
  image_uri?: string;
  x_pubky_admins?: string[];
  created?: string;
  [key: string]: any;
}

export interface SerializableCalendarListItem {
  uri: string;
  authorId: string;
  calendarId: string;
  calendar: SerializableCalendar;
}
