# Calky Architecture

## Overview

Calky is a Next.js 15 application for discovering and managing calendars and
events on the Pubky decentralized network.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**:
  - Zustand (client state: auth, UI state)
  - TanStack Query (server state: profiles, posts)
- **Data Fetching**: Nexus API (required infrastructure)
- **Authentication**: Pubky Auth Protocol
- **SDK**: @synonymdev/pubky
- **Testing**: Jest, React Testing Library

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/
│   │   └── callback/       # Auth callback handler
│   ├── calendars/          # Calendar discovery page
│   ├── events/             # Event discovery page
│   └── layout.tsx          # Root layout
│
├── components/             # React components
│   ├── auth/               # Authentication components
│   ├── layout/             # Layout components (TopNav, etc.)
│   └── ui/                 # Shadcn/ui components
│
├── hooks/                  # Custom React hooks
│   ├── useAuthCompletion.ts
│   ├── useProfile.ts       # (legacy) Profile hook
│   └── useNexusProfile.ts  # React Query profile hook
│
├── lib/                    # Core utilities and clients
│   ├── config.ts           # App configuration
│   ├── nexus-client.ts     # Nexus API client
│   ├── pubky-client.ts     # Pubky SDK wrapper
│   ├── query-provider.tsx  # TanStack Query provider
│   ├── relay.ts            # Auth relay utilities
│   └── utils.ts            # General utilities
│
├── services/               # 🎯 SERVICE LAYER
│   ├── README.md           # Service architecture guide
│   └── profile-service.ts  # Profile data fetching service
│
├── stores/                 # Zustand state stores
│   ├── auth-store.ts       # Authentication state
│   └── example-store.ts    # Example store
│
├── types/                  # TypeScript type definitions
│   ├── nexus.ts            # Nexus API response types
│   └── profile.ts          # Profile and user types
│
└── utils/                  # Utility functions
    └── avatar.ts           # Avatar helpers
```

## Architecture Layers

### 1. Presentation Layer (Components)

**Responsibility**: UI rendering and user interactions

```typescript
// Example: TopNav.tsx
export function TopNav() {
  const { user, logout } = useAuthStore();
  const { profile } = useProfile(user?.publicKey);

  return <nav>...</nav>;
}
```

**Rules**:

- No direct API calls
- No business logic
- Uses hooks and stores only
- Focuses on rendering and events

### 2. Hook Layer

**Responsibility**: Component-level state management and data fetching

**Two approaches:**

**A. React Query (Recommended for server state)**

```typescript
// Example: useNexusProfile.ts
export function useNexusProfile(publicKey: string | null) {
  return useQuery({
    queryKey: ["profile", publicKey],
    queryFn: () => getResolvedProfile(publicKey),
    enabled: !!publicKey,
  });
}
```

**B. Custom useState hook (For specific needs)**

```typescript
// Example: useProfile.ts (legacy)
export function useProfile(publicKey: string | null) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getResolvedProfile(publicKey).then(setProfile);
  }, [publicKey]);

  return { profile, isLoading, error };
}
```

**Rules**:

- Use React Query for server state (profiles, posts, etc.)
- Use Zustand for client state (auth, UI state, modals)
- Calls service layer functions
- Handles loading/error states
- Provides clean API to components

### 3. Service Layer 🎯

**Responsibility**: Data fetching and business logic abstraction

```typescript
// Example: profile-service.ts
export async function getResolvedProfile(
  publicKey: string
): Promise<ResolvedProfile | null> {
  // Try Nexus API first
  const bootstrap = await nexusClient.getBootstrap(publicKey);
  if (bootstrap?.users.length > 0) {
    const user = bootstrap.users.find(u => u.details.id === publicKey);
    if (user) {
      const imageUrl = await resolveImageUrl(user.details.image, publicKey);
      return { publicKey, name: user.details.name, imageUrl, ... };
    }
  }
  
  // Profile not found in Nexus
  return null;
}
```

**Rules**:

- Abstract data sources
- Return null on errors (no throws)
- Use TypeScript interfaces
- Log with consistent prefixes
- Prepare for Nexus API integration

### 4. Client Layer

**Responsibility**: Low-level SDK interactions

```typescript
// Example: pubky-client.ts
export class PubkyClient {
  async get(url: string): Promise<Uint8Array | null> {
    const response = await this.client.fetch(url);
    return response.ok ? new Uint8Array(await response.arrayBuffer()) : null;
  }
}
```

**Rules**:

- Wraps external SDKs
- Handles initialization
- Provides type-safe API
- Singleton pattern

## Data Flow

### Current Implementation

```
User Action
    ↓
Component
    ↓
Hook (useProfile)
    ↓
Service (profile-service)
    ↓
Client (Fresh SDK Client)
    ↓
Pubky Homeserver
```

### Future Implementation (Nexus API)

```
User Action
    ↓
