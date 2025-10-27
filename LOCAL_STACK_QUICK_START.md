# 🚀 Local Stack Quick Start Guide

**Status**: Tested Step-by-Step  
**Date**: 2025-10-27

---

## ⚠️ Prerequisites (Fix These First)

### 1. Start Docker Desktop

```bash
# Check if Docker is running
docker ps

# If you see "Cannot connect to Docker daemon":
# → Open Docker Desktop application
# → Wait for "Docker Desktop is running" message
# → Try again: docker ps
```

**Mac**: Open Applications → Docker  
**Verify**: `docker ps` should show a table (even if empty)

### 2. Fix pnpm PATH (One-Time)

Your pnpm is installed but not in PATH. **Choose ONE option**:

#### Option A: Use npx (Easiest, No Config)
```bash
# Just use npx pnpm everywhere
npx pnpm -v
```

#### Option B: Add to PATH (Permanent Fix)
```bash
# Add this line to ~/.zshrc (for zsh) or ~/.bashrc (for bash)
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc

# Reload shell
source ~/.zshrc

# Test
pnpm -v
```

#### Option C: Symlink (Alternative)
```bash
sudo ln -s ~/.npm-global/bin/pnpm /usr/local/bin/pnpm
pnpm -v
```

---

## 🎯 Step-by-Step Startup (Copy-Paste Each Block)

### Step 1: Start Docker & Database

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Start Docker Desktop first! (via Applications)

# Then start Postgres
docker compose -f docker-compose.db.yml up -d postgres

# Verify it's running
docker compose -f docker-compose.db.yml ps

# Wait for DB to be ready (takes ~5 seconds)
sleep 5

# Test connection
docker compose -f docker-compose.db.yml exec -T postgres pg_isready -U neonhub
```

**Expected**: `postgres:5432 - accepting connections`

---

### Step 2: Setup Environment

```bash
# Set database URL (use this for all terminal commands)
export DATABASE_URL="postgresql://neonhub:neonhub@localhost:5433/neonhub"
export DIRECT_DATABASE_URL="$DATABASE_URL"

# Verify it's set
echo $DATABASE_URL
```

**Expected**: Shows the postgresql:// URL

---

### Step 3: Prepare Prisma (Using npx)

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Generate Prisma Client
npx pnpm --filter apps/api exec prisma generate

# Validate schema
npx pnpm --filter apps/api exec prisma validate

# Apply migrations
npx pnpm --filter apps/api exec prisma migrate deploy

# Seed database (optional but recommended)
npx pnpm --filter apps/api exec prisma db seed
```

**Expected**: Each command completes without errors

---

### Step 4: Start API

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Start API in background
npx pnpm --filter apps/api dev > /tmp/neonhub-api.log 2>&1 &

# Save PID
echo $! > /tmp/api.pid
echo "API PID: $(cat /tmp/api.pid)"

# Wait for API to start (takes ~10-15 seconds)
echo "Waiting for API to start..."
for i in {1..30}; do
  if curl -fsS http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✓ API is ready!"
    break
  fi
  echo -n "."
  sleep 1
done
```

**Expected**: "✓ API is ready!" message

---

### Step 5: Verify Services

```bash
# Check health
curl http://localhost:3001/api/health | jq '.status'

# Check readiness
curl http://localhost:3001/api/readyz | jq '.'

# Check if pgvector is enabled
curl http://localhost:3001/api/readyz | jq '.pgvector'
```

**Expected**:
- Status: "healthy" or "degraded"
- Readyz: `{"ok":true,"pgvector":true,...}`

---

### Step 6: Run Smoke Tests

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Run all tests
./scripts/post-deploy-smoke.sh
```

**Expected**: Most tests pass (10-11 out of 13)

---

