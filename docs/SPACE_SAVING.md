# NeonHub Space Saving Guide

This guide explains how to safely reclaim disk space in the NeonHub repository by removing ephemeral build artifacts and caches.

---

## 🎯 What Gets Deleted

The cleanup script removes **only ephemeral, regenerable artifacts**:

### Build Artifacts
- `.next/` - Next.js production builds
- `dist/` - TypeScript compiled output
- `build/` - Build directories
- `out/` - Static export outputs

### Caches
- `.cache/` - Various build caches
- `.turbo/` - Turborepo cache
- `.vite/` - Vite cache
- `node_modules/.cache/` - npm/pnpm caches

### Test Outputs
- `coverage/` - Test coverage reports (regenerate with `pnpm test`)
- `playwright-report/` - E2E test reports
- `test-results/` - Test result artifacts

### Deployment Artifacts
- `.vercel/` - Vercel deployment cache
- `.wrangler/` - Cloudflare Wrangler cache

### Temporary Files
- `tmp/` - Temporary directories
- `.DS_Store` - macOS metadata files

---

## ✅ What Is NEVER Deleted

The script has strict safeguards to **never touch**:

- ✅ **Source code** (`apps/*/src`, `packages/*/src`, `core/*/src`)
- ✅ **Configuration files** (`.env*`, `package.json`, `tsconfig.json`)
- ✅ **Database files** (`prisma/schema.prisma`, `migrations/`)
- ✅ **Documentation** (`docs/`, `README.md`)
- ✅ **Scripts** (`scripts/`)
- ✅ **Git history** (`.git/`)

---

## 🚀 How to Use

### 1. Preview (Dry Run)

See what would be deleted **without actually deleting**:

```bash
pnpm run clean:dry
```

This is **always safe** and shows:
- Current repository size
- Directories that would be deleted
- Estimated space to reclaim

### 2. Clean Build Artifacts

Delete ephemeral artifacts (safe to regenerate):

```bash
pnpm run clean:apply
```

This removes:
- Build caches (`.next`, `dist`, `.turbo`, etc.)
- Test coverage reports
- Vercel/Wrangler deployment caches
- Runs `pnpm store prune` to clean package cache
- Runs `git gc --aggressive` to optimize git database

### 3. Deep Clean (Including Ignored Files)

Remove **all** git-ignored files:

```bash
pnpm run clean:deep
```

⚠️ **Warning:** This runs `git clean -fdX` which removes:
- All ignored files (per `.gitignore`)
- Local configuration files you may have created
- Use with caution!

### 4. Clean Docker (If Applicable)

Remove unused Docker images, containers, and volumes:

```bash
pnpm run clean:docker
```

This runs `docker system prune -af --volumes` and can **free significant space** if you use Docker locally.

---

## 📊 Expected Space Savings

Typical cleanup results:

| Operation | Space Freed | Safety |
|-----------|-------------|--------|
| `clean:apply` | 5-50 MB | ✅ Very Safe |
| `clean:deep` | 10-100 MB | ⚠️ Use with caution |
| `clean:docker` | 100 MB - 10 GB | ✅ Safe (Docker only) |

---

## 🔍 Sparse Checkout (Advanced)

If you only work on specific parts of the monorepo, use **sparse checkout** to avoid downloading unnecessary files:

### Enable Sparse Checkout

```bash
# Initialize sparse checkout
git sparse-checkout init --cone

# Set paths you need (example)
git sparse-checkout set apps/api apps/web packages/data-model

# View current sparse checkout
git sparse-checkout list
```

### Add/Remove Paths

```bash
# Add more paths
git sparse-checkout add core/ai-governance modules/predictive-engine

# Reset to full checkout
git sparse-checkout disable
```

### Benefits
- **Faster clones:** Only download needed files
- **Smaller workspace:** Ignore unused packages
- **Faster operations:** Less files to scan

---

## 🛠️ Manual Cleanup Commands

If you prefer manual control:

### PNPM Cache Management

```bash
# View store size
pnpm store path
du -sh $(pnpm store path)

# Prune unused packages
pnpm store prune

# Clean node_modules caches
find . -type d -name '.cache' -exec rm -rf {} +
```

### Git Optimization

```bash
# Aggressive garbage collection
git gc --aggressive --prune=now

# Remove ignored files (BE CAREFUL!)
git clean -fdX

# View repository size
du -sh .git
```

### Find Large Directories

```bash
# Top 20 largest directories
du -hd1 . | sort -h | tail -20

# Find all .next directories
find . -type d -name '.next' -exec du -sh {} \;
```

---

## 📝 Common Pitfalls

### ❌ Don't Delete These Manually

- `node_modules/` - Use `pnpm install` to regenerate
- `.git/` - Your entire history!
- `apps/api/prisma/migrations/` - Database migration history
- `.env` files - Your local configuration

### ❌ Don't Run `git clean -fdx`

The `-x` flag removes **ALL untracked files**, including:
- `.env` files (your secrets!)
- IDE settings
- Local tools

✅ **Use `-X` (uppercase)** instead - removes only ignored files.

---

## 🔄 Regenerating Deleted Files

All deleted files can be regenerated:

```bash
# Reinstall dependencies
pnpm install

# Rebuild applications
pnpm run build

# Regenerate test coverage
pnpm run test

# Regenerate Prisma client
pnpm run prisma:generate
```

---

## 📋 Cleanup Logs

Every cleanup run creates a log file:

```
logs/cleanup-YYYYMMDD-HHMMSS.log
```

The log includes:
- Start/end repository size
- Deleted directories
- Actions performed
- PNPM/Git/Docker operations

View all cleanup logs:

```bash
ls -lh logs/cleanup-*.log
```

---

## 🆘 Troubleshooting

### "Permission Denied"

Make the script executable:

```bash
chmod +x scripts/cleanup.sh
```

### "pnpm not found"

Install pnpm:

```bash
npm install -g pnpm
```

Or use npm instead:

```bash
npm run clean:dry
```

### "Docker not found"

The `clean:docker` command requires Docker to be installed. Skip this step if you don't use Docker locally.

---

## 🎯 Best Practices

1. **Run `clean:dry` first** - Always preview before deleting
2. **Use `clean:apply` regularly** - Weekly or after major builds
3. **Use `clean:deep` sparingly** - Only when really needed
4. **Commit before cleaning** - Ensure no uncommitted work
5. **Keep logs** - Helps track space usage over time

---

## 📚 Related Documentation

- [Git History Audit](./GIT_HISTORY_AUDIT.md) - Find large files in git history
- [Maintenance Log](./MAINTENANCE_LOG.md) - Cleanup operation history
- [README.md](../README.md) - Main project documentation

---

**Last Updated:** October 27, 2025  
**Script Version:** 1.0  
**Maintainer:** NeonHub Team

