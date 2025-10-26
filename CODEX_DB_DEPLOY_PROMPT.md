# 🤖 CODEX: Prepare Database Deployment

## Objective
Stage all database migrations, verify schema integrity, and prepare the repo for GitHub Actions DB deployment. Do everything that can be automated—leave only the GitHub UI secrets configuration for the human.

## Context
- **Branch**: `ci/codex-autofix-and-heal`
- **New migrations ready**: 
  - `apps/api/prisma/migrations/20251026_full_org_ai_vector_bootstrap/migration.sql`
  - `apps/api/prisma/migrations/20251026_gpt5_merge_vector/migration.sql`
- **Workflow exists**: `.github/workflows/db-deploy.yml` (expects `DATABASE_URL` secret)
- **Local script ready**: `scripts/db-deploy-local.sh`
- **Documentation**: `DB_COMPLETION_REPORT.md`, `MIGRATION_SUMMARY.md` already exist

## Tasks (Do Everything You Can)

### 1. Git Operations
```bash
# Stage the new migrations
git add apps/api/prisma/migrations/20251026_full_org_ai_vector_bootstrap/
git add apps/api/prisma/migrations/20251026_gpt5_merge_vector/

# Stage the schema changes
git add apps/api/prisma/schema.prisma

# Stage seed updates
git add apps/api/prisma/seed.ts

# Stage docker and env changes
git add docker-compose.db.yml

# Stage documentation
git add DB_COMPLETION_REPORT.md DB_SMOKE_RESULTS.md MIGRATION_SUMMARY.md SEED_RUN_LOG.md

# Stage script improvements
git add scripts/run-cli.mjs

# Commit everything
git commit -m "feat(db): add pgvector migrations and consolidated schema

- Add 20251026_full_org_ai_vector_bootstrap migration for base schema
- Add 20251026_gpt5_merge_vector migration for vector extensions
- Update schema.prisma with vector support and model consolidation
- Enhance seed.ts with deterministic Org→Brand→Agent pipeline
- Configure docker-compose.db.yml for local pgvector on :5433
- Update run-cli.mjs with tsx fallback and Prisma cache setup

Migrations verified with prisma migrate status and validate.
Seed tested successfully (see SEED_RUN_LOG.md and DB_SMOKE_RESULTS.md).

Next: Add DATABASE_URL secret in GitHub, then run DB Deploy workflow."

# Push to remote
git push origin ci/codex-autofix-and-heal
```

### 2. Verify Workflow is Ready
```bash
# Check that db-deploy workflow exists and is valid
cat .github/workflows/db-deploy.yml

# Verify it references the correct secrets
grep -E "DATABASE_URL|DIRECT_DATABASE_URL" .github/workflows/db-deploy.yml
```

### 3. Create Quick Reference Guide
Create a file `GITHUB_SECRET_SETUP.md` with step-by-step instructions for adding the secret.

### 4. Verify Prisma Client Generation
```bash
# Ensure Prisma Client can generate successfully
pnpm --filter apps/api run prisma:generate

# Validate schema
pnpm --filter apps/api run prisma:validate
```

### 5. Create Deployment Checklist
Create `DB_DEPLOY_CHECKLIST.md` that lists:
- ✅ What's already done (automated)
- ⏳ What needs manual action (GitHub secrets)
- 🎯 Success criteria

### 6. Final Status Report
Update or create `DB_DEPLOY_STATUS.md` summarizing:
- Migrations staged and committed
- Schema validated
- Workflow verified
- What the human needs to do next

## Success Criteria
- [ ] All migrations committed and pushed
- [ ] Schema validated successfully
- [ ] Prisma Client generates without errors
- [ ] Documentation created for manual steps
- [ ] Branch is ahead of origin with new commits
- [ ] Clear instructions left for human operator

## Constraints
- DO NOT modify `.env` (contains local secrets)
- DO NOT attempt to add GitHub secrets (requires UI access)
- DO NOT trigger GitHub Actions (we'll do that manually)
- DO commit and push everything that's staged
- DO create helpful documentation

## Output
Provide a summary showing:
1. All commits made
2. All files staged/pushed
3. Verification results (Prisma validate, generate)
4. Exact manual steps remaining for the human

---

**Run this with full autonomy. Complete everything that doesn't require GitHub UI access.**

