#!/bin/bash
# ==========================================================
# NeonHub API Smoke Test Suite
# Tests authenticated endpoints with session cookie
# ==========================================================

set -euo pipefail

echo "🔍 NeonHub API Smoke Tests"
echo "====================================="
echo ""

# Configuration
BASE="${API_BASE_URL:-http://localhost:3001}"
SESSION_COOKIE="${SESSION_COOKIE:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if session cookie is provided
if [ -z "$SESSION_COOKIE" ]; then
  echo -e "${YELLOW}⚠️  Warning: No SESSION_COOKIE provided${NC}"
  echo "   Set via: export SESSION_COOKIE='your_session_cookie'"
  echo "   Attempting unauthenticated requests..."
  HDR=""
else
  HDR="Cookie: __session=$SESSION_COOKIE"
  echo -e "${GREEN}✅ Using session cookie${NC}"
fi

echo ""

# Test 1: Personas endpoint
echo "🧑 Test 1: Fetching personas..."
RESPONSE=$(curl -s -H "$HDR" "$BASE/api/personas")
if echo "$RESPONSE" | jq -e '.[0] | {id,name,slug,keywords:(.keywords|length)}' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Personas endpoint OK${NC}"
  echo "$RESPONSE" | jq '.[0] | {id,name,slug,keywords:(.keywords|length)}'
else
  echo -e "${RED}❌ Personas endpoint failed${NC}"
  echo "$RESPONSE"
fi
echo ""

# Test 2: Keywords endpoint
echo "🔑 Test 2: Fetching keywords..."
RESPONSE=$(curl -s -H "$HDR" "$BASE/api/keywords")
if echo "$RESPONSE" | jq -e '.[0] | {id,term,personaId}' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Keywords endpoint OK${NC}"
  echo "$RESPONSE" | jq '.[0] | {id,term,personaId}'
else
  echo -e "${RED}❌ Keywords endpoint failed${NC}"
  echo "$RESPONSE"
fi
echo ""

# Test 3: Editorial calendar endpoint
echo "📅 Test 3: Fetching editorial calendar..."
RESPONSE=$(curl -s -H "$HDR" "$BASE/api/editorial-calendar")
if echo "$RESPONSE" | jq -e '.[0] | {id,title,slug,personaId,scheduledAt}' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Editorial calendar endpoint OK${NC}"
  echo "$RESPONSE" | jq '.[0] | {id,title,slug,personaId,scheduledAt}'
else
  echo -e "${RED}❌ Editorial calendar endpoint failed${NC}"
  echo "$RESPONSE"
fi
echo ""

# Test 4: JSON-LD presence check
echo "📊 Test 4: Checking JSON-LD on content page..."
WEB_BASE="${WEB_BASE_URL:-http://localhost:3000}"
if curl -s "$WEB_BASE/content" | grep -q 'application/ld+json'; then
  echo -e "${GREEN}✅ JSON-LD present${NC}"
else
  echo -e "${RED}❌ JSON-LD missing${NC}"
fi
echo ""

# Test 5: Sitemap check
echo "🗺️  Test 5: Checking sitemap..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_BASE/sitemap.xml")
if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Sitemap accessible (HTTP $STATUS)${NC}"
else
  echo -e "${RED}❌ Sitemap failed (HTTP $STATUS)${NC}"
fi
echo ""

echo "====================================="
echo -e "${GREEN}🎉 Smoke tests complete!${NC}"
echo ""
echo "💡 Tip: To run authenticated tests, set SESSION_COOKIE:"
echo "   export SESSION_COOKIE='your_cookie_here'"
echo "   ./scripts/smoke-api.sh"
