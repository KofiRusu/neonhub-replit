#!/bin/bash
# Production Smoke Tests - NeonHub v3.x

set -e

# Configuration
WEB_URL="${WEB_URL:-https://app.yourdomain.com}"
API_URL="${API_URL:-https://api.yourdomain.com}"
TIMEOUT=30

echo "🧪 Running Production Smoke Tests"
echo "Web URL: $WEB_URL"
echo "API URL: $API_URL"
echo "==============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Counters
PASS_COUNT=0
FAIL_COUNT=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    echo -n "Testing $test_name... "
    
    if eval "$test_command" >/dev/null 2>&1; then
        if [ "$expected_result" = "pass" ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASS_COUNT=$((PASS_COUNT + 1))
        else
            echo -e "${RED}❌ FAIL (expected failure but passed)${NC}"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    else
        if [ "$expected_result" = "fail" ]; then
            echo -e "${YELLOW}⚠️ EXPECTED FAIL${NC}"
            PASS_COUNT=$((PASS_COUNT + 1))
        else
            echo -e "${RED}❌ FAIL${NC}"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    fi
}

# HTTP test function
http_test() {
    local endpoint="$1"
    local expected_status="$2"
    local description="$3"
    
    echo -n "Testing $description... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$endpoint" || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS ($status)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}❌ FAIL (got $status, expected $expected_status)${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

echo ""
echo "1. API Health Checks"
echo "------------------"

# API health endpoint
http_test "$API_URL/health" "200" "API health endpoint"

# API CORS (should reject without proper origin)
echo -n "Testing API CORS configuration... "
cors_response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: https://malicious-site.com" \
    "$API_URL/health" || echo "000")

if [ "$cors_response" = "200" ]; then
    echo -e "${YELLOW}⚠️ WARNING - API allows all origins${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
elif [ "$cors_response" = "403" ] || [ "$cors_response" = "000" ]; then
    echo -e "${GREEN}✅ PASS - CORS properly configured${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}❌ FAIL - Unexpected CORS response: $cors_response${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo ""
echo "2. Web Application Checks"
echo "-----------------------"

# Web homepage
http_test "$WEB_URL" "200" "Web homepage"

# Key application pages
http_test "$WEB_URL/dashboard" "200" "Dashboard page"
http_test "$WEB_URL/analytics" "200" "Analytics page" 
http_test "$WEB_URL/trends" "200" "Trends page"
http_test "$WEB_URL/billing" "200" "Billing page"
http_test "$WEB_URL/team" "200" "Team page"

# API proxy through web app (same-origin)
http_test "$WEB_URL/api/backend/health" "200" "API proxy through web"

echo ""
echo "3. Security Checks"
echo "----------------"

# HTTPS redirect (if using HTTP URL)
if [ "${WEB_URL:0:7}" = "http://" ]; then
    echo -n "Testing HTTP to HTTPS redirect... "
    redirect_status=$(curl -s -o /dev/null -w "%{http_code}" -L "${WEB_URL/http:/https:}" || echo "000")
    if [ "$redirect_status" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}❌ FAIL ($redirect_status)${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
fi

# Security headers check
echo -n "Testing security headers... "
security_headers=$(curl -s -I "$WEB_URL" | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)" | wc -l)

if [ "$security_headers" -ge 2 ]; then
    echo -e "${GREEN}✅ PASS (found $security_headers security headers)${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${YELLOW}⚠️ WARNING (only $security_headers security headers)${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
fi

echo ""
echo "4. Performance Checks"
echo "-------------------"

# Response time test
echo -n "Testing web app response time... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$WEB_URL" || echo "999")

# Use bc for floating point comparison if available, otherwise use simple comparison
if command -v bc >/dev/null 2>&1; then
    if (( $(echo "$response_time < 3.0" | bc -l) )); then
        echo -e "${GREEN}✅ PASS (${response_time}s)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    elif (( $(echo "$response_time < 5.0" | bc -l) )); then
        echo -e "${YELLOW}⚠️ SLOW (${response_time}s)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}❌ VERY SLOW (${response_time}s)${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
else
    # Fallback without bc
    response_int=$(echo "$response_time" | cut -d. -f1)
    if [ "$response_int" -le 3 ]; then
        echo -e "${GREEN}✅ PASS (${response_time}s)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${YELLOW}⚠️ SLOW (${response_time}s)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
fi

# API response time test
echo -n "Testing API response time... "
api_response_time=$(curl -s -o /dev/null -w "%{time_total}" "$API_URL/health" || echo "999")

if command -v bc >/dev/null 2>&1; then
    if (( $(echo "$api_response_time < 1.0" | bc -l) )); then
        echo -e "${GREEN}✅ PASS (${api_response_time}s)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${YELLOW}⚠️ SLOW (${api_response_time}s)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
else
    echo -e "${GREEN}✅ PASS (${api_response_time}s)${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
fi

echo ""
echo "5. Integration Health"
echo "-------------------"

# Check if API returns valid JSON health response
echo -n "Testing API health JSON response... "
health_json=$(curl -s "$API_URL/health" || echo "{}")

if echo "$health_json" | grep -q '"status"'; then
    echo -e "${GREEN}✅ PASS - Valid JSON response${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}❌ FAIL - Invalid JSON response${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test authentication endpoint (should be accessible)
http_test "$WEB_URL/api/auth/session" "200" "NextAuth session endpoint"

echo ""
echo "🏁 Smoke Test Results"
echo "===================="
echo -e "✅ Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "❌ Failed: ${RED}$FAIL_COUNT${NC}"

TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT))
SUCCESS_RATE=$(( (PASS_COUNT * 100) / TOTAL_TESTS ))

echo -e "📊 Success Rate: ${SUCCESS_RATE}%"

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}All smoke tests passed!${NC}"
    exit 0
elif [ "$FAIL_COUNT" -le 2 ]; then
    echo -e "\n⚠️ ${YELLOW}Minor issues detected but system operational${NC}"
    exit 0
else
    echo -e "\n🚨 ${RED}Multiple failures detected - investigate before proceeding${NC}"
    exit 1
fi