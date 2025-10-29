#!/usr/bin/env bash
# fix-migration-order.sh - Fix migration folder naming to ensure correct order
# The "initial" migration needs to run first, but its timestamp sorts it last

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATION_DIR="$REPO_ROOT/apps/api/prisma/migrations"

cd "$MIGRATION_DIR"

echo "🔧 Fixing migration order..."
echo ""

# Rename migrations to ensure correct chronological order
# The initial migration should be first (use a very early timestamp)

if [ -d "20251012154609_initial" ]; then
  echo "  Renaming 20251012154609_initial → 20240101000000_initial"
  mv "20251012154609_initial" "20240101000000_initial"
fi

if [ -d "20250105_phase4_beta" ]; then
  echo "  Renaming 20250105_phase4_beta → 20240102000000_phase4_beta"
  mv "20250105_phase4_beta" "20240102000000_phase4_beta"
fi

if [ -d "20250126_realign_schema" ]; then
  echo "  Renaming 20250126_realign_schema → 20240103000000_realign_schema"
  mv "20250126_realign_schema" "20240103000000_realign_schema"
fi

if [ -d "20250215_add_agent_memory" ]; then
  echo "  Renaming 20250215_add_agent_memory → 20240104000000_add_agent_memory"
  mv "20250215_add_agent_memory" "20240104000000_add_agent_memory"
fi

if [ -d "20251026_add_connector_kind_enum" ]; then
  echo "  Renaming 20251026_add_connector_kind_enum → 20240105000000_add_connector_kind_enum"
  mv "20251026_add_connector_kind_enum" "20240105000000_add_connector_kind_enum"
fi

if [ -d "20251026_full_org_ai_vector_bootstrap" ]; then
  echo "  Renaming 20251026_full_org_ai_vector_bootstrap → 20240106000000_full_org_ai_vector_bootstrap"
  mv "20251026_full_org_ai_vector_bootstrap" "20240106000000_full_org_ai_vector_bootstrap"
fi

if [ -d "20251026_gpt5_merge_vector" ]; then
  echo "  Renaming 20251026_gpt5_merge_vector → 20240107000000_gpt5_merge_vector"
  mv "20251026_gpt5_merge_vector" "20240107000000_gpt5_merge_vector"
fi

echo ""
echo "✅ Migration order fixed!"
echo ""
echo "New order:"
ls -1 | grep -v "migration_lock.toml" | sort
echo ""
echo "Next: bash ./scripts/run-and-capture.sh \"pnpm --filter apps/api prisma migrate deploy\""

