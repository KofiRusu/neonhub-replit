#!/usr/bin/env bash
set -euo pipefail

# NeonHub Local Stack Startup
# Starts Postgres + API + Web for local testing

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  NeonHub Local Stack Startup${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 0: Verify pnpm
echo -e "${YELLOW}[0/6]${NC} Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
  echo "  Installing pnpm globally..."
  npm install -g pnpm@8 > /dev/null 2>&1
fi
if command -v pnpm &> /dev/null; then
  echo -e "  ${GREEN}✓${NC} pnpm $(pnpm -v)"
else
  echo -e "  ${RED}✗${NC} pnpm not available, using npx"
  alias pnpm="npx pnpm"
fi
echo ""

# Step 1: Start Database
echo -e "${YELLOW}[1/6]${NC} Starting Postgres (port 5433)..."
docker compose -f docker-compose.db.yml up -d postgres

echo "  Waiting for database to be ready..."
for i in {1..30}; do
  if docker compose -f docker-compose.db.yml exec -T postgres pg_isready -U neonhub -h localhost > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Database is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "  ${RED}✗${NC} Database failed to start"
    exit 1
  fi
  sleep 1
done
echo ""

# Step 2: Setup Database URL
echo -e "${YELLOW}[2/6]${NC} Configuring environment..."
export DATABASE_URL="postgresql://neonhub:neonhub@localhost:5433/neonhub"
export DIRECT_DATABASE_URL="$DATABASE_URL"
echo -e "  ${GREEN}✓${NC} DATABASE_URL set"
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}[3/6]${NC} Installing dependencies..."
pnpm install --frozen-lockfile > /dev/null 2>&1
echo -e "  ${GREEN}✓${NC} Dependencies installed"
echo ""

# Step 4: Prepare Prisma
echo -e "${YELLOW}[4/6]${NC} Preparing Prisma..."
pnpm --filter apps/api exec prisma generate > /dev/null 2>&1
echo -e "  ${GREEN}✓${NC} Prisma Client generated"

pnpm --filter apps/api exec prisma validate > /dev/null 2>&1
echo -e "  ${GREEN}✓${NC} Schema validated"

pnpm --filter apps/api exec prisma migrate deploy > /dev/null 2>&1
echo -e "  ${GREEN}✓${NC} Migrations applied"

echo "  Running seed (may take a moment)..."
pnpm --filter apps/api exec prisma db seed > /dev/null 2>&1 || echo -e "  ${YELLOW}⚠${NC} Seed skipped"
echo ""

# Step 5: Start API
echo -e "${YELLOW}[5/6]${NC} Starting API (port 3001)..."
echo "  Starting in background..."
pnpm --filter apps/api dev > /tmp/neonhub-api.log 2>&1 &
API_PID=$!
echo "  API PID: $API_PID"

# Wait for API to be ready
echo "  Waiting for API to start..."
for i in {1..30}; do
  if curl -fsS http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} API is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "  ${RED}✗${NC} API failed to start"
    echo "  Check logs: tail -f /tmp/neonhub-api.log"
    kill $API_PID 2>/dev/null || true
    exit 1
  fi
  sleep 1
done
echo ""

# Step 6: Check services
echo -e "${YELLOW}[6/6]${NC} Verifying services..."
if curl -fsS http://localhost:3001/api/health | grep -q '"status":"healthy"'; then
  echo -e "  ${GREEN}✓${NC} API health check passed"
else
  echo -e "  ${YELLOW}⚠${NC} API is degraded (some services may be down)"
fi

if curl -fsS http://localhost:3001/api/readyz | grep -q '"ok":true'; then
  echo -e "  ${GREEN}✓${NC} Readiness check passed"
else
  echo -e "  ${RED}✗${NC} Readiness check failed"
fi
echo ""

# Success
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Local stack is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Services:"
echo "  • Postgres: http://localhost:5433"
echo "  • API:      http://localhost:3001"
echo "  • Health:   http://localhost:3001/api/health"
echo "  • Readyz:   http://localhost:3001/api/readyz"
echo ""
echo "API logs: tail -f /tmp/neonhub-api.log"
echo "API PID: $API_PID (kill with: kill $API_PID)"
echo ""
echo "Next: Run smoke tests"
echo "  ./scripts/post-deploy-smoke.sh"
echo ""

