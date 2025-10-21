"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "./ImageUpload";
import { LocationSearch } from "./LocationSearch";
import {
  formatDateForInput,
  parseDateFromInput,
  validateEventForm,
} from "@/lib/calendar-validation";
import { createEvent } from "@/services/calendar-service";
import type {
  EventFormData,
  EventStatus,
  PubkyAppEvent,
} from "@/types/calendar";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  FileText,
  MapPin,
  Repeat,
  Tag,
  Video,
  X,
} from "lucide-react";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (eventUri: string) => void;
  initialData?: PubkyAppEvent; // For editing (future)
  defaultCalendarUri?: string; // Pre-select calendar
  mode?: "create" | "edit";
}

/**
 * EventFormModal Component
 *
 * Modal form for creating/editing events
 * Follows pubky-app-specs Event type definition
 */
export function EventFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultCalendarUri,
  mode = "create",
}: EventFormModalProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categoryInput, setCategoryInput] = useState("");

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    summary: "",
    dtstart: new Date(),
    status: "CONFIRMED",
    categories: [],
    calendarUri: defaultCalendarUri,
  });

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      // TODO: Parse initial data when editing is implemented
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validation = validateEventForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error("Please fix the errors in the form");
      return;
    }

    // Check authentication
    if (!user?.publicKey) {
      toast.error("You must be logged in to create an event");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const eventUri = await createEvent(formData, user.publicKey);
      toast.success("Event created successfully!");

      // Reset form
      resetForm();

      onSuccess?.(eventUri);
      onClose();
    } catch (error) {
      console.error("Failed to create event:", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      summary: "",
      dtstart: new Date(),
      status: "CONFIRMED",
      categories: [],
      calendarUri: defaultCalendarUri,
    });
    setErrors({});
    setCategoryInput("");
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handleAddCategory = () => {
    if (
      categoryInput.trim() &&
      !formData.categories?.includes(categoryInput.trim())
    ) {
      setFormData({
        ...formData,
        categories: [...(formData.categories || []), categoryInput.trim()],
      });
      setCategoryInput("");
    }
  };

  const handleRemoveCategory = (category: string) => {
    setFormData({
      ...formData,
      categories: formData.categories?.filter((c) => c !== category),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {mode === "create" ? "Create Event" : "Edit Event"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Event Title */}
          <div>
            <label
              htmlFor="summary"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              id="summary"
              type="text"
              value={formData.summary}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })}
              placeholder="e.g., Bitcoin Meetup Zürich"
              className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.summary
                  ? "border-red-500"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
              maxLength={255}
            />
            {errors.summary && (
              <p className="mt-1 text-sm text-red-600">{errors.summary}</p>
            )}
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {formData.summary.length}/255 characters
            </p>
          </div>

          {/* Date/Time Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label
                htmlFor="dtstart"
                className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                <Clock className="h-4 w-4" />
                Start Date/Time <span className="text-red-500">*</span>
              </label>
              <input
                id="dtstart"
                type="datetime-local"
                value={formatDateForInput(formData.dtstart)}
                onChange={(e) => {
                  const date = parseDateFromInput(e.target.value);
                  if (date) {
                    setFormData({ ...formData, dtstart: date });
                  }
                }}
                className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.dtstart
                    ? "border-red-500"
                    : "border-neutral-300 dark:border-neutral-700"
                }`}
              />
              {errors.dtstart && (
                <p className="mt-1 text-sm text-red-600">{errors.dtstart}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label
                htmlFor="dtend"
                className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                <Clock className="h-4 w-4" />
                End Date/Time (Optional)
              </label>
              <input
                id="dtend"
                type="datetime-local"
                value={formData.dtend ? formatDateForInput(formData.dtend) : ""}
                onChange={(e) => {
                  const date = parseDateFromInput(e.target.value);
                  setFormData({ ...formData, dtend: date || undefined });
                }}
                className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.dtend
                    ? "border-red-500"
                    : "border-neutral-300 dark:border-neutral-700"
                }`}
              />
              {errors.dtend && (
                <p className="mt-1 text-sm text-red-600">{errors.dtend}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Event Status
            </label>
            <select
              id="status"
              value={formData.status || "CONFIRMED"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as EventStatus,
                })}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="CONFIRMED">Confirmed</option>
              <option value="TENTATIVE">Tentative</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              <FileText className="h-4 w-4" />
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })}
              placeholder="Add event details, agenda, requirements, etc."
              rows={4}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Supports HTML formatting (will be converted to styled description)
            </p>
          </div>

          {/* Location Search */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              <MapPin className="h-4 w-4" />
              Location (Optional)
            </label>
            <LocationSearch
              value={formData.structuredLocation}
              onChange={(location) =>
                setFormData({ ...formData, structuredLocation: location })}
              placeholder="Search for venue or location..."
            />
          </div>

          {/* Conference Link */}
          <div>
            <label
              htmlFor="conferenceUri"
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              <Video className="h-4 w-4" />
              Online Meeting Link (Optional)
            </label>
            <input
              id="conferenceUri"
              type="url"
              value={formData.conferenceUri || ""}
              onChange={(e) =>
                setFormData({ ...formData, conferenceUri: e.target.value })}
              placeholder="https://meet.jit.si/bitcoin-zurich"
              className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.conferenceUri
                  ? "border-red-500"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
            />
            {errors.conferenceUri && (
              <p className="mt-1 text-sm text-red-600">
                {errors.conferenceUri}
              </p>
            )}
            <input
              type="text"
              value={formData.conferenceLabel || ""}
              onChange={(e) =>
                setFormData({ ...formData, conferenceLabel: e.target.value })}
              placeholder="Meeting label (e.g., 'Jitsi Meeting')"
              className="w-full mt-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categories/Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              <Tag className="h-4 w-4" />
              Categories (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="Add category (e.g., bitcoin, meetup)"
                className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCategory}
              >
                Add
              </Button>
            </div>
            {formData.categories && formData.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.categories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {category}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(category)}
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recurrence Rule */}
          <div>
            <label
              htmlFor="rrule"
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              <Repeat className="h-4 w-4" />
              Recurrence Rule (Optional)
            </label>
            <input
              id="rrule"
              type="text"
              value={formData.rrule || ""}
              onChange={(e) =>
                setFormData({ ...formData, rrule: e.target.value })}
              placeholder="e.g., FREQ=WEEKLY;BYDAY=WE"
              className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.rrule
                  ? "border-red-500"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
            />
            {errors.rrule && (
              <p className="mt-1 text-sm text-red-600">{errors.rrule}</p>
            )}
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              RFC 5545 recurrence rule format. Example:
              FREQ=WEEKLY;BYDAY=MO,WE,FR
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Event Image (Optional)
            </label>
            <ImageUpload
              value={formData.imageFile}
              onChange={(file) => setFormData({ ...formData, imageFile: file })}
            />
          </div>

          {/* Calendar Association Note */}
          {!formData.calendarUri && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong>{" "}
                This event will be created as a standalone event without a
                calendar association. You can link it to a calendar later or
                create events from within a specific calendar.
              </p>
            </div>
          )}

          {formData.calendarUri && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-900 dark:text-green-100">
                <strong>Calendar:</strong>{" "}
                This event will be associated with the selected calendar.
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1 font-mono truncate">
                {formData.calendarUri}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !user}
              className="flex-1"
            >
              {isSubmitting
                ? "Creating..."
                : mode === "create"
                ? "Create Event"
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
