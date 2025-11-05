"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { useCalendar, useCalendarEvents } from "@/hooks/use-calendars";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarAdmins } from "@/components/calendar/CalendarAdmins";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";
import { EventFormModal } from "@/components/calendar/EventFormModal";
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
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Fetch calendar metadata from Nexus
  const {
    data: nexusCalendar,
    isLoading: isLoadingCalendar,
    error: calendarError,
  } = useCalendar(resolvedParams.author_id, resolvedParams.calendar_id);

  // Fetch events for this calendar from Nexus
  const {
    data: nexusEvents,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useCalendarEvents(resolvedParams.calendar_id);

  // Convert Nexus calendar to serializable format for components
  const calendar = nexusCalendar ? {
    name: nexusCalendar.name,
    timezone: nexusCalendar.timezone,
    color: nexusCalendar.color,
    image_uri: nexusCalendar.image_uri,
    x_pubky_admins: nexusCalendar.x_pubky_admins?.map(admin => `pubky://${admin}`) || [],
    created: nexusCalendar.created?.toString(),
  } : null;

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

  const handleCalendarUpdated = async () => {    
    // Invalidate and refetch the calendar query
    await queryClient.invalidateQueries({
      queryKey: ["calendars", "detail", resolvedParams.author_id, resolvedParams.calendar_id],
    });
    toast.success("Calendar updated!");
  };

  const handleCalendarDeleted = () => {
    toast.success("Calendar deleted!");
    router.push("/my-calendars");
  };

  const handleEventCreated = (eventUri: string) => {
    console.log("Event created:", eventUri);
    toast.success("Event created!");

    // Refetch events
    queryClient.invalidateQueries({
      queryKey: ["events", "calendar", resolvedParams.calendar_id],
    });

    // Get event page URL
    const pageUrl = getEventPageUrl(eventUri);
    if (pageUrl) {
      console.log(`Event created at: ${pageUrl}`);

      // TODO: Redirect to event detail page when implemented
      // router.push(pageUrl);
    }
  };

  // Loading state
  if (isLoadingCalendar) {
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
  if (calendarError || !calendar) {
    const errorMessage = calendarError instanceof Error
      ? calendarError.message
      : "Calendar not found";

    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            {errorMessage}
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

          {/* Events List */}
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
              <span className="ml-3 text-neutral-600 dark:text-neutral-400">
                Loading events... 
              </span>
            </div>
          ) : eventsError ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <p className="text-red-600 dark:text-red-400 mb-2">Failed to load events</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {eventsError instanceof Error ? eventsError.message : "Unknown error"}
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                The backend may have data format issues. Events feature is under development.
              </p>
            </div>
          ) : !nexusEvents || nexusEvents.length === 0 ? (
            <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-8 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
              <p className="text-neutral-600 dark:text-neutral-400">
                No events yet. {canCreateEvents ? "Create your first event!" : ""}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {nexusEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                >
                  <h3 className="text-lg font-semibold mb-2">
                    {event.summary || "Untitled Event"}
                  </h3>
                  
                  {event.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    {/* Date/Time */}
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 text-neutral-500 shrink-0" />
                      <div>
                        <div className="text-neutral-900 dark:text-neutral-100">
                          {new Date(event.start_date).toLocaleString()}
                        </div>
                        {event.end_date && (
                          <div className="text-neutral-600 dark:text-neutral-400">
                            to {new Date(event.end_date).toLocaleString()}
                          </div>
                        )}
                        {event.all_day && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded ml-2">
                            All Day
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {event.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-neutral-500 shrink-0" />
                        <div className="text-neutral-700 dark:text-neutral-300">
                          {event.location.name || event.location.address || "Location"}
                          {event.location.uri && (
                            <a
                              href={event.location.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Link
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status & Tags */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {event.status && (
                        <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded">
                          {event.status}
                        </span>
                      )}
                      {event.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                      {event.recurrence_rule && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                          Recurring
                        </span>
                      )}
                    </div>

                    {/* Raw Data (for debugging) */}
                    <details className="mt-3">
                      <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300">
                        View Raw Data
                      </summary>
                      <pre className="mt-2 text-xs bg-neutral-100 dark:bg-neutral-900 p-3 rounded overflow-x-auto">
                        {JSON.stringify(event, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
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
