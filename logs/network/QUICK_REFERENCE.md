# Quick Reference - DNS & Connectivity Commands

## ✅ Verified Working Commands

### Package Management
```bash
# Install dependencies (verified working)
/opt/homebrew/bin/pnpm install --frozen-lockfile

# Install with clean environment
env -i HOME="$HOME" SHELL="/bin/zsh" PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" \
  /opt/homebrew/bin/pnpm install --frozen-lockfile
```

### Prisma Operations (run from apps/api)
```bash
cd /Users/kofirusu/Desktop/NeonHub/apps/api

# Validate schema
/opt/homebrew/bin/pnpm exec prisma validate

# Generate client
/opt/homebrew/bin/pnpm exec prisma generate

# Migrate
/opt/homebrew/bin/pnpm exec prisma migrate dev
```

### Build & Validation
```bash
cd /Users/kofirusu/Desktop/NeonHub

# TypeScript check
/opt/homebrew/bin/pnpm -r run typecheck

# Lint API (web has config issues)
/opt/homebrew/bin/pnpm --filter @neonhub/backend-v3.2 run lint

# Build API
/opt/homebrew/bin/pnpm --filter @neonhub/backend-v3.2 run build
```

### DNS Diagnostics
```bash
# Quick health check
dig registry.npmjs.org +short
curl -I https://registry.npmjs.org/

# Full diagnostics
{
  echo "=== DNS Config ==="
  scutil --dns | head -n 60
  echo "=== Test Resolution ==="
  dig registry.npmjs.org +short
  host registry.npmjs.org
  echo "=== Test Connectivity ==="
  curl -I --max-time 15 https://registry.npmjs.org/
} | tee dns-check.log
```

## 🔧 If Issues Recur

### Reset pnpm config
```bash
/opt/homebrew/bin/pnpm config set offline false
/opt/homebrew/bin/pnpm config set registry https://registry.npmjs.org/
```

### Clear caches
```bash
/opt/homebrew/bin/pnpm store prune
rm -rf node_modules
/opt/homebrew/bin/pnpm install
```

### DNS flush (requires sudo)
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

## 📋 Status Check Commands
```bash
# Verify pnpm
which pnpm
/opt/homebrew/bin/pnpm -v

# Check node
node -v

# Test registry connectivity
curl -s https://registry.npmjs.org/ | head -n 1
```

---
**Last Updated:** October 28, 2025
**Status:** All commands verified working
