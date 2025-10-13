# CI/CD Setup Guide - NeonHub

**Last Updated:** October 13, 2025  
**Status:** ✅ Operational with comprehensive fixes

---

## 🎯 Overview

NeonHub uses GitHub Actions for:
1. **CI/CD Pipeline** - Build, test, and validate code on every push/PR
2. **Auto-Sync Pipeline** - Hourly sync from sibling Neon repos with safety guards

---

## 📋 Workflows

### 1. CI/CD Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`

**Jobs:**
- `build-and-test`: Lint, typecheck, test, build (API + Web)
- `quality-check`: Additional quality validations

**Key Features:**
- PostgreSQL 15 service container
- Full npm workspace support
- Prisma client generation
- Type checking and linting
- Test suite execution
- Build artifact uploads

### 2. Auto-Sync Workflow (`.github/workflows/auto-sync-from-siblings.yml`)

**Triggers:**
- Hourly (cron: `0 * * * *`)
- Manual (workflow_dispatch)
- Push to auto-sync files

**Source Repositories:**
- `KofiRusu/neon-v2.4.0`
- `KofiRusu/Neon-v2.5.0`
- `KofiRusu/NeonHub-v3.0`

**Features:**
- Authenticated private repo access
- Conventional commit filtering
- Path-based safety filters
- Risk-based auto-merge
- Full CI validation
- Runtime smoke tests

---

## 🔐 Required Secrets

### SOURCE_PAT (Required for Auto-Sync)

**Purpose:** Read-only access to private source repositories

**Setup:**
1. **Create fine-grained PAT:**
   - Visit: https://github.com/settings/personal-access-tokens/new
   - Name: `NeonHub Source Read PAT`
   - Expiration: 90 days
   - Repository access: Only select repositories
     - ☑ `KofiRusu/neon-v2.4.0`
     - ☑ `KofiRusu/Neon-v2.5.0`
     - ☑ `KofiRusu/NeonHub-v3.0`
   - Permissions:
     - Contents: **Read-only**
     - Metadata: **Read-only** (auto-selected)

2. **Add to repository:**
   \`\`\`bash
   gh secret set SOURCE_PAT --app actions --body "YOUR_FINE_GRAINED_TOKEN"
   \`\`\`

3. **Verify:**
   \`\`\`bash
   gh secret list | grep SOURCE_PAT
   \`\`\`

**Security Notes:**
- Token is read-only (cannot modify source repos)
- Scoped to only 3 specific repositories
- Auto-redacted in workflow logs
- Should be rotated every 90 days

---

## 🏗️ Package Manager: npm

**Standard:** This project uses `npm` exclusively.

**Commands:**
\`\`\`bash
# Install dependencies
npm ci

# Build all workspaces
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run typecheck
\`\`\`

**Do NOT use:**
- ❌ `pnpm`
- ❌ `yarn`

---

## 🗄️ Database Configuration

### CI Environment
\`\`\`env
DATABASE_URL=postgresql://test:test@localhost:5432/testdb?schema=public
\`\`\`

### Local Development
\`\`\`env
DATABASE_URL=postgresql://youruser@localhost:5432/neonhub?schema=public
\`\`\`

### Prisma Commands
\`\`\`bash
# Generate Prisma Client
npm run prisma:generate --workspace=apps/api
npm run prisma:generate --workspace=apps/web

# Run migrations
cd apps/api
npx prisma migrate dev

# Seed database
npm run seed --workspace=apps/api
\`\`\`

---

## 🧪 Testing Locally Before Push

### Full Validation
\`\`\`bash
# 1. Install dependencies
npm ci

# 2. Generate Prisma clients
npm run prisma:generate

# 3. Type check
npm run typecheck

# 4. Lint (warnings OK, errors fail)
npm run lint

# 5. Run tests
npm run test

# 6. Build
npm run build
\`\`\`

### Quick Check
\`\`\`bash
npm run verify
# Runs: lint + typecheck + test
\`\`\`

---

## 🔧 Common CI Issues & Fixes

### Issue: "Repository not found" (Auto-Sync)
**Cause:** SOURCE_PAT not configured or expired  
**Fix:**
\`\`\`bash
# Recreate and add PAT
gh secret set SOURCE_PAT --app actions --body "YOUR_TOKEN"
\`\`\`

### Issue: Prisma Client Errors
**Cause:** Prisma client not generated before build  
**Fix:** Ensure `prisma:generate` runs in build script or workflow

### Issue: Lint Failures
**Cause:** ESLint errors in code  
**Fix Options:**
1. Fix the specific lint errors
2. Add `// eslint-disable-next-line` for specific lines
3. Update ESLint config to allow warnings

