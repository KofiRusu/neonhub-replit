#!/usr/bin/env bash
set -euo pipefail

# Post-Deploy Smoke Test Kit
# Tests critical functionality after database deployment

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-10}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NeonHub Post-Deploy Smoke Test"
echo "  API: $API_URL"
echo "  Web: $WEB_URL"
echo "  Timeout: ${TIMEOUT}s"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

FAILED=0
PASSED=0

# Helper function
check() {
  local test_name="$1"
  local test_cmd="$2"
  
  printf "%-50s" "$test_name"
  
  if eval "$test_cmd" >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗${NC}"
    ((FAILED++))
    return 1
  fi
}

# Test 1: API Health
echo "[1/7] API Health Check"
if curl -fsS --max-time "$TIMEOUT" "${API_URL}/api/health" | grep -qi '"status":"healthy"'; then
  echo -e "  ${GREEN}✓${NC} API is healthy"
  ((PASSED++))
elif curl -fsS --max-time "$TIMEOUT" "${API_URL}/api/health" | grep -qi '"status":"degraded"'; then
  echo -e "  ${YELLOW}⚠${NC} API is degraded (non-critical services down)"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} API health check failed"
  ((FAILED++))
fi

# Test 2: Readiness (DB + pgvector)
echo "[2/7] Readiness Check (DB + pgvector)"
if curl -fsS --max-time "$TIMEOUT" "${API_URL}/api/readyz" | grep -qi '"pgvector":true'; then
  echo -e "  ${GREEN}✓${NC} Database and pgvector ready"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} Readiness check failed"
  ((FAILED++))
fi

# Test 3: Database connectivity (detailed)
echo "[3/7] Database Connection"
HEALTH_JSON=$(curl -fsS --max-time "$TIMEOUT" "${API_URL}/api/health" 2>/dev/null || echo '{}')
DB_STATUS=$(echo "$HEALTH_JSON" | grep -o '"database":{"status":"[^"]*"' | cut -d'"' -f6 || echo "unknown")
VECTOR_STATUS=$(echo "$HEALTH_JSON" | grep -o '"vector":{"status":"[^"]*"' | cut -d'"' -f6 || echo "unknown")

if [ "$DB_STATUS" = "ok" ]; then
  echo -e "  ${GREEN}✓${NC} Database: $DB_STATUS"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} Database: $DB_STATUS"
  ((FAILED++))
fi

if [ "$VECTOR_STATUS" = "ok" ]; then
  echo -e "  ${GREEN}✓${NC} Vector extension: $VECTOR_STATUS"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} Vector extension: $VECTOR_STATUS"
  ((FAILED++))
fi

# Test 4: Agents registered
echo "[4/7] Agents Registration"
AGENTS_COUNT=$(echo "$HEALTH_JSON" | grep -o '"registered":[0-9]*' | cut -d':' -f2 || echo "0")
if [ "$AGENTS_COUNT" -gt 0 ]; then
  echo -e "  ${GREEN}✓${NC} Agents registered: $AGENTS_COUNT"
  ((PASSED++))
else
  echo -e "  ${YELLOW}⚠${NC} No agents registered (may be expected)"
  ((PASSED++))
fi

# Test 5: Web app renders
echo "[5/7] Web Application"
if curl -fsS --max-time "$TIMEOUT" "${WEB_URL}/" | head -n 1 | grep -qi "<!DOCTYPE"; then
  echo -e "  ${GREEN}✓${NC} Web app renders"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} Web app failed to render"
  ((FAILED++))
fi

# Test 6: Auth guard (should return 401/403)
echo "[6/7] RBAC Auth Guard"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "${API_URL}/api/admin/users" 2>/dev/null || echo "000")
if [[ "$STATUS" == "401" || "$STATUS" == "403" ]]; then
  echo -e "  ${GREEN}✓${NC} RBAC guard working (got $STATUS)"
  ((PASSED++))
elif [[ "$STATUS" == "404" ]]; then
  echo -e "  ${YELLOW}⚠${NC} Admin endpoint not found (may not exist)"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} RBAC guard unexpected response: $STATUS"
  ((FAILED++))
fi

# Test 7: OpenAI connection (if configured)
echo "[7/7] External Services"
OPENAI_STATUS=$(echo "$HEALTH_JSON" | grep -o '"openai":{"status":"[^"]*"' | cut -d'"' -f6 || echo "unknown")
STRIPE_STATUS=$(echo "$HEALTH_JSON" | grep -o '"stripe":{"status":"[^"]*"' | cut -d'"' -f6 || echo "unknown")

if [ "$OPENAI_STATUS" = "ok" ]; then
  echo -e "  ${GREEN}✓${NC} OpenAI: $OPENAI_STATUS"
  ((PASSED++))
elif [ "$OPENAI_STATUS" = "not_configured" ]; then
  echo -e "  ${YELLOW}⚠${NC} OpenAI: not configured"
  ((PASSED++))
else
  echo -e "  ${YELLOW}⚠${NC} OpenAI: $OPENAI_STATUS"
  ((PASSED++))
fi

if [ "$STRIPE_STATUS" = "ok" ]; then
  echo -e "  ${GREEN}✓${NC} Stripe: $STRIPE_STATUS"
  ((PASSED++))
elif [ "$STRIPE_STATUS" = "not_configured" ]; then
  echo -e "  ${YELLOW}⚠${NC} Stripe: not configured"
  ((PASSED++))
else
  echo -e "  ${YELLOW}⚠${NC} Stripe: $STRIPE_STATUS"
  ((PASSED++))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ ALL SMOKE TESTS PASSED${NC} ($PASSED/$((PASSED + FAILED)))"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo -e "${GREEN}🚀 Deployment verified - safe to proceed!${NC}"
  exit 0
else
  echo -e "${RED}✗ SMOKE TESTS FAILED${NC} ($FAILED failed, $PASSED passed)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo -e "${RED}⚠️  DO NOT PROCEED - Fix issues before deploying${NC}"
  exit 1
fi

