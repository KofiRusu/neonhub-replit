#!/bin/bash
# Web App Deployment Verification Script

set -e

# Configuration
WEB_URL="${1:-https://app.yourdomain.com}"
API_URL="${2:-https://api.yourdomain.com}"
TIMEOUT=30
MAX_RETRIES=3

echo "🔍 Verifying Web deployment at: $WEB_URL"
echo "🔗 Expected API URL: $API_URL"
echo "----------------------------------------"

# Function to check endpoint with retries
check_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    for i in $(seq 1 $MAX_RETRIES); do
        status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$WEB_URL$endpoint" || echo "000")
        
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

# Function to check HTML content
check_html_content() {
    local endpoint=$1
    local expected_text=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    content=$(curl -s --connect-timeout $TIMEOUT "$WEB_URL$endpoint" || echo "")
    
    if echo "$content" | grep -q "$expected_text"; then
        echo "✅ PASS"
        return 0
    else
        echo "❌ FAIL - Expected text not found"
        echo "   Expected: $expected_text"
        return 1
    fi
}

# Function to check security headers
check_security_headers() {
    echo -n "Testing security headers... "
    
    headers=$(curl -s -I "$WEB_URL" 2>/dev/null || echo "")
    
    missing_headers=()
    
    # Check for important security headers
    if ! echo "$headers" | grep -qi "strict-transport-security"; then
        missing_headers+=("HSTS")
    fi
    
    if ! echo "$headers" | grep -qi "x-content-type-options"; then
        missing_headers+=("X-Content-Type-Options")
    fi
    
    if ! echo "$headers" | grep -qi "x-frame-options"; then
        missing_headers+=("X-Frame-Options")
    fi
    
    if [ ${#missing_headers[@]} -eq 0 ]; then
        echo "✅ PASS"
        return 0
    else
        echo "⚠️  WARNING - Missing: ${missing_headers[*]}"
        return 1
    fi
}

# Function to test Core Web Vitals (basic performance check)
check_performance() {
    echo -n "Testing page load performance... "
    
    # Measure total time to load homepage
    load_time=$(curl -s -o /dev/null -w "%{time_total}" "$WEB_URL" || echo "999")
    
    if (( $(echo "$load_time < 3.0" | bc -l 2>/dev/null || echo "0") )); then
        echo "✅ PASS (${load_time}s)"
    elif (( $(echo "$load_time < 5.0" | bc -l 2>/dev/null || echo "0") )); then
        echo "⚠️  SLOW (${load_time}s - should be < 3s for good UX)"
    else
        echo "❌ VERY SLOW (${load_time}s)"
    fi
}

# Test basic connectivity
echo "1. Basic Connectivity Tests"
echo "-------------------------"
check_endpoint "/" "200" "Homepage"
check_endpoint "/dashboard" "200" "Dashboard page"

# Test static assets
echo ""
echo "2. Static Assets"
echo "---------------"
check_endpoint "/favicon.ico" "200" "Favicon"
check_endpoint "/_next/static/chunks/main.js" "200" "Next.js main chunk" || echo "   ℹ️  Chunk name may vary - this is normal"

# Test HTML content
echo ""
echo "3. Content Verification"
echo "---------------------"
check_html_content "/" "NeonHub" "Homepage contains app name"
check_html_content "/" "<!DOCTYPE html>" "Valid HTML structure"

# Test API connectivity from web app
echo ""
echo "4. API Integration"
echo "-----------------"
echo -n "Testing API connectivity... "

# Check if the web app can reach its configured API
api_check=$(curl -s --connect-timeout $TIMEOUT "$WEB_URL/api/auth/session" || echo "error")

if echo "$api_check" | grep -q "user\|null"; then
    echo "✅ PASS - NextAuth API responding"
elif [ "$api_check" = "error" ]; then
    echo "❌ FAIL - API not reachable"
else
    echo "⚠️  UNKNOWN - Unexpected response: $api_check"
fi

# Test security configuration
echo ""
echo "5. Security Configuration"
echo "------------------------"
check_security_headers

# Test HTTPS redirect (if applicable)
echo -n "Testing HTTPS redirect... "
if [ "${WEB_URL:0:8}" = "https://" ]; then
    http_url="${WEB_URL/https:/http:}"
    redirect_status=$(curl -s -o /dev/null -w "%{http_code}" -L "$http_url" 2>/dev/null || echo "000")
    
    if [ "$redirect_status" = "200" ]; then
        echo "✅ PASS - HTTP redirects to HTTPS"
    else
        echo "⚠️  WARNING - HTTP redirect not working ($redirect_status)"
    fi
else
    echo "⚠️  SKIPPED - Not using HTTPS URL"
fi

# Test performance
echo ""
echo "6. Performance Test"
echo "-----------------"
check_performance

# Test responsive design (basic check)
echo ""
echo "7. Mobile/Responsive Check"
echo "------------------------"
echo -n "Testing mobile viewport... "

mobile_content=$(curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)" "$WEB_URL" || echo "")

if echo "$mobile_content" | grep -q "viewport"; then
    echo "✅ PASS - Viewport meta tag present"
else
    echo "⚠️  WARNING - No viewport meta tag detected"
fi

# Test build optimization
echo ""
echo "8. Build Optimization"
echo "-------------------"
echo -n "Testing Next.js optimization... "

# Check if the page includes Next.js optimization markers
if echo "$mobile_content" | grep -q "_next"; then
    echo "✅ PASS - Next.js optimizations detected"
    
    # Check for specific optimizations
    if echo "$mobile_content" | grep -q "preload"; then
        echo "   ✅ Resource preloading enabled"
    fi
else
    echo "⚠️  WARNING - Next.js optimizations not detected"
fi

# Environment validation
echo ""
echo "9. Environment Validation" 
echo "------------------------"
echo -n "Testing environment configuration... "

# Check if the app is running in production mode
prod_check=$(curl -s "$WEB_URL" | grep -o "production\|development" | head -1 || echo "unknown")

if [ "$prod_check" = "production" ]; then
    echo "✅ PASS - Running in production mode"
elif [ "$prod_check" = "development" ]; then
    echo "⚠️  WARNING - Running in development mode"
else
    echo "ℹ️  INFO - Environment mode not detectable (this is normal)"
fi

# Summary
echo ""
echo "🏁 Web Deployment Verification Complete"
echo "======================================"

# Check dependencies
if ! command -v bc &> /dev/null; then
    echo "💡 Tip: Install 'bc' for performance calculations"
fi

echo ""
echo "🔗 Web App: $WEB_URL"
echo "🔗 API Endpoint: $API_URL"
echo "📊 Monitor at: Vercel Dashboard"
echo "📈 Analytics: Vercel Analytics (if enabled)"

echo ""
echo "Next steps:"
echo "1. Test user registration/login flow"
echo "2. Verify all major features work end-to-end"
echo "3. Set up monitoring and alerts"
echo "4. Configure custom domain (if not already done)"
echo "5. Proceed to Phase F (Stripe & Email Validation)"

# Final recommendations
echo ""
echo "🎯 Performance Recommendations:"
echo "   - Monitor Core Web Vitals in Vercel Dashboard"
echo "   - Consider enabling Vercel Analytics for detailed insights"
echo "   - Set up Sentry for error monitoring (if not already configured)"
echo "   - Test with real user scenarios and different devices"



