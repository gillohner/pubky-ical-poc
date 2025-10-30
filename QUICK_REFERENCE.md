# Quick Reference: Environment Setup

## 🎯 TL;DR - Just Want to Start Coding

```bash
# Start testnet
pubky-testnet

# In another terminal
npm run dev

# That's it! Testnet is the default.
```

---

## 🔄 Switching Environments

### Use Testnet (Default)

```bash
# Do nothing! Already configured in .env.development
# Just run:
npm run dev
```

### Switch to Staging

```bash
# Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_USE_TESTNET=false
NEXT_PUBLIC_HOMESERVER=ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy
NEXT_PUBLIC_NEXUS_API_URL=https://nexus.staging.pubky.app
NEXT_PUBLIC_PUBKY_RELAY=https://httprelay.staging.pubky.app/link
EOF

# Restart
npm run dev
```

### Switch Back to Testnet

```bash
rm .env.local
npm run dev
```

---

## 📁 Environment File Priority

```
.env                    # Base (committed)
  ↓ overridden by
.env.development        # Dev defaults (committed)
  ↓ overridden by
.env.local             # Your overrides (gitignored)
```

**Rule of thumb:**

- **No `.env.local`?** → Uses testnet (from `.env.development`)
- **Have `.env.local`?** → Uses whatever you put there

---

## ⚙️ Environment Variables Quick Reference

| Variable                    | Testnet                       | Staging                                    |
| --------------------------- | ----------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_USE_TESTNET`   | `true`                        | `false`                                    |
| `NEXT_PUBLIC_HOMESERVER`    | `8pinxxgqs41n...`             | `ufibwbmed6j...`                           |
| `NEXT_PUBLIC_PUBKY_RELAY`   | `http://localhost:15412/link` | `https://httprelay.staging.pubky.app/link` |
| `NEXT_PUBLIC_NEXUS_API_URL` | `http://localhost:8080`       | `https://nexus.staging.pubky.app`          |

---

## 🐛 Common Issues

### "HTTP transport error: error sending request"

**Fix:** Make sure testnet is running and URL has no trailing slash

```bash
# Check testnet is running
lsof -i :15412

# Verify .env.development or .env.local
grep PUBKY_RELAY .env.development

# Should be: http://localhost:15412/link (no trailing /)
```

### Changes to .env not working

**Fix:** Restart Next.js dev server

```bash
# Press Ctrl+C then:
npm run dev
```

### Testnet warning about DHT

**Fix:** This is normal and can be ignored. Testnet works fine without DHT.

---

## 📝 Files You'll Edit

| File                 | Purpose                    | Committed?         |
| -------------------- | -------------------------- | ------------------ |
| `.env`               | Base config shared by team | ✅ Yes             |
| `.env.development`   | Dev defaults for everyone  | ✅ Yes             |
| `.env.local`         | Your personal overrides    | ❌ No (gitignored) |
| `.env.local.example` | Template for .env.local    | ✅ Yes             |

---

## 🚀 Quick Commands

```bash
# Install testnet (one-time)
cargo install pubky-testnet --version 0.6.0-rc.6

# Run testnet
pubky-testnet

# Check if testnet is running
lsof -i :15411  # Pkarr relay
lsof -i :15412  # HTTP relay
lsof -i :15413  # Homeserver

# Start app (testnet mode by default)
npm run dev

# Switch to staging
echo "NEXT_PUBLIC_USE_TESTNET=false" > .env.local
echo "NEXT_PUBLIC_HOMESERVER=ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy" >> .env.local
echo "NEXT_PUBLIC_NEXUS_API_URL=https://nexus.staging.pubky.app" >> .env.local
echo "NEXT_PUBLIC_PUBKY_RELAY=https://httprelay.staging.pubky.app/link" >> .env.local

# Switch back to testnet
rm .env.local
```
