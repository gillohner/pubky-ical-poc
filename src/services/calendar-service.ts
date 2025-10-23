/**
 * Calendar Service
 *
 * Handles calendar and event operations with homeserver
 * Follows pubky-app-specs for Calendar and Event types
 */

import { PubkyClient } from "@/lib/pubky-client";
import { PubkyAppCalendar, PubkyAppEvent, PubkyAppFile } from "pubky-app-specs";
import type { CalendarFormData, EventFormData } from "@/types/calendar";
import { AppError, ErrorCode } from "@/types/errors";
import { logError } from "@/lib/error-logger";
import { logger } from "@/lib/logger";
import {
  dateToMicroseconds,
  generateEventUid,
  getUserTimezone,
} from "@/lib/calendar-validation";
import {
  createConferenceJson,
  createOrganizerJson,
  createStructuredLocationJson,
  createStyledDescriptionJson,
} from "@/types/calendar";

/**
 * Generate a timestamp-based ID (13 characters, Crockford Base32)
 * This matches the pubky-app-specs TimestampId trait
 */
function generateTimestampId(): string {
  const now = Date.now() * 1000; // Convert to microseconds
  // Convert to Crockford Base32 (13 characters)
  const base32 = now.toString(32).toUpperCase().padStart(13, "0");
  return base32;
}

/**
 * Create a calendar on the homeserver
 */
export async function createCalendar(
  formData: CalendarFormData,
  publicKey: string,
): Promise<string> {
  const client = PubkyClient.getInstance();

  try {
    // Generate calendar ID
    const calendarId = generateTimestampId();

    // Upload image if provided
    let imageUri: string | undefined;
    if (formData.imageFile) {
      imageUri = await uploadImage(formData.imageFile, publicKey);
    }

    // Create calendar object using pubky-app-specs constructor
    const calendar = new PubkyAppCalendar(
      formData.name.trim(),
      formData.color?.trim() || null,
      formData.x_pubky_admins || [publicKey], // Use provided admins or default to creator
      formData.timezone || getUserTimezone() || null,
      imageUri || null, // Image URI from uploaded file
      BigInt(Date.now() * 1000), // Unix microseconds as bigint
    );

    // Convert to JSON using toJson() method
    const calendarJson = JSON.stringify(calendar.toJson());
    const calendarBytes = new TextEncoder().encode(calendarJson);

    // PUT to homeserver
    const calendarPath = `/pub/pubky.app/calendar/${calendarId}`;
    const calendarUri = `pubky://${publicKey}${calendarPath}`;

    const success = await client.put(calendarUri, calendarBytes);

    if (!success) {
      throw new AppError({
        code: ErrorCode.HOMESERVER_ERROR,
        message: "Failed to create calendar on homeserver",
        publicKey,
      });
    }

    logger.service("calendar", "Calendar created", { calendarUri });
    return calendarUri;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError({
      code: ErrorCode.HOMESERVER_ERROR,
      message: "Failed to create calendar",
      details: error,
      publicKey,
    });

    logError(appError, {
      action: "createCalendar",
      userId: publicKey,
    });

    throw appError;
  }
}

/**
 * Update an existing calendar on the homeserver
 */
export async function updateCalendar(
  calendarUri: string,
  formData: CalendarFormData,
  publicKey: string,
  existingImageUri?: string | null,
): Promise<void> {
  const client = PubkyClient.getInstance();

  try {
    // Upload new image if provided, otherwise keep existing
    let imageUri: string | null | undefined = existingImageUri;
    if (formData.imageFile) {
      imageUri = await uploadImage(formData.imageFile, publicKey);
    }

    // Create updated calendar object
    const calendar = new PubkyAppCalendar(
      formData.name.trim(),
      formData.color?.trim() || null,
      formData.x_pubky_admins || [publicKey],
      formData.timezone || getUserTimezone() || null,
      imageUri || null, // Keep existing or use new image URI
      BigInt(Date.now() * 1000), // Update timestamp
    );

    // Convert to JSON
    const calendarJson = JSON.stringify(calendar.toJson());
    const calendarBytes = new TextEncoder().encode(calendarJson);

    // PUT to homeserver (overwrites existing)
    const success = await client.put(calendarUri, calendarBytes);

    if (!success) {
      throw new AppError({
        code: ErrorCode.HOMESERVER_ERROR,
        message: "Failed to update calendar on homeserver",
        publicKey,
      });
    }

    logger.service("calendar", "Calendar updated", { calendarUri });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError({
      code: ErrorCode.HOMESERVER_ERROR,
      message: "Failed to update calendar",
      details: error,
      publicKey,
    });

    logError(appError, {
      action: "updateCalendar",
      userId: publicKey,
    });

    throw appError;
  }
}

