#!/usr/bin/env bash
set -euo pipefail
echo "🔎 Preflight: Node 20 + pnpm + clean builds"
pnpm -v || corepack enable
pnpm -C backend build
pnpm -C Neon-v2.5.0/ui build 2>/dev/null || pnpm -C Neon-v2.4.0/ui build
echo "✅ Preflight builds green"
