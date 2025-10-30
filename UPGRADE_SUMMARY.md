# Pubky SDK 0.6.0-rc.6 Upgrade Summary

## ✅ Completed Upgrades

This document summarizes the refactoring of `pubky-ical-poc` to use Pubky SDK
version **0.6.0-rc.6** with full testnet support.

---

## 🎯 Changes Made

### 1. **Environment Configuration** ⚙️

**Files Modified:**

- `.env.example` - Added testnet configuration
- `src/lib/config.ts` - Added `useTestnet` and `homeserver` to AppConfig

**New Environment Variables:**

```env
# Master switch for testnet vs production
NEXT_PUBLIC_USE_TESTNET=true

# Automatically configured based on testnet mode:
# - Testnet: 8pinxxgqs41n4aididenw5apqp1urfmzdztr8jt4abrkdn435ewo
# - Staging: ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy
NEXT_PUBLIC_HOMESERVER=<auto>

# Automatically configured based on testnet mode:
# - Testnet: http://localhost:15412/link
# - Production: https://httprelay.pubky.app/link
NEXT_PUBLIC_PUBKY_RELAY=<auto>
```

---

### 2. **SDK Package Upgrade** 📦

**Files Modified:**

- `package.json` - Updated dependency

**Change:**

```diff
- "@synonymdev/pubky": "^0.5.4"
+ "@synonymdev/pubky": "0.6.0-rc.6"
```

---

### 3. **Core Client Architecture Refactor** 🔧

**Files Modified:**

- `src/lib/pubky-client.ts` - Complete rewrite

**Major API Changes:**

| SDK 0.5.4 (Old)                                  | SDK 0.6.0-rc.6 (New)                    |
| ------------------------------------------------ | --------------------------------------- |
| `new Client()`                                   | `new Pubky()` or `Pubky.testnet()`      |
| `client.signup(keypair, homeserver, token)`      | `signer.signup(homeserver, token)`      |
| `client.signin(keypair)`                         | `signer.signin()`                       |
| `client.fetch(url, {method, body, credentials})` | `session.storage.putBytes(path, data)`  |
| `client.authRequest(relay, caps)`                | `pubky.startAuthFlow(caps, relay)`      |
| N/A                                              | `pubky.publicStorage.getBytes(address)` |

**New Pattern:**

```typescript
// Initialize facade (testnet-aware)
const pubky = config.useTestnet ? Pubky.testnet() : new Pubky();

// Start auth flow
const flow = pubky.startAuthFlow("/pub/pubky.app/:rw", relay);
const session = await flow.awaitApproval();

// Authenticated writes (relative paths)
await session.storage.putText("/pub/pubky.app/calendar/ABC", json);

// Public reads (addressed format)
const data = await pubky.publicStorage.getBytes(
    "pubky<pk>/pub/pubky.app/calendar/ABC",
);
```

---

### 4. **Authentication Flow Updates** 🔐

**Files Modified:**

- `src/components/auth/AuthDialog.tsx` - Updated to use `AuthFlow`
- `src/stores/auth-store.ts` - Updated signout to use `session.signout()`

**Key Changes:**

```typescript
// OLD: authRequest + response()
const request = await client.authRequest(relay, capabilities);
const url = request.url();
const pubky = await request.response();

// NEW: startAuthFlow + awaitApproval
const flow = await client.startAuthFlow(capabilities, relay);
const url = flow.authorizationUrl;
const session = await flow.awaitApproval();
```

**Session Management:**

- Session stored in PubkyClient singleton
- Session info contains `publicKey` and `capabilities`
- Logout calls `session.signout()` instead of `client.signout(publicKey)`

---

### 5. **Service Layer Updates** 📝

**Files Modified:**

- `src/services/calendar-service.ts` - Updated all CRUD operations
- `src/services/calendar-list-service.ts` - Updated list and get operations
- `src/services/calendar-fetch-service.ts` - Updated get operation

**URL Format Changes:**

| Operation                  | Old Format           | New Format        | Notes                             |
| -------------------------- | -------------------- | ----------------- | --------------------------------- |
| **PUT** (authenticated)    | `pubky://<pk>/path`  | `/path`           | Relative path for session storage |
| **DELETE** (authenticated) | `pubky://<pk>/path`  | `/path`           | Relative path for session storage |
| **GET** (public)           | `pubky://<pk>/path`  | `pubky<pk>/path`  | Remove `://` for public storage   |
| **LIST** (public)          | `pubky://<pk>/path/` | `pubky<pk>/path/` | Remove `://` for public storage   |