Component (unchanged)
    ↓
Hook (unchanged)
    ↓
Service (internal changes only)
    ↓
    ├─→ Local DB Cache (check)
    │       ↓ (miss)
    └─→ Nexus API Client
            ↓
        Nexus API Server
            ↓
        Local DB Cache (update)
```

## Nexus API Integration

### Overview

Calky uses the **Pubky Nexus API** as the primary data source for fetching user
profiles, posts, and social data. The Nexus API provides:

- **Fast, indexed access** to Pubky network data
- **Aggregated social graph** information (followers, following, tags)
- **Optimized image serving** with multiple sizes (small, feed, main)
- **Bootstrap endpoints** for getting all user data in one call

### Architecture

```
Component
    ↓
useNexusProfile (React Query)
    ↓
profile-service.ts
    ↓
  ┌─────────────────┐
  │ Try Nexus API   │ ← Primary
  │ /v0/bootstrap   │
  └─────┬───────────┘
        │
        │ (success) → Return data
        │
        │ (fail/timeout)
        ↓
  ┌─────────────────┐
  │ Fallback to     │ ← Backup
  │ Homeserver      │
  │ Direct Fetch    │
  └─────────────────┘
```

### Key Components

#### 1. Nexus Client (`lib/nexus-client.ts`)

Handles all Nexus API requests:

```typescript
// Bootstrap: Get user profile + social data
await nexusClient.getBootstrap(publicKey);

// Files: Get file metadata and URLs
await nexusClient.getFilesByIds([imageUri]);

// Image URLs: Get optimized image URL
nexusClient.getFileImageUrl(file, "small"); // 'small' | 'feed' | 'main'
```

#### 2. Profile Service (`services/profile-service.ts`)

Abstracts data fetching from Nexus API:

```typescript
export async function fetchProfileData(publicKey: string) {
  // Fetch from Nexus API
  const bootstrap = await nexusClient.getBootstrap(publicKey);
  if (bootstrap?.users.length > 0) {
    return convertNexusToProfile(bootstrap.users[0]);
  }

  // Profile not found
  return null;
}
```

#### 3. React Query Hook (`hooks/useNexusProfile.ts`)

Provides automatic caching and background refetching:

```typescript
const { data: profile, isLoading, error } = useNexusProfile(publicKey);
```

**Benefits:**

- Automatic caching (10min stale time, 30min cache time)
- Background refetching on window focus
- Deduplication of requests
- Loading and error states
- Automatic retries

### Image Handling

Nexus provides three image sizes for optimal performance:

| Size    | Use Case                    | Dimensions |
| ------- | --------------------------- | ---------- |
| `small` | Profile avatars, thumbnails | 100x100px  |
| `feed`  | Feed posts, medium previews | 400x400px  |
| `main`  | Full-size viewing, modals   | Original   |

**Example:**

```typescript
const imageUrl = nexusClient.getFileImageUrl(file, "small");
// Returns: https://nexus.pubky.app/static/files/{owner_id}/{file_id}/small
```

### Caching Strategy

**React Query handles caching automatically:**

1. **Query Key**: `['profile', publicKey]`
2. **Stale Time**: 10 minutes (data considered fresh)
3. **GC Time**: 30 minutes (keep in cache even if unused)
4. **Refetch**: On window focus (if stale)

**Benefits:**

- No manual cache management needed
- Instant navigation (cached data shown immediately)
- Background updates when data becomes stale
- Reduced API calls

### Error Handling

The service layer handles Nexus errors gracefully:

```typescript
try {
  const data = await nexusClient.getBootstrap(publicKey);
  if (data) return processNexusData(data);
  return null; // Profile not found
} catch (error) {
  console.error("Nexus error:", error);
  return null; // Show error state to user
}
```

**Why Nexus is required:**

- Nexus is essential infrastructure for the app
- Without Nexus, the app shows appropriate error states
- Write operations (creating data) still go directly to homeservers

### Configuration

Set Nexus API URL via environment variable:

```env
# .env.local
NEXT_PUBLIC_NEXUS_API_URL=https://nexus.pubky.app
```

Defaults to `https://nexus.pubky.app` if not set.

## Authentication Flow

### 1. Login Initiation

```typescript
// AuthDialog.tsx
const request = await client.authRequest(relay, capabilities, callbackUrl);
const deepLink = `pubkyring://auth?url=${
  encodeURIComponent(request.url())
}&callback=${callbackUrl}`;
```

### 2. Pubky Ring Authorization

User authorizes in Pubky Ring app → Ring redirects to callback URL with token

### 3. Callback Processing

```typescript
// app/auth/callback/page.tsx
const token = searchParams.get("token");
const publicKey = searchParams.get("pubkey");

const profile = await getResolvedProfile(publicKey);
setUser({ publicKey, name: profile?.name, imageUrl: profile?.imageUrl });
```

### 4. Session Management

