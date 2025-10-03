#!/bin/bash

# NeonHub - Automated Smoke Test
# Quick sanity checks before deployment

set -e

echo "🧪 NeonHub - Automated Smoke Test"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_code="${3:-200}"
  
  echo -n "Testing $name... "
  
  response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
  
  if [ "$response_code" = "$expected_code" ]; then
    echo -e "${GREEN}✅ PASS${NC} ($response_code)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}❌ FAIL${NC} (got $response_code, expected $expected_code)"
    FAILED=$((FAILED + 1))
  fi
}

# Backend tests
echo -e "${BLUE}Backend API Tests:${NC}"
test_endpoint "Health Check" "http://127.0.0.1:3001/health" 200
test_endpoint "Metrics Summary" "http://127.0.0.1:3001/metrics/summary?range=30d" 200
test_endpoint "Team Members" "http://127.0.0.1:3001/team/members" 200
test_endpoint "Team Invitations" "http://127.0.0.1:3001/team/invitations" 200
test_endpoint "Billing Plan" "http://127.0.0.1:3001/billing/plan" 200
test_endpoint "Billing Usage" "http://127.0.0.1:3001/billing/usage" 200
test_endpoint "Billing Invoices" "http://127.0.0.1:3001/billing/invoices" 200

echo ""
echo -e "${BLUE}Frontend Tests:${NC}"
test_endpoint "Homepage" "http://127.0.0.1:3000" 200
test_endpoint "Dashboard" "http://127.0.0.1:3000/dashboard" 200
test_endpoint "Trends Page" "http://127.0.0.1:3000/trends" 200
test_endpoint "Billing Page" "http://127.0.0.1:3000/billing" 200
test_endpoint "Team Page" "http://127.0.0.1:3000/team" 200
test_endpoint "Analytics" "http://127.0.0.1:3000/analytics" 200
test_endpoint "Content" "http://127.0.0.1:3000/content" 200

echo ""
echo -e "${BLUE}SEO Assets:${NC}"
test_endpoint "robots.txt" "http://127.0.0.1:3000/robots.txt" 200
test_endpoint "sitemap.xml" "http://127.0.0.1:3000/sitemap.xml" 200
test_endpoint "Web Manifest" "http://127.0.0.1:3000/site.webmanifest" 200

echo ""
echo "=================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "=================================="

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All smoke tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Check services.${NC}"
  exit 1
fi

