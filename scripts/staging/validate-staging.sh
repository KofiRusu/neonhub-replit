#!/bin/bash

# Staging Validation Script
# Runs full acceptance test suite

set -e

echo "🚀 Starting Staging Validation..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validation results
PASS=0
FAIL=0

check_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS++))
  else
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAIL++))
  fi
}

echo "1️⃣ Checking prerequisites..."
command -v docker >/dev/null 2>&1
check_result "Docker installed"

command -v docker compose >/dev/null 2>&1
check_result "Docker Compose installed"

command -v pnpm >/dev/null 2>&1
check_result "pnpm installed"

echo ""
echo "2️⃣ Building packages..."
pnpm stg:build >/dev/null 2>&1
check_result "Packages built"

echo ""
echo "3️⃣ Starting staging environment..."
pnpm stg:up >/dev/null 2>&1
check_result "Staging environment started"

# Wait for services to be ready
sleep 5

echo ""
echo "4️⃣ Checking OTel Collector health..."
curl -sf http://localhost:13133/ >/dev/null 2>&1
check_result "OTel Collector health check"

echo ""
echo "5️⃣ Running smoke test..."
pnpm stg:smoke
check_result "Smoke test"

echo ""
echo "6️⃣ Running load-lite test..."
LOAD_LITE_N=12 pnpm stg:loadlite
check_result "Load-lite test with SLO validation"

echo ""
echo "7️⃣ Checking telemetry data..."
docker logs neonhub-otel-collector 2>&1 | grep -q "Trace"
check_result "Traces in OTel Collector logs"

echo ""
echo "8️⃣ Verifying telemetry attributes..."
docker logs neonhub-otel-collector 2>&1 | grep -q "smoke"
check_result "Telemetry attributes present"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VALIDATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Passed${NC}: $PASS"
echo -e "${RED}Failed${NC}: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✨ All validation checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review OTel Collector logs: docker logs neonhub-otel-collector"
  echo "  2. View staging summary: pnpm stg:report"
  echo "  3. Teardown: pnpm stg:down"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️  Some validation checks failed${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check logs: docker compose logs"
  echo "  2. Review errors above"
  echo "  3. Restart: pnpm stg:down && pnpm stg:up"
  echo ""
  exit 1
fi