/**
 * Create an event on the homeserver
 */
export async function createEvent(
  formData: EventFormData,
  publicKey: string,
): Promise<string> {
  const client = PubkyClient.getInstance();

  try {
    // Generate event ID and UID
    const eventId = generateTimestampId();
    const uid = formData.calendarUri
      ? `pubky://${publicKey}/pub/pubky.app/event/${eventId}`
      : generateEventUid(publicKey);

    // Upload image if provided
    let imageUri: string | undefined;
    if (formData.imageFile) {
      imageUri = await uploadImage(formData.imageFile, publicKey);
    }

    // Create organizer JSON
    const organizer = createOrganizerJson(publicKey, undefined);

    // Create conference JSON if provided
    let conference: string | undefined;
    if (formData.conferenceUri) {
      conference = createConferenceJson(
        formData.conferenceUri,
        formData.conferenceLabel,
      );
    }

    // Create structured location JSON if provided
    let structuredLocation: string | undefined;
    if (formData.structuredLocation) {
      structuredLocation = createStructuredLocationJson(
        formData.structuredLocation,
      );
    }

    // Create styled description if provided
    let styledDescription: string | undefined;
    if (formData.description) {
      styledDescription = createStyledDescriptionJson(formData.description);
    }

    // Create event object using pubky-app-specs constructor
    const now = BigInt(Date.now() * 1000); // Unix microseconds as bigint
    const event = new PubkyAppEvent(
      uid,
      now, // dtstamp
      BigInt(dateToMicroseconds(formData.dtstart)), // dtstart
      formData.dtend ? BigInt(dateToMicroseconds(formData.dtend)) : null, // dtend
      formData.summary.trim(),
      formData.status || "CONFIRMED",
      organizer,
      formData.categories || null,
      now, // created
      formData.rrule?.trim() || null,
      null, // rdate
      null, // exdate
      null, // recurrence_id
      imageUri || null,
      conference || null,
      structuredLocation || null,
      styledDescription || null,
      formData.calendarUri || null,
    );

    // Convert to JSON using toJson() method
    const eventJson = JSON.stringify(event.toJson());
    const eventBytes = new TextEncoder().encode(eventJson);

    // PUT to homeserver
    const eventPath = `/pub/pubky.app/event/${eventId}`;
    const eventUri = `pubky://${publicKey}${eventPath}`;

    const success = await client.put(eventUri, eventBytes);

    if (!success) {
      throw new AppError({
        code: ErrorCode.HOMESERVER_ERROR,
        message: "Failed to create event on homeserver",
        publicKey,
      });
    }

    logger.service("event", "Event created", { eventUri });
    return eventUri;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError({
      code: ErrorCode.HOMESERVER_ERROR,
      message: "Failed to create event",
      details: error,
      publicKey,
    });

    logError(appError, {
      action: "createEvent",
      userId: publicKey,
    });

    throw appError;
  }
}

/**
 * Upload an image file to homeserver as PubkyAppFile
 * Returns the pubky:// URI of the uploaded file
 */
