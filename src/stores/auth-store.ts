"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
    publicKey: string;
    name?: string;
    imageUrl?: string;
    capabilities?: string[];
}

interface AuthState {
    isAuthenticated: boolean;
    user: AuthUser | null;
    isAuthDialogOpen: boolean;
    setAuthDialogOpen: (open: boolean) => void;
    setUser: (user: AuthUser | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            user: null,
            isAuthDialogOpen: false,
            setAuthDialogOpen: (open: boolean) =>
                set({ isAuthDialogOpen: open }),
            setUser: (user: AuthUser | null) =>
                set({ user, isAuthenticated: Boolean(user) }),
            logout: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: "pubky-user",
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
