"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, LogIn, Search, User } from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";
import { useAuthCompletion } from "@/hooks/useAuthCompletion";
import { fetchPubkyProfile } from "@/lib/profile";

export function TopNav() {
    const { isAuthenticated, user, setAuthDialogOpen, setUser, logout } =
        useAuthStore();
    useAuthCompletion();

    useEffect(() => {
        async function hydrateFromCallback() {
            const href = localStorage.getItem("pubky-auth-callback");
            if (!href) return;
            // TODO: derive publicKey from SDK/session when available
            // For now, leave as-is; implement once backend/SDK returns it via callback
        }
        hydrateFromCallback();
    }, []);
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
                                <Link href="/calendar">
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

                        {/* Right side: auth */}
                        <div className="flex items-center space-x-4">
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
                                    <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium truncate max-w-[160px]">
                                            {user?.name || user?.publicKey}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={logout}
                                        >
                                            Logout
                                        </Button>
                                    </div>
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
                        <Link href="/calendar" className="flex-1">
                            <Button
                                variant="ghost"
                                className="w-full flex items-center justify-center space-x-2"
                            >
                                <Calendar className="h-4 w-4" />
                                <span>Calendar</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>
            <AuthDialog />
        </>
    );
}
