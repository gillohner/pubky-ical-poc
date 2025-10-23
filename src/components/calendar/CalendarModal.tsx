"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Calendar, X, Plus, Globe, Palette, Upload, ImageIcon } from "lucide-react";
import type { PubkyAppCalendar } from "@/types/calendar";
import { useAuthStore } from "@/stores/auth-store";
import { createCalendar, updateCalendar } from "@/services/calendar-service";
import { getUserTimezone } from "@/lib/calendar-validation";
import { truncatePubkyUri } from "@/lib/utils";
import { getNexusImageUrl, extractFileId, extractPublicKey } from "@/lib/nexus";

interface CalendarModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSuccessAction?: (calendarUri: string) => void;
  calendar?: PubkyAppCalendar; // For editing
  calendarUri?: string; // Required for edit mode
}

/**
 * Simplified Calendar Modal
 * 
 * Streamlined form for creating/editing calendars with:
 * - Simple state management
 * - Proper field handling
 * - Clear validation
 * - Direct integration with calendar service
 */
export function CalendarModal({ isOpen, onCloseAction, onSuccessAction, calendar, calendarUri }: CalendarModalProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state - all in one place
  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    admins: [] as string[],
    imageFile: null as File | null,
    imagePreview: null as string | null,
    existingImageUri: null as string | null, // Track existing image
    removeExistingImage: false, // Flag to remove existing image
  });
  
  const [newAdmin, setNewAdmin] = useState("");

  // Load calendar data when editing
  useEffect(() => {
    if (calendar) {
      // Ensure admins have pubky:// prefix
      const admins = (calendar.x_pubky_admins || []).map(admin => 
        admin.startsWith("pubky://") ? admin : `pubky://${admin}`
      );
      
      setFormData({
        name: calendar.name || "",
        color: calendar.color || "#3B82F6", 
        timezone: calendar.timezone || getUserTimezone(),
        admins: admins,
        imageFile: null,
        imagePreview: null,
        existingImageUri: calendar.image_uri || null,
        removeExistingImage: false,
      });
      
      // Load existing image preview from Nexus
      if (calendar.image_uri && calendarUri) {
        const publicKey = extractPublicKey(calendarUri);
        const fileId = extractFileId(calendar.image_uri);
        if (publicKey && fileId) {
          const imageUrl = getNexusImageUrl(publicKey, fileId, "feed");
          setFormData(prev => ({ ...prev, imagePreview: imageUrl }));
        }
      }
    } else if (user?.publicKey) {
      // Initialize with current user as admin for new calendars
      setFormData(prev => ({
        ...prev,
        admins: [`pubky://${user.publicKey}`],
      }));
    }
  }, [calendar, calendarUri, user]);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result as string,
        removeExistingImage: false, // If uploading new image, don't remove existing
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle removing the image (both existing and new)
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: null,
      removeExistingImage: !!prev.existingImageUri, // Only flag removal if there was an existing image
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Calendar name is required");
      return;
    }

    if (formData.admins.length === 0) {
      toast.error("At least one admin is required");
      return;
    }

    if (!user?.publicKey) {
      toast.error("You must be logged in");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const calendarData = {
        name: formData.name.trim(),
        color: formData.color,
        timezone: formData.timezone,
        x_pubky_admins: formData.admins,
        imageFile: formData.imageFile || undefined,
      };

      if (calendar && calendarUri) {
        // Update existing calendar
        // Determine which image to use:
        // - If removeExistingImage is true, use null
        // - If new imageFile is provided, uploadImage will handle it
        // - Otherwise, keep existing image
        const imageToKeep = formData.removeExistingImage ? null : calendar.image_uri;
        
        await updateCalendar(calendarUri, calendarData, user.publicKey, imageToKeep);
        onSuccessAction?.(calendarUri);
      } else {
        // Create new calendar
        const newCalendarUri = await createCalendar(calendarData, user.publicKey);
        onSuccessAction?.(newCalendarUri);
      }
      
      // Reset and close
      resetForm();
      onCloseAction();
    } catch (error) {
      console.error("Failed to save calendar:", error);
      toast.error(`Failed to ${calendar ? "update" : "create"} calendar`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAdmin = () => {
    const trimmedAdmin = newAdmin.trim();
    
    if (!trimmedAdmin) {
      toast.error("Please enter a pubky URI");
      return;
    }
    
    if (!trimmedAdmin.startsWith("pubky://")) {
      toast.error('Admin URI must start with "pubky://"');
      return;
    }
    
    if (formData.admins.includes(trimmedAdmin)) {
      toast.error("This admin is already added");
      return;
    }
    
    setFormData(prev => ({ 
      ...prev, 
      admins: [...prev.admins, trimmedAdmin] 
    }));
    setNewAdmin("");
  };

  const removeAdmin = (index: number) => {
    if (formData.admins.length <= 1) {
      toast.error("At least one admin is required");
      return;
    }
    
    setFormData(prev => ({ 
      ...prev, 
      admins: prev.admins.filter((_, i) => i !== index) 
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      color: "#3B82F6",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      admins: user?.publicKey ? [`pubky://${user.publicKey}`] : [],
      imageFile: null,
      imagePreview: null,
      existingImageUri: null,
      removeExistingImage: false,
    });
    setNewAdmin("");
  };

  const handleCancel = () => {
    resetForm();
    onCloseAction();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {calendar ? "Edit Calendar" : "Create Calendar"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Calendar Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Bitcoin Switzerland Events"
              maxLength={255}
              className="w-full"
            />
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {formData.name.length}/255 characters
            </p>
          </div>

          {/* Color & Timezone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                <Palette className="h-4 w-4" />
                Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="h-10 w-16 cursor-pointer rounded border border-neutral-300 dark:border-neutral-700"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                <Globe className="h-4 w-4" />
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Europe/Zurich">Zurich</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
                <option value="Australia/Sydney">Sydney</option>
                <option value={getUserTimezone()}>Local ({getUserTimezone()})</option>
              </select>
            </div>
          </div>

          {/* Admins */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Admins <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
              {formData.admins.map((admin, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                  <span className="flex-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate">
                    {truncatePubkyUri(admin, 40)}
                  </span>
                  {formData.admins.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700"
                      onClick={() => removeAdmin(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAdmin}
                onChange={(e) => setNewAdmin(e.target.value)}
                placeholder="pubky://..."
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={addAdmin}
                disabled={!newAdmin.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Add Pubky URIs of users who can edit this calendar
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Calendar Image (Optional)
            </label>
            
            {!formData.imagePreview ? (
              <label className="relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Upload className="h-12 w-12 mb-2 text-neutral-400" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Click to upload image
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                  PNG, JPG, WEBP up to 10MB
                </p>
              </label>
            ) : (
              <div className="relative group">
                <img
                  src={formData.imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-neutral-300 dark:border-neutral-700"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white/90 hover:bg-white pointer-events-none"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Change
                    </Button>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="bg-white/90 hover:bg-white text-red-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
                {formData.imageFile && (
                  <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-medium">{formData.imageFile.name}</span> (
                    {(formData.imageFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
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
              {isSubmitting ? "Saving..." : calendar ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
