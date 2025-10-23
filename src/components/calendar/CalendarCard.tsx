"use client";

import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import { getNexusImageUrl, extractFileId } from "@/lib/nexus";
import { SerializableCalendar } from "@/types/calendar-serializable";

interface CalendarCardProps {
  authorId: string;
  calendarId: string;
  calendar: SerializableCalendar;
  className?: string;
}

export function CalendarCard({
  authorId,
  calendarId,
  calendar,
  className,
}: CalendarCardProps) {
  const calendarUrl = `/calendar/${authorId}/${calendarId}`;

  // Get image URL directly from Nexus
  const fileId = extractFileId(calendar.image_uri);
  const imageUrl = fileId ? getNexusImageUrl(authorId, fileId, "feed") : null;

  // Use color or default
  const backgroundColor = calendar.color || "#3B82F6";

  return (
    <Link href={calendarUrl}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-950",
          className,
        )}
      >
        {/* Color Banner or Image */}
        <div
          className="h-32 w-full relative"
          style={imageUrl ? undefined : { backgroundColor }}
        >
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt={calendar.name || "Calendar"}
                className="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </>
          ) : null}
        </div>

        {/* Calendar Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {calendar.name || "Unnamed Calendar"}
          </h3>

          {/* Metadata */}
          <div className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            {calendar.timezone && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{calendar.timezone}</span>
              </div>
            )}

            {calendar.x_pubky_admins && calendar.x_pubky_admins.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0" />
                <span>
                  {calendar.x_pubky_admins.length}{" "}
                  {calendar.x_pubky_admins.length === 1 ? "admin" : "admins"}
                </span>
              </div>
            )}

            {calendar.created && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  Created {new Date(Number(calendar.created) / 1000)
                    .toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors pointer-events-none" />
      </div>
    </Link>
  );
}
