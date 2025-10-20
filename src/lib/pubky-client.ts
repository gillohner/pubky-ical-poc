import type {
    AuthRequest as PubkyAuthRequest,
    Client,
    Keypair,
    PublicKey,
    Session,
} from "@synonymdev/pubky";

export class PubkyClient {
    private static instance: PubkyClient;
    private client: Client | null = null;
    private initialized = false;
    private currentSession: Session | null = null;
    private customCapabilities: string[] = [];

    private constructor() {}

    public static getInstance(): PubkyClient {
        if (!PubkyClient.instance) {
            PubkyClient.instance = new PubkyClient();
        }
        return PubkyClient.instance;
    }

    private async ensureInitialized() {
        if (this.initialized) return;
        const mod = await import("@synonymdev/pubky");
        const C = (mod.Client as unknown) as { new (): Client };
        this.client = new C();
        this.initialized = true;
    }

    public updateCapabilities(
        additionalCapabilities: string[],
    ): Promise<boolean> {
        this.customCapabilities = additionalCapabilities;
        if (this.currentSession) {
            this.currentSession = null;
            return Promise.resolve(false);
        }
        return Promise.resolve(true);
    }

    public async get(url: string): Promise<Uint8Array | null> {
        await this.ensureInitialized();
        try {
            const response = await this.client!.fetch(url);
            if (response.ok) {
                const arrayBuffer =
                    (await response.arrayBuffer()) as ArrayBuffer;
                return new Uint8Array(arrayBuffer);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    public async put(url: string, content: Uint8Array): Promise<boolean> {
        await this.ensureInitialized();
        try {
            const response = await this.client!.fetch(url, {
                method: "PUT",
                body: content,
                credentials: "include",
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    public async delete(url: string): Promise<boolean> {
        await this.ensureInitialized();
        try {
            const response = await this.client!.fetch(url, {
                method: "DELETE",
                credentials: "include",
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    public async list(
        url: string,
        cursor?: string,
        reverse?: boolean,
        limit?: number,
    ): Promise<string[]> {
        await this.ensureInitialized();
        try {
            const response = await this.client!.list(
                url,
                cursor,
                reverse,
                limit,
            );
            return response || [];
        } catch (error) {
            return [];
        }
    }

    public async signup(
        keypair: Keypair,
        homeserver: PublicKey,
        signupToken?: string,
    ): Promise<Session> {
        await this.ensureInitialized();
        const session = await this.client!.signup(
            keypair,
            homeserver,
            signupToken,
        );
        this.currentSession = session;
        return session;
    }

    async signin(keypair: Keypair): Promise<Session | undefined> {
        await this.ensureInitialized();
        await this.client!.signin(keypair);
        const publicKey = keypair.publicKey();
        const session = await this.client!.session(publicKey);
        if (session) {
            this.currentSession = session;
            return session;
        }
        return undefined;
    }

    public async signout(publicKey: PublicKey): Promise<void> {
        await this.ensureInitialized();
        await this.client!.signout(publicKey);
        this.currentSession = null;
    }

    public async session(publicKey: PublicKey): Promise<Session | null> {
        await this.ensureInitialized();
        const session = await this.client!.session(publicKey);
        if (session) {
            this.currentSession = session;
        }
        return session || null;
    }

    public async authRequest(
        relay: string,
        capabilities: string[],
        callbackUrl?: string,
    ): Promise<PubkyAuthRequest> {
        await this.ensureInitialized();
        const allCapabilities = capabilities.join(",");
        const relayWithCallback = callbackUrl
            ? `${relay}?callback=${encodeURIComponent(callbackUrl)}`
            : relay;
        return this.client!.authRequest(
            relayWithCallback,
            allCapabilities,
        ) as PubkyAuthRequest;
    }
}

export type { Keypair, PublicKey, Session };
