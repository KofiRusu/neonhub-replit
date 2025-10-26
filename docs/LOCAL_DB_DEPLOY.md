# Local Database Deployment Guide

## Quick Start (One Command)

```bash
./scripts/db-deploy-local.sh
```

That's it! The script handles:
- ✅ Corepack + pnpm setup
- ✅ Dependency installation
- ✅ Prisma client generation
- ✅ Database migrations
- ✅ Seed data (if configured)
- ✅ Docker pgvector fallback (if DB unavailable)

---

## Features

### Automatic Database Provisioning

**If `DATABASE_URL` is NOT set:**
```bash
./scripts/db-deploy-local.sh
```

The script will automatically:
1. Check for Docker
2. Stop/remove any existing `neonhub-db` container
3. Start `ankane/pgvector` (PostgreSQL with vector support)
4. Wait for database readiness
5. Deploy schema and seed

**If `DATABASE_URL` IS set:**
```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/neonhub"
./scripts/db-deploy-local.sh
```

Uses your existing database.

---

## Usage Scenarios

### Scenario 1: Fresh Local Development

```bash
# No prior setup needed
cd /Users/kofirusu/Desktop/NeonHub
./scripts/db-deploy-local.sh

# Output: ✅ Local database deployment complete!
# Database is ready for development
```

### Scenario 2: Connect to Managed DB (Neon, Supabase)

```bash
# Set connection string
export DATABASE_URL="postgresql://user:password@[region].neon.tech:5432/neonhub?sslmode=require"
export DIRECT_DATABASE_URL="postgresql://user:password@[region].neon.tech:5432/neonhub?sslmode=require"

# Run deployment
./scripts/db-deploy-local.sh
```

### Scenario 3: Redeploy to Local Docker

```bash
# Force fresh Docker database
docker stop neonhub-db 2>/dev/null || true
docker rm neonhub-db 2>/dev/null || true
unset DATABASE_URL

./scripts/db-deploy-local.sh

# Creates fresh pgvector container
```

---

## What Happens Step-by-Step

| Step | Command | Output |
|------|---------|--------|
| 1 | Corepack init | `✓ pnpm@9 enabled` |
| 2 | Install deps | `✓ Dependencies installed` |
| 3 | Prisma generate | `✓ Prisma Client generated` |
| 4 | Check migrations | `✓ No pending migrations` |
| 5 | Run migrations | `✓ Migrations applied` |
| 6 | Seed database | `✓ Seed completed` |

---

## Prerequisites

### Required
- ✅ Node.js 20+
- ✅ npm/pnpm

### Optional (for Docker fallback)
- ✅ Docker (only if `DATABASE_URL` not set)

### Or use External DB
- ✅ Neon PostgreSQL
- ✅ Supabase
- ✅ Self-hosted PostgreSQL

---

## Environment Variables

```bash
# REQUIRED (or Docker will start)
DATABASE_URL="postgresql://user:pass@host:5432/db"

# OPTIONAL (for connection pooling)
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/db"
```

**Store in `.env` or `apps/api/.env`:**

```bash
# apps/api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/neonhub
DIRECT_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/neonhub
```

Then run:
```bash
source apps/api/.env
./scripts/db-deploy-local.sh
```

---

## Troubleshooting

### Problem: "Docker not found"

```
[ERROR] Docker not found. Please set DATABASE_URL environment variable.
```

**Solution:**
```bash
# Option 1: Install Docker
# macOS: brew install docker
# Linux: sudo apt install docker.io

# Option 2: Provide database URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/neonhub"
./scripts/db-deploy-local.sh
```

### Problem: Port 5432 Already in Use

```
Error: listen tcp 0.0.0.0:5432: bind: address already in use
```

**Solution:**
```bash
# Stop existing container
docker stop neonhub-db
docker rm neonhub-db

# Or use different port
docker run -d -p 5433:5432 ... ankane/pgvector

# Update DATABASE_URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/neonhub"
./scripts/db-deploy-local.sh
```

### Problem: "Can't reach database server"

```
P1001: Can't reach database server
```

**Solution:**
```bash
# Verify connection string
echo $DATABASE_URL

# Test manually
psql "$DATABASE_URL" -c "SELECT 1;"

# Or check Docker container
docker ps | grep neonhub-db
docker logs neonhub-db
```

### Problem: Migration Conflicts

```
P3008: Conflict: Migration already applied or rolled back
```

**Solution:**
```bash
# Resolve conflict
cd apps/api
npx prisma migrate resolve --rolled-back [migration_name]

# Re-run
./scripts/db-deploy-local.sh
```

---

## Advanced Usage

### Run with Custom Database Name

```bash
# Modify script to pass different postgres db name
docker run -d \
  -e POSTGRES_DB=my_custom_db \
  -p 5432:5432 \
  ankane/pgvector

export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_custom_db"
./scripts/db-deploy-local.sh
```

### Connect Prisma Studio

After running the script:

```bash
pnpm --filter apps/api prisma studio
```

Opens `http://localhost:5555` with interactive database viewer.

### Run Just Migrations (Skip Seed)

```bash
cd apps/api
npx prisma migrate deploy
# (seed is separate)
```

---

## After Deployment

Once the script completes successfully:

### Start Development Server

```bash
# Terminal 1: Backend API
pnpm --filter apps/api dev

# Terminal 2: Frontend Web
pnpm --filter apps/web dev

# Or both together
pnpm dev
```

### View Database

```bash
# Prisma Studio (interactive UI)
pnpm --filter apps/api prisma studio

# Or use psql
psql "$DATABASE_URL" -c "\dt"  # List all tables
```

### Run Tests

```bash
pnpm test
pnpm test --filter apps/api
```

---

## Cleanup

To remove the Docker database container:

```bash
docker stop neonhub-db
docker rm neonhub-db
```

This deletes all data. Create backups if needed:

```bash
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Integration with GitHub Actions

For CI/CD, use the GitHub Actions workflow documented in [CI_DB_DEPLOY.md](./CI_DB_DEPLOY.md).

Local script is for development; Actions workflow is for production deployments.

---

## Summary

| Scenario | Command |
|----------|---------|
| Fresh start | `./scripts/db-deploy-local.sh` |
| With managed DB | `export DATABASE_URL="..."; ./scripts/db-deploy-local.sh` |
| Just migrations | `npx prisma migrate deploy` |
| Interactive viewer | `pnpm prisma studio` |
| Full dev setup | `./scripts/db-deploy-local.sh && pnpm dev` |

**Done!** Your local database is ready for development. 🚀