```typescript
// auth-store.ts (Zustand with persist middleware)
persist(
  (set) => ({
    user: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: true }),
    logout: async () => {
      await client.signout(user.publicKey);
      // Clear cookies, storage, etc.
      set({ user: null, isAuthenticated: false });
    },
  }),
  { name: "pubky-ical-user" },
);
```

## State Management

### Global State (Zustand)

- **auth-store**: User authentication state
- Persisted to localStorage
- Accessed via `useAuthStore()` hook

### Component State (React)

- **useProfile**: Profile data fetching
- **useAuthCompletion**: Auth modal state
- Local state for UI-only concerns

### Server State (Future)

When integrating Nexus API:

- Use React Query or SWR for server state
- Cache in IndexedDB
- Sync with Nexus API

## Profile Data Handling

### Critical: Avoiding Session Contamination

**Problem**: When users share the same homeserver, the SDK's session cookies can
cause profile fetches to return the wrong user's data.

**Solution**: Always use a fresh Client instance with NO session when fetching
public data:

```typescript
// ✅ CORRECT
const { Client } = await import("@synonymdev/pubky");
const freshClient = new Client(); // No session cookies
const response = await freshClient.fetch(`pubky://${publicKey}/...`);

// ❌ WRONG
const client = PubkyClient.getInstance(); // Has session cookies!
const response = await client.get(`pubky://${publicKey}/...`);
```

This ensures the SDK properly resolves `pubky://USER/path` to
`https://USER.homeserver.pubky.app/path` instead of routing through the
logged-in session's homeserver.

## Migration to Nexus API

### Phase 1: Current (Direct Homeserver)

- ✅ Clean service layer abstraction
- ✅ Type-safe interfaces
- ✅ Session storage caching
- Components use hooks → services → homeservers

### Phase 2: Nexus Integration (Future)

**Step 1**: Add Nexus Client

```typescript
// src/lib/nexus-client.ts
export class NexusClient {
  async getProfile(publicKey: string): Promise<Profile> {
    const response = await fetch(`${NEXUS_API}/profiles/${publicKey}`);
    return response.json();
  }
}
```

**Step 2**: Add Local DB

```typescript
// src/lib/db.ts
export const db = new Dexie("calky");
db.version(1).stores({
  profiles: "publicKey, name, updatedAt",
  events: "id, title, start, end",
  calendars: "id, name, owner",
});
```

**Step 3**: Update Services (Internal Only)

```typescript
// src/services/profile-service.ts
export async function getResolvedProfile(publicKey: string) {
  // Check cache
  const cached = await db.profiles.get(publicKey);
  if (cached && !isStale(cached)) return cached;

  // Fetch from Nexus
  const data = await nexusClient.getProfile(publicKey);

  // Update cache
  await db.profiles.put({ ...data, updatedAt: Date.now() });

  return data;
}
```

**Step 4**: Components Unchanged ✅

No component or hook changes needed!

## Performance Considerations

### Current Optimizations

1. **Session Storage Cache**: Profiles cached per session
2. **Race Condition Guards**: Hooks check if requests are still valid before
   updating state
3. **Object URL Management**: Blob URLs properly revoked to prevent memory leaks
4. **Fresh Client Instances**: No session contamination

### Future Optimizations

1. **IndexedDB Cache**: Persistent local cache
2. **Stale-While-Revalidate**: Show cached data, fetch in background
3. **Request Deduplication**: Prevent duplicate API calls
4. **Batch Requests**: Group multiple profile fetches
5. **Optimistic Updates**: Update UI before API confirms

## Testing Strategy

### Unit Tests

- Services: Mock external clients
- Hooks: Use `@testing-library/react-hooks`
- Utils: Pure function tests

### Integration Tests

- Component + Hook + Service flow
- Mock service layer

## Key Design Decisions

1. **Service Layer Abstraction**: Enables seamless Nexus migration
2. **Fresh Client for Public Data**: Prevents session contamination
3. **Session Storage Cache**: Fast, browser-managed
4. **Zustand with Persist**: Simple, type-safe global state
5. **TypeScript Strict Mode**: Catch errors at compile time
6. **Hook-Based Architecture**: Clean separation, testable

## Environment Variables

```env
# Required for Pubky Auth
NEXT_PUBLIC_BASE_APP_PATH=/pub/pubky.app/
NEXT_PUBLIC_PUBKY_RELAY=https://httprelay.pubky.app/link

# Optional
NEXT_PUBLIC_APP_NAME=Calky

# Future: Nexus API
NEXT_PUBLIC_NEXUS_API_URL=https://api.nexus.pubky.app
```

## Next Steps

1. **Implement event/calendar services** following profile-service pattern
2. **Add IndexedDB layer** for persistent caching
3. **Integrate Nexus API client** when available
4. **Add React Query** for server state management
5. **Implement sync strategy** between local DB and Nexus
