export interface AppConfig {
  appName: string;
  appUrl: string;
  pubkyRelay: string;
  baseAppPath: string;
  nexusApiUrl: string; // Nexus API base URL
}

export function getAppConfig(): AppConfig {
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME || "Calky",
    appUrl: typeof window !== "undefined" ? window.location.origin : "",
    pubkyRelay: process.env.NEXT_PUBLIC_PUBKY_RELAY ||
      "https://httprelay.pubky.app/link",
    baseAppPath: process.env.NEXT_PUBLIC_BASE_APP_PATH ||
      "/pub/pubky.app/",
    nexusApiUrl: process.env.NEXT_PUBLIC_NEXUS_API_URL ||
      "https://nexus.pubky.app",
  };
}
