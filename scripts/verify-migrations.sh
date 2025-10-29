#!/bin/bash
# Migration Verification Script for NeonHub
# Verifies that all migrations are properly applied and schema is consistent

set -e

echo "🔍 NeonHub Migration Verification"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Check 1: _prisma_migrations table exists
echo "✓ Checking _prisma_migrations table..."
if docker exec neonhub-postgres psql -U neonhub -d neonhub -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_prisma_migrations');" | grep -q "t"; then
    echo -e "${GREEN}✓ _prisma_migrations table exists${NC}"
else
    echo -e "${RED}✗ _prisma_migrations table not found${NC}"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# Check 2: All 13 migrations are marked as applied
echo "✓ Checking migration count..."
MIGRATION_COUNT=$(docker exec neonhub-postgres psql -U neonhub -d neonhub -tAc "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;")
if [ "$MIGRATION_COUNT" -eq 13 ]; then
    echo -e "${GREEN}✓ All 13 migrations applied${NC}"
else
    echo -e "${RED}✗ Expected 13 migrations, found $MIGRATION_COUNT${NC}"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# Check 3: No migrations are incomplete
echo "✓ Checking for incomplete migrations..."
INCOMPLETE_COUNT=$(docker exec neonhub-postgres psql -U neonhub -d neonhub -tAc "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NULL;")
if [ "$INCOMPLETE_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ No incomplete migrations${NC}"
else
    echo -e "${YELLOW}⚠ Found $INCOMPLETE_COUNT incomplete migration(s)${NC}"
    docker exec neonhub-postgres psql -U neonhub -d neonhub -c "SELECT migration_name, started_at FROM _prisma_migrations WHERE finished_at IS NULL;"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# Check 4: Prisma migrate status
echo "✓ Checking Prisma migration status..."
cd "$(dirname "$0")/../apps/api"
if npx prisma migrate status 2>&1 | grep -q "Database schema is up to date"; then
    echo -e "${GREEN}✓ Prisma reports schema is up to date${NC}"
else
    echo -e "${RED}✗ Prisma reports schema drift or pending migrations${NC}"
    npx prisma migrate status
    FAILURES=$((FAILURES + 1))
fi
echo ""

# Check 5: Key tables exist
echo "✓ Checking core tables..."
CORE_TABLES=("users" "accounts" "sessions" "connectors" "content_drafts" "messages")
MISSING_TABLES=0
for table in "${CORE_TABLES[@]}"; do
    if docker exec neonhub-postgres psql -U neonhub -d neonhub -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '$table');" | grep -q "t"; then
        echo -e "${GREEN}  ✓ $table${NC}"
    else
        echo -e "${RED}  ✗ $table not found${NC}"
        MISSING_TABLES=$((MISSING_TABLES + 1))
    fi
done

# Get total table count
TOTAL_TABLES=$(docker exec neonhub-postgres psql -U neonhub -d neonhub -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
echo -e "  ${GREEN}Total tables: $TOTAL_TABLES${NC}"

if [ $MISSING_TABLES -gt 0 ]; then
    echo -e "${YELLOW}⚠ $MISSING_TABLES core table(s) missing (may be created by future migrations)${NC}"
fi
echo ""

# Check 6: Extensions enabled
echo "✓ Checking Postgres extensions..."
EXTENSIONS=("vector" "uuid-ossp" "citext")
for ext in "${EXTENSIONS[@]}"; do
    if docker exec neonhub-postgres psql -U neonhub -d neonhub -tAc "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = '$ext');" | grep -q "t"; then
        echo -e "${GREEN}  ✓ $ext${NC}"
    else
        echo -e "${RED}  ✗ $ext not installed${NC}"
        FAILURES=$((FAILURES + 1))
    fi
done
echo ""

# Summary
echo "=================================="
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo "Database is ready for production deployment."
    exit 0
else
    echo -e "${RED}❌ $FAILURES check(s) failed${NC}"
    echo "Please review the errors above and fix before deploying."
    exit 1
fi