**Example Conversions:**

```typescript
// OLD: Authenticated write with full URI
await client.put(`pubky://${publicKey}/pub/pubky.app/calendar/${id}`, data);

// NEW: Authenticated write with relative path
await client.put(`/pub/pubky.app/calendar/${id}`, data);

// OLD: Public read with URI
await client.get(`pubky://${publicKey}/pub/pubky.app/calendar/${id}`);

// NEW: Public read with address format
const address = `pubky${publicKey}/pub/pubky.app/calendar/${id}`;
await client.get(address);
```

---

### 6. **Documentation** 📚

**Files Modified:**

- `README.md` - Added comprehensive testnet guide

**New Sections:**

- Quick Start with testnet setup
- Testnet Development Guide
- Environment variable documentation
- Authentication guide for testnet
- Switching between testnet and staging

---

## 🧪 Testnet Support

### How to Use Testnet

**1. Install pubky-testnet:**

```bash
cargo install pubky-testnet --version 0.6.0-rc.6
```

**2. Run testnet:**

```bash
pubky-testnet
```

**3. Configure your app:**

```env
NEXT_PUBLIC_USE_TESTNET=true
```

**4. Start development:**

```bash
npm run dev
```

### Testnet Benefits

- ✅ Fully offline development
- ✅ No network latency
- ✅ Clean state on restart
- ✅ No signup tokens required
- ✅ Perfect for CI/CD testing

---

## 🔄 Migration Checklist

For other projects upgrading to SDK 0.6.0-rc.6:

- [ ] Update `package.json` to use `@synonymdev/pubky@0.6.0-rc.6`
- [ ] Add `NEXT_PUBLIC_USE_TESTNET` environment variable
- [ ] Replace `Client` with `Pubky` facade
- [ ] Update auth flow to use `startAuthFlow()` + `awaitApproval()`
- [ ] Convert authenticated writes to use relative paths
- [ ] Convert public reads to use `pubky<pk>/path` format (no `://`)
- [ ] Update signout to use `session.signout()` instead of `client.signout(pk)`
- [ ] Test with local testnet before deploying

---

## 📝 Breaking Changes Summary

### Type Changes

- `Client` → `Pubky` (facade pattern)
- `AuthRequest` → `AuthFlow`
- No more `client.session(publicKey)` - use `flow.awaitApproval()` instead

### Method Changes

- `client.signup()` → `signer.signup()`
- `client.signin()` → `signer.signin()`
- `client.authRequest()` → `pubky.startAuthFlow()`
- `client.fetch()` → `session.storage.put/get/delete()`
- `client.signout(pk)` → `session.signout()`

### Path Format Changes

- Authenticated operations: Use relative paths (`/pub/pubky.app/...`)
- Public reads: Use address format (`pubky<pk>/pub/...` without `://`)

---

## ⚠️ Known Issues

### Pre-existing Type Errors

The following type errors existed before the upgrade and are unrelated to SDK
changes:

- `calendar-service.ts:63` - Color parameter type mismatch
- `calendar-service.ts:129` - Color parameter type mismatch
- `calendar-service.ts:225` - dtend parameter type mismatch

These are related to `pubky-app-specs` type definitions, not the SDK upgrade.

---

## 🎉 Results

The application now:

- ✅ Works with both local testnet AND staging environments
- ✅ Uses the latest Pubky SDK 0.6.0-rc.6 architecture
- ✅ Supports easy environment switching via `NEXT_PUBLIC_USE_TESTNET`
- ✅ Has improved developer experience with offline development
- ✅ Follows SDK 0.6.0 best practices and patterns
- ✅ Includes comprehensive testnet documentation

---

## 📖 Resources

- [Pubky SDK 0.6.0-rc.6 on npm](https://www.npmjs.com/package/@synonymdev/pubky/v/0.6.0-rc.6)
- [Pubky SDK Documentation](https://docs.rs/pubky/0.6.0-rc.6/pubky/index.html)
- [JavaScript Examples](https://github.com/pubky/pubky-core/tree/main/examples/javascript)
- [Hackathon Instructions](https://github.com/pubky/hackathon-2025/blob/main/README.md)

---

**Upgrade completed on:** 2025-10-30\
**SDK Version:** 0.6.0-rc.6\
**Project:** pubky-ical-poc