### Issue: Test Failures
**Cause:** Tests requiring API keys (OpenAI, etc.)  
**Fix:** Tests should use mocks or skip API calls in CI environment

### Issue: Build Timeout
**Cause:** Large dependencies or slow network  
**Fix:** Increase timeout in workflow or use caching

---

## 📊 Auto-Sync Pipeline Details

### How It Works
1. Every hour (or manual trigger)
2. Fetches latest commits from 3 source repos
3. Filters by conventional commit type (`feat`, `fix`, `perf`, `refactor`)
4. Cherry-picks commits to integration branches
5. Filters files by path (allows `apps/`, denies `.env`, `secrets/`)
6. Runs full CI validation
7. Calculates risk score
8. Auto-merges low-risk OR creates PR for review

### Risk Scoring
\`\`\`
weight = filesChanged + (tsErrors × 3) + (testFailures × 5) + (prisma ? 2 : 0)

if weight <=5:  risk = "low"
if weight <=15: risk = "medium"
if weight >15:  risk = "high"
\`\`\`

**Auto-merge criteria:**
- Risk === "low"
- TypeScript errors === 0
- Test failures === 0
- `autoMergeLowRisk` === true in config

### Configuration
**File:** `scripts/auto-sync/config.json`

\`\`\`json
{
  "sourceRepos": ["KofiRusu/neon-v2.4.0", "KofiRusu/Neon-v2.5.0", "KofiRusu/NeonHub-v3.0"],
  "targetDefaultBranch": "main",
  "integrationBranchPrefix": "integration/auto-sync",
  "stateFile": ".neon/auto-sync-state.json",
  "allowConventionalTypes": ["feat", "fix", "perf", "refactor"],
  "maxCommitsPerRun": 40,
  "autoMergeLowRisk": true,
  "requireCiGreenForMerge": true
}
\`\`\`

### Path Filters
**Allowed:**
- `apps/api/**`
- `apps/web/**`
- `packages/**`
- `scripts/**`
- `.github/**`

**Denied (never auto-synced):**
- `.env*`
- `secrets/**`
- `infra/prod/**`
- `deploy/**`
- `examples/**`
- `playground/**`

---

## 🔄 Workflow Commands

### Trigger Auto-Sync Manually
\`\`\`bash
gh workflow run auto-sync-from-siblings.yml
\`\`\`

### Watch Workflow Execution
\`\`\`bash
gh run watch
\`\`\`

### View Recent Runs
\`\`\`bash
# Auto-sync runs
gh run list --workflow=auto-sync-from-siblings.yml --limit 10

# CI runs
gh run list --workflow=ci.yml --limit 10
\`\`\`

### View Specific Run Logs
\`\`\`bash
gh run view <RUN_ID> --log
gh run view <RUN_ID> --log-failed  # Only failed steps
\`\`\`

### List Auto-Sync PRs
\`\`\`bash
gh pr list --label auto-sync --state all
\`\`\`

---

## 📈 Monitoring & Maintenance

### Daily Checks
\`\`\`bash
# Check workflow success rate
gh run list --workflow=auto-sync-from-siblings.yml --limit 24 --json conclusion

# Review any failed runs
gh run list --status failure --limit 5
\`\`\`

### Weekly Review
\`\`\`bash
# Review auto-sync PRs
gh pr list --label auto-sync --state all

# Check state file for anomalies
cat .neon/auto-sync-state.json | jq .
\`\`\`

### Monthly Maintenance
- Review SOURCE_PAT expiration date
- Audit auto-merge decisions
- Tune risk scoring if needed
- Update source repo list if new versions released

---

## 🎓 Best Practices

### For Developers
1. ✅ Run `npm run verify` before pushing
2. ✅ Fix lint errors before committing
3. ✅ Write tests for new features
4. ✅ Use conventional commit messages
5. ✅ Never commit `.env` or secrets

### For Maintainers
1. ✅ Keep SOURCE_PAT up to date (90-day rotation)
2. ✅ Monitor auto-sync PRs weekly
3. ✅ Review high-risk PRs promptly
4. ✅ Update source repo list as needed
5. ✅ Keep documentation current

---

## 📞 Support & Resources

### Quick Links
- **Workflows:** `.github/workflows/`
- **Auto-Sync Config:** `scripts/auto-sync/config.json`
- **Enhancements Module:** `scripts/auto-sync/enhancements.ts`
- **Verification Report:** `AUTO_SYNC_VERIFICATION_REPORT.md`

### Useful Commands
\`\`\`bash
# Test auto-sync logic locally
tsx scripts/auto-sync/index.ts

# Check workflow syntax
gh workflow view auto-sync-from-siblings.yml

# Re-run failed workflow
gh run rerun <RUN_ID>
\`\`\`

---

**🚀 CI/CD configured for reliable, automated operations!**

