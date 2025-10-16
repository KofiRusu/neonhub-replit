#!/bin/bash
# Integration Validation Script - Stripe, Resend, OpenAI

set -e

# Configuration
API_URL="${1:-https://api.yourdomain.com}"
TIMEOUT=30

echo "🔍 Validating External Service Integrations"
echo "API URL: $API_URL"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "PASS")
            echo -e "${GREEN}✅ PASS${NC} - $message"
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL${NC} - $message"
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARN${NC} - $message"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  INFO${NC} - $message"
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate JSON response
validate_json() {
    echo "$1" | jq . >/dev/null 2>&1
}

echo ""
echo "1. Environment Variables Check"
echo "----------------------------"

# Check required environment variables
check_env_var() {
    local var_name=$1
    local var_value="${!var_name}"
    local min_length=${2:-10}
    
    if [ -z "$var_value" ]; then
        print_status "FAIL" "$var_name not set"
        return 1
    elif [ ${#var_value} -lt $min_length ]; then
        print_status "FAIL" "$var_name too short (${#var_value} chars, expected >$min_length)"
        return 1
    else
        print_status "PASS" "$var_name configured (${#var_value} chars)"
        return 0
    fi
}

# Only check if running in environment with access to variables
if [ -n "$STRIPE_SECRET_KEY" ]; then
    check_env_var "STRIPE_SECRET_KEY" 20
    check_env_var "STRIPE_WEBHOOK_SECRET" 20
else
    print_status "INFO" "Environment variables not accessible from script context"
fi

echo ""
echo "2. Stripe Integration Test"
echo "------------------------"

# Test Stripe webhook endpoint
echo -n "Testing Stripe webhook endpoint... "
webhook_response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/billing/webhook" \
    -H "Content-Type: application/json" \
    -d '{"test": true}' 2>/dev/null || echo "000")

case $webhook_response in
    "400")
        print_status "PASS" "Webhook endpoint responds correctly (400 for invalid signature)"
        ;;
    "200")
        print_status "WARN" "Webhook endpoint responds 200 without signature (security issue?)"
        ;;
    "404")
        print_status "FAIL" "Webhook endpoint not found"
        ;;
    "000")
        print_status "FAIL" "Webhook endpoint not reachable"
        ;;
    *)
        print_status "WARN" "Unexpected webhook response: $webhook_response"
        ;;
esac

# Test Stripe API (if credentials available)
if [ -n "$STRIPE_SECRET_KEY" ]; then
    echo -n "Testing Stripe API connectivity... "
    stripe_test=$(curl -s "https://api.stripe.com/v1/payment_methods" \
        -u "$STRIPE_SECRET_KEY:" 2>/dev/null || echo "error")
    
    if echo "$stripe_test" | grep -q '"object": "list"'; then
        print_status "PASS" "Stripe API accessible"
    else
        print_status "FAIL" "Stripe API connection failed"
    fi
else
    print_status "INFO" "Stripe API key not available for testing"
fi

echo ""
echo "3. Email Service (Resend) Test"
echo "----------------------------"

# Test if email service is configured
echo -n "Testing email service configuration... "
email_config_response=$(curl -s "$API_URL/health" 2>/dev/null || echo "{}")

if validate_json "$email_config_response"; then
    print_status "PASS" "API responding (email service status unknown without test endpoint)"
else
    print_status "FAIL" "API not responding"
fi

# Test Resend API (if key available)
if [ -n "$RESEND_API_KEY" ]; then
    echo -n "Testing Resend API connectivity... "
    resend_test=$(curl -s "https://api.resend.com/domains" \
        -H "Authorization: Bearer $RESEND_API_KEY" 2>/dev/null || echo "error")
    
    if echo "$resend_test" | grep -q '"data"'; then
        print_status "PASS" "Resend API accessible"
    else
        print_status "FAIL" "Resend API connection failed"
    fi
else
    print_status "INFO" "Resend API key not available for testing"
fi

echo ""
echo "4. OpenAI Integration Test"  
echo "------------------------"

