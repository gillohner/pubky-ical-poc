# Services Layer

This directory contains the service layer for data fetching and business logic.

## Architecture

```
Components → Hooks → Services → Nexus API
                       ↓
                   React Query Cache
```

### Current Implementation

- **Nexus API**: Services fetch data from the Pubky Nexus API for all read
  operations.
- **React Query Cache**: Automatic caching with TanStack Query (10min stale,
  30min cache).
- **Direct Homeserver**: Only for write operations (creating/updating data).

### Why Nexus is Required

Nexus is the essential backend infrastructure for Calky. The app relies on Nexus
for:

- **Fast, indexed queries** - Pre-indexed profiles, posts, tags
- **Optimized images** - Automatic CDN delivery with multiple sizes
  (small/feed/main)
- **Social graph data** - Followers, influencers, recommendations
- **Search** - Full-text search across profiles and content

**There is no homeserver fallback for reads** - if Nexus is unavailable, the app
shows error states.

## Directory Structure

```
services/
├── README.md              # This file
├── profile-service.ts     # Profile fetching from Nexus
└── [future services]      # e.g., events-service.ts, calendar-service.ts
```

## Service Guidelines

### 1. Single Responsibility

Each service handles one domain (profiles, events, calendars, etc.)

### 2. Abstraction

Services abstract the data source. Components don't know Nexus implementation
details.

### 3. Type Safety

Use TypeScript interfaces from `@/types/*` for all inputs/outputs.

### 4. Error Handling

Return `null` or appropriate fallback values rather than throwing errors.

### 5. Logging

Use consistent console logging prefixes:

- `📋 SERVICE:` for profile operations
- `🖼️ SERVICE:` for image operations
- `📅 SERVICE:` for event operations
- `🗓️ SERVICE:` for calendar operations

## Example: Profile Service

```typescript
/**
 * Profile Service
 *
 * Fetches profile data from Nexus API.
 */

import { nexusClient } from "@/lib/nexus-client";
import type { ResolvedProfile } from "@/types/profile";

/**
 * Fetch profile data from Nexus
 * @param publicKey - User's public key
 * @returns Profile data or null if not found
 */
export async function fetchProfileData(
  publicKey: string,
): Promise<Profile | null> {
  console.log("📋 SERVICE: Fetching from Nexus:", publicKey);

  try {
    const bootstrap = await nexusClient.getBootstrap(publicKey);
    const user = bootstrap.users.find((u) => u.details.id === publicKey);

    if (user) {
      return {
        name: user.details.name,
        bio: user.details.bio,
        image: user.details.image, // File URI
        links: user.details.links,
      };
    }

    return null;
  } catch (error) {
    console.error("📋 SERVICE: Nexus error:", error);
    return null;
  }
}

/**
 * Resolve image URL from Nexus file URI
 * @param imageUri - File URI from Nexus
 * @returns CDN image URL
 */
export async function resolveImageUrl(
  imageUri: string | undefined,
): Promise<string | null> {
  if (!imageUri) return null;

  console.log("🖼️ SERVICE: Resolving image:", imageUri.substring(0, 50));

  try {
    const files = await nexusClient.getFilesByIds([imageUri]);

    if (files && files.length > 0) {
      // Get optimized 100x100 avatar size
      return nexusClient.getFileImageUrl(files[0], "small");
    }

    return null;
  } catch (error) {
    console.error("🖼️ SERVICE: Image resolve error:", error);
    return null;
  }
}
```

## Read vs Write Operations

### Read Operations (via Nexus)

- ✅ Fetch user profiles
- ✅ Fetch posts and content
- ✅ Fetch social graph (followers, following)
- ✅ Search profiles and tags
- ✅ Resolve images (optimized CDN URLs)

**Implementation**: Use Nexus API client

### Write Operations (direct to homeserver)

- ✅ Create new events
- ✅ Update user profile
- ✅ Publish posts
- ✅ Upload images

**Implementation**: Use Pubky SDK client with authenticated session

## Benefits

- **Performance**: Nexus provides fast, indexed queries
- **Scalability**: Offload read operations from homeservers
- **Optimization**: Automatic image optimization and CDN delivery
- **Separation of Concerns**: Components don't know about Nexus internals
- **Type Safety**: TypeScript ensures correct data flow
- **Testability**: Easy to mock services in tests

## Future Enhancements

### Local IndexedDB Caching

For offline support and faster subsequent loads:

```typescript
export async function getResolvedProfile(
  publicKey: string,
): Promise<ResolvedProfile | null> {
  // 1. Check local DB cache
  const cached = await db.profiles.get(publicKey);
  if (cached && !isStale(cached)) return cached;

  // 2. Fetch from Nexus
  const profile = await fetchProfileData(publicKey);

  // 3. Update cache
  if (profile) {
    await db.profiles.put({ ...profile, updatedAt: Date.now() });
  }

  return profile;
}
```

### Real-time Updates

For live notifications and feed updates:

```typescript
// Subscribe to real-time events from Nexus
nexusClient.subscribe("profile-updates", publicKey, (update) => {
  queryClient.invalidateQueries(["profile", publicKey]);
});
```
