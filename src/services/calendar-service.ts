/**
 * Calendar Service
 *
 * Handles calendar and event operations with homeserver
 * Follows pubky-app-specs for Calendar and Event types
 */

import { PubkyClient } from "@/lib/pubky-client";
import { PubkyAppCalendar, PubkyAppEvent, PubkyAppFile, PubkyAppBlob } from "pubky-app-specs";
import type { CalendarFormData, EventFormData } from "@/types/calendar";
import { AppError, ErrorCode } from "@/types/errors";
import { logError } from "@/lib/error-logger";
import { logger } from "@/lib/logger";
import { blake3 } from "@noble/hashes/blake3.js";
// @ts-ignore - no types available for base32-encode
import base32Encode from "base32-encode";
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
 * Used for PubkyAppFile (not for PubkyAppBlob which uses HashId)
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

    // PUT to homeserver using relative path (authenticated write)
    const calendarPath = `/pub/pubky.app/calendar/${calendarId}`;

    const success = await client.put(calendarPath, calendarBytes);

    if (!success) {
      throw new AppError({
        code: ErrorCode.HOMESERVER_ERROR,
        message: "Failed to create calendar on homeserver",
        publicKey,
      });
    }

    // Return the full pubky URI for reference
    const calendarUri = `pubky://${publicKey}${calendarPath}`;
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

    // Extract path from URI for authenticated write
    // calendarUri is like "pubky://<pubkey>/pub/pubky.app/calendar/ABC"
    const calendarPath = calendarUri.split(publicKey)[1]; // Gets "/pub/pubky.app/calendar/ABC"
    const success = await client.put(calendarPath, calendarBytes);

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

    // PUT to homeserver using relative path (authenticated write)
    const eventPath = `/pub/pubky.app/event/${eventId}`;
    const success = await client.put(eventPath, eventBytes);

    if (!success) {
      throw new AppError({
        code: ErrorCode.HOMESERVER_ERROR,
        message: "Failed to create event on homeserver",
        publicKey,
      });
    }

    // Return the full pubky URI for reference
    const eventUri = `pubky://${publicKey}${eventPath}`;
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
 * Create a blob ID from file bytes using Blake3 hash (matches HashId trait)
 * This is identical to the Rust implementation in pubky-app-specs
 * TODO: PR in pubky-app-specs to expose this function directly
 */
function createBlobId(data: Uint8Array): string {
  // Create Blake3 hash of the blob data
  const hash = blake3(data);
  
  // Get first half of the hash bytes (16 bytes)
  const halfHash = hash.slice(0, hash.length / 2);
  
  // Encode in Crockford Base32 (same as Rust implementation)
  const blobId = base32Encode(halfHash, "Crockford", { padding: false });
  
  return blobId;
}

/**
 * Upload an image file to homeserver using PubkyAppBlob and PubkyAppFile
 * Returns the pubky:// URI of the uploaded file metadata
 * 
 * Process:
 * 1. Create PubkyAppBlob from file bytes (blob ID is hash-based)
 * 2. Upload blob to /pub/pubky.app/blobs/:blob_id
 * 3. Create PubkyAppFile metadata (file ID is timestamp-based)
 * 4. Upload file metadata to /pub/pubky.app/files/:file_id
 */
async function uploadImage(file: File, publicKey: string): Promise<string> {
  const client = PubkyClient.getInstance();

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    // Generate blob ID from hash of file bytes (HashId trait)
    const blobId = createBlobId(fileBytes);

    console.log("📋 BLOB: Creating blob with hash-based ID:", blobId, `(${blobId.length} chars)`);

    // Create PubkyAppBlob from file bytes using pubky-app-specs
    const blobArray = Array.from(fileBytes);
    const blob = PubkyAppBlob.fromJson(blobArray);

    // Upload blob to homeserver using relative path (authenticated write)
    const blobPath = `/pub/pubky.app/blobs/${blobId}`;

    // Get blob data as Uint8Array for upload
    const blobData = blob.data; // Returns Uint8Array from WASM
    const blobSuccess = await client.put(blobPath, blobData);

    if (!blobSuccess) {
      throw new Error("Failed to upload image blob");
    }

    const blobUri = `pubky://${publicKey}${blobPath}`;
    console.log("📋 BLOB: Blob uploaded successfully to", blobUri);

    // Generate timestamp-based ID for file metadata (TimestampId trait)
    const fileId = generateTimestampId();

    console.log("📄 FILE: Creating file metadata with timestamp-based ID:", fileId, `(${fileId.length} chars)`);

    // Create PubkyAppFile metadata using pubky-app-specs
    // The file uses TimestampId trait, different from blob's HashId
    const fileMetadata = {
      name: file.name,
      created_at: Date.now() * 1000, // Unix microseconds
      src: blobUri, // Points to the blob URI
      content_type: file.type,
      size: file.size,
    };

    const pubkyFile = PubkyAppFile.fromJson(fileMetadata);
    
    // Convert to JSON and upload using relative path (authenticated write)
    const metadataJson = JSON.stringify(pubkyFile.toJson());
    const metadataBytes = new TextEncoder().encode(metadataJson);

    const filePath = `/pub/pubky.app/files/${fileId}`;
    const metadataSuccess = await client.put(filePath, metadataBytes);

    if (!metadataSuccess) {
      throw new Error("Failed to upload image metadata");
    }

    const fileUri = `pubky://${publicKey}${filePath}`;
    logger.service("image", "Image uploaded", { fileUri, blobId, fileId });
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
    // Convert pubky://<pk>/path to pubky<pk>/path format for SDK 0.6.0
    const address = calendarUri.replace("pubky://", "pubky");
    const response = await client.get(address);

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
    // Convert pubky://<pk>/path to pubky<pk>/path format for SDK 0.6.0
    const address = eventUri.replace("pubky://", "pubky");
    const response = await client.get(address);

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
    // Extract the path from the URI for authenticated delete
    // calendarUri is like "pubky://<pk>/pub/pubky.app/calendar/ABC"
    const pathMatch = calendarUri.match(/pubky:\/\/[^/]+(.+)/);
    const path = pathMatch ? pathMatch[1] : calendarUri;
    
    const success = await client.delete(path);

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
    // Extract the path from the URI for authenticated delete
    const pathMatch = eventUri.match(/pubky:\/\/[^/]+(.+)/);
    const path = pathMatch ? pathMatch[1] : eventUri;
    
    const success = await client.delete(path);

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
