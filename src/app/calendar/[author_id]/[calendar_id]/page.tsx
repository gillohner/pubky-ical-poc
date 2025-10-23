"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { fetchCalendarMetadata } from "@/services/calendar-fetch-service";
import { PubkyAppCalendar } from "pubky-app-specs";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarAdmins } from "@/components/calendar/CalendarAdmins";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { EventFormModal } from "@/components/calendar/EventFormModal";
import { AppError, ErrorCode } from "@/types/errors";
import { logError } from "@/lib/error-logger";
import { getEventPageUrl } from "@/utils/pubky-uri";
import { toast } from "sonner";

interface CalendarPageProps {
  params: Promise<{
    author_id: string;
    calendar_id: string;
  }>;
}

export default function CalendarPage({ params }: CalendarPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [calendar, setCalendar] = useState<PubkyAppCalendar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Owner is the creator of the calendar (author_id)
  const isOwner = Boolean(
    isAuthenticated &&
      user?.publicKey &&
      resolvedParams.author_id === user.publicKey,
  );

  // Admin is someone in x_pubky_admins list (but NOT the owner - owner has separate rights)
  const isAdmin = Boolean(
    isAuthenticated &&
      user?.publicKey &&
      calendar?.x_pubky_admins?.includes(`pubky://${user.publicKey}`) ===
        true &&
      !isOwner,
  );

  // Owner has all admin rights plus ability to edit calendar
  const canEditCalendar = isOwner;

  // Both owner and admins can create events
  const canCreateEvents = isOwner || isAdmin;
  // Fetch calendar metadata
  useEffect(() => {
    async function loadCalendar() {
      setIsLoading(true);
      setError(null);

      try {
        const calendarData = await fetchCalendarMetadata(
          resolvedParams.author_id,
          resolvedParams.calendar_id,
        );

        if (!calendarData) {
          setError("Calendar not found");
          return;
        }

        setCalendar(calendarData);
      } catch (err) {
        const appError = err instanceof AppError ? err : new AppError({
          code: ErrorCode.UNKNOWN_ERROR,
          message: "Failed to load calendar",
          details: err,
        });

        logError(appError, {
          component: "CalendarPage",
          action: "loadCalendar",
          metadata: {
            authorId: resolvedParams.author_id,
            calendarId: resolvedParams.calendar_id,
          },
        });

        setError(appError.getUserMessage());
      } finally {
        setIsLoading(false);
      }
    }

    loadCalendar();
  }, [resolvedParams.author_id, resolvedParams.calendar_id]);

  const handleCalendarUpdated = (updatedCalendar: PubkyAppCalendar) => {
    setCalendar(updatedCalendar);
    toast.success("Calendar updated!");
  };

  const handleCalendarDeleted = () => {
    toast.success("Calendar deleted!");
    router.push("/my-calendars");
  };

  const handleEventCreated = (eventUri: string) => {
    console.log("Event created:", eventUri);
    toast.success("Event created!");

    // Get event page URL
    const pageUrl = getEventPageUrl(eventUri);
    if (pageUrl) {
      console.log(`Event created at: ${pageUrl}`);

      // TODO: Redirect to event detail page when implemented
      // router.push(pageUrl);

      // For now, refresh the current page to show updated event count
      // TODO: Refresh events list when events section is implemented
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          <span className="ml-3 text-neutral-600 dark:text-neutral-400">
            Loading calendar...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !calendar) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            {error || "Calendar not found"}
          </h1>
          <Button onClick={() => router.push("/calendars")} variant="outline">
            Back to Calendars
          </Button>
        </div>
      </div>
    );
  }

  const calendarUri =
    `pubky://${resolvedParams.author_id}/pub/pubky.app/calendar/${resolvedParams.calendar_id}`;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Calendar Header with Image/Color, Name, Actions */}
      <CalendarHeader
        calendarName={calendar.name || ""}
        calendarColor={calendar.color}
        calendarImageUri={calendar.image_uri}
        calendarCreated={calendar.created?.toString() || ""}
        calendarUri={calendarUri}
        isAdmin={canEditCalendar}
        calendar={calendar}
        onCalendarUpdatedAction={handleCalendarUpdated}
        onCalendarDeletedAction={handleCalendarDeleted}
      />

      {/* Calendar Info Section */}
      <div className="mt-8 grid md:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="md:col-span-2">
          {/* New Event Button (Owner and Admins) */}
          {canCreateEvents && (
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Events</h2>
              <Button
                onClick={() => setIsEventModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Event</span>
              </Button>
            </div>
          )}

          {/* Events List Placeholder */}
          <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-8 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              Event listing coming soon...
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Calendar Details */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Details
            </h3>
            <div className="space-y-2 text-sm">
              {calendar.timezone && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Timezone:
                  </span>
                  <span className="ml-2 text-neutral-900 dark:text-neutral-100">
                    {calendar.timezone}
                  </span>
                </div>
              )}
              {calendar.created && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Created:
                  </span>
                  <span className="ml-2 text-neutral-900 dark:text-neutral-100">
                    {new Date(Number(calendar.created) / 1000)
                      .toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Calendar Admins (filtered to exclude owner) */}
          <CalendarAdmins
            admins={calendar.x_pubky_admins || []}
            ownerPubkyUri={`pubky://${resolvedParams.author_id}`}
            calendarName={calendar.name || "Calendar"}
          />
        </div>
      </div>

      {/* Event Creation Modal */}
      <EventFormModal
        isOpen={isEventModalOpen}
        onCloseAction={() => setIsEventModalOpen(false)}
        onSuccessAction={handleEventCreated}
        defaultCalendarUri={calendarUri}
      />
    </div>
  );
}
