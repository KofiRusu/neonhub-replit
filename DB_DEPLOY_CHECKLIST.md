# 🚀 Database Deployment Checklist

## ✅ Already Done (Automated)

- [x] Created Prisma migrations
  - `20251026_full_org_ai_vector_bootstrap` - Base schema with pgvector
  - `20251026_gpt5_merge_vector` - Vector indexes and optimizations
- [x] Updated `schema.prisma` with consolidated models
- [x] Enhanced `seed.ts` with Org→Brand→Agent→Dataset pipeline
- [x] Configured local pgvector in `docker-compose.db.yml`
- [x] Updated `scripts/run-cli.mjs` with tsx fallback
- [x] Validated schema with Prisma CLI
- [x] Tested seed locally (see `SEED_RUN_LOG.md`)
- [x] Created GitHub workflow `.github/workflows/db-deploy.yml`
- [x] Documented everything in `DB_COMPLETION_REPORT.md`

---

## ⏳ Manual Steps Required (You Need To Do This)

### 1. Add GitHub Secrets 🔑
**Where**: GitHub.com → NeonHub repo → Settings → Secrets and variables → Actions

**What to add**:
```
Name: DATABASE_URL
Value: postgresql://user:pass@cloud-host.com:5432/neonhub
```

**Optional** (if your database provider requires it):
```
Name: DIRECT_DATABASE_URL
Value: (same as DATABASE_URL)
```

📖 **Detailed guide**: See `GITHUB_SECRET_SETUP.md`

---

### 2. Commit & Push Migrations 📤
```bash
git status  # Should show new migrations as untracked
git add apps/api/prisma/migrations/20251026_*
git add apps/api/prisma/schema.prisma
git add apps/api/prisma/seed.ts
git add docker-compose.db.yml
git add scripts/run-cli.mjs
git add DB_*.md MIGRATION_SUMMARY.md SEED_RUN_LOG.md

git commit -m "feat(db): add pgvector migrations and consolidated schema"
git push origin ci/codex-autofix-and-heal
```

---

### 3. Run GitHub Workflow 🏃‍♂️
**Where**: GitHub.com → Actions tab → DB Deploy

**Steps**:
1. Click "Run workflow"
2. Select branch: `ci/codex-autofix-and-heal`
3. Click "Run workflow" button
4. Watch the logs

---

### 4. Verify Success ✅
**What to check**:
- [ ] Workflow completes with green checkmarks
- [ ] "Migrate Deploy" step shows: "Migration applied"
- [ ] "Seed DB" step shows: "Seeding complete"
- [ ] No red errors in logs

---

## 🎯 Success Criteria

### Cloud Database
- [ ] Migrations applied successfully
- [ ] Tables created with pgvector extension
- [ ] Seed data inserted (Org, Brand, Agent, Dataset)
- [ ] Vector indexes created

### CI/CD
- [ ] GitHub Actions workflow passes
- [ ] No secrets exposed in logs
- [ ] Database connection successful

### Local Development
- [ ] Can run `./scripts/db-deploy-local.sh`
- [ ] Local DB at `localhost:5433` works
- [ ] Prisma Client generates successfully

---

## 🆘 Troubleshooting

### Error: "DATABASE_URL is not defined"
**Fix**: Go back to step 1 and add the GitHub secret

### Error: "password authentication failed"
**Fix**: Check your DATABASE_URL has the correct username/password

### Error: "could not translate host name"
**Fix**: Make sure DATABASE_URL uses cloud host, not `localhost`

### Error: "pgvector extension not found"
**Fix**: Your database needs pgvector support. Contact your DB provider or use Neon/Supabase

---

## 📞 Need Help?

If the workflow fails:
1. Copy the EXACT error message from GitHub Actions logs
2. Take a screenshot of the failing step
3. Share both with your AI assistant

Most errors are quick fixes (wrong URL format, missing extension, etc.)!

