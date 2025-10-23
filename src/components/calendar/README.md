# Calendar Components

This directory contains components for creating and managing calendars and
events following the pubky-app-specs iCalendar integration (RFC 5545, RFC 7986,
RFC 9073).

## Components

### CalendarModal

Simplified modal form for creating/editing calendars.

**Features:**

- Calendar name (required, max 255 chars)
- Color picker for visual identification
- Image upload for calendar banner (with preview and removal)
- Admin management (add/remove admins)
- Form validation with error messages
- Edit mode with existing data loading
- Creates/updates calendar on homeserver with PubkyAppCalendar type

**Usage:**

```typescript
import { CalendarModal } from "@/components/calendar";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = (calendarUri: string) => {
    toast.success("Calendar created!");
    console.log("Calendar created:", calendarUri);
    // Navigate or refresh data
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Create Calendar
      </button>
      <CalendarModal
        isOpen={isOpen}
        onCloseAction={() => setIsOpen(false)}
        onSuccessAction={handleSuccess}
      />
    </>
  );
}

// Edit mode
function EditCalendar(
  { calendar, calendarUri }: {
    calendar: PubkyAppCalendar;
    calendarUri: string;
  },
) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = (calendarUri: string) => {
    toast.success("Calendar updated!");
    // Refresh data
  };

  return (
    <CalendarModal
      isOpen={isOpen}
      onCloseAction={() => setIsOpen(false)}
      onSuccessAction={handleSuccess}
      calendar={calendar}
      calendarUri={calendarUri}
    />
  );
}
```

### EventFormModal

Modal form for creating/editing events.

**Features:**

- Event title (required, max 255 chars)
- Start and end date/time
- Event status (CONFIRMED, TENTATIVE, CANCELLED)
- Rich text description
- Location search using Nominatim OSM API
- Online meeting/conference link
- Categories/tags
- Recurrence rule (RFC 5545 RRULE format)
- Image upload for event banner
- Form validation with error messages
- Creates event on homeserver with PubkyAppEvent type

**Usage:**

```typescript
import { EventFormModal } from "@/components/calendar";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const calendarUri = "pubky://user/pub/pubky.app/calendar/123";

  const handleSuccess = (eventUri: string) => {
    console.log("Event created:", eventUri);
    // Navigate or refresh data
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Create Event
      </button>
      <EventFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
        defaultCalendarUri={calendarUri}
      />
    </>
  );
}
```

### LocationSearch

Autocomplete location search component using Nominatim OSM API.

**Features:**

- Search locations worldwide
- Debounced search (500ms)
- Autocomplete dropdown with results
- Returns structured location data
- Displays selected location with OpenStreetMap link
- Supports geo: URI format

**Usage:**

```typescript
import { LocationSearch } from "@/components/calendar";
import type { StructuredLocation } from "@/types/calendar";

function MyComponent() {
  const [location, setLocation] = useState<StructuredLocation | undefined>();

  return (
    <LocationSearch
      value={location}
      onChange={setLocation}
      placeholder="Search for a location..."
    />
  );
}
```

**StructuredLocation Format:**

```typescript
{
  uri: "geo:47.366667,8.550000",
  name: "Insider Bar, Zürich, Switzerland",
  description: "Insider Bar, Zürich, Switzerland",
  osm_id: "123456789",
  bitcoin_accepted: true // Optional, for future use
}
```

### ImageUpload

Drag-and-drop image upload component with preview.

**Features:**

- Click to upload or drag-and-drop
- Image preview
- File type validation (JPEG, PNG, WebP, GIF)
- File size validation (default 10MB)
- Change/remove uploaded image
- Follows PubkyAppFile specs for homeserver upload

**Usage:**

```typescript
import { ImageUpload } from "@/components/calendar";

function MyComponent() {
  const [image, setImage] = useState<File | undefined>();

  return (
    <ImageUpload
      value={image}
      onChange={setImage}
      maxSizeMB={10}
      acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
    />
  );
}
```

## Services

### calendar-service.ts

Service layer for calendar/event operations with homeserver.

**Functions:**

- `createCalendar(formData, publicKey)` - Create calendar on homeserver
- `createEvent(formData, publicKey)` - Create event on homeserver
- `fetchCalendar(calendarUri)` - Fetch calendar from homeserver
- `fetchEvent(eventUri)` - Fetch event from homeserver
- `deleteCalendar(calendarUri)` - Delete calendar from homeserver
- `deleteEvent(eventUri)` - Delete event from homeserver

