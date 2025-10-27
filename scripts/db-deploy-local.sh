#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL first, e.g. export DATABASE_URL=postgresql://user:pass@localhost:5433/neonhub}"
export PRISMA_HIDE_UPDATE_MESSAGE=1
export CI=${CI:-false}

echo "[+] Node/pnpm"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[-] pnpm not found. Installing via Corepack..."
  corepack enable >/dev/null 2>&1 || true
  corepack prepare pnpm@8 --activate
fi
pnpm -v

echo "[+] Install deps"
pnpm install --frozen-lockfile || pnpm install

echo "[+] Generate Prisma Client"
pnpm -F apps/api prisma generate

echo "[+] Validate schema"
pnpm -F apps/api prisma validate

echo "[+] Apply migrations (deploy)"
pnpm -F apps/api prisma migrate deploy

echo "[+] Seed"
pnpm -F apps/api prisma db seed

echo "[✓] generate ✔ migrate ✔ seed ✔"
