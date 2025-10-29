#!/usr/bin/env bash
# setup-env.sh - Environment setup and validation for NeonHub
# Checks prerequisites and offers to fix common issues

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "🔍 NeonHub Environment Setup & Validation"
echo ""

# Check 1: Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
  echo "  ❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
  exit 1
fi
NODE_VERSION=$(node -v)
echo "  ✓ Node.js $NODE_VERSION found"

# Check 2: Database connection
echo ""
echo "✓ Checking database configuration..."
if [ ! -f "apps/api/.env" ]; then
  echo "  ❌ apps/api/.env not found"
  echo "  💡 Creating from template..."
  cp ENV_TEMPLATE.example apps/api/.env
  echo "  ⚠️  Please edit apps/api/.env with your database credentials"
  exit 1
fi

DB_URL=$(grep "^DATABASE_URL=" apps/api/.env | cut -d= -f2-)
if [[ "$DB_URL" == *"localhost"* ]]; then
  echo "  ⚠️  Using local database: $DB_URL"
  echo ""
  echo "  Database options:"
  echo "    1. Start local Docker PostgreSQL:"
  echo "       docker compose -f docker-compose.db.yml up -d"
  echo ""
  echo "    2. Use Neon.tech cloud database (recommended):"
  echo "       bash ./scripts/use-cloud-db.sh"
  echo ""
  if command -v docker &> /dev/null && docker info &> /dev/null; then
    read -p "  Start local Docker database now? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker compose -f docker-compose.db.yml up -d
      echo "  ⏳ Waiting for database to be ready..."
      sleep 5
    else
      echo "  ⚠️  Database not started. Run one of the options above."
      exit 1
    fi
  else
    echo "  ⚠️  Docker not available. Consider using cloud database."
    exit 1
  fi
else
  echo "  ✓ Using cloud database"
fi

# Check 3: Test database connection
echo ""
echo "✓ Testing database connection..."
if ./pnpm --filter apps/api prisma db execute --stdin <<< "SELECT 1;" &> /dev/null; then
  echo "  ✓ Database connection successful"
else
  echo "  ❌ Cannot connect to database"
  echo "  💡 Check your DATABASE_URL in apps/api/.env"
  exit 1
fi

# Check 4: Node modules
echo ""
echo "✓ Checking dependencies..."
if [ ! -d "apps/api/node_modules" ]; then
  echo "  ⚠️  Dependencies not installed. Run: npm install"
  exit 1
fi
echo "  ✓ Dependencies installed"

# Check 5: Prisma client
echo ""
echo "✓ Checking Prisma client..."
if [ ! -d "apps/api/node_modules/.prisma" ]; then
  echo "  ⚠️  Prisma client not generated. Generating now..."
  ./pnpm --filter apps/api prisma generate
fi
echo "  ✓ Prisma client ready"

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Validate schema:  bash ./scripts/run-and-capture.sh \"pnpm --filter apps/api prisma validate\""
echo "  2. Check migrations: bash ./scripts/run-and-capture.sh \"pnpm --filter apps/api prisma migrate status\""
echo "  3. Run migrations:   bash ./scripts/run-and-capture.sh \"pnpm --filter apps/api prisma migrate dev --name <name>\""
echo "  4. Seed database:    bash ./scripts/run-and-capture.sh \"pnpm --filter apps/api prisma db seed\""

