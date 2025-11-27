# NeonHub API - Development Environment Setup

## Required Environment Variables

Before running `npm run dev` in `apps/api`, set these variables:

### Critical for Dev Startup

```bash
# Encryption (required)
export ENCRYPTION_KEY=d0dd06fad2c0317ab089ab8568a169f410cf5c34fc04cb0f4a848d219072537f

# Dev mode flags (to skip heavy initialization)
export NODE_ENV=development
export ENABLE_WORKERS=false
export ENABLE_CONNECTORS=false
export ENABLE_ORCHESTRATION_BOOTSTRAP=false
export ENABLE_SEO_ANALYTICS_JOB=false

# Server
export PORT=3001

# Database (assumes docker compose postgres is running)
export DATABASE_URL=postgresql://neonhub:neonhub@localhost:5433/neonhub
```

### Option A: Set in Terminal Session

```bash
cd /Users/kofirusu/Desktop/NeonHub/apps/api

export ENCRYPTION_KEY=d0dd06fad2c0317ab089ab8568a169f410cf5c34fc04cb0f4a848d219072537f
export NODE_ENV=development
export ENABLE_WORKERS=false
export ENABLE_CONNECTORS=false
export ENABLE_ORCHESTRATION_BOOTSTRAP=false

npm run dev
```

### Option B: Use `.env.local` (git-ignored)

Create `apps/api/.env.local` with contents from above (this file is in .gitignore).

### Option C: Create Quick-Start Script

```bash
# Create: apps/api/dev-start.sh
#!/bin/bash
export ENCRYPTION_KEY=d0dd06fad2c0317ab089ab8568a169f410cf5c34fc04cb0f4a848d219072537f
export NODE_ENV=development
export ENABLE_WORKERS=false
export ENABLE_CONNECTORS=false
export ENABLE_ORCHESTRATION_BOOTSTRAP=false
npm run dev

# Then:
chmod +x dev-start.sh
./dev-start.sh
```

## Expected Output

After running dev command, you should see (within 5-10 seconds):

```
⚠️  Using relaxed environment defaults. Set required variables or run `npm run verify` before production deploys.
[BOOT] 01 - Starting server bootstrap
[BOOT] 02 - Env loaded
...
[BOOT] 08 - About to call listen()
🚀 NeonHub API server started { port: 3001, env: 'development' }
```

Then in another terminal:
```bash
curl http://localhost:3001/api/health
# Expected: { "status": "ok", ... }
```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `ENCRYPTION_KEY must be 64 hex characters` | Key not set | Export ENCRYPTION_KEY before starting |
| `Can't reach database server` | Docker postgres not running | `docker compose up -d neonhub-postgres` |
| `Port 3001 already in use` | Another process on port | `lsof -i :3001` then kill, or use different port |
| `Process hangs silently` | Heavy init not skipped | Set `ENABLE_*=false` flags |

