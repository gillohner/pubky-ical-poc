"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { getResolvedProfile } from "@/services/profile-service";
import { toast } from "sonner";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    try {
      const href = globalThis.window.location.href;
      localStorage.setItem("pubky-auth-callback", href);

      const token = searchParams.get("token");
      const publicKey = searchParams.get("pubkey") ||
        searchParams.get("pk");
      const caps = searchParams.get("capabilities") ||
        searchParams.get("caps");

      if (token && publicKey) {
        try {
          localStorage.setItem("pubky-auth-token", token);
        } catch {}

        const capabilityList = caps
          ? caps.split(",").map((c) => c.trim()).filter(Boolean)
          : undefined;

        // Fetch profile then set user
        console.log("🔐 CALLBACK: Auth success, publicKey:", publicKey);
        getResolvedProfile(publicKey).then((profile) => {
          console.log(
            "🔐 CALLBACK: Profile resolved:",
            profile?.name,
            "for",
            publicKey,
          );
          setUser({
            publicKey,
            name: profile?.name,
            imageUrl: profile?.imageUrl,
            capabilities: capabilityList,
          });
          toast.success("Authenticated successfully");
        }).finally(() => {
          if (globalThis.window.opener) {
            globalThis.window.opener.postMessage(
              { type: "pubky-auth-callback", href },
              "*",
            );
          }
          setTimeout(() => router.push("/"), 300);
        });
      } else {
        toast.error("Authentication callback missing parameters");
        // Still notify opener so it can close modal
        if (globalThis.window.opener) {
          globalThis.window.opener.postMessage(
            { type: "pubky-auth-callback", href },
            "*",
          );
        }
      }
    } catch {}
  }, [searchParams, router, setUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        globalThis.window.close();
      } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6 text-center">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Authentication complete. You can close this tab.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Processing authentication...
          </p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
