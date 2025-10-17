#!/bin/bash

# NeonHub v3.2 Post-Deployment QA Script
# Comprehensive validation of live deployment health, monitoring activation, and documentation

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/post-deployment-qa-$(date +%Y%m%d-%H%M%S).log"
DEPLOYMENT_URL=${DEPLOYMENT_URL:-"http://localhost:3000"}
API_URL=${API_URL:-"http://localhost:3001"}
TIMEOUT=${TIMEOUT:-30}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2 | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*" | tee -a "$LOG_FILE"
}

# Create log directory
mkdir -p "${PROJECT_ROOT}/logs"

log "Starting NeonHub v3.2 Post-Deployment QA..."

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local timeout=${3:-$TIMEOUT}

    log "Testing endpoint: $url (expected: $expected_status)"

    local response
    if response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" \
                 --max-time "$timeout" "$url" 2>/dev/null); then

        local body=$(echo "$response" | sed 's/HTTPSTATUS.*//')
        local status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        local time=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)

        if [ "$status" = "$expected_status" ]; then
            success "✓ $url - Status: $status, Response time: ${time}s"
            return 0
        else
            error "✗ $url - Expected: $expected_status, Got: $status"
            return 1
        fi
    else
        error "✗ $url - Connection failed"
        return 1
    fi
}

# Function to validate JSON response
validate_json_response() {
    local url=$1
    local required_fields=("${@:2}")

    log "Validating JSON response: $url"

    local response
    if ! response=$(curl -s --max-time "$TIMEOUT" "$url" 2>/dev/null); then
        error "✗ Failed to fetch JSON from $url"
        return 1
    fi

    # Check if response is valid JSON
    if ! echo "$response" | jq . >/dev/null 2>&1; then
        error "✗ Invalid JSON response from $url"
        return 1
    fi

    # Check required fields
    for field in "${required_fields[@]}"; do
        if ! echo "$response" | jq -e ".$field" >/dev/null 2>&1; then
            error "✗ Missing required field: $field in $url"
            return 1
        fi
    done

    success "✓ JSON validation passed for $url"
    return 0
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local health_url=$2

    log "Checking $service_name health..."

    if test_endpoint "$health_url"; then
        # Additional health validation
        if validate_json_response "$health_url" "status" "timestamp"; then
            success "✓ $service_name health check passed"
            return 0
        fi
    fi

    error "✗ $service_name health check failed"
    return 1
}

# Function to validate predictive engine
validate_predictive_engine() {
    log "Validating Predictive Engine functionality..."

    local errors=0

    # Test predictive engine health
    if ! check_service_health "Predictive Engine" "${API_URL}/api/predictive/health"; then
        ((errors++))
    fi

    # Test baseline metrics endpoint
    if ! validate_json_response "${API_URL}/api/predictive/baseline" "traffic" "latency" "errors"; then
        ((errors++))
    fi

    # Test scaling decision endpoint (with mock data)
    local mock_metrics='{
        "traffic": {"totalPageViews": 100000, "uniqueVisitors": 35000},
        "latency": {"apiResponseTimeAvg": 600},
        "errors": {"apiErrorRate": 0.02},
        "conversions": {"conversionRate": 0.02},
        "infrastructure": {"uptimePercentage": 99.9}
    }'

    local scaling_response
    if scaling_response=$(curl -s -X POST \
                           -H "Content-Type: application/json" \
                           -d "$mock_metrics" \
                           --max-time "$TIMEOUT" \
                           "${API_URL}/api/predictive/scale" 2>/dev/null); then

        if echo "$scaling_response" | jq -e '.decision' >/dev/null 2>&1; then
            success "✓ Scaling decision endpoint working"
        else
            error "✗ Invalid scaling decision response"
            ((errors++))
        fi
    else
        error "✗ Scaling decision endpoint failed"
        ((errors++))
    fi

    return $errors
}

# Function to validate personalization features
validate_personalization() {
    log "Validating Personalization features..."

    local errors=0

    # Test user behavior analytics endpoint
    if ! test_endpoint "${API_URL}/api/analytics/user-behavior"; then
        warning "⚠ User behavior analytics endpoint not accessible (may require authentication)"
    fi

    # Test personalization recommendations endpoint
    if ! test_endpoint "${API_URL}/api/personalization/recommendations"; then
        warning "⚠ Personalization recommendations endpoint not accessible (may require authentication)"
    fi

    # Check if personalization UI components are loading
    if curl -s --max-time "$TIMEOUT" "${DEPLOYMENT_URL}" | grep -q "personalization\|recommendation"; then
        success "✓ Personalization components detected in web application"
    else
        warning "⚠ Personalization components not detected in web application"
    fi

    return $errors
}

# Function to validate monitoring setup
validate_monitoring() {
    log "Validating monitoring and alerting setup..."

    local errors=0

    # Check if logs are being generated
    if [ -d "${PROJECT_ROOT}/logs" ] && [ "$(find "${PROJECT_ROOT}/logs" -name "*.log" -type f | wc -l)" -gt 0 ]; then
        success "✓ Application logs are being generated"
    else
        warning "⚠ No application logs found"
    fi

    # Check if benchmark reports were generated
    if [ -d "${PROJECT_ROOT}/reports/v3.2" ]; then
        local report_count=$(find "${PROJECT_ROOT}/reports/v3.2" -name "v32_benchmark_report.*" | wc -l)
        if [ "$report_count" -ge 3 ]; then
            success "✓ Benchmark reports generated ($report_count files)"
        else
            warning "⚠ Incomplete benchmark reports ($report_count files found)"
        fi
    else
        error "✗ Benchmark reports directory not found"
        ((errors++))
    fi

    return $errors
}

