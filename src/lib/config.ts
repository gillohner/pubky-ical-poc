export interface AppConfig {
    appName: string;
    appUrl: string;
    pubkyRelay: string;
    baseAppPath: string; // e.g., pubky:///pub/your.app/
}

export function getAppConfig(): AppConfig {
    return {
        appName: "Pubky Calendar",
        appUrl: typeof window !== "undefined" ? window.location.origin : "",
        pubkyRelay: process.env.NEXT_PUBLIC_PUBKY_RELAY ||
            "https://httprelay.pubky.app/link",
        baseAppPath: process.env.NEXT_PUBLIC_BASE_APP_PATH ||
            "/pub/pubky.app/",
    };
}
