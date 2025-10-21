"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PubkyClient } from "@/lib/pubky-client";

export interface AuthUser {
  publicKey: string;
  name?: string;
  bio?: string;
  imageUrl?: string;
  capabilities?: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isAuthDialogOpen: boolean;
  setAuthDialogOpen: (open: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isAuthDialogOpen: false,
      setAuthDialogOpen: (open: boolean) => set({ isAuthDialogOpen: open }),
      setUser: (user: AuthUser | null) => {
        console.log("👤 SET_USER called with:", user?.publicKey, user?.name);
        set({ user, isAuthenticated: Boolean(user) });
      },
      logout: async () => {
        const currentUser = get().user;
        console.log(
          "🚪 LOGOUT START - Current user:",
          currentUser?.publicKey,
          currentUser?.name,
        );

        // Call SDK signout first if we have a user
        if (currentUser?.publicKey) {
          try {
            const client = PubkyClient.getInstance();
            const { PublicKey } = await import("@synonymdev/pubky");
            const pk = PublicKey.from(currentUser.publicKey);
            console.log("🚪 Calling SDK signout for:", currentUser.publicKey);
            await client.signout(pk);
            console.log("✅ SDK signout complete");
          } catch (error) {
            console.error("❌ SDK signout error:", error);
          }
        }

        // Clear browser cookies for homeserver domain
        try {
          console.log("🍪 Clearing cookies");
          // Clear all cookies by setting them to expire
          document.cookie.split(";").forEach((c) => {
            const cookie = c.trim();
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
            // Clear for all domains and paths
            document.cookie = name +
              "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            document.cookie = name +
              "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.pubky.app";
            document.cookie = name +
              "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=homeserver.pubky.app";
          });
        } catch (e) {
          console.error("Cookie clear error:", e);
        }

        // Clear only our specific keys
        try {
          const keysToRemove = [
            "pubky-ical-user",
            "pubky-auth-callback",
            "pubky-auth-token",
            "pubky-auth-payload",
            "pubky-avatar-url",
          ];
          console.log("🗑️ Clearing storage keys:", keysToRemove);
          keysToRemove.forEach((key) => {
            const lsVal = localStorage.getItem(key);
            const ssVal = sessionStorage.getItem(key);
            if (lsVal) {
              console.log(`  localStorage[${key}]:`, lsVal.substring(0, 50));
            }
            if (ssVal) {
              console.log(`  sessionStorage[${key}]:`, ssVal.substring(0, 50));
            }
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
        } catch {}

        console.log("🚪 Setting store to null");
        set({ user: null, isAuthenticated: false, isAuthDialogOpen: false });
        console.log("🚪 LOGOUT COMPLETE - Store state after:", get().user);
      },
    }),
    {
      name: "pubky-ical-user",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
);

export function useAuth() {
  const state = useAuthStore();
  return state;
}
