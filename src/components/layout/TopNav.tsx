"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Calendar,
  CalendarDays,
  LogIn,
  LogOut,
  Plus,
  Search,
  User,
} from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { CalendarModal } from "@/components/calendar";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthCompletion } from "@/hooks/useAuthCompletion";
import { useNexusProfile } from "@/hooks/useNexusProfile";
import { getBio, getDisplayName } from "@/utils/avatar";
import { handleCalendarCreated } from "@/utils/calendar-redirect";
import { toast } from "sonner";

export function TopNav() {
  const router = useRouter();
  const { isAuthenticated, user, setAuthDialogOpen, logout } = useAuthStore();
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  useAuthCompletion();

  // Use the Nexus profile hook to fetch profile data with automatic caching
  const { data: profile, isLoading } = useNexusProfile(user?.publicKey, {
    enabled: isAuthenticated && !!user?.publicKey,
  });

  // Determine display values: prefer store data, fallback to fetched profile
  const avatarUrl = user?.imageUrl || profile?.imageUrl || null;
  const displayName = getDisplayName(
    user?.name || profile?.name,
    user?.publicKey || "",
  );
  const bio = getBio(user?.bio || profile?.bio);

  const onCalendarCreated = (calendarUri: string) => {
    toast.success("Calendar created!");
    handleCalendarCreated(calendarUri, router);
  };

  return (
    <>
      <nav className="border-b bg-white dark:bg-neutral-950">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-8">
              <Link
                href="/"
                className="flex items-center space-x-2"
              >
                <Calendar className="h-6 w-6" />
                <span className="font-bold text-lg">
                  Calky
                </span>
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/events">
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <Search className="h-4 w-4" />
                    <span>Event Discovery</span>
                  </Button>
                </Link>
                <Link href="/calendars">
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Calendar Discovery</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right side: auth & actions */}
            <div className="flex items-center space-x-4">
              {/* New Calendar Button (only when authenticated) */}
              {isAuthenticated && (
                <Button
                  variant="default"
                  size="sm"
                  className="hidden md:flex items-center space-x-2"
                  onClick={() => setIsCalendarModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span>New Calendar</span>
                </Button>
              )}

              {!isAuthenticated
                ? (
                  <Button
                    variant="default"
                    className="flex items-center space-x-2"
                    onClick={() => setAuthDialogOpen(true)}
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </Button>
                )
                : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                        {avatarUrl
                          ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarUrl}
                              alt={user?.name || user?.publicKey || "Profile"}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          )
                          : (
                            <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        <span className="font-medium truncate max-w-[160px] hidden md:block">
                          {displayName}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <div className="px-2 py-1.5">
                        <div className="text-sm font-medium">
                          {displayName}
                        </div>
                        {bio && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                            {bio}
                          </div>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/my-calendars" className="cursor-pointer">
                          <CalendarDays className="mr-2 h-4 w-4" />
                          My Calendars
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await logout();
                          toast.info("Logged out");
                        }}
                        className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2 pb-4">
            <Link href="/events" className="flex-1">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Events</span>
              </Button>
            </Link>
            <Link href="/calendars" className="flex-1">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </Button>
            </Link>
            {isAuthenticated && (
              <Button
                variant="default"
                size="sm"
                className="flex-shrink-0"
                onClick={() => setIsCalendarModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </nav>
      <AuthDialog />
      <CalendarModal
        isOpen={isCalendarModalOpen}
        onCloseAction={() => setIsCalendarModalOpen(false)}
        onSuccessAction={onCalendarCreated}
      />
    </>
  );
}
