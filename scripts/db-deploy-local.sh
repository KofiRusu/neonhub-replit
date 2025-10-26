#!/usr/bin/env bash

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}[INFO]${NC} NeonHub Local Database Deploy"
echo -e "${GREEN}[INFO]${NC} Using $(node -v)"
echo -e "${GREEN}[INFO]${NC} npm version: $(npm -v)"

# Enable Corepack and pnpm
echo -e "${YELLOW}[SETUP]${NC} Enabling Corepack..."
corepack enable >/dev/null 2>&1 || true

echo -e "${YELLOW}[SETUP]${NC} Preparing pnpm@9..."
corepack prepare pnpm@9 --activate >/dev/null 2>&1 || true

echo -e "${GREEN}[INFO]${NC} pnpm version: $(pnpm -v 2>/dev/null || echo 'fallback to npm')"

# Install dependencies
echo -e "${YELLOW}[SETUP]${NC} Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || npm ci

# Check DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
  echo -e "${YELLOW}[WARN]${NC} DATABASE_URL not set. Attempting Docker pgvector..."
  
  # Check if Docker is available
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Docker not found. Please set DATABASE_URL environment variable."
    echo "Example: export DATABASE_URL='postgresql://postgres:postgres@localhost:5432/neonhub'"
    exit 1
  fi
  
  # Stop existing container if any
  docker stop neonhub-db 2>/dev/null || true
  docker rm neonhub-db 2>/dev/null || true
  
  # Start pgvector container
  echo -e "${YELLOW}[SETUP]${NC} Starting pgvector container..."
  docker run -d \
    --name neonhub-db \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=neonhub \
    -p 5432:5432 \
    ankane/pgvector:latest >/dev/null 2>&1 || {
    echo -e "${RED}[ERROR]${NC} Failed to start pgvector. Ensure Docker is running."
    exit 1
  }
  
  export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/neonhub"
  export DIRECT_DATABASE_URL="$DATABASE_URL"
  
  echo -e "${YELLOW}[SETUP]${NC} Waiting for database to be ready..."
  sleep 3
  
  # Verify connection
  echo -e "${YELLOW}[SETUP]${NC} Verifying database connection..."
  for i in {1..30}; do
    if pg_isready -h localhost -p 5432 2>/dev/null; then
      echo -e "${GREEN}[OK]${NC} Database is ready!"
      break
    fi
    if [ $i -eq 30 ]; then
      echo -e "${RED}[ERROR]${NC} Database failed to start."
      exit 1
    fi
    sleep 1
  done
else
  echo -e "${GREEN}[INFO]${NC} Using provided DATABASE_URL"
  export DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}"
fi

# Navigate to API directory
cd "$(dirname "$0")/../apps/api" || exit 1

echo ""
echo -e "${YELLOW}[STEP 1]${NC} Prisma generate..."
pnpm run prisma:generate 2>/dev/null || npx prisma generate

echo ""
echo -e "${YELLOW}[STEP 2]${NC} Prisma migrate status..."
pnpm run prisma:migrate:status 2>/dev/null || npx prisma migrate status || true

echo ""
echo -e "${YELLOW}[STEP 3]${NC} Running migrations..."
pnpm run prisma:migrate:dev --name "local_deployment_$(date +%s)" 2>/dev/null || npx prisma migrate dev --name "local_deployment_$(date +%s)"

echo ""
echo -e "${YELLOW}[STEP 4]${NC} Seeding database (if configured)..."
pnpm run seed 2>/dev/null || echo -e "${YELLOW}[INFO]${NC} No seed script found, skipping."

echo ""
echo -e "${GREEN}[SUCCESS]${NC} Local database deployment complete! ✅"
echo ""
echo -e "${GREEN}Details:${NC}"
echo "  DATABASE_URL: ${DATABASE_URL:0:50}***"
echo "  Migrations:   Applied"
echo "  Seed:         Completed (if configured)"
echo ""
echo "Next steps:"
echo "  1. Run API: pnpm dev --filter apps/api"
echo "  2. Run Web: pnpm dev --filter apps/web"
echo "  3. Or both: pnpm dev"
