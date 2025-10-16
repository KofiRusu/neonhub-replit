#!/bin/bash
# API Deployment Verification Script

set -e

# Configuration
API_URL="${1:-https://api.yourdomain.com}"
TIMEOUT=30
MAX_RETRIES=5

echo "🔍 Verifying API deployment at: $API_URL"
echo "----------------------------------------"

# Function to check endpoint with retries
check_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    for i in $(seq 1 $MAX_RETRIES); do
        status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$API_URL$endpoint" || echo "000")
        
        if [ "$status" = "$expected_status" ]; then
            echo "✅ PASS ($status)"
            return 0
        fi
        
        if [ $i -lt $MAX_RETRIES ]; then
            echo -n "⏳ Retry $i/$MAX_RETRIES... "
            sleep 2
        fi
    done
    
    echo "❌ FAIL ($status, expected $expected_status)"
    return 1
}

# Function to check JSON response
check_json_response() {
    local endpoint=$1
    local description=$2
    
    echo -n "Testing $description... "
    
    response=$(curl -s --connect-timeout $TIMEOUT "$API_URL$endpoint" || echo "{\"error\":\"no_response\"}")
    status=$(echo "$response" | jq -r '.status // "unknown"' 2>/dev/null || echo "invalid_json")
    
    if [ "$status" = "ok" ]; then
        echo "✅ PASS"
        echo "   Response: $response"
        return 0
    else
        echo "❌ FAIL"
        echo "   Response: $response"
        return 1
    fi
}

# Function to test CORS
check_cors() {
    echo -n "Testing CORS headers... "
    
    cors_header=$(curl -s -H "Origin: https://app.yourdomain.com" -I "$API_URL/health" | grep -i "access-control-allow-origin" || echo "")
    
    if [ -n "$cors_header" ]; then
        echo "✅ PASS"
        echo "   $cors_header"
    else
        echo "⚠️  WARNING - No CORS headers detected"
    fi
}

# Test basic connectivity
echo "1. Basic Connectivity Tests"
echo "-------------------------"
check_endpoint "/health" "200" "Health endpoint"

# Test health details
echo ""
echo "2. Health Status Details"
echo "----------------------"
check_json_response "/health" "Health status JSON"

# Test CORS configuration
echo ""
echo "3. Security Configuration"  
echo "------------------------"
check_cors

# Test rate limiting (optional)
echo ""
echo "4. Rate Limiting Test"
echo "-------------------"
echo -n "Testing rate limits... "

# Make 10 rapid requests to test rate limiting
rate_limit_triggered=false
for i in $(seq 1 10); do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" || echo "000")
    if [ "$status" = "429" ]; then
        rate_limit_triggered=true
        break
    fi
    sleep 0.1
done

if [ "$rate_limit_triggered" = true ]; then
    echo "✅ PASS - Rate limiting is active"
else
    echo "⚠️  INFO - Rate limiting not triggered (may be configured for higher limits)"
fi

# Test SSL certificate
echo ""
echo "5. SSL Certificate Check"
echo "----------------------"
echo -n "Testing SSL certificate... "

if echo | openssl s_client -servername "${API_URL#https://}" -connect "${API_URL#https://}:443" 2>/dev/null | openssl x509 -noout -dates > /dev/null 2>&1; then
    echo "✅ PASS - Valid SSL certificate"
    
    # Check certificate expiry
    cert_info=$(echo | openssl s_client -servername "${API_URL#https://}" -connect "${API_URL#https://}:443" 2>/dev/null | openssl x509 -noout -dates)
    echo "   $cert_info"
else
    echo "❌ FAIL - SSL certificate issue"
fi

# Performance test
echo ""
echo "6. Performance Test"
echo "-----------------"
echo -n "Testing response time... "

response_time=$(curl -s -o /dev/null -w "%{time_total}" "$API_URL/health")

if (( $(echo "$response_time < 2.0" | bc -l) )); then
    echo "✅ PASS (${response_time}s)"
else
    echo "⚠️  SLOW (${response_time}s - should be < 2s)"
fi

# Summary
echo ""
echo "🏁 Deployment Verification Complete"
echo "=================================="

# Check if jq is available for JSON parsing
if ! command -v jq &> /dev/null; then
    echo "💡 Tip: Install 'jq' for better JSON response parsing"
fi

# Check if bc is available for math
if ! command -v bc &> /dev/null; then
    echo "💡 Tip: Install 'bc' for performance calculations"  
fi

echo ""
echo "🔗 Health Endpoint: $API_URL/health"
echo "📊 Monitor at: Railway/Render Dashboard"
echo "📝 Logs: Check deployment platform logs for any errors"

echo ""
echo "Next steps:"
echo "1. Verify all environment variables are set correctly"
echo "2. Test database connectivity with sample requests"
echo "3. Configure monitoring and alerting"
echo "4. Proceed to Phase E (Web Deployment)"