**Internal:**

- `uploadImage(file, publicKey)` - Upload image as PubkyAppFile

## Types

### calendar.ts

TypeScript types matching pubky-app-specs:

- `PubkyAppCalendar` - Calendar type
- `PubkyAppEvent` - Event type
- `EventStatus` - "CONFIRMED" | "TENTATIVE" | "CANCELLED"
- `EventOrganizer` - Organizer object structure
- `EventConference` - Conference/meeting link structure
- `StructuredLocation` - OSM location data structure
- `StyledDescription` - Rich text description structure
- `CalendarFormData` - Calendar form state
- `EventFormData` - Event form state

## Validation

### calendar-validation.ts

Validation utilities:

- `validateCalendarForm(data)` - Validate calendar form data
- `validateEventForm(data)` - Validate event form data
- `generateEventUid(publicKey)` - Generate RFC 5545 UID
- `dateToMicroseconds(date)` - Convert Date to Unix microseconds
- `microsecondsToDate(microseconds)` - Convert Unix microseconds to Date
- `getUserTimezone()` - Get user's IANA timezone
- `formatDate(date)` - Format date for display
- `formatDateForInput(date)` - Format for datetime-local input
- `parseDateFromInput(input)` - Parse from datetime-local input

## Nominatim API

### nominatim-client.ts

OpenStreetMap Nominatim API client:

- `search(query, limit)` - Search locations by query
- `reverse(lat, lon)` - Reverse geocode coordinates
- `getFormattedAddress(result)` - Format address from result
- `createGeoUri(lat, lon)` - Create geo: URI
- `parseGeoUri(uri)` - Parse geo: URI to coordinates

**Rate Limiting:**

Nominatim has usage limits. For production, consider:

- Self-hosting Nominatim instance
- Using alternative geocoding service
- Implementing request caching

## Homeserver Storage Structure

```
/pub/pubky.app/
├── calendar/:calendar_id     # Calendar metadata (13-char timestamp ID)
├── event/:event_id          # Event data (13-char timestamp ID)
├── files/:file_id           # File metadata
└── blobs/:blob_id           # Raw file blobs
```

**Example URIs:**

```
pubky://user123/pub/pubky.app/calendar/0033RCZXVEPNG
pubky://user123/pub/pubky.app/event/0033SCZXVEPNG
pubky://user123/pub/pubky.app/files/0033FCZXVEPNG
pubky://user123/pub/pubky.app/blobs/0033BCZXVEPNG
```

## Future Enhancements

### Planned Features

- Edit existing calendars/events
- Delete calendars/events
- Event attendee management (RSVP)
- Alarm/reminder creation
- Recurrence rule builder UI
- Calendar color themes
- Event templates
- Import/export iCalendar (.ics)
- CalDAV bridge

### Nexus Integration

When Nexus indexing is ready:

- Fetch calendars/events from Nexus API
- Event discovery with filters (location, tags, date range)
- Calendar discovery
- User calendar lists
- Attendee lists and RSVP status

## RFC Standards

This implementation follows:

- **RFC 5545** - iCalendar Core (VEVENT, VCALENDAR)
- **RFC 7986** - New iCalendar Properties (NAME, COLOR, IMAGE, CONFERENCE)
- **RFC 9073** - Event Publishing Extensions (STRUCTURED-LOCATION,
  STYLED-DESCRIPTION)

## Testing

To test the components:

```bash
npm run dev
```

1. Open http://localhost:3000
2. Log in with Pubky Ring
3. Open Calendar/Event form modal
4. Fill in required fields
5. Upload optional image
6. Search for location (requires internet)
7. Submit form
8. Check browser console for created URIs
9. Verify data on homeserver using Pubky SDK

## Troubleshooting

### Form validation errors

- Check required fields are filled
- Verify date/time formats
- Ensure end date is after start date
- Check RRULE syntax if provided

### Location search not working

- Check internet connection
- Verify Nominatim API is accessible
- Try more specific search query
- Check browser console for errors

### Image upload fails

- Check file size (must be < 10MB)
- Verify file format (JPEG, PNG, WebP, GIF)
- Ensure user is logged in
- Check homeserver connection

### Calendar/Event not created

- Verify user is authenticated
- Check browser console for errors
- Verify homeserver is accessible
- Check pubky-client configuration
