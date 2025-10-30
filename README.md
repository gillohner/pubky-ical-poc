This is a [Next.js](https://nextjs.org) project bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Component Library**: ShadCN UI
- **State Management**: Zustand (client state) + TanStack Query (server state)
- **Data Fetching**: Nexus API (required infrastructure)
- **Pubky SDK**: @synonymdev/pubky v0.6.0-rc.6
- **Testing**: Jest, React Testing Library

## Quick Start

### Prerequisites

- **Node.js 22+** (check with `node --version`)
- **npm** or **pnpm** or **yarn**
- **Rust toolchain** (only for local testnet development) -
  [Install Rust](https://rustup.rs/)

### Installation

```bash
npm install
```

### Development Modes

#### Option 1: Local Testnet (Recommended for Development)

Run a fully local, offline Pubky environment:

**Terminal 1 - Start Testnet:**

```bash
# Install pubky-testnet (one-time setup)
cargo install pubky-testnet --version 0.6.0-rc.6

# Run testnet
pubky-testnet
```

**Terminal 2 - Configure Environment:**

```bash
# Copy example env file
cp .env.example .env

# Ensure these values in your .env:
NEXT_PUBLIC_USE_TESTNET=true
NEXT_PUBLIC_HOMESERVER=8pinxxgqs41n4aididenw5apqp1urfmzdztr8jt4abrkdn435ewo
NEXT_PUBLIC_PUBKY_RELAY=http://localhost:15412/link
NEXT_PUBLIC_NEXUS_API_URL=http://localhost:8080  # If running Nexus locally
```

**Terminal 3 - Start App:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**What is Testnet?**

- 🧪 **Fully Local**: No internet required, runs entirely on your machine
- ⚡ **Fast**: Instant responses, no network latency
- 🔒 **Safe**: Isolated from production, perfect for testing
- 🎯 **Includes**: Local DHT, Homeserver, Pkarr relay, and HTTP relay

#### Option 2: Staging Environment

Use the shared staging infrastructure:

```bash
# Your .env
NEXT_PUBLIC_USE_TESTNET=false
NEXT_PUBLIC_HOMESERVER=ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy
NEXT_PUBLIC_PUBKY_RELAY=https://httprelay.staging.pubky.app/link
NEXT_PUBLIC_NEXUS_API_URL=https://nexus.staging.pubky.app
```

Then start the app:

```bash
npm run dev
```

### Authentication

The app uses **Pubky Auth** via QR code scanning:

1. Click "Sign In" or attempt to create a calendar
2. Scan QR code with **Pubky Ring** mobile app
3. Approve the authentication request
4. You're now authenticated with full read/write access to `/pub/pubky.app/`

**Testnet Authentication:**

- In testnet mode, you can test auth flows without a real mobile app
- Use the example authenticator from
  `pubky-core/examples/javascript/3-authenticator.mjs`
- Or create test recovery files for development

## Environment Variables

The app supports environment-based configuration. See `.env.example` for all
options:

```env
# Core Settings
NEXT_PUBLIC_USE_TESTNET=true              # true = local testnet, false = staging/production
NEXT_PUBLIC_HOMESERVER=<homeserver_pk>    # Homeserver public key
NEXT_PUBLIC_PUBKY_RELAY=<relay_url>       # HTTP relay URL for auth
NEXT_PUBLIC_NEXUS_API_URL=<nexus_url>     # Nexus API endpoint
NEXT_PUBLIC_BASE_APP_PATH=/pub/pubky.app/ # App data path
NEXT_PUBLIC_APP_NAME=Calky                # App display name
```

**Key Variables:**

- `NEXT_PUBLIC_USE_TESTNET`: Master switch for testnet vs production
- `NEXT_PUBLIC_HOMESERVER`: The homeserver to use for signup/signin
- `NEXT_PUBLIC_PUBKY_RELAY`: Relay for pubkyauth flow (QR code auth)
- `NEXT_PUBLIC_NEXUS_API_URL`: Nexus API for calendar queries and indexing

### Understanding Environment Files

Next.js loads environment files in this order (later files override earlier
ones):

1. **`.env`** - Base config (committed to git, shared by everyone)
2. **`.env.development`** - Development defaults (committed to git, used by
   `npm run dev`)
3. **`.env.local`** - Your personal overrides (gitignored, NOT committed)

**How to use them:**

| Scenario                       | What to do                                                       |
| ------------------------------ | ---------------------------------------------------------------- |
| **Use local testnet**          | Do nothing! `.env.development` is already configured for testnet |
| **Switch to staging**          | Create `.env.local` and set `NEXT_PUBLIC_USE_TESTNET=false`      |
| **Share config with team**     | Update `.env.development` (committed to git)                     |
| **Personal secrets/overrides** | Add to `.env.local` (never committed)                            |

**Quick switch to staging:**

```bash
# Create .env.local file
cat > .env.local << 'EOF'
# Override to use staging instead of testnet
NEXT_PUBLIC_USE_TESTNET=false
NEXT_PUBLIC_HOMESERVER=ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy
NEXT_PUBLIC_NEXUS_API_URL=https://nexus.staging.pubky.app
NEXT_PUBLIC_PUBKY_RELAY=https://httprelay.staging.pubky.app/link
EOF

# Restart your dev server
npm run dev
```

**Switch back to testnet:**

```bash
# Just delete .env.local
rm .env.local

# Restart dev server
npm run dev
```

## Testnet Development Guide

### What is Pubky Testnet?

`pubky-testnet` is a complete local Pubky stack that runs on your machine:

```
┌─────────────────────────────────────────┐
│  pubky-testnet (single binary)         │
├─────────────────────────────────────────┤
│  • Local DHT (Mainline DHT)            │
│  • Pkarr Relay (localhost:15411)       │
│  • HTTP Relay (localhost:15412)        │
│  • Homeserver (localhost:15413)        │
└─────────────────────────────────────────┘
```

### Testnet Setup Steps

1. **Install Rust** (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **Install pubky-testnet**:
   ```bash
   cargo install pubky-testnet --version 0.6.0-rc.6
   ```

3. **Run testnet**:
   ```bash
   pubky-testnet
   ```

   You should see output like:
   ```
   🧪 Pubky Testnet v0.6.0-rc.6
   ✓ DHT running on localhost
   ✓ Pkarr relay: http://localhost:15411
   ✓ HTTP relay: http://localhost:15412
   ✓ Homeserver: http://localhost:15413

   Default homeserver public key:
   8pinxxgqs41n4aididenw5apqp1urfmzdztr8jt4abrkdn435ewo
   ```

   **Common Issues:**

   - **Error: "Failed to run homeserver on port..."**
     - The testnet is trying to connect to mainline DHT
     - This is a known warning and can be ignored - the testnet will still work
       locally
     - The homeserver runs in isolated mode without DHT connectivity

   - **Port conflicts**: If you see "address already in use", another process is
     using the port
     - Stop any Docker containers: `docker stop $(docker ps -q)`
     - Kill the process using the port: `lsof -ti:15412 | xargs kill -9`

4. **Verify testnet is running**:
   ```bash
   # Check if HTTP relay is responding
   curl http://localhost:15412/health || echo "Relay is running (404 is OK)"

   # The above might return 404, which is normal - the relay is running
   # but doesn't have a /health endpoint
   ```

5. **Configure your app** (already done in `.env.development`):
   ```env
   NEXT_PUBLIC_USE_TESTNET=true
   NEXT_PUBLIC_HOMESERVER=8pinxxgqs41n4aididenw5apqp1urfmzdztr8jt4abrkdn435ewo
   NEXT_PUBLIC_PUBKY_RELAY=http://localhost:15412/link
   ```

6. **Start your app**:
   ```bash
   npm run dev
   ```

### Testnet Features

✅ **What Works:**

- User signup/signin
- Calendar CRUD operations
- Event CRUD operations
- File/blob uploads
- Pubkyauth flows
- All SDK 0.6.0 features

❌ **What Doesn't Work:**

- Nexus API queries (Nexus not included in testnet binary)
- Network-wide discovery
- Mobile app QR scanning (use example scripts instead)

### Testnet Development Tips

1. **Clean State**: Restart `pubky-testnet` to reset all data
2. **No Signup Tokens**: Testnet doesn't require invitation codes
3. **Fast Iteration**: Changes reflect instantly (no network delays)
4. **Debugging**: Enable SDK logging:
   ```typescript
   import { setLogLevel } from "@synonymdev/pubky";
   setLogLevel("debug"); // or "trace" for verbose output
   ```

### Switching Between Testnet and Staging

**Testnet** (local development):

```env
NEXT_PUBLIC_USE_TESTNET=true
NEXT_PUBLIC_HOMESERVER=8pinxxgqs41n4aididenw5apqp1urfmzdztr8jt4abrkdn435ewo
NEXT_PUBLIC_PUBKY_RELAY=http://localhost:15412/link
```

**Staging** (shared infrastructure):

```env
NEXT_PUBLIC_USE_TESTNET=false
NEXT_PUBLIC_HOMESERVER=ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy
NEXT_PUBLIC_PUBKY_RELAY=https://httprelay.staging.pubky.app/link
NEXT_PUBLIC_NEXUS_API_URL=https://nexus.staging.pubky.app
```

Just change `NEXT_PUBLIC_USE_TESTNET` and restart your dev server!

## Troubleshooting

### Testnet Issues

**Error: "Request failed: HTTP transport error: error sending request"**

This usually means the SDK can't connect to the testnet services. Check:

1. **Is testnet running?**
   ```bash
   # Look for these ports in use
   lsof -i :15411  # Pkarr relay
   lsof -i :15412  # HTTP relay
   lsof -i :15413  # Homeserver
   ```

2. **Is your `.env.development` or `.env.local` configured correctly?**
   ```bash
   # Should show NEXT_PUBLIC_USE_TESTNET=true
   cat .env.development
   ```

3. **Restart both testnet and your app:**
   ```bash
   # Terminal 1: Stop and restart testnet
   # Press Ctrl+C, then:
   pubky-testnet

   # Terminal 2: Restart Next.js
   # Press Ctrl+C, then:
   npm run dev
   ```

4. **Check the relay URL doesn't have a trailing slash:**
   ```env
   # ✅ Correct
   NEXT_PUBLIC_PUBKY_RELAY=http://localhost:15412/link

   # ❌ Wrong
   NEXT_PUBLIC_PUBKY_RELAY=http://localhost:15412/link/
   ```

**Warning: "Failed to publish the homeserver's pkarr packet to the DHT"**

This is **expected** and can be ignored. The testnet runs in isolated mode and
doesn't need to connect to the mainline DHT. Your local development will work
fine.

**Error: "Port already in use"**

```bash
# Find what's using the port
lsof -i :15412

# Kill the process
kill -9 <PID>

# Or kill all on that port
lsof -ti:15412 | xargs kill -9
```

### Environment Variable Issues

**Changes to `.env` files not taking effect:**

1. **Restart the Next.js dev server** - Environment variables are loaded at
   startup
   ```bash
   # Press Ctrl+C to stop
   npm run dev  # Start again
   ```

2. **Check Next.js is reading the right file:**
   ```typescript
   // Add this temporarily to any component
   console.log("Testnet mode:", process.env.NEXT_PUBLIC_USE_TESTNET);
   console.log("Homeserver:", process.env.NEXT_PUBLIC_HOMESERVER);
   ```

3. **Remember the loading order:** `.env` → `.env.development` → `.env.local`
   - If you created `.env.local`, it overrides everything else
   - Delete `.env.local` to use the default `.env.development` settings

**Variable showing as `undefined`:**

- Must be prefixed with `NEXT_PUBLIC_` to be available in the browser
- Check for typos in variable names
- Restart the dev server after adding new variables

### SDK/Authentication Issues

**QR code shows but auth never completes:**

In testnet mode, you need to manually approve auth requests since there's no
mobile app:

```bash
# In another terminal, approve the auth request
cd /path/to/pubky-core/examples/javascript
npm run authenticator -- ./your-recovery-file.pkarr "<AUTH_URL>" --testnet
```

**"No active session" errors:**

The app requires authentication before creating calendars. Make sure you:

1. Click "Sign In" or attempt to create a calendar
2. The auth flow completes successfully
3. You see your profile in the header

## Testing

This project includes unit and integration tests:

### Unit & Integration Tests (Jest + React Testing Library)

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

## Documentation

- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System architecture,
  patterns, and best practices
- **[Data Fetching Guide](./docs/DATA_FETCHING.md)** - How to fetch data using
  Nexus API
- **[Error Handling Guide](./docs/ERROR_HANDLING.md)** - Error handling patterns
  and best practices

## Project Structure

```
src/
├── app/              # Next.js app directory
├── components/       # React components
│   ├── ui/          # ShadCN UI components
│   └── __tests__/   # Component tests
├── lib/             # Utility functions
│   └── __tests__/   # Utility tests
├── stores/          # Zustand stores
└── hooks/           # Custom React hooks
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out
[the Next.js GitHub repository](https://github.com/vercel/next.js) - your
feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our
[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
for more details.
