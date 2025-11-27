# NeonHub API - Quick Start for Development

## One-Command Setup

```bash
cd /Users/kofirusu/Desktop/NeonHub/apps/api && \
export ENCRYPTION_KEY=d0dd06fad2c0317ab089ab8568a169f410cf5c34fc04cb0f4a848d219072537f && \
export NODE_ENV=development && \
export ENABLE_WORKERS=false && \
export ENABLE_CONNECTORS=false && \
export ENABLE_ORCHESTRATION_BOOTSTRAP=false && \
export ENABLE_SEO_ANALYTICS_JOB=false && \
npm run dev
```

## Expected Output (Within 5 seconds)

```
[BOOT] ✓ 16 - SERVER LISTENING ON PORT 3001
🚀 NeonHub API server started
```

## Test It

```bash
# From another terminal:
curl -i http://localhost:3001/api/health
# Expected: 401 Unauthorized (auth required - this is normal!)

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@neonhub.local","password":"TestPassword123!"}'
# Expected: 200 OK with access_token
```

## Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| `ENCRYPTION_KEY must be 64 hex` | Set `ENCRYPTION_KEY` env var (see command above) |
| `Port 3001 already in use` | `lsof -i :3001` then `kill -9 <PID>` |
| `Can't reach database` | `docker compose up -d neonhub-postgres` |
| `Process hangs` | It's still starting; wait 10 seconds or check `/tmp/neonhub-boot.log` |
| `Connection refused after 5s` | Kill the process and restart with the full one-command above |

## For Postman Testing

1. **Start the API** (use one-command above)
2. **Import Postman assets** (see below)
3. **Run smoke tests** or full collection
4. **See results**: Tests verify API endpoints are working

### Postman Import

The collection and environment are ready to import:
- Collection: `postman/NeonHub.postman_collection.json`
- Environment: `postman/NeonHub_DevEnvironment.postman_environment.json`

**Full guide**: See `docs/agency/NEONHUB_POSTMAN_USAGE_GUIDE.md`

## For Full Bootstrap (All Features)

If you need connectors, workers, etc., set flags to `true`:

```bash
export ENABLE_WORKERS=true
export ENABLE_CONNECTORS=true
export ENABLE_ORCHESTRATION_BOOTSTRAP=true
export ENABLE_SEO_ANALYTICS_JOB=true
npm run dev
# Will take 20-30 seconds but fully initialized
```

## Files Reference

- **Dev startup**: This file
- **Environment setup**: `DEV_ENV_SETUP.md`
- **Bootstrap details**: `DEV_BOOTSTRAP_BEHAVIOUR.md`
- **Bootstrap sequence**: `API_BOOTSTRAP_MAP.md`

---

**Status**: ✅ API Server Ready for Local Development & Postman Testing

