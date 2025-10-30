# 🚀 NeonHub Database Deployment Runbook (Enterprise-Safe)

**Version**: 1.2  
**Last Updated**: 2025-10-30  
**Owner**: DevOps Team  
**Status**: ✅ Verified & Ready

> ✅ 2025-10-30: Production readiness audit complete. Database infrastructure is operational and safe. Workflows validated. Docker Postgres startup required for local drift checks. See `PRODUCTION_READINESS_REPORT.md` for full audit.

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Order](#deployment-order)
3. [Workflows Overview](#workflows-overview)
4. [Emergency Procedures](#emergency-procedures)
5. [Secrets Configuration](#secrets-configuration)
6. [Environment Setup](#environment-setup)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### ✅ Before ANY Database Operation

- [ ] **Verify target database** (staging vs production)
- [ ] **Review schema changes** in PR/diff
- [ ] **Check drift status** (run `DB Drift Check` workflow)
- [ ] **Backup exists** (< 24 hours old)
- [ ] **Stakeholders notified** (for prod deployments)
- [ ] **Rollback plan ready** (know which backup to restore)
- [ ] **Off-peak hours** (for prod: 2-6 AM UTC preferred)
- [ ] **Someone on-call** (for immediate verification)

---

## Deployment Order (Quick Reference)

### 🎯 Standard Deployment Flow

```mermaid
graph TD
    A[1. Secrets Check] --> B[2. DB Drift Check]
    B --> C[3. DB Backup]
    C --> D{Backup OK?}
    D -->|Yes| E[4. DB Diff dry-run]
    D -->|No| F[Fix & Retry]
    E --> G{Approve Changes?}
    G -->|Yes| H[5. DB Deploy]
    G -->|No| I[Cancel & Review]
    H --> J{Deploy OK?}
    J -->|Yes| K[6. Verify & Monitor]
    J -->|No| L[7. DB Restore]
    K --> M[✅ Complete]
    L --> M
```

### Step-by-Step Commands

#### Step 1: Verify Secrets (GitHub UI)
```
GitHub Repo → Settings → Secrets and variables → Actions
✅ DATABASE_URL (required)
✅ DIRECT_DATABASE_URL (optional)
✅ SLACK_WEBHOOK_URL (optional, recommended)
✅ AWS_ACCESS_KEY_ID (optional, for S3 backups)
✅ AWS_SECRET_ACCESS_KEY (optional, for S3 backups)
```

#### Step 2: Run Drift Check
```
Actions → DB Drift Check → Run workflow
→ Wait for green ✅ or review drift report
```

#### Step 3: Create Backup
```
Actions → DB Backup → Run workflow
→ Download artifact or verify S3 upload
→ Note backup artifact name (e.g., db-backup-20251027_140000)
```

#### Step 4: Dry-Run Diff (Review Changes)
```
Actions → DB Migrate Diff (dry-run) → Run workflow
→ Review STEP SUMMARY for SQL changes
→ Confirm changes match expectations
```

#### Step 5: Deploy (with approval gate)
```
Actions → DB Deploy → Run workflow
→ RUN_SEED: true (staging) or false (production)
→ Click "Review deployments" → Approve
→ Monitor logs in real-time
```

#### Step 6: Post-Deployment Verification
```bash
# Local verification (change URL to your deployed DB)
export DATABASE_URL="postgresql://..."

# Check migration status
pnpm --filter apps/api exec prisma migrate status

# Verify table counts
node scripts/db-smoke.mjs

# Test API health
curl https://your-api.railway.app/health
```

---

## Workflows Overview

### 1. **DB Drift Check** (`db-drift-check.yml`)

**Purpose**: Detect schema drift and pending migrations  
**Triggers**:
- Manual (`workflow_dispatch`)
- Every 6 hours (scheduled)
- On PR changes to `schema.prisma`

**What it does**:
- ✅ Checks migration status
- ✅ Compares schema vs actual DB
- ✅ Generates drift SQL (if any)
- ⚠️ Fails if drift detected

**When to use**:
- Before any deployment
- After manual DB changes (emergency fixes)
- Weekly as part of ops routine

---

### 2. **DB Migrate Diff** (`db-diff.yml`)

**Purpose**: Preview migration changes (dry-run, no apply)  
**Triggers**:
- Manual (`workflow_dispatch`)
- On PR changes to `schema.prisma` or `migrations/`

**What it does**:
- ✅ Shows SQL diff between DB and schema
- ✅ Does NOT apply changes
- ✅ Safe to run anytime

**When to use**:
- Before running `DB Deploy`
- To review what migrations will do
- During PR review

---

### 3. **DB Backup** (`db-backup.yml`)

**Purpose**: Create database backup  
**Triggers**:
- Manual (`workflow_dispatch`)
- Daily at 2 AM UTC (scheduled)

**What it does**:
- ✅ Creates `pg_dump` backup
- ✅ Compresses with gzip
- ✅ Uploads to GitHub artifacts (7-day retention)
- ✅ Optionally uploads to S3 (if configured)
- ✅ Deletes S3 backups older than 30 days

**When to use**:
- **ALWAYS** before `DB Deploy` (manual trigger)
- Automatically runs daily (no action needed)

**Backup locations**:
- GitHub Actions → Artifacts (7 days)
- S3 bucket (if `AWS_*` secrets configured, 30 days)

---

### 4. **DB Deploy** (`db-deploy.yml`)

**Purpose**: Apply migrations to database  
**Triggers**:
- Manual (`workflow_dispatch`)

**Environment Protection**: Requires manual approval (configured in Settings → Environments → production)

**Inputs**:
- `RUN_SEED`: true (staging) or false (production)

**What it does**:
- ✅ Validates DB connectivity
- ✅ Runs `prisma migrate deploy`
- ✅ Optionally seeds database
- ✅ Logs migration telemetry
- ✅ Sends Slack notification (if configured)

**When to use**:
- After reviewing diff and creating backup
- For staging: RUN_SEED=true
- For production: RUN_SEED=false (never seed prod!)

**Safety features**:
- ⚠️ Requires approval before running
- ⚠️ Warns on seed execution
- ⚠️ Logs telemetry to STEP SUMMARY
- ⚠️ Notifies Slack on completion

---

### 5. **DB Restore** (`db-restore.yml`)

**Purpose**: Emergency rollback to previous backup  
**Triggers**:
- Manual (`workflow_dispatch`) only

**Environment Protection**: Requires `production-restore` environment approval

**Inputs**:
- `BACKUP_ARTIFACT_NAME`: artifact name from DB Backup
- `CONFIRM_RESTORE`: Must type "RESTORE" (prevents accidents)

**What it does**:
- ⚠️ Creates safety backup (pre-restore snapshot)
- ⚠️ **ERASES current database**
- ⚠️ Restores from backup
- ✅ Applies any new migrations (post-restore)
- ✅ Notifies Slack with `@channel` alert

**When to use**:
- **EMERGENCY ONLY**
- After failed migration
- Data corruption detected
- Need to rollback to known-good state

**Warning**: This is destructive! Always:
1. Notify team first
2. Understand what you're restoring
3. Have someone verify after restore

---

## Emergency Procedures

### 🚨 Scenario 1: Migration Failed Mid-Deploy

**Symptoms**: `DB Deploy` workflow failed, partial migration

**Steps**:
1. **Don't panic** - Prisma migrations are transactional
2. Check workflow logs for exact error
3. If safe: Fix schema, commit, re-run deploy
4. If unsafe: Restore from backup

```bash
# Option A: Fix and retry
git add apps/api/prisma/schema.prisma
git commit -m "fix: correct migration issue"
git push
# Then: Run DB Deploy workflow again

# Option B: Restore
# Actions → DB Restore → Select backup → Type RESTORE
```

---

### 🚨 Scenario 2: Schema Drift Detected

**Symptoms**: `DB Drift Check` fails, drift SQL shown

**Causes**:
- Manual DB changes (someone ran SQL directly)
- Out-of-band migrations
- Hotfix applied without migration

**Steps**:
1. Review drift SQL in workflow summary
2. If intentional: Create migration to capture changes
3. If accidental: Restore from backup OR create corrective migration

```bash
# Create migration from current state
cd apps/api
pnpm exec prisma db pull  # Update schema from DB
pnpm exec prisma migrate dev --name fix_drift
# Review, commit, deploy
```

---

### 🚨 Scenario 3: Need Immediate Rollback

**Symptoms**: Data corruption, bad migration, critical bug

**Steps**:
1. **Stop the bleeding** - Disable API if needed
2. Notify team on Slack
3. Identify last good backup (< 24 hours)
4. Run `DB Restore` workflow
5. Verify data integrity
6. Re-enable API
7. Post-mortem later

```bash
# After restore, verify:
export DATABASE_URL="..."
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM organizations;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
# Check API:
curl https://api.neonhub.com/health
```

---

### 🚨 Scenario 4: Backup Failed

**Symptoms**: `DB Backup` workflow failed

**Steps**:
1. Check workflow logs for error
2. Common causes:
   - DB connection timeout
   - Disk space (unlikely on GitHub runners)
   - S3 credentials expired
3. Fix and re-run manually
4. **DO NOT deploy** until backup succeeds

---

## Secrets Configuration

### Required Secrets

| Secret | Required | Where | Purpose |
|--------|----------|-------|---------|
| `DATABASE_URL` | ✅ Yes | Actions | Connection to database |
| `DIRECT_DATABASE_URL` | ⚙️ Optional | Actions | Pooled connection (recommended) |

### Optional Secrets (Recommended)

| Secret | Purpose | Setup |
|--------|---------|-------|
| `SLACK_WEBHOOK_URL` | Notifications | Create webhook in Slack |
| `AWS_ACCESS_KEY_ID` | S3 backups | AWS IAM user |
| `AWS_SECRET_ACCESS_KEY` | S3 backups | AWS IAM user |
| `AWS_S3_BUCKET` | S3 backups | Bucket name (default: `neonhub-db-backups`) |
| `AWS_REGION` | S3 region | Region (default: `us-east-2`) |

### How to Add Secrets

1. Go to: https://github.com/NeonHub3A/neonhub/settings/secrets/actions
2. Click **"New repository secret"**
3. Enter name and value
4. Click **"Add secret"**

---

## Environment Setup

### GitHub Environments (Required for Approval Gates)

#### 1. Create "production" Environment
```
Settings → Environments → New environment → "production"
```

**Configure**:
- ✅ Required reviewers: Add team members (at least 1)
- ✅ Wait timer: 5 minutes (optional, allows cancellation)
- ✅ Deployment branches: Only `main` and `ci/*` branches

#### 2. Create "production-restore" Environment
```
Settings → Environments → New environment → "production-restore"
```

**Configure**:
- ✅ Required reviewers: Add senior engineers (at least 2)
- ✅ Wait timer: 10 minutes (allows time to reconsider)
- ✅ Deployment branches: Only `main`

---

## Monitoring & Alerts

### What to Monitor

#### 1. Migration Health
```bash
# Check migration status daily
pnpm --filter apps/api exec prisma migrate status
```

#### 2. Backup Status
- GitHub Actions → DB Backup workflow
- Check last run < 24 hours
- Verify artifacts uploaded

#### 3. Schema Drift
- Automatically checked every 6 hours
- Review drift reports in Actions

#### 4. Database Metrics (via your monitoring tool)
- Connection pool usage
- Query latency (p50, p95, p99)
- Slow query count
- Table sizes
- Index usage

### Slack Notifications

If `SLACK_WEBHOOK_URL` configured, you'll receive:

✅ **Success notifications**:
- "✅ DB Deploy finished with success"
- "✅ DB Backup complete"

⚠️ **Warning notifications**:
- "⚠️ DB Drift Check - Drift detected"

❌ **Error notifications**:
- "❌ DB Deploy failed"
- "⚠️ CRITICAL: DB RESTORE completed @channel"

### Setting up Slack Webhook

1. Go to your Slack workspace
2. Apps → Incoming Webhooks → Add to Workspace
3. Choose channel (e.g., `#ops-alerts`)
4. Copy webhook URL
5. Add as `SLACK_WEBHOOK_URL` secret in GitHub

---

## Troubleshooting

### Issue: "DATABASE_URL secret not configured"

**Fix**:
```
GitHub → Settings → Secrets → Actions → New secret
Name: DATABASE_URL
Value: postgresql://user:pass@host:5432/db
```

---

### Issue: "Pending migrations detected"

**Meaning**: Database is behind schema

**Fix**: Run `DB Deploy` workflow

---

### Issue: "Schema drift detected"

**Meaning**: Database has changes not in migrations

**Diagnosis**:
1. Review drift SQL in workflow summary
2. Identify source of change

**Fix**:
```bash
# If intentional, capture as migration:
cd apps/api
pnpm exec prisma db pull
pnpm exec prisma migrate dev --name capture_drift
git add . && git commit -m "fix: capture schema drift"
```

---

### Issue: Migration failed with foreign key violation

**Cause**: Data doesn't match new constraints

**Fix**:
1. Review migration SQL
2. Clean up data first:
```sql
-- Example: Remove orphaned records
DELETE FROM table_b WHERE parent_id NOT IN (SELECT id FROM table_a);
```
3. Re-run migration

---

### Issue: Backup is too large / timing out

**Solutions**:
1. Increase workflow timeout (default: 30 min)
2. Exclude large tables from backup:
```bash
pg_dump "$DATABASE_URL" \
  --exclude-table-data=audit_logs \
  --exclude-table-data=metric_events
```
3. Use Neon branching instead (instant snapshots)

---

### Issue: Restore is slow

**Expected**: Large databases (> 10 GB) can take 10-30 minutes

**Speed up**:
```bash
# Use custom format for faster restore
pg_dump -Fc "$DATABASE_URL" > backup.dump
pg_restore -d "$DATABASE_URL" -j 4 backup.dump  # 4 parallel jobs
```

---

## Best Practices

### ✅ DO

- ✅ Always backup before deploying
- ✅ Review diff before deploying
- ✅ Test migrations in staging first
- ✅ Deploy during off-peak hours
- ✅ Monitor for 30 min post-deploy
- ✅ Keep backups for 30+ days
- ✅ Document manual DB changes
- ✅ Use Slack notifications

### ❌ DON'T

- ❌ Deploy to prod without backup
- ❌ Skip drift check
- ❌ Seed production database
- ❌ Make manual DB changes without migration
- ❌ Deploy during peak hours (without reason)
- ❌ Ignore drift warnings
- ❌ Delete backups manually
- ❌ Share DATABASE_URL in Slack/email

---

## Maintenance Schedule

### Daily
- ✅ Auto-backup (2 AM UTC)
- ✅ Drift check (every 6 hours)

### Weekly
- [ ] Review backup artifacts
- [ ] Check slow queries
- [ ] Verify monitoring alerts

### Monthly
- [ ] Test restore procedure (staging)
- [ ] Review and update this runbook
- [ ] Rotate DATABASE_URL (if required by policy)
- [ ] Check S3 backup retention

### Quarterly
- [ ] Full DR drill (restore to new environment)
- [ ] Review migration history
- [ ] Optimize indexes based on usage
- [ ] Update environment secrets

---

## Appendix: Local Commands

### Local Deployment (Mirror Cloud)

```bash
# Set your cloud DATABASE_URL
export DATABASE_URL="postgresql://user:pass@cloud-host/db"

# Run deployment
./scripts/db-deploy-local.sh

# Or step-by-step:
pnpm --filter apps/api exec prisma migrate status
pnpm --filter apps/api exec prisma migrate deploy
pnpm --filter apps/api exec prisma db seed  # staging only!
```

### Local Backup

```bash
# Backup
pg_dump "$DATABASE_URL" --no-owner --no-acl --file=backup.sql
gzip backup.sql

# Restore
gunzip backup.sql.gz
psql "$DATABASE_URL" < backup.sql
```

### Prisma Commands Reference

```bash
# Check status
pnpm --filter apps/api exec prisma migrate status

# Preview diff
pnpm --filter apps/api exec prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel apps/api/prisma/schema.prisma \
  --script

# Validate schema
pnpm --filter apps/api exec prisma validate

# Format schema
pnpm --filter apps/api exec prisma format

# Generate client
pnpm --filter apps/api exec prisma generate
```

---

## Handling Existing Schema (Migration Consolidation)

### Background

Migration history contained draft entries that blocked `prisma migrate deploy`. We restored alignment by pushing the schema and manually marking migrations as applied so Prisma and the database agreed on state.

### When to Use

- Migration files are inconsistent or partially applied
- The live schema already matches the desired model
- You need a fast, low-risk deployment path without rewriting migrations

### Steps

1. Deploy schema: `npx prisma db push`
2. Mark migrations as applied (see `docs/MIGRATION_STRATEGY.md`)
3. Verify status: `npx prisma migrate status`
4. Re-enable required extensions: `vector`, `uuid-ossp`, `citext`

### Verification

Run: `./scripts/verify-migrations.sh`  
Expected: All checks pass ✅

---

## Support

**Slack**: `#infrastructure` or `#ops-alerts`  
**On-Call**: Check PagerDuty rotation  
**Escalation**: DevOps lead → CTO

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-27  
**Next Review**: 2025-11-27  
**Maintainer**: DevOps Team
