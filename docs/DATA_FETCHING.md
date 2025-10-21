# Data Fetching Guide

## Overview

Calky fetches data from the **Nexus API**, a fast, indexed backend service for
the Pubky network. All read operations (profiles, posts, social graph) use
Nexus, while write operations go directly to homeservers.

## Architecture

### Read Operations (Nexus API)

All data fetching flows through this architecture:

```
Component
    ↓
React Hook (useNexusProfile)
    ↓
Service Layer (profile-service.ts)
    ↓
Nexus API Client (nexus-client.ts)
    ↓
Nexus API (https://nexus.pubky.app)
```

**Automatic caching** via TanStack Query:

- 10 minutes stale time (data considered fresh)
- 30 minutes cache time (kept in memory)
- Automatic deduplication (multiple requests = single API call)
- Background refetching on window focus

### Write Operations (Direct to Homeserver)

Creating and updating data uses authenticated Pubky SDK:

```
Component
    ↓
Pubky Client (pubky-client.ts)
    ↓
User's Homeserver (pubky://user/path)
```

## Using Nexus in Your Components

### Fetching User Profiles

```typescript
import { useNexusProfile } from "@/hooks/useNexusProfile";

function ProfileCard({ publicKey }: { publicKey: string }) {
  const { data: profile, isLoading, error } = useNexusProfile(publicKey);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState error={error} />;
  if (!profile) return <NotFound />;

  return (
    <div>
      <img src={profile.imageUrl} alt={profile.name} />
      <h2>{profile.name}</h2>
      <p>{profile.bio}</p>
    </div>
  );
}
```

**The hook automatically handles**:

- Caching (instant subsequent loads)
- Loading states
- Error states
- Deduplication
- Background refetching

### Conditional Fetching

Only fetch when needed:

```typescript
const { data: profile } = useNexusProfile(user?.publicKey, {
  enabled: !!user?.publicKey, // Only fetch if publicKey exists
});
```

## Image Optimization

Nexus provides three optimized image sizes:

| Size    | Resolution | Use Case                    |
| ------- | ---------- | --------------------------- |
| `small` | 100x100px  | Profile avatars, thumbnails |
| `feed`  | 400x400px  | Feed posts, previews        |
| `main`  | Original   | Full-size viewing, modals   |

**Usage**:

```typescript
import { nexusClient } from "@/lib/nexus-client";

// Fetch file metadata
const files = await nexusClient.getFilesByIds([imageUri]);
const file = files[0];

// Get different sizes
const avatarUrl = nexusClient.getFileImageUrl(file, "small"); // 100x100
const feedUrl = nexusClient.getFileImageUrl(file, "feed"); // 400x400
const fullUrl = nexusClient.getFileImageUrl(file, "main"); // Original
```

All images are served via Nexus CDN for fast delivery.

## Service Layer

The service layer abstracts data sources from components. This allows changing
implementations without affecting UI code.

### Profile Service

Located at `src/services/profile-service.ts`:

```typescript
/**
 * Fetch profile data from Nexus
 * @param publicKey - User's public key
 * @returns Profile data or null
 */
export async function fetchProfileData(
  publicKey: string,
): Promise<PubkyProfile | null> {
  const bootstrap = await nexusClient.getBootstrap(publicKey);
  if (bootstrap?.users.length > 0) {
    const user = bootstrap.users.find((u) => u.details.id === publicKey);
    if (user) {
      return {
        name: user.details.name,
        bio: user.details.bio,
        image: user.details.image,
        links: user.details.links,
      };
    }
  }
  return null;
}

/**
 * Get resolved profile with optimized image URL
 */
export async function getResolvedProfile(
  publicKey: string,
): Promise<ResolvedProfile | null> {
  const profile = await fetchProfileData(publicKey);
  if (!profile) return null;

  const imageUrl = await resolveImageUrl(profile.image, publicKey);

  return {
    publicKey,
    name: profile.name,
    bio: profile.bio,
    links: profile.links,
    imageUrl,
  };
}
```

**Components should use hooks, not services directly.**

## Nexus Client API

### Bootstrap Endpoint

Get comprehensive data for a user:

```typescript
import { nexusClient } from "@/lib/nexus-client";

const bootstrap = await nexusClient.getBootstrap(publicKey);

// Returns:
bootstrap.users[0].details; // Profile data (name, bio, image, links)
bootstrap.users[0].counts; // Follower/following counts
bootstrap.users[0].tags; // User tags
bootstrap.posts; // User's posts
bootstrap.list.stream; // Activity stream
bootstrap.list.influencers; // Influencer recommendations
bootstrap.list.hot_tags; // Trending tags
```

### Files Endpoint

Fetch file metadata:

```typescript
const files = await nexusClient.getFilesByIds([
  "pubky://user/pub/pubky.app/files/ABC123",
  "pubky://user/pub/pubky.app/files/DEF456",
]);

files.forEach((file) => {
  console.log(file.name); // "avatar.jpg"
  console.log(file.content_type); // "image/jpeg"
  console.log(file.size); // 12345
});
```

### Image URLs

Get optimized image URLs:

```typescript
const imageUrl = nexusClient.getFileImageUrl(file, "small");
// Returns: https://nexus.pubky.app/static/files/{owner}/{id}/small
```

## Error Handling

### Nexus is Required Infrastructure

