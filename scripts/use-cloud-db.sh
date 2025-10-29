#!/usr/bin/env bash
# use-cloud-db.sh - Switch to Neon.tech cloud database
# Updates DATABASE_URL in apps/api/.env to use production Neon.tech instance

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Neon.tech production database URL from deployment
CLOUD_DB_URL="postgresql://neondb_owner:npg_r2D7UIdgPsVX@ep-polished-flower-aefsjkya-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

ENV_FILE="apps/api/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE not found"
  exit 1
fi

# Backup current .env
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d-%H%M%S)"

# Update DATABASE_URL
if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
  # Use | as delimiter since URL contains /
  sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$CLOUD_DB_URL\"|" "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
  echo "✅ Updated DATABASE_URL to use Neon.tech cloud database"
else
  echo "DATABASE_URL=\"$CLOUD_DB_URL\"" >> "$ENV_FILE"
  echo "✅ Added DATABASE_URL for Neon.tech cloud database"
fi

# Also update DIRECT_DATABASE_URL if present
if grep -q "^DIRECT_DATABASE_URL=" "$ENV_FILE"; then
  sed -i.bak "s|^DIRECT_DATABASE_URL=.*|DIRECT_DATABASE_URL=\"$CLOUD_DB_URL\"|" "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
fi

echo ""
echo "Database URL updated in $ENV_FILE"
echo "Backup saved to $ENV_FILE.backup.*"
echo ""
echo "Test connection with:"
echo "  bash ./scripts/run-and-capture.sh \"pnpm --filter apps/api prisma migrate status\""

