#!/usr/bin/env bash
# reset-database.sh - Completely reset and reinitialize the database
# WARNING: This will drop all data!

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "⚠️  DATABASE RESET"
echo "This will DROP ALL TABLES and DATA from the database."
echo ""

read -p "Are you sure you want to continue? Type 'yes' to proceed: " -r
if [[ ! $REPLY == "yes" ]]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "🗑️  Dropping all tables..."

# Drop all tables and reset migration state
./pnpm --filter apps/api prisma migrate reset --force --skip-seed || {
  echo "  ⚠️  migrate reset failed, trying manual drop..."
  
  # Manual drop using psql or direct SQL
  cat > /tmp/drop_all.sql <<'EOF'
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
END $$;
EOF

  ./pnpm --filter apps/api prisma db execute --stdin < /tmp/drop_all.sql
  rm /tmp/drop_all.sql
}

echo ""
echo "📊 Pushing schema to database..."
./pnpm --filter apps/api prisma db push --accept-data-loss --skip-generate

echo ""
echo "🔄 Generating Prisma client..."
./pnpm --filter apps/api prisma generate

echo ""
echo "📝 Marking migrations as applied..."
# Mark all migrations as applied without running them
for migration in apps/api/prisma/migrations/*/; do
  migration_name=$(basename "$migration")
  if [[ "$migration_name" != "migration_lock.toml" ]]; then
    echo "  Resolving $migration_name"
    ./pnpm --filter apps/api prisma migrate resolve --applied "$migration_name" || true
  fi
done

echo ""
echo "✅ Database reset complete!"
echo ""
echo "Next steps:"
echo "  1. Seed database: bash ./scripts/run-and-capture.sh \"pnpm --filter apps/api prisma db seed\""
echo "  2. Verify: bash ./scripts/run-and-capture.sh \"pnpm --filter apps/api prisma migrate status\""

