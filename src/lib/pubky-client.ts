import type {
  AuthFlow,
  Keypair,
  Pubky as PubkyType,
  PublicKey,
  Session,
  Signer,
} from "@synonymdev/pubky";
import { getAppConfig } from "./config";

/**
 * PubkyClient - Singleton wrapper for Pubky SDK 0.6.0
 * 
 * Architecture:
 * - Pubky facade: testnet vs mainnet
 * - AuthFlow: for pubkyauth authentication flows
 * - Session: for authenticated storage operations
 * - PublicStorage: for reading public data without auth
 */
export class PubkyClient {
  private static instance: PubkyClient;
  private pubky: PubkyType | null = null;
  private initialized = false;
  private currentSession: Session | null = null;

  private constructor() {}

  public static getInstance(): PubkyClient {
    if (!PubkyClient.instance) {
      PubkyClient.instance = new PubkyClient();
    }
    return PubkyClient.instance;
  }

  /**
   * Initialize the Pubky facade (testnet or mainnet)
   */
  private async ensureInitialized() {
    if (this.initialized && this.pubky) return;
    
    const mod = await import("@synonymdev/pubky");
    const config = getAppConfig();
    
    // Use testnet or mainnet facade
    if (config.useTestnet) {
      this.pubky = mod.Pubky.testnet();
      console.log("🧪 Pubky initialized in TESTNET mode");
    } else {
      this.pubky = new mod.Pubky();
      console.log("🌐 Pubky initialized in MAINNET mode");
    }
    
    this.initialized = true;
  }

  /**
   * PUBLIC READ: Get data from a public resource
   * Uses publicStorage - no authentication required
   */
  public async get(url: string): Promise<Uint8Array | null> {
    await this.ensureInitialized();
    try {
      // For public reads, use publicStorage.getBytes
      // URL format: pubky<publickey>/pub/<path>
      const bytes = await this.pubky!.publicStorage.getBytes(url as any);
      return bytes || null;
    } catch (error) {
      console.error("GET error:", error);
      return null;
    }
  }

  /**
   * AUTHENTICATED WRITE: Put data to user's storage
   * Requires an active session
   */
  public async put(path: string, content: Uint8Array): Promise<boolean> {
    if (!this.currentSession) {
      console.error("PUT failed: No active session");
      return false;
    }
    
    try {
      await this.currentSession.storage.putBytes(path as any, content);
      return true;
    } catch (error) {
      console.error("PUT error:", error);
      return false;
    }
  }

  /**
   * AUTHENTICATED DELETE: Delete data from user's storage
   * Requires an active session
   */
  public async delete(path: string): Promise<boolean> {
    if (!this.currentSession) {
      console.error("DELETE failed: No active session");
      return false;
    }
    
    try {
      await this.currentSession.storage.delete(path as any);
      return true;
    } catch (error) {
      console.error("DELETE error:", error);
      return false;
    }
  }

  /**
   * LIST: List resources at a path
   * Can be public or authenticated depending on the path
   */
  public async list(
    url: string,
    cursor?: string,
    reverse?: boolean,
    limit?: number,
  ): Promise<string[]> {
    await this.ensureInitialized();
    try {
      // If we have a session and the URL is a relative path, use session storage
      if (this.currentSession && url.startsWith("/")) {
        const results = await this.currentSession.storage.list(
          url as any,
          cursor || null,
          reverse || null,
          limit || null,
          null,
        );
        return results || [];
      }
      
      // Otherwise use public storage for absolute URLs
      const results = await this.pubky!.publicStorage.list(
        url as any,
        cursor || null,
        reverse || null,
        limit || null,
        null,
      );
      return results || [];
    } catch (error) {
      console.error("LIST error:", error);
      return [];
    }
  }

  /**
   * SIGNUP: Create a new user on the homeserver
   */
  public async signup(
    keypair: Keypair,
    homeserver: PublicKey,
    signupToken?: string,
  ): Promise<Session> {
    await this.ensureInitialized();
    const signer = this.pubky!.signer(keypair);
    const session = await signer.signup(homeserver, signupToken || null);
    this.currentSession = session;
    return session;
  }

  /**
   * SIGNIN: Sign in an existing user
   */
  public async signin(keypair: Keypair): Promise<Session | undefined> {
    await this.ensureInitialized();
    const signer = this.pubky!.signer(keypair);
    try {
      const session = await signer.signin();
      if (session) {
        this.currentSession = session;
        return session;
      }
    } catch (error) {
      console.error("SIGNIN error:", error);
    }
    return undefined;
  }

  /**
   * SIGNOUT: Sign out the current user
   */
  public async signout(): Promise<void> {
    if (this.currentSession) {
      try {
        await this.currentSession.signout();
      } catch (error) {
        console.error("SIGNOUT error:", error);
      }
      this.currentSession = null;
    }
  }

  /**
   * Get current session
   */
  public getSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Set session (for restoring from auth)
   */
  public setSession(session: Session): void {
    this.currentSession = session;
  }

  /**
   * START AUTH FLOW: Create an authentication flow
   * Returns an AuthFlow that can be displayed as QR code
   */
  public async startAuthFlow(
    capabilities: string[],
    relay?: string,
  ): Promise<AuthFlow> {
    await this.ensureInitialized();
    
    // Create auth flow with capabilities
    const capsString = capabilities.join(",");
    const flow = this.pubky!.startAuthFlow(capsString as any, relay || null);
    
    return flow;
  }

  /**
   * Get Pubky facade instance (advanced usage)
   */
  public async getPubky(): Promise<PubkyType> {
    await this.ensureInitialized();
    return this.pubky!;
  }
}

// Re-export types
export type { AuthFlow, Keypair, PublicKey, Session, Signer };
