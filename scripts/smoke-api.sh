#!/bin/bash

# NeonHub API - Comprehensive Smoke Test
# Tests all critical endpoints

set -e

echo "🔥 NeonHub API - Smoke Test"
echo "============================"
echo ""

API_URL="${API_URL:-http://127.0.0.1:3001}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

test_endpoint() {
  local name="$1"
  local method="${2:-GET}"
  local path="$3"
  local data="$4"
  
  echo -n "Testing $name... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$API_URL$path")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$API_URL$path")
  fi
  
  status_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -n -1)
  
  if [ "$status_code" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
    if [ -n "$body" ] && command -v jq &> /dev/null; then
      echo "$body" | jq -C '.' 2>/dev/null | head -3
    fi
  else
    echo -e "${RED}❌ FAIL${NC} (HTTP $status_code)"
    FAILED=$((FAILED + 1))
  fi
  echo ""
}

echo -e "${BLUE}Core Endpoints:${NC}"
test_endpoint "Health Check" GET "/health"
test_endpoint "Metrics Summary (30d)" GET "/metrics/summary?range=30d"
test_endpoint "Metrics Summary (24h)" GET "/metrics/summary?range=24h"

echo -e "${BLUE}Team Endpoints:${NC}"
test_endpoint "Team Members" GET "/team/members"
test_endpoint "Team Invitations" GET "/team/invitations"

echo -e "${BLUE}Billing Endpoints:${NC}"
test_endpoint "Billing Plan" GET "/billing/plan"
test_endpoint "Billing Usage" GET "/billing/usage"
test_endpoint "Billing Invoices" GET "/billing/invoices"

echo -e "${BLUE}Content Endpoint (Mock OK):${NC}"
test_endpoint "Content Generation" POST "/content/generate" '{"topic":"smoke test","targetAudience":"developers","contentType":"blog-post"}'

echo "============================"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED${NC}"
fi
echo "============================"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All API smoke tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Check services.${NC}"
  exit 1
fi

