# 🚀 Autopilot Bootstrap Complete - Operator Instructions

## ✅ What Was Done

### 1. UI Path Detected
- **Active UI:** `Neon-v2.5.0/ui` (primary path exists)
- Fallback available: `Neon-v2.4.0/ui`

### 2. Scripts Made Executable
```bash
✓ chmod +x scripts/preflight.sh
✓ chmod +x scripts/smoke-api.sh
```

### 3. Documentation Added
- ✅ **README.md** - Added CI badge and comprehensive "How to Deploy" section
- ✅ **Release Checklist** - Created `.github/ISSUE_TEMPLATE/release_checklist.md`

### 4. Recent Commits
```
8c3c2ee docs(release): add Issue template for release checklist
9c624c5 docs(readme): add CI badge and How to Deploy quickstart
031257f chore(vercel): explicit root build for ui
870b32a chore(scripts): add preflight and API smoke scripts
df5cd9b chore(ci): add strict Node 20 + pnpm build for backend and ui
```

---

## 🔧 Required Actions (Operator)

### Step 1: Add Git Remote

**No git remote is currently configured.** You need to add your repository URL:

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Replace with your actual repository URL
git remote add origin git@github.com:YOUR_ORG/neonhub.git

# Verify remote was added
git remote -v
```

### Step 2: Push Branch

```bash
git push -u origin infra/autopilot-bootstrap
```

### Step 3: Open Pull Request

Once pushed, create a PR using GitHub CLI:

```bash
gh pr create --title "chore: Autopilot bootstrap (CI + scripts + docs)" --body "$(cat <<'EOF'
## Changes

- **CI workflow**: Node 20 + pnpm for backend and UI
- **Scripts**: 
  - `preflight.sh` - Local build validation
  - `smoke-api.sh` - Production API smoke tests
- **Documentation**:
  - README: Added CI badge and "How to Deploy" section
  - Release checklist: GitHub issue template for release verification
- **Vercel config**: `vercel.json` maps to `Neon-v2.5.0/ui` with pnpm
- **UI path**: Neon-v2.5.0/ui

## Testing

- CI will run automatically on this PR
- Local preflight: \`./scripts/preflight.sh\`
- Post-deploy API check: \`API_URL=https://api.neonhubecosystem.com ./scripts/smoke-api.sh\`

## Deployment Checklist

See the new [Release Checklist template](.github/ISSUE_TEMPLATE/release_checklist.md) for comprehensive pre/post-deployment verification.

## Related Docs

- [How to Deploy](./README.md#-how-to-deploy) - New quickstart section
- [Deploy Escort Guide](./docs/DEPLOY_ESCORT.md)
- [Production Environment Guide](./docs/PRODUCTION_ENV_GUIDE.md)
- [Release Notes v1.0.0](./release/RELEASE_NOTES_v1.0.0.md)
EOF
)"
```

**Alternative (Manual PR):**

If you prefer to create the PR via web interface:

1. Go to: `https://github.com/YOUR_ORG/neonhub/compare/infra/autopilot-bootstrap`
2. Use the title: `chore: Autopilot bootstrap (CI + scripts + docs)`
3. Copy the PR body from above

---

## 📋 Next Steps After PR Merge

### 1. Local Build Verification

Run the preflight script to ensure everything builds:

```bash
./scripts/preflight.sh
```

This will:
- Build backend (TypeScript → JavaScript)
- Build UI (Next.js production build)
- Validate Prisma schema
- Check for TypeScript errors

### 2. Vercel Deployment Setup

Configure your Vercel project:

**Project Settings:**
- **Framework Preset:** Next.js
- **Node Version:** 20.x
- **Root Directory:** `Neon-v2.5.0/ui`
- **Install Command:** `pnpm i --frozen-lockfile`
- **Build Command:** `pnpm build`

**Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=https://api.neonhubecosystem.com
NEXTAUTH_URL=https://neonhubecosystem.com
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
SENTRY_DSN=<optional>
```

### 3. Backend Deployment

**Build & Deploy:**
```bash
docker build -t neonhub-backend:latest ./backend
docker push your-registry.com/neonhub-backend:latest
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection
- `CORS_ORIGIN` - Frontend URL
- `OPENAI_API_KEY` - AI content generation
- `JWT_SECRET` - Authentication

**Run Migrations:**
```bash
pnpm -C backend prisma migrate deploy
```

### 4. Post-Deployment Smoke Tests

**API Health Check:**
```bash
API_URL=https://api.neonhubecosystem.com ./scripts/smoke-api.sh
```

**Manual Verification:**
- ✓ UI loads: `/`, `/dashboard`, `/analytics`, `/trends`
- ✓ API `/health` returns 200
- ✓ Metrics summary returns data
- ✓ Team invite flow works
- ✓ No critical errors in Sentry (if configured)

---

## 🎯 Update CI Badge

After pushing to GitHub, update the README.md CI badge URL:

Replace:
```markdown
[![CI](https://github.com/YOUR_ORG/neonhub/actions/workflows/ci.yml/badge.svg)]
```

With your actual organization/username:
```markdown
[![CI](https://github.com/actual-org/neonhub/actions/workflows/ci.yml/badge.svg)]
```

---

## 📚 Documentation References

- **[README.md](./README.md)** - Updated with deployment quickstart
- **[Release Checklist](./.github/ISSUE_TEMPLATE/release_checklist.md)** - New issue template
- **[Deploy Escort Guide](./docs/DEPLOY_ESCORT.md)** - Step-by-step deployment
- **[Production Environment Guide](./docs/PRODUCTION_ENV_GUIDE.md)** - All environment variables
- **[Release Notes v1.0.0](./release/RELEASE_NOTES_v1.0.0.md)** - Latest release info

---

## ⚠️ Important Notes

1. **No secrets committed** - All environment variables are documented but not in code
2. **UI path confirmed** - `Neon-v2.5.0/ui` is the active Next.js App Router
3. **Scripts ready** - `preflight.sh` and `smoke-api.sh` are executable
4. **CI configured** - `.github/workflows/ci.yml` will run on PR
5. **Vercel ready** - `vercel.json` points to correct UI path

---

## 🆘 Troubleshooting

### Remote URL Issues
If you need to change the remote URL:
```bash
git remote set-url origin git@github.com:NEW_ORG/neonhub.git
```

### Push Rejected
If push is rejected due to unrelated histories:
```bash
git pull origin main --allow-unrelated-histories --no-rebase
git push -u origin infra/autopilot-bootstrap
```

### CI Failing
Check:
- Node 20.x is specified in workflow
- pnpm is used (not npm)
- Build commands match local success

---

**Bootstrap complete! 🎉**

Follow the operator instructions above to push the branch and open the PR.

