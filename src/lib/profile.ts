import { PubkyClient } from "@/lib/pubky-client";
import type { PubkyProfile } from "@/types/pubky";

export async function fetchPubkyProfile(
    publicKey: string,
): Promise<PubkyProfile | null> {
    const client = PubkyClient.getInstance();
    const url = `pubky://${publicKey}/pub/pubky.app/profile.json`;
    const bytes = await client.get(url);
    if (!bytes) return null;
    try {
        const text = new TextDecoder().decode(bytes);
        return JSON.parse(text) as PubkyProfile;
    } catch {
        return null;
    }
}
