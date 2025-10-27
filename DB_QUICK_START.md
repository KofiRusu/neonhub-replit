# ⚡ NeonHub Database Deployment — Quick Start

**TL;DR:** Choose one method below and follow the commands.

---

## 🚀 Option C: Fastest (Recommended for First-Time Setup)

```bash
cd /Users/kofirusu/Desktop/NeonHub
./scripts/deploy-db.sh
```

✅ **Done!** The script handles everything.

---

## 🧠 Option B: Manual Commands (Fastest for CI/CD)

```bash
cd /Users/kofirusu/Desktop/NeonHub
npm install --legacy-peer-deps
npm run prisma:generate --workspace=apps/api
npm run prisma:migrate --workspace=apps/api -- dev --name initial_bootstrap
npm run seed --workspace=apps/api
```

✅ **Verify it worked:**
```bash
npm run prisma:studio --workspace=apps/api
# Opens browser at http://localhost:5555
```

---

## 🔧 Option A: GitHub Actions (Production CI/CD)

1. **Verify the workflow exists:**
   ```bash
   cat .github/workflows/db-deploy.yml
   ```

2. **Add GitHub Secret:**
   - Go to GitHub → Settings → Secrets → Actions
   - Click "New repository secret"
   - Name: `DATABASE_URL`
   - Value: `postgresql://[user@]host:5432/neonhub?schema=public`

3. **Trigger deployment:**
   - Go to GitHub → Actions → "🗄️ Database Deploy" → Run workflow
   - Or push to `main`: `git push origin main`

✅ **Monitor:** GitHub Actions tab shows progress in real-time

---

## ✅ Verify Success

```bash
# Check tables exist
psql postgresql://kofirusu@localhost:5432/neonhub -c "\dt"

# Check demo user
psql postgresql://kofirusu@localhost:5432/neonhub -c "SELECT email FROM users;"

# Check seed data count
psql postgresql://kofirusu@localhost:5432/neonhub -c "SELECT COUNT(*) FROM \"ContentDraft\";"
```

**Expected:**
- 17 tables created
- Demo user: `demo@neonhub.ai`
- At least 2 content drafts

---

## 🐛 Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| `DATABASE_URL not set` | Check `.env` file exists |
| `Connection refused` | Start PostgreSQL: `brew services start postgresql` |
| `Permission denied` | Make script executable: `chmod +x scripts/deploy-db.sh` |
| `node_modules error` | Clean & reinstall: `rm -rf node_modules && npm install` |

---

## 📚 Full Documentation

- **Detailed Guide:** `DB_DEPLOYMENT_GUIDE.md`
- **Full Summary:** `DB_DEPLOYMENT_SUMMARY.md`
- **GitHub Workflow:** `.github/workflows/db-deploy.yml`

---

## ⏱️ Time Estimates

| Method | Time | Best For |
|--------|------|----------|
| Option C (Script) | ~5 min | First setup, automation |
| Option B (Manual) | ~3-5 min | Development, testing |
| Option A (GitHub) | ~5 min | Production, CI/CD |

---

## 🎯 Next Steps After Deployment

```bash
# Start dev servers
npm run dev

# Run tests
npm run test:all

# View database
npm run prisma:studio --workspace=apps/api
```

---

**Status:** ✅ All methods ready for deployment  
**Last Updated:** October 26, 2025
