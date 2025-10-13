#!/usr/bin/env bash
set -euo pipefail

echo "=== Auto Sync: Start ==="
git config user.name "neon-sync-bot"
git config user.email "neon-sync-bot@users.noreply.github.com"

PKG="npm"
if [ -f pnpm-lock.yaml ]; then PKG="pnpm"; fi

# Ensure tsx is available
$PKG exec -c "tsx --version" >/dev/null 2>&1 || $PKG add -D tsx

# Run orchestrator
$PKG exec -c "tsx scripts/auto-sync/index.ts"
echo "=== Auto Sync: Done ==="

