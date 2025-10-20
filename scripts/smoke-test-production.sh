#!/bin/bash
set -euo pipefail

# NeonHub v3.0 Production Smoke Test Script
# Tests critical endpoints after deployment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${1:-}"
WEB_URL="${2:-}"
TIMEOUT=10

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Usage
if [ -z "$API_URL" ] || [ -z "$WEB_URL" ]; then
  echo "Usage: $0 <API_URL> <WEB_URL>"
  echo "Example: $0 https://api.neonhubecosystem.com https://neonhubecosystem.com"
  exit 1
fi

echo "=== NeonHub v3.0 Production Smoke Tests ==="
echo "API URL: $API_URL"
echo "Web URL: $WEB_URL"
echo ""

# Helper function to test HTTP endpoint
test_endpoint() {
  local name=$1
  local url=$2
  local expected_code=${3:-200}
  
  TESTS_RUN=$((TESTS_RUN + 1))
  echo -n "Testing $name... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" || echo "000")
  
  if [ "$response" = "$expected_code" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_code, Got: $response)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

# Helper function to test JSON endpoint
test_json_endpoint() {
  local name=$1
  local url=$2
  local expected_field=$3
  
  TESTS_RUN=$((TESTS_RUN + 1))
  echo -n "Testing $name... "
  
  response=$(curl -s --max-time $TIMEOUT "$url" || echo '{}')
  
  if echo "$response" | grep -q "$expected_field"; then
    echo -e "${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Field '$expected_field' not found)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

# Helper function to test SSL certificate
test_ssl() {
  local name=$1
  local url=$2
  
  TESTS_RUN=$((TESTS_RUN + 1))
  echo -n "Testing SSL certificate for $name... "
  
  domain=$(echo "$url" | sed 's|https://||' | sed 's|/.*||')
  
  if echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | grep -q "Verify return code: 0"; then
    echo -e "${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

echo "--- API Tests ---"

# Test API health endpoint
test_json_endpoint "API Health" "$API_URL/api/health" "status"

# Test API auth providers
test_json_endpoint "API Auth Providers" "$API_URL/api/auth/providers" "providers"

# Test API CORS (should return 200 or 204 for OPTIONS)
echo -n "Testing API CORS... "
TESTS_RUN=$((TESTS_RUN + 1))
cors_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT \
  -X OPTIONS \
  -H "Origin: $WEB_URL" \
  -H "Access-Control-Request-Method: GET" \
  "$API_URL/api/health" || echo "000")

if [ "$cors_response" = "200" ] || [ "$cors_response" = "204" ]; then
  echo -e "${GREEN}✓ PASS${NC} (HTTP $cors_response)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗ FAIL${NC} (HTTP $cors_response)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "--- Web Tests ---"

# Test web homepage
test_endpoint "Web Homepage" "$WEB_URL" 200

# Test web assets (favicon)
test_endpoint "Web Favicon" "$WEB_URL/favicon.ico" 200

# Test web manifest
test_endpoint "Web Manifest" "$WEB_URL/manifest.json" 200

echo ""
echo "--- SSL Tests ---"

# Test SSL certificates
test_ssl "API" "$API_URL"
test_ssl "Web" "$WEB_URL"

echo ""
echo "--- Security Headers Tests ---"

# Test security headers on web
echo -n "Testing Security Headers... "
TESTS_RUN=$((TESTS_RUN + 1))

headers=$(curl -s -I --max-time $TIMEOUT "$WEB_URL" || echo "")

security_headers=("X-Frame-Options" "X-Content-Type-Options" "X-XSS-Protection")
headers_found=0

for header in "${security_headers[@]}"; do
  if echo "$headers" | grep -qi "$header"; then
    headers_found=$((headers_found + 1))
  fi
done

if [ $headers_found -eq ${#security_headers[@]} ]; then
  echo -e "${GREEN}✓ PASS${NC} (All security headers present)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${YELLOW}⚠ PARTIAL${NC} ($headers_found/${#security_headers[@]} headers found)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
fi

echo ""
echo "--- DNS & Connectivity Tests ---"

# Test DNS resolution
echo -n "Testing DNS resolution for API... "
TESTS_RUN=$((TESTS_RUN + 1))
api_domain=$(echo "$API_URL" | sed 's|https://||' | sed 's|/.*||')

if nslookup "$api_domain" > /dev/null 2>&1 || host "$api_domain" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASS${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗ FAIL${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo -n "Testing DNS resolution for Web... "
TESTS_RUN=$((TESTS_RUN + 1))
web_domain=$(echo "$WEB_URL" | sed 's|https://||' | sed 's|/.*||')

if nslookup "$web_domain" > /dev/null 2>&1 || host "$web_domain" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASS${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗ FAIL${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "--- Performance Tests ---"

# Test API response time
echo -n "Testing API response time... "
TESTS_RUN=$((TESTS_RUN + 1))
response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$API_URL/api/health" || echo "0")

if (( $(echo "$response_time < 2.0" | bc -l) )); then
  echo -e "${GREEN}✓ PASS${NC} (${response_time}s)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
elif (( $(echo "$response_time < 5.0" | bc -l) )); then
  echo -e "${YELLOW}⚠ SLOW${NC} (${response_time}s)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗ FAIL${NC} (${response_time}s - Too slow)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test Web response time
echo -n "Testing Web response time... "
TESTS_RUN=$((TESTS_RUN + 1))
response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$WEB_URL" || echo "0")

if (( $(echo "$response_time < 2.0" | bc -l) )); then
  echo -e "${GREEN}✓ PASS${NC} (${response_time}s)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
elif (( $(echo "$response_time < 5.0" | bc -l) )); then
  echo -e "${YELLOW}⚠ SLOW${NC} (${response_time}s)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗ FAIL${NC} (${response_time}s - Too slow)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "=== Test Summary ==="
echo "Total Tests: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ All smoke tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Monitor application logs for errors"
  echo "2. Run full integration test suite"
  echo "3. Verify monitoring alerts are configured"
  echo "4. Test user-facing features manually"
  exit 0
else
  echo ""
  echo -e "${RED}✗ Some tests failed. Please investigate before proceeding.${NC}"
  exit 1
fi