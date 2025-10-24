#!/usr/bin/env bash
set -euo pipefail

echo "=== Auto Sync: Start ==="
git config user.name "neon-sync-bot"
git config user.email "neon-sync-bot@users.noreply.github.com"

# Prefer pnpm when lockfile present and pnpm available, otherwise fall back to npx.
if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then
  TSX_CMD=(pnpm exec tsx)
else
  TSX_CMD=(npx --yes tsx@4)
fi

# Sanity check that tsx can run before executing the orchestrator.
if ! "${TSX_CMD[@]}" --version >/dev/null 2>&1; then
  echo "Failed to run tsx via ${TSX_CMD[*]}." >&2
  exit 1
fi

# Run orchestrator
"${TSX_CMD[@]}" scripts/auto-sync/index.ts
echo "=== Auto Sync: Done ==="