# Test OpenAI API (if key available)
if [ -n "$OPENAI_API_KEY" ]; then
    echo -n "Testing OpenAI API connectivity... "
    openai_test=$(curl -s "https://api.openai.com/v1/models" \
        -H "Authorization: Bearer $OPENAI_API_KEY" 2>/dev/null || echo "error")
    
    if echo "$openai_test" | grep -q '"gpt-4"'; then
        print_status "PASS" "OpenAI API accessible with GPT-4 access"
    elif echo "$openai_test" | grep -q '"gpt-3.5"'; then
        print_status "WARN" "OpenAI API accessible but no GPT-4 access"
    else
        print_status "FAIL" "OpenAI API connection failed"
    fi
    
    # Test minimal completion
    echo -n "Testing OpenAI completion... "
    completion_test=$(curl -s "https://api.openai.com/v1/chat/completions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -d '{
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": "Hello"}],
            "max_tokens": 5
        }' 2>/dev/null || echo "error")
    
    if echo "$completion_test" | grep -q '"choices"'; then
        print_status "PASS" "OpenAI completion working"
    else
        print_status "FAIL" "OpenAI completion failed"
    fi
else
    print_status "INFO" "OpenAI API key not available for testing"
fi

echo ""
echo "5. Integration Health Summary"
echo "---------------------------"

# Test health endpoint for service status
health_response=$(curl -s "$API_URL/health" 2>/dev/null || echo "{}")

if validate_json "$health_response"; then
    db_status=$(echo "$health_response" | jq -r '.db // "unknown"')
    overall_status=$(echo "$health_response" | jq -r '.status // "unknown"')
    
    case $db_status in
        "true"|true)
            print_status "PASS" "Database connection healthy"
            ;;
        "false"|false)
            print_status "FAIL" "Database connection failed"
            ;;
        *)
            print_status "WARN" "Database status unknown: $db_status"
            ;;
    esac
    
    case $overall_status in
        "ok")
            print_status "PASS" "Overall API health good"
            ;;
        "error")
            print_status "FAIL" "API health check failed"
            ;;
        *)
            print_status "WARN" "Unknown health status: $overall_status"
            ;;
    esac
else
    print_status "FAIL" "Health endpoint not responding or invalid JSON"
fi

echo ""
echo "6. Security Validation"
echo "--------------------"

# Test HTTPS
echo -n "Testing HTTPS configuration... "
if [ "${API_URL:0:8}" = "https://" ]; then
    ssl_test=$(curl -s -I "$API_URL/health" 2>/dev/null | head -1 | grep -o "200\|404\|403" || echo "fail")
    if [ "$ssl_test" != "fail" ]; then
        print_status "PASS" "HTTPS working correctly"
    else
        print_status "FAIL" "HTTPS connection failed"
    fi
else
    print_status "WARN" "Not using HTTPS URL for testing"
fi

# Test rate limiting (optional)
echo -n "Testing rate limiting... "
rate_limit_count=0
for i in {1..5}; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "000")
    if [ "$status" = "429" ]; then
        rate_limit_count=$((rate_limit_count + 1))
    fi
    sleep 0.2
done

if [ $rate_limit_count -gt 0 ]; then
    print_status "PASS" "Rate limiting active ($rate_limit_count/5 requests blocked)"
else
    print_status "INFO" "Rate limiting not triggered (may be configured for higher limits)"
fi

echo ""
echo "7. Recommendations"
echo "----------------"

print_status "INFO" "Set up monitoring for webhook delivery success rates"
print_status "INFO" "Configure email domain verification for better deliverability"
print_status "INFO" "Monitor OpenAI token usage to avoid unexpected charges"
print_status "INFO" "Test payment flows in Stripe test mode before going live"
print_status "INFO" "Set up alerting for service failures and high error rates"

echo ""
echo "🏁 Integration Validation Complete"
echo "================================"

# Check dependencies
echo ""
echo "💡 Optional Tools for Enhanced Testing:"
if ! command_exists "jq"; then
    echo "   - Install 'jq' for better JSON parsing: apt-get install jq"
fi

if ! command_exists "stripe"; then
    echo "   - Install Stripe CLI for webhook testing: https://stripe.com/docs/stripe-cli"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Fix any FAIL status items above"
echo "2. Configure production webhook endpoints in service dashboards"
echo "3. Set up monitoring and alerting for all integrations"
echo "4. Test complete user flows (signup → payment → email notifications)"
echo "5. Proceed to Phase G (DNS & SSL Configuration)"

echo ""
echo "🔗 Service Dashboards:"
echo "   - Stripe: https://dashboard.stripe.com"
echo "   - Resend: https://resend.com/dashboard"
echo "   - OpenAI: https://platform.openai.com/usage"