# Function to run performance validation
run_performance_validation() {
    log "Running performance validation..."

    local errors=0

    # Test API response times
    log "Testing API response times..."

    local api_endpoints=(
        "${API_URL}/api/health"
        "${API_URL}/api/predictive/health"
        "${DEPLOYMENT_URL}/api/health"
    )

    for endpoint in "${api_endpoints[@]}"; do
        local response_time
        if response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time "$TIMEOUT" "$endpoint" 2>/dev/null); then
            local time_seconds=$(echo "$response_time" | awk '{print int($1 * 1000)}')  # Convert to milliseconds

            if [ "$time_seconds" -lt 1000 ]; then
                success "✓ $endpoint - ${time_seconds}ms"
            elif [ "$time_seconds" -lt 2000 ]; then
                warning "⚠ $endpoint - ${time_seconds}ms (slow)"
            else
                error "✗ $endpoint - ${time_seconds}ms (too slow)"
                ((errors++))
            fi
        else
            error "✗ Failed to test $endpoint"
            ((errors++))
        fi
    done

    return $errors
}

# Function to validate documentation
validate_documentation() {
    log "Validating documentation and handoff materials..."

    local errors=0

    local required_docs=(
        "docs/v3.2/README.md"
        "docs/v3.2/DEPLOYMENT_CHECKLIST.md"
        "reports/v3.2/v32_benchmark_report.pdf"
        "reports/v3.2/v32_benchmark_report.json"
        "reports/v3.2/v32_benchmark_report.csv"
    )

    for doc in "${required_docs[@]}"; do
        if [ -f "${PROJECT_ROOT}/$doc" ]; then
            success "✓ Documentation found: $doc"
        else
            error "✗ Missing documentation: $doc"
            ((errors++))
        fi
    done

    # Check if documentation is accessible
    if [ -d "${PROJECT_ROOT}/docs/v3.2" ]; then
        success "✓ v3.2 documentation directory exists"
    else
        error "✗ v3.2 documentation directory missing"
        ((errors++))
    fi

    return $errors
}

# Function to generate QA report
generate_qa_report() {
    local total_checks=$1
    local total_errors=$2
    local report_file="${PROJECT_ROOT}/logs/post-deployment-qa-report-$(date +%Y%m%d-%H%M%S).md"

    cat > "$report_file" << EOF
# NeonHub v3.2 Post-Deployment QA Report

**Generated:** $(date)
**Deployment URL:** $DEPLOYMENT_URL
**API URL:** $API_URL

## Summary

- **Total Checks:** $total_checks
- **Errors Found:** $total_errors
- **Success Rate:** $(( (total_checks - total_errors) * 100 / total_checks ))%

## Detailed Results

See log file for detailed results: $LOG_FILE

## Recommendations

EOF

    if [ "$total_errors" -eq 0 ]; then
        echo "- ✅ All checks passed. Deployment ready for production." >> "$report_file"
    else
        echo "- ⚠️ $total_errors issues found. Review log file for details." >> "$report_file"
        echo "- 🔧 Address critical issues before full production rollout." >> "$report_file"
    fi

    success "QA report generated: $report_file"
}

# Main execution
main() {
    log "=== NeonHub v3.2 Post-Deployment QA Started ==="

    local total_checks=0
    local total_errors=0

    # Basic connectivity tests
    log "Phase 1: Basic Connectivity Tests"
    ((total_checks++))
    if test_endpoint "${DEPLOYMENT_URL}"; then
        success "✓ Web application accessible"
    else
        error "✗ Web application not accessible"
        ((total_errors++))
    fi

    ((total_checks++))
    if test_endpoint "${API_URL}/api/health"; then
        success "✓ API accessible"
    else
        error "✗ API not accessible"
        ((total_errors++))
    fi

    # Service health checks
    log "Phase 2: Service Health Checks"
    local health_checks=(
        "API:${API_URL}/api/health"
        "Web:${DEPLOYMENT_URL}/api/health"
    )

    for check in "${health_checks[@]}"; do
        IFS=':' read -r service url <<< "$check"
        ((total_checks++))
        if ! check_service_health "$service" "$url"; then
            ((total_errors++))
        fi
    done

    # Predictive engine validation
    log "Phase 3: Predictive Engine Validation"
    ((total_checks++))
    if ! validate_predictive_engine; then
        ((total_errors++))
    fi

    # Personalization validation
    log "Phase 4: Personalization Features Validation"
    ((total_checks++))
    if ! validate_personalization; then
        ((total_errors++))
    fi

    # Monitoring validation
    log "Phase 5: Monitoring & Alerting Validation"
    ((total_checks++))
    if ! validate_monitoring; then
        ((total_errors++))
    fi

    # Performance validation
    log "Phase 6: Performance Validation"
    ((total_checks++))
    if ! run_performance_validation; then
        ((total_errors++))
    fi

    # Documentation validation
    log "Phase 7: Documentation & Handoff Validation"
    ((total_checks++))
    if ! validate_documentation; then
        ((total_errors++))
    fi

    # Generate final report
    generate_qa_report "$total_checks" "$total_errors"

    # Final summary
    log "=== QA Results Summary ==="
    log "Total Checks: $total_checks"
    log "Errors Found: $total_errors"
    log "Success Rate: $(( (total_checks - total_errors) * 100 / total_checks ))%"

    if [ "$total_errors" -eq 0 ]; then
        success "🎉 All QA checks passed! Deployment ready for production."
        exit 0
    else
        error "❌ $total_errors QA issues found. Review logs before production."
        exit 1
    fi
}

# Run main function
main "$@"