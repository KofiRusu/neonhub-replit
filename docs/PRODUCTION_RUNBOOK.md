# 🚀 NeonHub Production Deployment Runbook

**Version:** 3.2.0  
**Last Updated:** October 26, 2025  
**Owner:** Platform Engineering Team

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Steps](#deployment-steps)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [Rollback Procedures](#rollback-procedures)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Troubleshooting](#troubleshooting)
7. [Emergency Contacts](#emergency-contacts)

---

## Pre-Deployment Checklist

### 1. Environment Validation

```bash
# Verify environment variables are set
cd /Users/kofirusu/Desktop/NeonHub
source .env

# Required variables:
echo $DATABASE_URL          # PostgreSQL connection string
echo $NEXTAUTH_URL          # Frontend URL
echo $NEXTAUTH_SECRET       # Auth secret (32+ chars)
echo $OPENAI_API_KEY        # OpenAI API key
echo $STRIPE_SECRET_KEY     # Stripe secret (production)
```

### 2. Code Quality Checks

```bash
# Run all checks
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm --filter apps/api test:coverage
pnpm build

# Expected: All checks pass with 0 errors
```

### 3. Database Backup

```bash
# Create backup before deployment
export BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DATABASE_URL" > backups/$BACKUP_FILE

# Verify backup was created
ls -lh backups/$BACKUP_FILE

# Upload to secure storage
aws s3 cp backups/$BACKUP_FILE s3://neonhub-backups/ --sse AES256
```

### 4. Schema Validation

```bash
cd apps/api

# Validate Prisma schema
npx prisma validate

# Check for pending migrations
npx prisma migrate status

# Expected: "Database schema is up to date!"
```

---

## Deployment Steps

### Phase 1: Backend Deployment

#### 1.1 Build Docker Image

```bash
cd /Users/kofirusu/Desktop/NeonHub/apps/api

# Build production image
docker build -t neonhub-api:3.2.0 -t neonhub-api:latest -f Dockerfile .

# Verify build
docker images | grep neonhub-api

# Expected: Image size ~200-300MB
```

#### 1.2 Test Container Locally

```bash
# Run container with production config
docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -p 3001:3001 \
  neonhub-api:latest &

# Wait 10 seconds for startup
sleep 10

# Test health endpoint
curl http://localhost:3001/health | jq .

# Expected: {"status":"healthy",...}

# Stop test container
docker stop $(docker ps -q --filter ancestor=neonhub-api:latest)
```

#### 1.3 Deploy to Production

```bash
# Tag image for production registry
docker tag neonhub-api:latest registry.neonhubecosystem.com/api:3.2.0

# Push to registry
docker push registry.neonhubecosystem.com/api:3.2.0

# Deploy via orchestrator (k8s, docker-compose, or cloud platform)
# Example for Railway:
railway up

# Example for Render:
render deploy --service api

# Example for kubernetes:
kubectl set image deployment/neonhub-api api=registry.neonhubecosystem.com/api:3.2.0
kubectl rollout status deployment/neonhub-api
```

#### 1.4 Run Database Migrations

```bash
# Option A: Automated (runs in Docker container on startup)
# Migrations run automatically via CMD in Dockerfile:
# CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

# Option B: Manual execution (if needed)
cd apps/api
npx prisma migrate deploy

# Verify migrations applied
npx prisma migrate status

# Expected: No pending migrations
```

### Phase 2: Frontend Deployment

#### 2.1 Build Frontend

```bash
cd /Users/kofirusu/Desktop/NeonHub/apps/web

# Build Next.js production bundle
pnpm build

# Expected: ✓ Compiled successfully
```

#### 2.2 Deploy Frontend

```bash
# For Vercel:
vercel --prod

# For self-hosted:
docker build -t neonhub-web:3.2.0 -f Dockerfile .
docker push registry.neonhubecosystem.com/web:3.2.0

# For static export:
pnpm build && pnpm export
aws s3 sync out/ s3://neonhub-frontend/ --delete
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# API health check
curl https://api.neonhubecosystem.com/health | jq .

# Expected response:
{
  "status": "healthy",
  "version": "3.2.0",
  "checks": {
    "database": { "status": "ok", "latency": 15 },
    "websocket": { "status": "ok", "connections": 0 },
    "stripe": { "status": "ok" },
    "openai": { "status": "ok" }
  },
  "timestamp": "2025-10-26T...",
  "uptime": 45
}
```

### 2. WebSocket Connectivity

```bash
# Test WebSocket connection
node -e "
const io = require('socket.io-client');
const socket = io('https://api.neonhubecosystem.com');
socket.on('connect', () => {
  console.log('✅ WebSocket connected:', socket.id);
  socket.disconnect();
});
socket.on('connect_error', (err) => {
  console.error('❌ Connection failed:', err.message);
});
"
```

### 3. Database Queries

```bash
# Test basic queries
cd apps/api
npx prisma db execute --stdin <<EOF
SELECT 
  COUNT(*) as user_count 
FROM users;
EOF

# Test table integrity
npx prisma db execute --stdin <<EOF
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename))
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
EOF
```

### 4. Frontend Verification

```bash
# Test homepage
curl -I https://neonhubecosystem.com/

# Expected: HTTP/2 200

# Test dashboard (authenticated)
curl -I https://neonhubecosystem.com/dashboard

# Expected: HTTP/2 200 or 302 (redirect to signin)
```

### 5. Real-Time Monitoring Dashboard

1. Open browser to: `https://neonhubecosystem.com/deployment`
2. Verify "Connected" badge shows green
3. Check all health metrics show "ok"
4. Confirm WebSocket connections are active

---

## Rollback Procedures

### When to Rollback

- Health checks fail after 5 minutes
- Critical errors in application logs
- Database queries timing out
- WebSocket connections failing
- User-reported critical bugs

### Rollback Steps

#### Option A: Quick Rollback (Docker/Container)

```bash
# Rollback to previous version
kubectl rollout undo deployment/neonhub-api
kubectl rollout undo deployment/neonhub-web

# For Docker Compose:
docker-compose down
docker tag neonhub-api:3.1.0 neonhub-api:latest
docker tag neonhub-web:3.1.0 neonhub-web:latest
docker-compose up -d
```

#### Option B: Database Rollback (Critical)

```bash
# Stop application first
docker-compose down

# Restore from backup
export BACKUP_FILE="backup_20251026_143000.sql"
psql "$DATABASE_URL" < backups/$BACKUP_FILE

# Rollback migrations (if new migration was applied)
cd apps/api
npx prisma migrate resolve --rolled-back 20251026143000_feature_name

# Restart application with previous version
docker-compose up -d
```

#### Option C: Git Rollback

```bash
# Revert to previous commit
git log --oneline -10
git revert <commit-hash>

# Redeploy
pnpm build
railway up  # or your deployment command
```

### Verify Rollback

```bash
# Check health
curl https://api.neonhubecosystem.com/health | jq .status

# Check version
curl https://api.neonhubecosystem.com/health | jq .version

# Expected: Previous version (e.g., "3.1.0")
```

---

## Monitoring & Alerts

### Real-Time Dashboard

**URL:** https://neonhubecosystem.com/deployment

**Monitors:**
- ✅ Database connectivity & latency
- ✅ WebSocket connections
- ✅ Migration progress
- ✅ System health
- ✅ External service status (Stripe, OpenAI)

### Log Monitoring

```bash
# API logs
docker logs -f neonhub-api --tail 100

# Filter for errors
docker logs neonhub-api --since 10m | grep -i error

# Database query logs
psql "$DATABASE_URL" -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

### Sentry Error Tracking

- Dashboard: https://sentry.io/organizations/neonhub/issues/
- Alerts: Configured for:
  - Server errors (5xx)
  - Database connection failures
  - Unhandled exceptions

### Drift Detection

```bash
# Run manual drift check
cd apps/api
npx tsx src/services/drift-detector.ts

# Automated: Runs every 5 minutes in production
# Broadcasts alerts via WebSocket to deployment dashboard
```

---

## Troubleshooting

### Issue: Database Connection Timeout

**Symptoms:** Health check shows `database: { status: "error" }`

**Solutions:**
```bash
# 1. Check database is running
psql "$DATABASE_URL" -c "SELECT 1;"

# 2. Check connection pool
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# 3. Restart database (if self-hosted)
sudo systemctl restart postgresql

# 4. Check for long-running queries
psql "$DATABASE_URL" -c "
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;
"

# 5. Kill long-running query if needed
psql "$DATABASE_URL" -c "SELECT pg_terminate_backend(PID_HERE);"
```

### Issue: Migration Fails

**Symptoms:** Migration monitor shows failed phase

**Solutions:**
```bash
# 1. Check migration status
cd apps/api
npx prisma migrate status

# 2. View migration logs
cat apps/api/prisma/migrations/*/migration.sql

# 3. Manually apply migration (if safe)
npx prisma migrate deploy --force

# 4. Resolve migration conflict
npx prisma migrate resolve --rolled-back MIGRATION_NAME
npx prisma migrate deploy

# 5. If all else fails: rollback and investigate
# See "Rollback Procedures" section above
```

### Issue: WebSocket Disconnects

**Symptoms:** Dashboard shows "Disconnected" badge

**Solutions:**
```bash
# 1. Check CORS configuration
curl -H "Origin: https://neonhubecosystem.com" \
  -I https://api.neonhubecosystem.com/health

# 2. Verify WebSocket endpoint
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  https://api.neonhubecosystem.com/socket.io/

# 3. Check firewall/proxy settings
# Ensure WebSocket traffic is allowed on port 3001

# 4. Restart API server
docker restart neonhub-api
```

### Issue: High Memory Usage

**Symptoms:** Container OOM or slow performance

**Solutions:**
```bash
# 1. Check container stats
docker stats neonhub-api

# 2. Check for memory leaks in logs
docker logs neonhub-api | grep -i "memory"

# 3. Increase container memory limit
docker update --memory 2g neonhub-api

# 4. Restart application
docker restart neonhub-api
```

---

## Emergency Contacts

### Platform Team
- **Platform Lead:** [Name] - [phone] - [email]
- **Database Admin:** [Name] - [phone] - [email]
- **DevOps Engineer:** [Name] - [phone] - [email]

### Escalation Path
1. On-call engineer (PagerDuty)
2. Platform lead
3. CTO

### External Support
- **Neon Database:** support@neon.tech
- **Railway:** help@railway.app
- **Stripe:** https://support.stripe.com
- **OpenAI:** support@openai.com

---

## Deployment History

| Date       | Version | Deployed By | Notes                          |
|------------|---------|-------------|--------------------------------|
| 2025-10-26 | 3.2.0   | Cursor AI   | Migration monitoring dashboard |
| 2025-10-20 | 3.1.0   | Team        | Phase 4 beta features          |
| 2025-10-15 | 3.0.0   | Team        | Major version release          |

---

## Additional Resources

- **Main README:** `/Users/kofirusu/Desktop/NeonHub/README.md`
- **Migration Guide:** `/Users/kofirusu/Desktop/NeonHub/docs/DATABASE_AUTONOMOUS_DEPLOYMENT_GUIDE.md`
- **Architecture Docs:** `/Users/kofirusu/Desktop/NeonHub/docs/`
- **API Documentation:** `https://api.neonhubecosystem.com/docs`

---

**Remember:** Always create a backup before deployment. When in doubt, rollback.

**Status Page:** https://status.neonhubecosystem.com

