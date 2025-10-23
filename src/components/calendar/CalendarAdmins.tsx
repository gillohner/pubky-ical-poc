"use client";

import { useNexusProfile } from "@/hooks/useNexusProfile";
import { getDisplayName } from "@/utils/avatar";
import { extractPublicKey } from "@/utils/pubky-uri";
import { getAppConfig } from "@/lib/config";
import { ExternalLink, User } from "lucide-react";

interface ProfileItemProps {
  userUri: string;
}

function ProfileItem({ userUri }: ProfileItemProps) {
  const publicKey = extractPublicKey(userUri);
  const { data: profile, isLoading } = useNexusProfile(publicKey);

  const displayName = getDisplayName(profile?.name, publicKey || "unknown");
  const avatarUrl = profile?.imageUrl;
  const bio = profile?.bio;
  const config = getAppConfig();
  const profileUrl = `${config.pubkyProfileUrl}/${publicKey}`;

  if (isLoading) {
    return (
      <div className="flex items-center space-x-3 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="flex-1">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 mb-2" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center space-x-3 p-2 -mx-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group"
    >
      {avatarUrl
        ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-10 w-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
          />
        )
        : (
          <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
            <User className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
          </div>
        )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {displayName}
          </p>
          <ExternalLink className="h-3 w-3 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 flex-shrink-0" />
        </div>
        {bio && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {bio}
          </p>
        )}
      </div>
    </a>
  );
}

interface CalendarAdminsProps {
  admins: string[]; // Array of admin pubky URIs
  ownerPubkyUri: string; // Owner's pubky URI to exclude from admin list
  calendarName: string;
}

export function CalendarAdmins({
  admins,
  ownerPubkyUri,
  calendarName,
}: CalendarAdminsProps) {
  const ownerPublicKey = extractPublicKey(ownerPubkyUri);
  const filteredAdmins = admins.filter(
    (adminUri) => extractPublicKey(adminUri) !== ownerPublicKey
  );

  return (
    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
      {/* Owner Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          Owner
        </h3>
        <ProfileItem
          userUri={ownerPubkyUri}
        />
      </div>

      {/* Admins Section */}
      {filteredAdmins && filteredAdmins.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            Admins
          </h3>
          <div className="space-y-3">
            {filteredAdmins.map((adminUri) => (
              <ProfileItem key={adminUri} userUri={adminUri} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
