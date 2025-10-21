"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function useAuthCompletion() {
  const { setAuthDialogOpen } = useAuthStore();

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data as { type?: string; href?: string };
      if (data && data.type === "pubky-auth-callback") {
        localStorage.setItem("pubky-auth-callback", data.href || "");
        setAuthDialogOpen(false);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === "pubky-auth-callback" && event.newValue) {
        setAuthDialogOpen(false);
      }
    }

    function checkLocalFlag() {
      const stored = localStorage.getItem("pubky-auth-callback");
      if (stored) setAuthDialogOpen(false);
    }

    globalThis.window.addEventListener("message", handleMessage);
    globalThis.window.addEventListener("storage", handleStorage);
    globalThis.window.addEventListener("focus", checkLocalFlag);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkLocalFlag();
    });
    checkLocalFlag();
    return () => {
      globalThis.window.removeEventListener("message", handleMessage);
      globalThis.window.removeEventListener("storage", handleStorage);
      globalThis.window.removeEventListener("focus", checkLocalFlag);
      document.removeEventListener(
        "visibilitychange",
        checkLocalFlag as any,
      );
    };
  }, [setAuthDialogOpen]);
}
