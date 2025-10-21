"use client";

import { useState } from "react";
import { PubkyAppCalendar } from "pubky-app-specs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { CalendarFormModal } from "./CalendarFormModal";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import { deleteCalendar } from "@/services/calendar-service";
import { fetchCalendarMetadata } from "@/services/calendar-fetch-service";
import { useCalendarImage } from "@/utils/calendar-image";
import { toast } from "sonner";
import { logError } from "@/lib/error-logger";
import { AppError, ErrorCode } from "@/types/errors";

interface CalendarHeaderProps {
  calendar: PubkyAppCalendar;
  calendarUri: string;
  isAdmin: boolean;
  onCalendarUpdated: (calendar: PubkyAppCalendar) => void;
  onCalendarDeleted: () => void;
}

export function CalendarHeader({
  calendar,
  calendarUri,
  isAdmin,
  onCalendarUpdated,
  onCalendarDeleted,
}: CalendarHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract owner public key from URI
  const ownerPublicKey = calendarUri.split("/")[2].replace("pubky://", "");

  // Fetch calendar image from Nexus
  const { imageUrl } = useCalendarImage(calendar.image_uri, ownerPublicKey);

  const handleEditSuccess = async () => {
    // Refetch calendar data after edit
    const parts = calendarUri.split("/");
    if (parts.length >= 7) {
      const authorId = parts[2].replace("pubky://", "");
      const calendarId = parts[6];
      try {
        const updated = await fetchCalendarMetadata(authorId, calendarId);
        if (updated) {
          onCalendarUpdated(updated);
        }
      } catch (error) {
        console.error("Failed to refetch calendar:", error);
      }
    }
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const success = await deleteCalendar(calendarUri);

      if (!success) {
        throw new AppError({
          code: ErrorCode.HOMESERVER_ERROR,
          message: "Failed to delete calendar",
        });
      }

      onCalendarDeleted();
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError({
        code: ErrorCode.UNKNOWN_ERROR,
        message: "Failed to delete calendar",
        details: error,
      });

      logError(appError, {
        component: "CalendarHeader",
        action: "handleDelete",
        metadata: { calendarUri },
      });

      toast.error(appError.getUserMessage());
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Use image if available, otherwise fall back to color
  const backgroundStyle = !imageUrl && calendar.color
    ? { backgroundColor: calendar.color }
    : { backgroundColor: "#3B82F6" };

  return (
    <>
      <div className="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        {/* Header Image/Color Background */}
        <div
          className="h-48 w-full relative"
          style={imageUrl ? undefined : backgroundStyle}
        >
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={calendar.name || "Calendar banner"}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* 3-Dot Menu (Admin Only) */}
          {isAdmin && (
            <div className="absolute top-4 right-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/90 hover:bg-white dark:bg-neutral-900/90 dark:hover:bg-neutral-900"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setIsEditModalOpen(true)}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Calendar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Calendar Info */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            {calendar.name || "Unnamed Calendar"}
          </h1>
        </div>
      </div>

      {/* Edit Modal */}
      {isAdmin && (
        <CalendarFormModal
          key={`${calendarUri}-${calendar.created}-${calendar.image_uri}`}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          initialData={calendar}
          mode="edit"
          calendarUri={calendarUri}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Calendar"
        description={`Are you sure you want to delete "${
          calendar.name || "this calendar"
        }"? This action cannot be undone and will remove all associated events.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}