The app requires Nexus to function. If Nexus is unavailable:

```typescript
const { data: profile, error } = useNexusProfile(publicKey);

if (error) {
  // Show error state to user
  return (
    <ErrorBanner message="Unable to load profile. Please try again later." />
  );
}
```

**No homeserver fallback** - Write operations go to homeservers, but read
operations require Nexus.

### Automatic Retries

React Query automatically retries failed requests once with exponential backoff.

### Cache-First Loading

Even if Nexus is temporarily unavailable, cached data (if available) is shown
immediately:

```typescript
const { data: profile, isLoading, isError, error } = useNexusProfile(publicKey);

// Show cached data even if refetch fails
if (profile) {
  return <ProfileView profile={profile} stale={isError} />;
}

if (isLoading) return <Spinner />;
if (isError) return <ErrorState />;
```

## Configuration

### Environment Variables

Set in `.env.local`:

```env
# Nexus API URL (optional, defaults to https://nexus.pubky.app)
NEXT_PUBLIC_NEXUS_API_URL=https://nexus.pubky.app

# Other Pubky configuration
NEXT_PUBLIC_PUBKY_RELAY=https://httprelay.pubky.app/link
NEXT_PUBLIC_BASE_APP_PATH=/pub/pubky.app/
NEXT_PUBLIC_APP_NAME=Calky
```

### React Query Configuration

Configured in `src/lib/query-provider.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1, // Retry once on failure
      refetchOnWindowFocus: true, // Refresh on tab focus
    },
  },
});
```

## Performance Best Practices

### 1. Use Conditional Fetching

Only fetch when you have the data you need:

```typescript
const { data } = useNexusProfile(publicKey, {
  enabled: !!publicKey && isVisible,
});
```

### 2. Leverage Cache

Navigate between pages freely - data is cached:

```typescript
// First visit: Fetches from Nexus
<Link to={`/profile/${publicKey}`}>View Profile</Link>

// Return visit within 10 minutes: Instant load from cache
<Link to={`/profile/${publicKey}`}>View Profile</Link>
```

### 3. Use Optimized Image Sizes

Always specify the appropriate size:

```typescript
// ❌ Don't load original for thumbnails
<img src={nexusClient.getFileImageUrl(file, "main")} className="w-10 h-10" />

// ✅ Use 'small' for thumbnails
<img src={nexusClient.getFileImageUrl(file, "small")} className="w-10 h-10" />
```

### 4. Prefetch Data

Preload data before user navigates:

```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

function prefetchProfile(publicKey: string) {
  queryClient.prefetchQuery({
    queryKey: ["profile", publicKey],
    queryFn: () => getResolvedProfile(publicKey),
  });
}

// Prefetch on hover
<Link
  to={`/profile/${pk}`}
  onMouseEnter={() => prefetchProfile(pk)}
>
  View Profile
</Link>;
```

## Extending to Other Data

The same pattern works for any Nexus data:

### Posts Feed

```typescript
export function useNexusPosts(publicKey: string) {
  return useQuery({
    queryKey: ["posts", publicKey],
    queryFn: async () => {
      const bootstrap = await nexusClient.getBootstrap(publicKey);
      return bootstrap.posts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes for posts
  });
}
```

### Followers

```typescript
export function useNexusFollowers(publicKey: string) {
  return useQuery({
    queryKey: ["followers", publicKey],
    queryFn: () => fetchFollowers(publicKey),
  });
}
```

### Tags

```typescript
export function useNexusTags(filter?: string) {
  return useQuery({
    queryKey: ["tags", filter],
    queryFn: () => fetchTags(filter),
  });
}
```

## Debugging

### React Query DevTools

Install for visual cache inspection:

```bash
npm install @tanstack/react-query-devtools
```

Add to your layout:

```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function RootLayout({ children }) {
  return (
    <QueryProvider>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryProvider>
  );
}
```

### Console Logging

Services log all operations:

```
📋 SERVICE: Fetching profile from Nexus for: c5js...
🖼️ SERVICE: Resolving image: pubky://c5js.../files/...
🖼️ SERVICE: Got Nexus image URL
```

### Network Tab

Monitor API calls:

- `GET https://nexus.pubky.app/v0/bootstrap/{publicKey}` - Profile data
- `POST https://nexus.pubky.app/v0/files/by_ids` - File metadata
- `GET https://nexus.pubky.app/static/files/{owner}/{id}/small` - Images

## Troubleshooting

### Profile not loading

1. Check console for errors
2. Verify `NEXT_PUBLIC_NEXUS_API_URL` is correct
3. Check network tab for Nexus API calls
4. Ensure publicKey is valid

### Images not displaying

1. Verify image `src` starts with `https://nexus.pubky.app/static/files/...`
2. Check network tab for 404s
3. Confirm file URI format is correct

### Stale cache

1. Wait 10 minutes for automatic background refetch
2. Or manually invalidate:
   ```typescript
   queryClient.invalidateQueries(["profile", publicKey]);
   ```

## Summary

- ✅ All reads via Nexus (fast, indexed, cached)
- ✅ All writes via homeservers (authenticated, direct)
- ✅ Automatic caching with React Query
- ✅ Optimized image serving (3 sizes)
- ✅ Clean component APIs via hooks
- ✅ Type-safe throughout
