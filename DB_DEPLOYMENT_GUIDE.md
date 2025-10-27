# 🗄️ NeonHub Database Deployment Guide

**Version:** 3.2.0  
**Last Updated:** October 26, 2025  
**Status:** ✅ Ready for Deployment

---

## 📋 Overview

This guide provides three deployment methods for the NeonHub database schema using Prisma:

1. **Option A** — GitHub Actions Automated Deployment (CI/CD)
2. **Option B** — Local Workspace Deployment (Development)
3. **Option C** — One-Command CLI Deployment (Quick Setup)

---

## ✅ Prerequisites

- **Node.js:** v20.x or higher
- **PostgreSQL:** v14+ running locally or remote
- **Environment:** `.env` file configured with `DATABASE_URL`

### Verify Setup

```bash
# Check Node.js version
node --version  # Should be >= 20.0.0

# Check PostgreSQL
psql --version  # Should be >= 14.0

# Verify .env exists
cat .env | grep DATABASE_URL
```

**Expected Output:**
```
DATABASE_URL=postgresql://[user:pass@]localhost:5432/neonhub?schema=public
```

---

## 🚀 Option A: GitHub Actions Automated Deployment

### Setup Instructions

#### Step 1: Verify Workflow File
The workflow file is already created at `.github/workflows/db-deploy.yml`

```bash
ls -la .github/workflows/db-deploy.yml
```

#### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value |
|---|---|
| `DATABASE_URL` | `postgresql://[user:pass@]host:5432/neonhub?schema=public` |

#### Step 3: Trigger Deployment

**Option A1: Manual Trigger (Recommended for Testing)**
```bash
# In GitHub UI:
# 1. Go to Actions tab
# 2. Select "🗄️ Database Deploy" workflow
# 3. Click "Run workflow" → choose branch → "Run workflow"
```

**Option A2: Automatic Trigger on Main Push**
```bash
# Simply push to main branch and the workflow runs automatically
git add apps/api/prisma/
git commit -m "chore(db): bump schema for production"
git push origin main
```

### Monitoring Deployment

1. **Watch the Workflow:**
   - Go to **Actions** tab in GitHub
   - Click on the **"🗄️ Database Deploy"** run
   - Monitor the progress in real-time

2. **Success Indicators:**
   ```
   ✓ Prisma Client generated
   ✓ Migrations applied successfully
   ✓ Database seeded with initial data
   ```

3. **View Logs:**
   - Click job name → expand each step
   - Download artifacts for detailed logs

### Rollback (if needed)

```bash
# Rollback last migration
pnpm --filter apps/api prisma migrate resolve --rolled-back "migration_name"

# Or manually in the migration_lock.toml
```

---

## 🧠 Option B: Local Workspace Deployment

### Step 1: Prepare Environment

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Verify .env configuration
cat .env | grep -E "DATABASE_URL|NODE_ENV"
```

**Expected:**
```
DATABASE_URL=postgresql://kofirusu@localhost:5432/neonhub?schema=public
NODE_ENV=development
```

### Step 2: Install Dependencies

```bash
# Method 1: Using pnpm (recommended)
pnpm install --frozen-lockfile

# Method 2: Using npm (fallback)
npm install --legacy-peer-deps
```

### Step 3: Generate Prisma Client

```bash
pnpm --filter apps/api prisma generate
# OR
npm run prisma:generate --workspace=apps/api
```

**Success Indicator:**
```
✔ Generated Prisma Client v5.22.0 to ./node_modules/@prisma/client in 2.34s
```

### Step 4: Run Migrations

```bash
pnpm --filter apps/api prisma migrate dev --name initial_bootstrap
# OR
npm run prisma:migrate --workspace=apps/api -- dev --name initial_bootstrap
```

**What This Does:**
- Creates new migration file: `prisma/migrations/<timestamp>_initial_bootstrap/migration.sql`
- Applies migration to your local database
- Generates updated Prisma Client

**Success Indicator:**
```
✔ Successfully created 1 migration
✔ Generated Prisma Client
```

### Step 5: Seed Database

```bash
pnpm --filter apps/api prisma db seed
# OR
npm run seed --workspace=apps/api
```

**What This Does:**
- Runs `prisma/seed.ts` script
- Creates demo user: `demo@neonhub.ai`
- Populates sample content, campaigns, and agents
- Initializes system data

**Success Indicator:**
```
🌱 Seeding database...
✅ Created user: demo@neonhub.ai
✅ Created content drafts
✅ Seed complete!
```

### Step 6: Verify Database

#### Option B1: Prisma Studio (Interactive GUI)
```bash
pnpm --filter apps/api prisma studio
# Browser opens at http://localhost:5555
```

#### Option B2: Direct SQL Query
```bash
psql postgresql://kofirusu@localhost:5432/neonhub -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM \"ContentDraft\";"
```

**Expected Output:**
```
 count