async function uploadImage(file: File, publicKey: string): Promise<string> {
  const client = PubkyClient.getInstance();

  try {
    // Generate file ID
    const fileId = generateTimestampId();

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    // Upload file blob
    const blobPath = `/pub/pubky.app/blobs/${fileId}`;
    const blobUri = `pubky://${publicKey}${blobPath}`;

    const blobSuccess = await client.put(blobUri, fileBytes);

    if (!blobSuccess) {
      throw new Error("Failed to upload image blob");
    }

    // Create file metadata using PubkyAppFile from pubky-app-specs
    const fileMetadataObj = {
      name: file.name,
      created_at: Date.now() * 1000, // Unix microseconds
      src: blobUri,
      content_type: file.type,
      size: file.size,
    };

    // Use fromJson to create PubkyAppFile instance
    const pubkyFile = PubkyAppFile.fromJson(fileMetadataObj);
    const metadataJson = JSON.stringify(pubkyFile.toJson());
    const metadataBytes = new TextEncoder().encode(metadataJson);

    // Upload file metadata
    const filePath = `/pub/pubky.app/files/${fileId}`;
    const fileUri = `pubky://${publicKey}${filePath}`;

    const metadataSuccess = await client.put(fileUri, metadataBytes);

    if (!metadataSuccess) {
      throw new Error("Failed to upload image metadata");
    }

    logger.service("image", "Image uploaded", { fileUri });
    return fileUri;
  } catch (error) {
    const appError = new AppError({
      code: ErrorCode.HOMESERVER_ERROR,
      message: "Failed to upload image",
      details: error,
      publicKey,
    });

    logError(appError, {
      action: "uploadImage",
      userId: publicKey,
      metadata: { fileName: file.name },
    });

    throw appError;
  }
}

/**
 * Fetch a calendar from homeserver
 */
export async function fetchCalendar(
  calendarUri: string,
): Promise<PubkyAppCalendar | null> {
  const client = PubkyClient.getInstance();

  try {
    const response = await client.get(calendarUri);

    if (!response) {
      return null;
    }

    const text = new TextDecoder().decode(response);
    const calendarData = JSON.parse(text);

    // Use fromJson() to create a proper PubkyAppCalendar instance
    const calendar = PubkyAppCalendar.fromJson(calendarData);

    return calendar;
  } catch (error) {
    logError(
      new AppError({
        code: ErrorCode.INVALID_DATA,
        message: "Failed to parse calendar data",
        details: error,
      }),
      {
        action: "fetchCalendar",
        metadata: { calendarUri },
      },
    );

    return null;
  }
}

/**
 * Fetch an event from homeserver
 */
export async function fetchEvent(
  eventUri: string,
): Promise<PubkyAppEvent | null> {
  const client = PubkyClient.getInstance();

  try {
    const response = await client.get(eventUri);

    if (!response) {
      return null;
    }

    const text = new TextDecoder().decode(response);
    const eventData = JSON.parse(text);

    // Use fromJson() to create a proper PubkyAppEvent instance
    const event = PubkyAppEvent.fromJson(eventData);

    return event;
  } catch (error) {
    logError(
      new AppError({
        code: ErrorCode.INVALID_DATA,
        message: "Failed to parse event data",
        details: error,
      }),
      {
        action: "fetchEvent",
        metadata: { eventUri },
      },
    );

    return null;
  }
}

/**
 * Delete a calendar from homeserver
 */
export async function deleteCalendar(calendarUri: string): Promise<boolean> {
  const client = PubkyClient.getInstance();

  try {
    const success = await client.delete(calendarUri);

    if (success) {
      logger.service("calendar", "Calendar deleted", { calendarUri });
    }

    return success;
  } catch (error) {
    logError(
      new AppError({
        code: ErrorCode.HOMESERVER_ERROR,
        message: "Failed to delete calendar",
        details: error,
      }),
      {
        action: "deleteCalendar",
        metadata: { calendarUri },
      },
    );

    return false;
  }
}

/**
 * Delete an event from homeserver
 */
export async function deleteEvent(eventUri: string): Promise<boolean> {
  const client = PubkyClient.getInstance();

  try {
    const success = await client.delete(eventUri);

    if (success) {
      logger.service("event", "Event deleted", { eventUri });
    }

    return success;
  } catch (error) {
    logError(
      new AppError({
        code: ErrorCode.HOMESERVER_ERROR,
        message: "Failed to delete event",
        details: error,
      }),
      {
        action: "deleteEvent",
        metadata: { eventUri },
      },
    );

    return false;
  }
}
