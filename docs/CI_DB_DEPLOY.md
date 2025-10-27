# GitHub Actions: Database Deployment Workflow

**Last Updated:** 2025-10-26 (Post Omni-Channel Enhancement)  
**Enhancement:** ConnectorKind enum + 15 platform connectors

## Overview

The `DB Deploy` workflow (``.github/workflows/db-deploy.yml`) automatically runs Prisma migrations and seeds your database on every push to `main` or on manual trigger.

**Latest Migration:** `20251026_add_connector_kind_enum` (15 platform types)  
**Latest Seed:** Enhanced with omni-channel connector catalog

**Triggers:**
- ✅ Manual run via GitHub Actions UI
- ✅ Automatic on push to `main` branch

---

## Setup: Add Secrets to GitHub Actions

### 1. Navigate to Repository Settings

```
GitHub Repo → Settings → Secrets and variables → Actions
```

### 2. Add Required Secret: `DATABASE_URL`

**Name:** `DATABASE_URL`  
**Value:** Your PostgreSQL connection string

**Examples:**

**Neon (Recommended):**
```
postgresql://user:password@region.neon.tech:5432/neonhub?sslmode=require
```

**Self-Hosted PostgreSQL:**
```
postgresql://postgres:password@localhost:5432/neonhub
```

**Supabase:**
```
postgresql://postgres:password@db.supabase.co:5432/postgres
```

### 3. (Optional) Add `DIRECT_DATABASE_URL` for Connection Pooling

If using Neon or similar with connection pooling, add:

**Name:** `DIRECT_DATABASE_URL`  
**Value:** Direct connection (bypasses pooler for migrations)

```
postgresql://user:password@region.neon.tech:5432/neonhub?sslmode=require
```

---

## Running the Workflow

### Option 1: Manual Trigger (Recommended for First Run)

```
GitHub Actions → DB Deploy → Run workflow
```

### Option 2: Automatic (On Push to main)

Just push to `main`:
```bash
git push origin main
```

The workflow will automatically execute.

---

## Monitoring Deployment

### 1. View Workflow Logs

```
GitHub Repo → Actions → DB Deploy → [Latest Run]
```

Click on the job to see:
- ✅ Prisma Client generation
- ✅ Migration application
- ✅ Database seed (if configured)

### 2. Expected Output

```
✅ DB migration & seed operations complete
✅ Database deployment workflow completed successfully
```

### 3. Troubleshooting Failed Runs

**Common Issues:**

| Error | Solution |
|-------|----------|
| `P1001: Can't reach database server` | Verify `DATABASE_URL` secret is set correctly |
| `P3008: Migration conflicts` | Run `npx prisma migrate resolve --rolled-back <name>` locally |
| `No seed script configured` | This is OK—seed is optional |

---

## Local Equivalents

To test the workflow locally before pushing:

```bash
# Install & generate Prisma
pnpm install --frozen-lockfile
pnpm --filter apps/api run prisma:generate

# Run migrations
DATABASE_URL="postgresql://..." pnpm --filter apps/api run prisma:migrate:deploy

# Seed (optional)
pnpm --filter apps/api run seed
```

---

## Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | ✅ Yes | `postgresql://user:pass@host:5432/db` |
| `DIRECT_DATABASE_URL` | ❌ No | Same as `DATABASE_URL` for connection pooling |

---

## Best Practices

1. ✅ Always test migrations locally first
2. ✅ Keep backups of production DATABASE_URL
3. ✅ Use `DIRECT_DATABASE_URL` for managed services
4. ✅ Monitor Actions tab after deployments
5. ✅ Document any manual schema changes

---

## Disabling the Workflow

To temporarily disable automatic deployments:

```bash
# Comment out the 'push' trigger in .github/workflows/db-deploy.yml
# Workflows will only run on manual trigger
```

---

## Omni-Channel Deployment Details

### What Gets Deployed

When this workflow runs, it will:

1. **Apply 6 migrations** (including latest `20251026_add_connector_kind_enum`)
2. **Seed 15 platform connectors:**
   - EMAIL (Email / SMTP)
   - SMS (SMS / Twilio)
   - WHATSAPP (WhatsApp Business)
   - REDDIT (Reddit)
   - INSTAGRAM (Instagram)
   - FACEBOOK (Facebook Pages)
   - X (X / Twitter)
   - YOUTUBE (YouTube)
   - TIKTOK (TikTok)
   - GOOGLE_ADS (Google Ads)
   - SHOPIFY (Shopify)
   - STRIPE (Stripe)
   - SLACK (Slack)
   - DISCORD (Discord)
   - LINKEDIN (LinkedIn)

3. **Create 2 demo connector auths** (for email and Slack)
4. **Add 3 omni-channel tools** (send-email, post-social, send-sms)
5. **Set up vector embeddings** (1536 dimensions, IVFFLAT indexes)

### Post-Deployment Verification

After the workflow completes, verify deployment with:

```bash
# SSH into your server or use Neon SQL Editor
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM connectors;"
# Expected: 15

psql "$DATABASE_URL" -c "SELECT unnest(enum_range(NULL::\"ConnectorKind\"));"
# Expected: 15 enum values

psql "$DATABASE_URL" -c "SELECT slug FROM tools WHERE slug IN ('send-email', 'post-social', 'send-sms');"
# Expected: 3 tools
```

Or use the automated smoke test script:
```bash
node scripts/db-smoke.mjs
# Expected: ✅ Smoke test passed!
```

---

## Next Steps

- Run the workflow manually from Actions tab
- Monitor logs for successful migration
- Verify connector catalog with SQL queries above
- For local CLI, see [LOCAL_DB_DEPLOY.md](./LOCAL_DB_DEPLOY.md)
