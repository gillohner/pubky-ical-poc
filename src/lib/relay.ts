"use client";

// Base64URL encoding for Uint8Array
export function base64UrlEncode(bytes: Uint8Array): string {
    const bin = String.fromCharCode(...bytes);
    const b64 = btoa(bin);
    return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function sha256(input: Uint8Array): Promise<Uint8Array> {
    const digest = await crypto.subtle.digest("SHA-256", input);
    return new Uint8Array(digest);
}

export function generateClientSecret(): Uint8Array {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return bytes;
}

export async function computeChannelId(secret: Uint8Array): Promise<string> {
    const h = await sha256(secret);
    return base64UrlEncode(h);
}

// Ensure relay base is the base path without channel id
export function normalizeRelayBase(relayBase: string): string {
    // Keep as provided; caller should pass something like https://httprelay.pubky.app/link
    return relayBase.replace(/\/$/, "");
}

export function buildPubkyAuthUrl(
    relayBase: string,
    capsCsv: string,
    secretB64: string,
): string {
    const rp = normalizeRelayBase(relayBase);
    const url = `pubkyauth:///?relay=${encodeURIComponent(rp)}&caps=${
        encodeURIComponent(capsCsv)
    }&secret=${encodeURIComponent(secretB64)}`;
    return url;
}

export function subscribeRelay(
    relayBase: string,
    channelId: string,
    onMessage: (data: string) => void,
) {
    const base = normalizeRelayBase(relayBase);
    const sseUrl = `${base}/${channelId}`;
    const es = new EventSource(sseUrl);
    const handler = (ev: MessageEvent) => {
        if (typeof ev.data === "string" && ev.data.length > 0) {
            onMessage(ev.data);
        }
    };
    es.addEventListener("message", handler);
    return () => {
        try {
            es.removeEventListener("message", handler);
            es.close();
        } catch {}
    };
}
