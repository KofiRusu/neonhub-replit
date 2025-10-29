#!/usr/bin/env bash
# run-and-capture.sh
# Usage: bash ./scripts/run-and-capture.sh "<your command>"
# Captures command output to timestamped logs for easy debugging

set -euo pipefail

cmd="${1:-}"
if [ -z "$cmd" ]; then
  echo "usage: run-and-capture \"<command>\""
  exit 2
fi

ts=$(date +%Y%m%d-%H%M%S)
log="logs/snags-$ts.log"
mkdir -p logs

echo "→ $cmd" | tee "$log"

# Add local pnpm shim to PATH
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export PATH="$REPO_ROOT:$PATH"

# Source shell environment for other tools
[[ -s "$HOME/.nvm/nvm.sh" ]] && source "$HOME/.nvm/nvm.sh" 2>/dev/null || true

if eval "$cmd" 2>&1 | tee -a "$log"; then
  echo "✅ OK: $cmd"
else
  echo ""
  echo "❌ FAILED: $cmd"
  echo "📋 Log saved: $log"
  echo ""
  echo "=== CONTEXT (copy/paste with error) ==="
  echo "Node: $(node -v 2>/dev/null || echo 'not found')"
  echo "Prisma: $(pnpm --filter apps/api prisma -v 2>/dev/null | head -1 || echo 'not found')"
  echo "DB URL host (redacted): $(echo "${DATABASE_URL:-NOT_SET}" | sed -E 's#://([^:]+):?[^@]*@#://****:****@#')"
  echo "Branch/Commit: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown') @ $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
  echo "Log file: $log"
  echo "=== END CONTEXT ==="
  echo ""
  echo "📎 Last 20 lines of output:"
  tail -20 "$log"
  exit 1
fi
