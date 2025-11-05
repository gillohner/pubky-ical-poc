"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useUserCalendars, nexusCalendarsToSerializable } from "@/hooks/use-calendars";
import { CalendarCard } from "@/components/calendar/CalendarCard";
import { Button } from "@/components/ui/Button";
import { Calendar as CalendarIcon, Loader2, Plus } from "lucide-react";
import { CalendarModal } from "@/components/calendar";
import { handleCalendarCreated } from "@/utils/calendar-redirect";
import { toast } from "sonner";
import { useState } from "react";

export default function MyCalendarsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch user's calendars using React Query
  const { data: nexusCalendars, isLoading, error, refetch } = useUserCalendars(user?.publicKey);

  // Convert Nexus calendars to serializable format
  const calendars = nexusCalendars ? nexusCalendarsToSerializable(nexusCalendars) : [];

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const onCalendarCreated = (calendarUri: string) => {
    toast.success("Calendar created!");
    // Refetch calendars after creating a new one
    refetch();
    handleCalendarCreated(calendarUri, router);
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Calendars</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Manage your calendars and events
            </p>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Calendar</span>
          </Button>
        </div>

        {/* Content */}
        {isLoading
          ? (
            /* Loading */
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
              <span className="ml-3 text-neutral-600 dark:text-neutral-400">
                Loading your calendars...
              </span>
            </div>
          )
          : error
          ? (
            /* Error */
            <div className="border border-red-200 dark:border-red-800 rounded-lg p-8 text-center bg-red-50 dark:bg-red-950/20">
              <p className="text-red-600 dark:text-red-400">
                {error instanceof Error ? error.message : "Failed to load calendars"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch()}
              >
                Try Again
              </Button>
            </div>
          )
          : calendars.length === 0
          ? (
            /* Empty State */
            <div className="border rounded-lg p-12 text-center bg-neutral-50 dark:bg-neutral-900">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
              <h2 className="text-xl font-semibold mb-2">No calendars yet</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                Create your first calendar to start organizing and sharing
                events.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Calendar
              </Button>
            </div>
          )
          : (
            /* Calendar Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {calendars.map((item) => (
                <CalendarCard
                  key={item.uri}
                  authorId={item.authorId}
                  calendarId={item.calendarId}
                  calendar={item.calendar}
                />
              ))}
            </div>
          )}
      </div>

      {/* Create Calendar Modal */}
      <CalendarModal
        isOpen={isCreateModalOpen}
        onCloseAction={() => setIsCreateModalOpen(false)}
        onSuccessAction={onCalendarCreated}
      />
    </div>
  );
}
