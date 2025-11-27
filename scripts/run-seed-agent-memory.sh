#!/usr/bin/env bash
set -euo pipefail

if [[ "${CI:-}" == "true" ]]; then
  echo "Running NeonHub agent memory seeding (CI mode)..."
else
  echo "Running NeonHub agent memory seeding..."
fi

if ! pnpm --filter @neonhub/backend-v3.2 exec tsx scripts/seed-agent-memory.ts "$@"; then
  echo "Primary tsx execution failed, attempting ts-node fallback..."
  pnpm --filter @neonhub/backend-v3.2 exec node --loader ts-node/esm scripts/seed-agent-memory.ts "$@"
fi
