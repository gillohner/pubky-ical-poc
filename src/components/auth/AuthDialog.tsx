"use client";

import { useEffect, useMemo, useState } from "react";
import { getAppConfig } from "@/lib/config";
import { PubkyClient } from "@/lib/pubky-client";
import { useAuthStore } from "@/stores/auth-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { toast } from "sonner";
import { getResolvedProfile } from "@/services/profile-service";

export function AuthDialog() {
  const { isAuthDialogOpen, setAuthDialogOpen, setUser } = useAuthStore();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [ringUrl, setRingUrl] = useState<string | null>(null);

  const config = useMemo(() => getAppConfig(), []);

  useEffect(() => {
    if (!isAuthDialogOpen) return;
    let cancelled = false;
    async function run() {
      const client = PubkyClient.getInstance();
      // Authenticate the fixed BASE_APP_PATH as read-write
      const capabilities = [
        `${
          config.baseAppPath.endsWith("/")
            ? config.baseAppPath
            : config.baseAppPath + "/"
        }:rw`,
      ];

      // Start auth flow using the new SDK 0.6.0 API
      const flow = await client.startAuthFlow(
        capabilities,
        config.pubkyRelay,
      );
      
      const url = flow.authorizationUrl;
      if (cancelled) return;
      setAuthUrl(url);
      toast.info("Scan the QR with Pubky Ring to continue");
      
      // Build pubkyring deep link with callback
      const callback = encodeURIComponent(
        `${globalThis.window.location.origin}/auth/callback`,
      );
      const ring = `pubkyring://auth?url=${
        encodeURIComponent(url)
      }&callback=${callback}`;
      setRingUrl(ring);

      const { default: QRCodeLib } = await import("qrcode");
      const dataUrl = await QRCodeLib.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      if (cancelled) return;
      setQrDataUrl(dataUrl);

      // Await approval from the auth flow
      try {
        const session = await flow.awaitApproval();
        if (session && !cancelled) {
          // Store the session in the client
          client.setSession(session);
          
          // Get the public key from session info
          const publicKey = session.info.publicKey.z32();
          const profile = await getResolvedProfile(publicKey);
          setUser({
            publicKey,
            name: profile?.name,
            imageUrl: profile?.imageUrl,
            capabilities: session.info.capabilities,
          });
          setAuthDialogOpen(false);
          toast.success("Authenticated successfully");
        }
      } catch (error) {
        console.error("Auth flow error:", error);
        toast.error("Authentication failed or was cancelled");
      }
    }
    run();
    return () => {
      cancelled = true;
      setQrDataUrl(null);
      setAuthUrl(null);
    };
  }, [isAuthDialogOpen, config.baseAppPath, config.pubkyRelay, setAuthDialogOpen, setUser]);

  return (
    <Dialog open={isAuthDialogOpen} onOpenChange={setAuthDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authenticate with Pubky</DialogTitle>
          <DialogDescription>
            Scan with Pubky Ring to grant this app access to its base path.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {qrDataUrl && (
            <div className="flex justify-center">
              <Image
                src={qrDataUrl}
                alt="Authentication QR Code"
                width={256}
                height={256}
                className="w-64 h-64"
              />
            </div>
          )}
          {authUrl && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  globalThis.window.location.href = ringUrl ||
                    "";
                }}
              >
                Open Pubky Ring
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(authUrl);
                }}
              >
                Copy URL
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AuthDialog;
