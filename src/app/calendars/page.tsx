"use client";

import { useCalendars, nexusCalendarsToSerializable } from "@/hooks/use-calendars";
import { CalendarCard } from "@/components/calendar/CalendarCard";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export default function CalendarDiscoveryPage() {
  const { data: nexusCalendars, isLoading, error } = useCalendars();

  // Convert Nexus calendars to serializable format for CalendarCard
  const calendars = nexusCalendars ? nexusCalendarsToSerializable(nexusCalendars) : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Calendars</h1>
        <p className="text-muted-foreground">
          Browse public calendars from the Pubky network
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading calendars...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium mb-2">Failed to load calendars</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !error && calendars.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-lg mb-2">No public calendars found</p>
          <p className="text-sm text-muted-foreground">
            Check back later as more calendars are published to the network
          </p>
        </div>
      )}

      {!isLoading && !error && calendars.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {calendars.map((calendar) => (
            <CalendarCard
              key={calendar.uri}
              authorId={calendar.authorId}
              calendarId={calendar.calendarId}
              calendar={calendar.calendar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
