"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import {
  CalendarListItem,
  fetchUserCalendars,
} from "@/services/calendar-list-service";
import { CalendarCard } from "@/components/calendar/CalendarCard";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Loader2, Plus } from "lucide-react";
import { AppError, ErrorCode } from "@/types/errors";
import { logError } from "@/lib/error-logger";
import { CalendarFormModal } from "@/components/calendar";
import { handleCalendarCreated } from "@/utils/calendar-redirect";

export default function MyCalendarsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [calendars, setCalendars] = useState<CalendarListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Fetch user's calendars when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.publicKey) {
      return;
    }

    async function loadCalendars() {
      setIsLoading(true);
      setError(null);

      try {
        const userCalendars = await fetchUserCalendars(user!.publicKey);
        setCalendars(userCalendars);
      } catch (err) {
        const appError = err instanceof AppError ? err : new AppError({
          code: ErrorCode.UNKNOWN_ERROR,
          message: "Failed to load calendars",
          details: err,
        });

        logError(appError, {
          component: "MyCalendarsPage",
          action: "loadCalendars",
          userId: user?.publicKey,
        });

        setError(appError.getUserMessage());
      } finally {
        setIsLoading(false);
      }
    }

    loadCalendars();
  }, [isAuthenticated, user]);

  const onCalendarCreated = (calendarUri: string) => {
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
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  if (user?.publicKey) {
                    setIsLoading(true);
                    fetchUserCalendars(user.publicKey)
                      .then(setCalendars)
                      .catch((err) => {
                        setError(
                          err instanceof AppError
                            ? err.getUserMessage()
                            : "Failed to load calendars",
                        );
                      })
                      .finally(() => setIsLoading(false));
                  }
                }}
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
      <CalendarFormModal
        isOpen={isCreateModalOpen}
        onCloseAction={() => setIsCreateModalOpen(false)}
        onSuccessAction={onCalendarCreated}
      />
    </div>
  );
}
