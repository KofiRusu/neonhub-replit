# 🔒 Final Lockdown Checklist - Production Readiness

**Status**: ❌ Blocked  
**Date**: 2025-10-27  
**Goal**: Validate all security gates and workflows (pending database connectivity & CI fixes)

---

## ✅ A) Branch Protection (Required Status Checks)

### Option 1: GitHub UI (5 minutes)

1. **Go to Branch Protection**
   ```
   https://github.com/NeonHub3A/neonhub/settings/branches
   ```

2. **Click "Add rule" for `main` branch**

3. **Configure Protection**:
   ```
   ☑ Require a pull request before merging
     └─ Required approving reviews: 1
   
   ☑ Require status checks to pass before merging
     ☑ Require branches to be up to date before merging
     └─ Status checks:
        ☑ Security Preflight
        ☑ DB Drift Check
   
   ☑ Require conversation resolution before merging
   
   ☑ Include administrators (optional - recommended)
   ```

4. **Click "Create" or "Save changes"**

### Option 2: GitHub CLI (30 seconds)

```bash
# Install gh CLI if needed: brew install gh

# Authenticate
gh auth login

# Set branch protection
gh api -X PUT repos/NeonHub3A/neonhub/branches/main/protection \
  -f required_status_checks='{"strict":true,"contexts":["Security Preflight","DB Drift Check"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -f restrictions=null
```

### Verify Protection

```bash
# Check protection is enabled
gh api repos/NeonHub3A/neonhub/branches/main/protection

# Or visit:
# https://github.com/NeonHub3A/neonhub/settings/branches
```

---

## ✅ B) Environment Protection (Manual Approval Gates)

### Configure "production" Environment

1. **Go to Environments**
   ```
   https://github.com/NeonHub3A/neonhub/settings/environments
   ```

