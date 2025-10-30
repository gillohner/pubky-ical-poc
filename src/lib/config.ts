export interface AppConfig {
  appName: string;
  appUrl: string;
  pubkyRelay: string;
  baseAppPath: string;
  nexusApiUrl: string; // Nexus API base URL
  pubkyProfileUrl: string; // Pubky.app profile base URL
  useTestnet: boolean; // Whether to use testnet mode
  homeserver: string; // Homeserver public key
}

export function getAppConfig(): AppConfig {
  const useTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === "true";
  
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME || "Calky",
    appUrl: typeof window !== "undefined" ? window.location.origin : "",
    useTestnet,
    homeserver: process.env.NEXT_PUBLIC_HOMESERVER ||
      (useTestnet 
        ? "8pinxxgqs41n4aididenw5apqp1urfmzdztr8jt4abrkdn435ewo"
        : "ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy"),
    pubkyRelay: process.env.NEXT_PUBLIC_PUBKY_RELAY ||
      (useTestnet
        ? "http://localhost:15412/link"
        : "https://httprelay.pubky.app/link"),
    baseAppPath: process.env.NEXT_PUBLIC_BASE_APP_PATH ||
      "/pub/pubky.app/",
    nexusApiUrl: process.env.NEXT_PUBLIC_NEXUS_API_URL ||
      (useTestnet
        ? "http://localhost:8080"
        : "https://nexus.pubky.app"),
    pubkyProfileUrl: process.env.NEXT_PUBLIC_PUBKY_PROFILE_URL ||
      "https://pubky.app/profile",
  };
}
