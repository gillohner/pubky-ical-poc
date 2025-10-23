"use client";

import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

interface ImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Simple unified Image component
 * Handles loading states, errors, and fallbacks
 * Replaces complex image handling hooks
 */
export function Image({ src, alt, className, fallback }: ImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(!!src);

  if (!src || error) {
    return fallback || (
      <div className={cn("bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center", className)}>
        <ImageIcon className="h-8 w-8 text-neutral-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-cover", loading && "animate-pulse", className)}
      onLoad={() => setLoading(false)}
      onError={() => setError(true)}
    />
  );
}