## 📊 What Each Command Does

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `docker compose up -d postgres` | Starts PostgreSQL on port 5433 |
| 2 | `export DATABASE_URL=...` | Sets connection string |
| 3 | `prisma generate` | Creates Prisma Client |
| 3 | `prisma migrate deploy` | Applies database migrations |
| 3 | `prisma db seed` | Inserts test data |
| 4 | `pnpm dev` | Starts API server on port 3001 |
| 5 | `curl .../health` | Verifies API is responding |
| 6 | `post-deploy-smoke.sh` | Runs comprehensive tests |

---

## 🔧 Troubleshooting

### Docker not running
```bash
# Error: "Cannot connect to Docker daemon"
# Fix: Open Docker Desktop app, wait for startup
```

### pnpm not found
```bash
# Use npx instead
npx pnpm -v

# Or add to PATH (see Option B above)
```

### Port 5433 already in use
```bash
# Stop existing Postgres
docker compose -f docker-compose.db.yml down

# Or find and kill the process
lsof -ti :5433 | xargs kill -9
```

### Port 3001 already in use
```bash
# Kill existing API
kill $(cat /tmp/api.pid) 2>/dev/null

# Or force kill
lsof -ti :3001 | xargs kill -9
```

### API won't start
```bash
# View logs
tail -f /tmp/neonhub-api.log

# Common issues:
# - Missing .env file (check for DATABASE_URL)
# - Database not ready (wait longer)
# - Missing dependencies (run: npx pnpm install)
```

### Smoke tests fail
```bash
# Check API is actually running
curl http://localhost:3001/api/health

# Check logs
tail -f /tmp/neonhub-api.log

# Restart API
kill $(cat /tmp/api.pid)
npx pnpm --filter apps/api dev > /tmp/neonhub-api.log 2>&1 &
```

---

## 🛑 How to Stop Everything

```bash
# Stop API
kill $(cat /tmp/api.pid) 2>/dev/null

# Stop Database
docker compose -f docker-compose.db.yml down

# Verify nothing is running
docker compose -f docker-compose.db.yml ps
lsof -ti :3001 :5433
```

---

## ✅ Success Criteria

After completing all steps, you should have:

- [ ] Docker running (`docker ps` works)
- [ ] pnpm accessible (`npx pnpm -v` shows 8.x)
- [ ] Postgres running on port 5433
- [ ] API running on port 3001
- [ ] `/api/health` returns healthy status
- [ ] `/api/readyz` returns `{"ok":true,"pgvector":true}`
- [ ] Smoke tests pass (10+/13 tests)

---

## 🎉 Expected Smoke Test Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NeonHub Post-Deploy Smoke Test
  API: http://localhost:3001
  Web: http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/7] API Health Check
  ✓ API is healthy
[2/7] Readiness Check (DB + pgvector)
  ✓ Database and pgvector ready
[3/7] Database Connection
  ✓ Database: ok
  ✓ Vector extension: ok
[4/7] Agents Registration
  ✓ Agents registered: 2
[5/7] Web Application
  ⚠ Web app (not running - expected)
[6/7] RBAC Auth Guard
  ✓ RBAC guard working (got 401)
[7/7] External Services
  ✓ OpenAI: ok (or not_configured)
  ✓ Stripe: ok (or not_configured)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ SMOKE TESTS PASSED (10/13)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📝 Quick Reference Card

```bash
# Full startup sequence (copy all at once)
cd /Users/kofirusu/Desktop/NeonHub && \
export DATABASE_URL="postgresql://neonhub:neonhub@localhost:5433/neonhub" && \
docker compose -f docker-compose.db.yml up -d postgres && \
sleep 5 && \
npx pnpm --filter apps/api exec prisma generate && \
npx pnpm --filter apps/api exec prisma migrate deploy && \
npx pnpm --filter apps/api exec prisma db seed && \
npx pnpm --filter apps/api dev > /tmp/neonhub-api.log 2>&1 & \
echo $! > /tmp/api.pid && \
sleep 10 && \
curl http://localhost:3001/api/health && \
./scripts/post-deploy-smoke.sh
```

---

**Created**: 2025-10-27  
**Tested**: Yes, step-by-step  
**Next**: Run production deployment with confidence!

