"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "./ImageUpload";
import {
  getUserTimezone,
  validateCalendarForm,
} from "@/lib/calendar-validation";
import { createCalendar, updateCalendar } from "@/services/calendar-service";
import type { CalendarFormData, PubkyAppCalendar } from "@/types/calendar";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { Calendar, Globe, Palette, Plus, Users, X } from "lucide-react";

interface CalendarFormModalProps {
  isOpen: boolean;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  onSuccess?: (calendarUri: string) => void;
  initialData?: PubkyAppCalendar; // For editing
  mode?: "create" | "edit";
  calendarUri?: string; // Required for edit mode
}

/**
 * CalendarFormModal Component
 *
 * Modal form for creating/editing calendars
 * Follows pubky-app-specs Calendar type definition
 */
export function CalendarFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  mode = "create",
  calendarUri,
}: CalendarFormModalProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<CalendarFormData>({
    name: "",
    color: "#3B82F6", // Default blue
    timezone: getUserTimezone(),
  });

  // Admin management state
  const [adminUris, setAdminUris] = useState<string[]>([]);
  const [newAdminInput, setNewAdminInput] = useState("");

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        color: initialData.color,
        timezone: initialData.timezone,
      });
      setAdminUris(initialData.x_pubky_admins || []);
    } else if (user?.publicKey && mode === "create") {
      // Initialize with current user as admin for new calendars
      setAdminUris([`pubky://${user.publicKey}`]);
    }
  }, [initialData, user, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validation = validateCalendarForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Check authentication
    if (!user?.publicKey) {
      toast.error("You must be logged in to create a calendar");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const formDataWithAdmins = { ...formData, x_pubky_admins: adminUris };

      if (mode === "edit" && calendarUri && initialData) {
        // Update existing calendar, preserve existing image if no new one uploaded
        await updateCalendar(
          calendarUri,
          formDataWithAdmins,
          user.publicKey,
          initialData.image_uri,
        );
        toast.success("Calendar updated successfully!");
        onSuccess?.(calendarUri);
      } else {
        // Create new calendar
        const newCalendarUri = await createCalendar(
          formDataWithAdmins,
          user.publicKey,
        );
        toast.success("Calendar created successfully!");
        onSuccess?.(newCalendarUri);
      }

      // Reset form
      setFormData({
        name: "",
        color: "#3B82F6",
        timezone: getUserTimezone(),
      });
      setAdminUris([]);

      onClose();
    } catch (error) {
      console.error(
        `Failed to ${mode} calendar:`,
        error,
      );
      toast.error(`Failed to ${mode} calendar. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      name: "",
      color: "#3B82F6",
      timezone: getUserTimezone(),
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {mode === "create" ? "Create Calendar" : "Edit Calendar"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Calendar Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Calendar Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Bitcoin Switzerland Events"
              className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name
                  ? "border-red-500"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
              maxLength={255}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {formData.name.length}/255 characters
            </p>
          </div>

          {/* Color */}
          <div>
            <label
              htmlFor="color"
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              <Palette className="h-4 w-4" />
              Calendar Color
            </label>
            <div className="flex gap-2 items-center">
              <input
                id="color"
                type="color"
                value={formData.color || "#3B82F6"}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20 cursor-pointer rounded border border-neutral-300 dark:border-neutral-700"
              />
              <input
                type="text"
                value={formData.color || ""}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.color && (
              <p className="mt-1 text-sm text-red-600">{errors.color}</p>
            )}
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Choose a color to visually identify your calendar
            </p>
          </div>

          {/* Timezone */}
          <div>
            <label
              htmlFor="timezone"
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              <Globe className="h-4 w-4" />
              Timezone
            </label>
            <select
              id="timezone"
              value={formData.timezone || getUserTimezone()}
              onChange={(e) =>
                setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {/* Common timezones */}
              <optgroup label="Common Timezones">
                <option value="America/New_York">
                  Eastern Time (US & Canada)
                </option>
                <option value="America/Chicago">
                  Central Time (US & Canada)
                </option>
                <option value="America/Denver">
                  Mountain Time (US & Canada)
                </option>
                <option value="America/Los_Angeles">
                  Pacific Time (US & Canada)
                </option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris, Berlin, Rome</option>
                <option value="Europe/Zurich">Zurich</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Beijing, Shanghai</option>
                <option value="Australia/Sydney">Sydney</option>
              </optgroup>
              <optgroup label="Other">
                <option value={getUserTimezone()}>
                  Your Local Timezone ({getUserTimezone()})
                </option>
              </optgroup>
            </select>
            {errors.timezone && (
              <p className="mt-1 text-sm text-red-600">{errors.timezone}</p>
            )}
          </div>

          {/* Admin Management */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              <Users className="h-4 w-4" />
              Calendar Admins
            </label>
            <div className="space-y-2">
              {/* Admin List */}
              {adminUris.map((adminUri, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-md"
                >
                  <span className="flex-1 text-sm font-mono text-neutral-700 dark:text-neutral-300 truncate">
                    {adminUri}
                  </span>
                  {adminUris.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => {
                        setAdminUris(adminUris.filter((_, i) => i !== index));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Add Admin Input */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="pubky://..."
                  value={newAdminInput}
                  onChange={(e) => setNewAdminInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    if (!newAdminInput.trim()) {
                      toast.error("Please enter a pubky URI");
                      return;
                    }
                    if (!newAdminInput.startsWith("pubky://")) {
                      toast.error('Admin URI must start with "pubky://"');
                      return;
                    }
                    if (adminUris.includes(newAdminInput)) {
                      toast.error("This admin is already added");
                      return;
                    }
                    setAdminUris([...adminUris, newAdminInput]);
                    setNewAdminInput("");
                  }}
                  disabled={!newAdminInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {/* TODO: Add user search with Nexus */}
              Add Pubky URIs of users who can edit this calendar. At least one
              admin is required.
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Calendar Image (Optional)
            </label>
            <ImageUpload
              value={formData.imageFile}
              onChange={(file) => setFormData({ ...formData, imageFile: file })}
            />
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Upload a banner image for your calendar
            </p>
          </div>

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
                ? "Create Calendar"
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
