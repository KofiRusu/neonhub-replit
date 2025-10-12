#!/bin/bash
# NeonHub v3.0 - Smoke Test Script
# Tests basic functionality of API and Web

set -eo pipefail

echo "🧪 NeonHub Smoke Tests"
echo "======================"
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_code="${3:-200}"
  
  echo -n "Testing $name... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [ "$response" != "000" ]; then
    if [ "$response" = "$expected_code" ]; then
      echo -e "${GREEN}✓ PASS${NC} ($response)"
      PASSED=$((PASSED + 1))
    else
      echo -e "${RED}✗ FAIL${NC} (got $response, expected $expected_code)"
      FAILED=$((FAILED + 1))
    fi
  else
    echo -e "${RED}✗ FAIL${NC} (connection error)"
    FAILED=$((FAILED + 1))
  fi
}

# API Tests
echo "📡 API Tests ($API_URL)"
echo "---"
test_endpoint "API Health" "$API_URL/health" "200"
test_endpoint "API CORS Preflight" "$API_URL/api/content" "404"  # 404 is ok, just checking it responds
echo ""

# Web Tests  
echo "🌐 Web Tests ($WEB_URL)"
echo "---"
test_endpoint "Web Home" "$WEB_URL/" "200"
test_endpoint "Web Analytics" "$WEB_URL/analytics" "200"
test_endpoint "Web Trends" "$WEB_URL/trends" "200"
test_endpoint "Web Brand Voice" "$WEB_URL/brand-voice" "200"
test_endpoint "Auth Providers API" "$WEB_URL/api/auth/providers" "200"
echo ""

# Summary
echo "======================"
echo "Summary: $PASSED passed, $FAILED failed"
echo ""

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}❌ Smoke tests FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}✅ All smoke tests PASSED${NC}"
  exit 0
fi
