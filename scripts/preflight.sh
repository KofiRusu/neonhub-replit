#!/usr/bin/env bash

# NeonHub Preflight Check
# Run this locally before deploying to production

set -euo pipefail

echo "🔎 NeonHub Production Preflight Check"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

check() {
  local name="$1"
  shift
  echo -n "Checking $name... "
  
  if "$@" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${RED}❌ FAIL${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
}

# Node version
echo -e "${BLUE}Environment:${NC}"
check "Node.js version" node --version
check "npm version" npm --version

# Backend build
echo ""
echo -e "${BLUE}Backend Build:${NC}"
cd backend || exit 1
echo "Building backend..."
if npm run build; then
  echo -e "${GREEN}✅ Backend build SUCCESS${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "${RED}❌ Backend build FAILED${NC}"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Frontend build (active version)
echo ""
echo -e "${BLUE}Frontend Build (Neon-v2.4.0/ui):${NC}"
cd ../Neon-v2.4.0/ui || exit 1
echo "Building frontend..."
if npm run build; then
  echo -e "${GREEN}✅ Frontend build SUCCESS${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "${RED}❌ Frontend build FAILED${NC}"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check key files
echo ""
echo -e "${BLUE}Configuration Files:${NC}"
cd ../..
check "vercel.json exists" test -f Neon-v2.5.0/vercel.json
check "docker-compose.yml exists" test -f Neon-v2.5.0/docker-compose.yml
check ".nvmrc exists" test -f .nvmrc
check "CI workflow exists" test -f .github/workflows/ci.yml

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
if [ $CHECKS_FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
fi
echo "======================================"

if [ $CHECKS_FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Preflight complete! Builds are green.${NC}"
  echo ""
  echo -e "${BLUE}👉 Next steps:${NC}"
  echo "   1. Review: docs/PRODUCTION_DEPLOYMENT.md"
  echo "   2. Generate secrets: openssl rand -base64 32"
  echo "   3. Follow Deploy Escort checklist below"
  echo ""
  echo -e "${YELLOW}📘 Deploy Escort: docs/DEPLOY_ESCORT.md${NC}"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}❌ Preflight failed! Fix errors before deploying.${NC}"
  exit 1
fi

