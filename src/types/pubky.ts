export interface PubkyProfile {
    name?: string;
    bio?: string;
    image?: string; // pubky://... or http(s) URL
    links?: Array<{ title?: string; url: string }> | string[];
}