-------
     1
(1 row)

 count
-------
     2
(1 row)
```

---

## ⚙️ Option C: One-Command Deployment

### Single Command Execution

```bash
cd /Users/kofirusu/Desktop/NeonHub && \
npm install --legacy-peer-deps && \
npm run prisma:generate --workspace=apps/api && \
npm run prisma:migrate --workspace=apps/api -- dev --name full_org_ai_vector_bootstrap && \
npm run seed --workspace=apps/api
```

### Alternative: Using bash script

Create `scripts/deploy-db.sh`:

```bash
#!/bin/bash
set -e

cd /Users/kofirusu/Desktop/NeonHub

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔨 Generating Prisma Client..."
npm run prisma:generate --workspace=apps/api

echo "🚀 Running migrations..."
npm run prisma:migrate --workspace=apps/api -- dev --name full_org_ai_vector_bootstrap

echo "🌱 Seeding database..."
npm run seed --workspace=apps/api

echo "✅ Database deployment complete!"
```

### Execute Script

```bash
chmod +x scripts/deploy-db.sh
./scripts/deploy-db.sh
```

---

## 🔍 Verification Checklist

After any deployment method, verify success:

### ✅ Checklist

```bash
# 1. Check tables exist
psql postgresql://kofirusu@localhost:5432/neonhub -c "\dt"

# 2. Check user created
psql postgresql://kofirusu@localhost:5432/neonhub -c "SELECT email FROM users LIMIT 5;"

# 3. Check seed data
psql postgresql://kofirusu@localhost:5432/neonhub -c "SELECT COUNT(*) FROM \"ContentDraft\";"

# 4. Verify Prisma Client
ls -la apps/api/node_modules/@prisma/client/index.d.ts

# 5. Test API connection (if running)
curl http://localhost:3001/api/health || echo "API not running yet"
```

---

## 📊 Database Deployment Summary

### Schema Overview

| Table | Purpose | Records |
|---|---|---|
| `users` | User accounts & auth | 1+ demo user |
| `ContentDraft` | AI-generated content | 2+ samples |
| `Campaign` | Marketing campaigns | 1+ sample |
| `AgentJob` | Autonomous agent executions | Auto-populated |
| `Subscription` | Billing & plans | Auto-created |
| `AuditLog` | Compliance & audit trail | Auto-logged |

### Migration History

```
20251012154609_initial
  ↓
20250126_realign_schema
  ↓
20250105_phase4_beta
  ↓
[NEW: full_org_ai_vector_bootstrap]
```

---

## 🐛 Troubleshooting

### Issue: `DATABASE_URL not set`

**Solution:**
```bash
# Ensure .env exists and is readable
cat .env | grep DATABASE_URL

# Or set it explicitly
export DATABASE_URL="postgresql://kofirusu@localhost:5432/neonhub?schema=public"
```

### Issue: `Connection refused`

**Solution:**
```bash
# Start PostgreSQL
brew services start postgresql  # macOS

# Or for Docker
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15
```

### Issue: `Migration failed / Already exists`

**Solution:**
```bash
# Skip if already migrated
pnpm --filter apps/api prisma migrate resolve --rolled-back 20251012154609_initial

# Or reset for development only
pnpm --filter apps/api prisma migrate reset --force
```

### Issue: `node_modules corruption`

**Solution:**
```bash
rm -rf node_modules pnpm-lock.yaml package-lock.json
npm cache clean --force
npm install
```

---

## 📝 Next Steps

After successful deployment:

1. **Start the API Server:**
   ```bash
   npm run start:api
   ```

2. **Start the Web App:**
   ```bash
   npm run start:web
   ```

3. **Run Tests:**
   ```bash
   npm run test:all
   ```

4. **Deploy to Production:**
   - Push to `main` branch
   - GitHub Actions workflow runs automatically
   - Verify success in Actions tab

---

## 📚 References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [NeonHub Architecture](./docs/ARCHITECTURE.md)
- [Environment Setup](./ENV_TEMPLATE.example)
- [CI/CD Pipeline](./docs/CI_CD.md)

---

## 🆘 Support

For deployment issues:

1. Check logs: `pnpm --filter apps/api prisma migrate status`
2. Review migrations: `cat apps/api/prisma/migrations/*/migration.sql`
3. Check Prisma version: `npm list @prisma/client`
4. Contact DevOps team or create an issue on GitHub

---

**Generated:** October 26, 2025  
**Author:** Neon Autonomous Development Agent  
**Status:** ✅ Production Ready