2. **Click "production"** (or create if doesn't exist)

3. **Configure**:
   ```
   ☑ Required reviewers: [Add your team members]
     └─ At least 1 person
   
   ☑ Wait timer: 5 minutes (optional)
   
   ☑ Deployment branches: Only protected branches
   ```

4. **Click "Save protection rules"**

### Configure "production-restore" Environment

1. **Click "New environment"** → Name: `production-restore`

2. **Configure**:
   ```
   ☑ Required reviewers: [Add 2+ senior engineers]
     └─ At least 2 people (for emergency rollbacks)
   
   ☑ Wait timer: 10 minutes (allows time to reconsider)
   
   ☑ Deployment branches: Only "main"
   ```

3. **Click "Save protection rules"**

---

## ✅ C) Slack Webhook Test

### Test Notification

```bash
# Replace with your actual webhook URL
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Send test message
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚀 NeonHub CI Smoke Test: Slack notifications wired ✅"}' \
  "$SLACK_WEBHOOK_URL"
```

**Expected**: Message appears in your Slack channel within seconds

### Add to GitHub Secrets

```
GitHub → Settings → Secrets → Actions → New secret
Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## ✅ D) Post-Deploy Smoke Test (Local)

### Test Against Localhost

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Start your API first (if not running)
# pnpm dev --filter apps/api

# Run smoke tests
API_URL="http://localhost:3001" \
WEB_URL="http://localhost:3000" \
./scripts/post-deploy-smoke.sh
```

**Expected Output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NeonHub Post-Deploy Smoke Test
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
  ✓ Web app renders
[6/7] RBAC Auth Guard
  ✓ RBAC guard working (got 401)
[7/7] External Services
  ✓ OpenAI: ok
  ✓ Stripe: ok

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ ALL SMOKE TESTS PASSED (13/13)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Deployment verified - safe to proceed!
```

### Test Against Production (When Ready)

```bash
# Replace with your actual URLs
API_URL="https://api.neonhub.com" \
WEB_URL="https://app.neonhub.com" \
./scripts/post-deploy-smoke.sh
```

---

## ✅ E) Security Loop End-to-End Test

### Step 1: Security Preflight

```
GitHub → Actions → Security Preflight → Run workflow
Branch: ci/codex-autofix-and-heal

Expected: ✅ All checks pass
- Prisma validation
- TypeScript check
- Dependency audit
- Gitleaks scan
- CodeQL analysis
```

### Step 2: DB Drift Check

```
GitHub → Actions → DB Drift Check → Run workflow

Expected: ✅ "No drift detected"
```

### Step 3: DB Diff (Dry-Run)

```
GitHub → Actions → DB Migrate Diff (dry-run) → Run workflow

Expected: SQL diff shown in Step Summary
Review: Confirm changes are as expected
```

### Step 4: DB Backup

```
GitHub → Actions → DB Backup → Run workflow

Expected: 
- ✅ Backup created
- ✅ Artifact uploaded
- ✅ (Optional) S3 upload complete
```

### Step 5: DB Deploy

```
GitHub → Actions → DB Deploy → Run workflow
Input: RUN_SEED = false (production) or true (staging)

Expected:
- ⏸️ Waiting for approval
- Click "Review deployments" → Approve
- ✅ Migrations applied
- ✅ Status check passed
- ✅ Slack notification sent
```

### Step 6: Post-Deploy Smoke

```bash
# Run smoke tests (from your terminal)
API_URL="https://your-api.com" \
WEB_URL="https://your-web.com" \
./scripts/post-deploy-smoke.sh

Expected: ✅ All tests pass
```

---

## ✅ F) Least-Privilege DB Roles Configuration

### Step 1: Create Roles on Cloud Database

```bash
# Connect to your Neon database
psql "postgresql://neondb_owner:PASSWORD@ep-xxx.neon.tech:5432/neondb?sslmode=require"
```

```sql
-- Create migration role (DDL operations)
CREATE ROLE neonhub_migrate 
  NOINHERIT 
  LOGIN 
  PASSWORD 'GENERATE_STRONG_PASSWORD_1';

-- Create app role (DML operations only)
CREATE ROLE neonhub_app 
  NOINHERIT 
  LOGIN 
  PASSWORD 'GENERATE_STRONG_PASSWORD_2';

-- Grant permissions to neonhub_app (runtime)
GRANT CONNECT ON DATABASE neondb TO neonhub_app;
GRANT USAGE ON SCHEMA public TO neonhub_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO neonhub_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO neonhub_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO neonhub_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO neonhub_app;

-- Grant permissions to neonhub_migrate (CI/CD)
GRANT CREATE ON SCHEMA public TO neonhub_migrate;
GRANT ALL PRIVILEGES ON SCHEMA public TO neonhub_migrate;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neonhub_migrate;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neonhub_migrate;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO neonhub_migrate;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON TABLES TO neonhub_migrate;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON SEQUENCES TO neonhub_migrate;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON FUNCTIONS TO neonhub_migrate;
```

### Step 2: Generate Strong Passwords

```bash
# Generate password for migrate role
echo "neonhub_migrate: $(openssl rand -base64 32)"

# Generate password for app role
echo "neonhub_app: $(openssl rand -base64 32)"
```

### Step 3: Update GitHub Secrets (CI/CD)

```
GitHub → Settings → Secrets → Actions

Update DATABASE_URL with neonhub_migrate role:
postgresql://neonhub_migrate:PASSWORD@ep-xxx.neon.tech:5432/neondb?sslmode=require

Update DIRECT_DATABASE_URL (same as above):
postgresql://neonhub_migrate:PASSWORD@ep-xxx.neon.tech:5432/neondb?sslmode=require
```

### Step 4: Update Runtime Environment (Railway/Render)

```
Railway/Render → Environment Variables

Set DATABASE_URL with neonhub_app role:
postgresql://neonhub_app:PASSWORD@ep-xxx.neon.tech:5432/neondb?sslmode=require

Set DIRECT_DATABASE_URL (same as above):
postgresql://neonhub_app:PASSWORD@ep-xxx.neon.tech:5432/neondb?sslmode=require
```

### Step 5: Test Role Separation

```bash
# Test migrate role (should work)
psql "postgresql://neonhub_migrate:PASSWORD@host/db" \
  -c "CREATE TABLE test_ddl (id serial);"

# Test app role (should fail - permission denied)
psql "postgresql://neonhub_app:PASSWORD@host/db" \
  -c "CREATE TABLE test_ddl (id serial);"

# Test app role (should work)
psql "postgresql://neonhub_app:PASSWORD@host/db" \
  -c "SELECT * FROM users LIMIT 1;"
```

---

## ✅ G) Rollback Drill (Safe Test)

### Purpose
Verify emergency rollback procedure works without data loss

### Step 1: Create Fresh Backup (Staging)

```
GitHub → Actions → DB Backup → Run workflow

Wait for completion
Note artifact name: db-backup-YYYYMMDD_HHMMSS
```

### Step 2: Trigger Restore (Staging Only!)

```
GitHub → Actions → DB Restore → Run workflow

Inputs:
- BACKUP_ARTIFACT_NAME: db-backup-YYYYMMDD_HHMMSS (from Step 1)
- CONFIRM_RESTORE: RESTORE (type exactly)

Expected:
- ⏸️ Waiting for 2 approvals (production-restore environment)
- 2 team members approve
- ✅ Pre-restore safety backup created
- ✅ Database restored from backup
- ✅ Migrations applied (if any new ones)
- ✅ Slack @channel notification sent
```

### Step 3: Verify Restore

```bash
# Run smoke tests
API_URL="https://staging-api.neonhub.com" \
WEB_URL="https://staging.neonhub.com" \
./scripts/post-deploy-smoke.sh

Expected: ✅ All tests pass
```

### Step 4: Document Results

```
Create incident report (even if drill):
- Backup artifact used
- Restore time (start → complete)
- Smoke test results
- Lessons learned
```

---

## 📊 Final Validation Matrix

| Component | Status | Verified By |
|-----------|--------|-------------|
| **Branch Protection** | ⏳ | GitHub Settings |
| **Environment Approvals** | ⏳ | GitHub Environments |
| **Slack Notifications** | ⏳ | Test message sent |
| **Security Preflight** | ⏳ | Workflow run green |
| **DB Drift Check** | ⏳ | Workflow run green |
| **DB Backup** | ⏳ | Artifact created |
| **DB Deploy** | ⏳ | Approval + success |
| **Smoke Tests** | ⏳ | Local run passed |
| **Readiness Probe** | ⏳ | `/api/readyz` returns 200 |
| **Least-Privilege Roles** | ⏳ | Roles created + tested |
| **Rollback Drill** | ⏳ | Restore workflow success |

---

## 🎯 Quick Command Reference

### Run All Checks Locally (Pre-Deploy)

```bash
cd /Users/kofirusu/Desktop/NeonHub

# 1. Validate schema
pnpm --filter apps/api exec prisma validate

# 2. Check drift (against cloud DB)
export DATABASE_URL="postgresql://..."
pnpm --filter apps/api exec prisma migrate status

# 3. Type check
pnpm --filter apps/api exec tsc --noEmit

# 4. Run smoke tests (if API running)
API_URL="http://localhost:3001" \
WEB_URL="http://localhost:3000" \
./scripts/post-deploy-smoke.sh
```

### Run All Workflows (CI/CD)

```bash
# Via GitHub CLI
gh workflow run security-preflight.yml --ref ci/codex-autofix-and-heal
gh workflow run db-drift-check.yml --ref ci/codex-autofix-and-heal
gh workflow run db-diff.yml --ref ci/codex-autofix-and-heal
gh workflow run db-backup.yml --ref ci/codex-autofix-and-heal
gh workflow run db-deploy.yml --ref ci/codex-autofix-and-heal -f RUN_SEED=false
```

### Monitor Workflow Status

```bash
# Watch workflow runs
gh run list --workflow=security-preflight.yml --limit 5

# Get logs from latest run
gh run view --log

# Or visit:
# https://github.com/NeonHub3A/neonhub/actions
```

---

## 🆘 Troubleshooting

### Branch Protection Won't Save

**Issue**: "Could not save branch protection rule"

**Fix**:
1. Ensure workflows have run at least once (so status checks exist)
2. Check you have admin permissions
3. Try disabling "Include administrators" temporarily

### Smoke Tests Fail Locally

**Issue**: Tests fail even though API is running

**Common Fixes**:
```bash
# Check API is actually running
curl http://localhost:3001/api/health

# Check DATABASE_URL is set
echo $DATABASE_URL

# Start API if needed
pnpm dev --filter apps/api

# Re-run tests
./scripts/post-deploy-smoke.sh
```

### Least-Privilege Role Creation Fails

**Issue**: "permission denied to create role"

**Fix**: You must connect as superuser (neondb_owner) to create roles

```bash
# Use the admin connection string from Neon dashboard
psql "postgresql://neondb_owner:ADMIN_PASSWORD@..."
```

---

## ✅ Completion Criteria

Mark each as done when verified:

- [ ] Branch protection requires Security Preflight + DB Drift Check
- [ ] Environment approvals require 1 person (production), 2 people (restore)
- [ ] Slack webhook tested and configured in GitHub secrets
- [ ] Security Preflight workflow passed on latest commit
- [ ] DB Drift Check workflow passed (no drift detected)
- [ ] DB Backup workflow created artifact successfully
- [ ] DB Deploy workflow completed with approval
- [ ] Smoke tests passed locally (all 7 checks)
- [ ] `/api/readyz` endpoint returns `{"ok":true,"pgvector":true}`
- [ ] Least-privilege roles created and tested
- [ ] Rollback drill completed successfully (staging)

---

## 🎉 When All Complete

You'll have:
- ✅ **Zero-trust deployment** (multiple approval gates)
- ✅ **Automated security scanning** (every PR)
- ✅ **Comprehensive testing** (8 pre-deploy + 7 post-deploy checks)
- ✅ **Emergency rollback** (tested and verified)
- ✅ **Least-privilege access** (separate runtime/migration roles)
- ✅ **Complete observability** (health + readiness probes)

**STATUS**: 🚀 **PRODUCTION-GRADE SECURITY ACHIEVED**

---

**Created**: 2025-10-27  
**Owner**: DevOps Team  
**Next Review**: After first production deployment
