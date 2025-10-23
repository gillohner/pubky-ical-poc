"use client";

import { useCallback, useRef, useState } from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: File;
  onChangeAction: (file: File | undefined) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

/**
 * ImageUpload Component
 *
 * Handles image file selection with preview
 * Files will be uploaded to homeserver as PubkyAppFile when form is submitted
 */
export function ImageUpload({
  value,
  onChangeAction,
  maxSizeMB = 10,
  acceptedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"],
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load preview if value exists
  useState(() => {
    if (value) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(value);
    }
  });

  const validateFile = useCallback(
    (file: File): boolean => {
      // Check file type
      if (!acceptedFormats.includes(file.type)) {
        toast.error(
          `Invalid file type. Accepted formats: ${
            acceptedFormats.map((f) => f.split("/")[1]).join(", ")
          }`,
        );
        return false;
      }

      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast.error(`File size must be less than ${maxSizeMB}MB`);
        return false;
      }

      return true;
    },
    [acceptedFormats, maxSizeMB],
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!validateFile(file)) return;

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      onChangeAction(file);
    },
    [validateFile, onChangeAction],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    setPreview(null);
    onChangeAction(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload Area */}
      {!preview && (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-8
            flex flex-col items-center justify-center
            cursor-pointer transition-all
            ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600"
          }
          `}
        >
          <Upload
            className={`h-12 w-12 mb-4 ${
              isDragging ? "text-blue-500" : "text-neutral-400"
            }`}
          />
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {isDragging
                ? "Drop image here"
                : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {acceptedFormats.map((f) => f.split("/")[1].toUpperCase()).join(
                ", ",
              )} up to {maxSizeMB}MB
            </p>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative group">
          <div className="relative rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-700">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClick}
                className="bg-white/90 hover:bg-white"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Change
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
          {value && (
            <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">{value.name}</span> (
              {(value.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
