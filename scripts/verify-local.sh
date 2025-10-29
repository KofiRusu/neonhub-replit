#!/bin/bash
# ==========================================================
# NeonHub Local Verification Suite
# Validates API, Web, Database, and TypeScript integrity
# ==========================================================

set -euo pipefail

echo "🚀 NeonHub Local Verification Suite"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Node & pnpm sanity check
echo "📦 Checking Node.js and npm versions..."
node -v
npm -v
echo -e "${GREEN}✅ Node environment OK${NC}\n"

# API layer validation
echo "🔧 Validating API layer..."
echo "  → Prisma schema validation..."
npm run prisma:validate --workspace=apps/api

echo "  → Migration status check..."
npm run prisma migrate status --workspace=apps/api || echo -e "${YELLOW}⚠️  Migrations may need sync${NC}"

echo "  → API linting..."
npm run lint --workspace=apps/api

echo "  → API type checking..."
npm run typecheck --workspace=apps/api

echo "  → API test coverage..."
npm run test:coverage --workspace=apps/api

echo -e "${GREEN}✅ API validation complete${NC}\n"

# Database seed (idempotent)
echo "🌱 Running database seed (idempotent)..."
npm run prisma db seed --workspace=apps/api
echo -e "${GREEN}✅ Database seeded${NC}\n"

# Web layer validation
echo "🌐 Validating Web layer..."
echo "  → Web linting..."
npm run lint --workspace=apps/web

echo "  → Web type checking..."
npm run typecheck --workspace=apps/web

echo -e "${GREEN}✅ Web validation complete${NC}\n"

# Boot services
echo "🔥 Starting development servers..."
echo "  → API server (background)..."
npm run dev --workspace=apps/api &
API_PID=$!

echo "  → Waiting 8 seconds for API to initialize..."
sleep 8

echo "  → Web server (background)..."
npm run dev --workspace=apps/web &
WEB_PID=$!

echo "  → Waiting 8 seconds for Web to initialize..."
sleep 8

echo -e "${GREEN}✅ Services running:${NC}"
echo "   API PID: $API_PID"
echo "   Web PID: $WEB_PID"
echo ""
echo "📋 Next steps:"
echo "   1. Run smoke tests: ./scripts/smoke-api.sh"
echo "   2. Visit http://localhost:3000 in your browser"
echo "   3. Stop services with: kill $API_PID $WEB_PID"
echo ""
echo -e "${GREEN}🎉 Local verification complete!${NC}"

