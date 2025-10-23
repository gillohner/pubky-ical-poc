"use client";

import { useState, useEffect } from "react";
import { User, ExternalLink } from "lucide-react";
import { Image } from "./image";
import { getNexusImageUrl, getPubkyProfilePageUrl, fetchNexusProfile, extractPublicKey } from "@/lib/nexus";

interface ProfileItemProps {
  userUri: string;
  showBio?: boolean;
  showLink?: boolean;
  className?: string;
}

/**
 * Simplified Profile Item Component
 * 
 * Displays user profile information from Nexus with:
 * - Direct API calls (no complex hooks)
 * - Simple loading states
 * - Optional bio and link display
 */
export function ProfileItem({ userUri, showBio = true, showLink = true, className = "" }: ProfileItemProps) {
  const [profile, setProfile] = useState<{
    name?: string;
    bio?: string;
    image?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const publicKey = extractPublicKey(userUri);
  const displayName = profile?.name || (publicKey ? `${publicKey.slice(0, 8)}...` : "Unknown");
  const avatarUrl = profile?.image && publicKey ? getNexusImageUrl(publicKey, profile.image, "small") : null;
  const profilePageUrl = publicKey ? getPubkyProfilePageUrl(publicKey) : null;

  useEffect(() => {
    if (!publicKey) {
      setLoading(false);
      return;
    }

    let mounted = true;

    fetchNexusProfile(publicKey)
      .then((data) => {
        if (mounted) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (mounted) {
          console.warn("Error fetching profile:", error);
          setProfile(null);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [publicKey]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-3 animate-pulse ${className}`}>
        <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="flex-1">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 mb-2" />
          {showBio && <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />}
        </div>
      </div>
    );
  }

  const content = (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="h-10 w-10 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={displayName} className="h-full w-full" />
        ) : (
          <User className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {displayName}
          </p>
          {showLink && profilePageUrl && (
            <ExternalLink className="h-3 w-3 text-neutral-400 flex-shrink-0" />
          )}
        </div>
        {showBio && profile?.bio && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  );

  if (showLink && profilePageUrl) {
    return (
      <a
        href={profilePageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors rounded-md p-2 -m-2"
      >
        {content}
      </a>
    );
  }

  return content;
}
