#!/bin/bash

# NeonHub v3.2 Rollback Guard Script
# Implements comprehensive validation tests with security scanning and Web Vitals monitoring

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/rollback-guard-$(date +%Y%m%d-%H%M%S).log"
ROLLBACK_THRESHOLD=${ROLLBACK_THRESHOLD:-80}
WEB_VITALS_THRESHOLD=${WEB_VITALS_THRESHOLD:-75}

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

log "Starting NeonHub v3.2 Rollback Guard validation..."

# Function to run security scans
run_security_scans() {
    log "Running security scans..."

    local scan_results=()

    # NPM audit
    log "Running npm audit..."
    if cd "${PROJECT_ROOT}/apps/api" && npm audit --audit-level=moderate --json > "${PROJECT_ROOT}/logs/npm-audit.json" 2>/dev/null; then
        scan_results+=("npm_audit:pass")
        success "NPM audit passed"
    else
        scan_results+=("npm_audit:fail")
        error "NPM audit failed"
    fi

    # Trivy container scanning (if available)
    if command -v trivy >/dev/null 2>&1; then
        log "Running Trivy container scan..."
        if trivy image --format json --output "${PROJECT_ROOT}/logs/trivy-scan.json" "neonhub-api:latest" 2>/dev/null; then
            scan_results+=("trivy:pass")
            success "Trivy scan passed"
        else
            scan_results+=("trivy:fail")
            warning "Trivy scan found issues (review logs)"
        fi
    else
        warning "Trivy not installed, skipping container scanning"
        scan_results+=("trivy:skipped")
    fi

    # Gitleaks secret scanning
    if command -v gitleaks >/dev/null 2>&1; then
        log "Running Gitleaks secret scan..."
        if gitleaks detect --verbose --redact --config "${PROJECT_ROOT}/.gitleaks.toml" --report-format json --report-path "${PROJECT_ROOT}/logs/gitleaks-report.json" 2>/dev/null; then
            scan_results+=("gitleaks:pass")
            success "Gitleaks scan passed"
        else
            scan_results+=("gitleaks:fail")
            error "Gitleaks found potential secrets"
        fi
    else
        warning "Gitleaks not installed, skipping secret scanning"
        scan_results+=("gitleaks:skipped")
    fi

    echo "${scan_results[@]}"
}

# Function to run Web Vitals monitoring
run_web_vitals_check() {
    log "Running Web Vitals monitoring..."

    local vitals_results=()

    # Check if Lighthouse CI is available
    if command -v lhci >/dev/null 2>&1; then
        log "Running Lighthouse CI performance check..."
        if lhci autorun --config "${PROJECT_ROOT}/.lighthouserc.json" > "${PROJECT_ROOT}/logs/lighthouse-report.json" 2>/dev/null; then
            # Parse Lighthouse results
            local performance_score=$(jq -r '.summary.performance' "${PROJECT_ROOT}/logs/lighthouse-report.json" 2>/dev/null || echo "0")

            if (( $(echo "$performance_score >= 0.$WEB_VITALS_THRESHOLD" | bc -l) )); then
                vitals_results+=("lighthouse:pass:$performance_score")
                success "Lighthouse performance score: $performance_score"
            else
                vitals_results+=("lighthouse:fail:$performance_score")
                error "Lighthouse performance score below threshold: $performance_score < 0.$WEB_VITALS_THRESHOLD"
            fi
        else
            vitals_results+=("lighthouse:error")
            error "Lighthouse CI failed to run"
        fi
    else
        warning "Lighthouse CI not installed, skipping Web Vitals check"
        vitals_results+=("lighthouse:skipped")
    fi

    echo "${vitals_results[@]}"
}

# Function to run health checks
run_health_checks() {
    log "Running deployment health checks..."

    local health_results=()

    # API health check
    log "Checking API health..."
    if curl -f -s --max-time 30 "http://localhost:3001/api/health" > /dev/null 2>&1; then
        health_results+=("api_health:pass")
        success "API health check passed"
    else
        health_results+=("api_health:fail")
        error "API health check failed"
    fi

    # Database connectivity
    log "Checking database connectivity..."
    if curl -f -s --max-time 10 "http://localhost:3001/api/health/database" > /dev/null 2>&1; then
        health_results+=("db_health:pass")
        success "Database health check passed"
    else
        health_results+=("db_health:fail")
        error "Database health check failed"
    fi

    # Web application health
    log "Checking web application health..."
    if curl -f -s --max-time 30 "http://localhost:3000/api/health" > /dev/null 2>&1; then
        health_results+=("web_health:pass")
        success "Web application health check passed"
    else
        health_results+=("web_health:fail")
        error "Web application health check failed"
    fi

    echo "${health_results[@]}"
}

# Function to run performance validation
run_performance_validation() {
    log "Running performance validation..."

    local perf_results=()

    # Run performance tests
    log "Running performance test suite..."
    if cd "${PROJECT_ROOT}/apps/api" && npm run test:performance > "${PROJECT_ROOT}/logs/performance-tests.log" 2>&1; then
        perf_results+=("performance_tests:pass")
        success "Performance tests passed"
    else
        perf_results+=("performance_tests:fail")
        error "Performance tests failed"
    fi

    # Check response times
    log "Validating API response times..."
    local avg_response_time=$(curl -o /dev/null -s -w "%{time_total}" "http://localhost:3001/api/health" | awk '{print $1 * 1000}')

    if (( $(echo "$avg_response_time < 1000" | bc -l) )); then
        perf_results+=("response_time:pass:$avg_response_time")
        success "API response time acceptable: ${avg_response_time}ms"
    else
        perf_results+=("response_time:fail:$avg_response_time")
        error "API response time too slow: ${avg_response_time}ms"
    fi

    echo "${perf_results[@]}"
}

# Function to calculate rollback score
calculate_rollback_score() {
    local security_results=("$1")
    local vitals_results=("$2")
    local health_results=("$3")
    local perf_results=("$4")

    local total_checks=0
    local passed_checks=0

    # Count security checks
    for result in "${security_results[@]}"; do
        ((total_checks++))
        if [[ $result == *":pass"* ]]; then
            ((passed_checks++))
        fi
    done

    # Count vitals checks
    for result in "${vitals_results[@]}"; do
        ((total_checks++))
        if [[ $result == *":pass"* ]]; then
            ((passed_checks++))
        fi
    done

    # Count health checks
    for result in "${health_results[@]}"; do
        ((total_checks++))
        if [[ $result == *":pass"* ]]; then
            ((passed_checks++))
        fi
    done

    # Count performance checks
    for result in "${perf_results[@]}"; do
        ((total_checks++))
        if [[ $result == *":pass"* ]]; then
            ((passed_checks++))
        fi
    done

    # Calculate percentage
    local score=$(( passed_checks * 100 / total_checks ))

    echo "$score"
}

# Function to determine rollback action
determine_rollback_action() {
    local score=$1

    if (( score >= ROLLBACK_THRESHOLD )); then
        success "Rollback score: ${score}% - Deployment approved"
        echo "APPROVE"
    else
        error "Rollback score: ${score}% - Below threshold (${ROLLBACK_THRESHOLD}%) - Initiating rollback"
        echo "ROLLBACK"
    fi
}

# Main execution
main() {
    log "=== NeonHub v3.2 Rollback Guard Started ==="

    # Run all validation checks
    local security_results
    IFS=' ' read -ra security_results <<< "$(run_security_scans)"

    local vitals_results
    IFS=' ' read -ra vitals_results <<< "$(run_web_vitals_check)"

    local health_results
    IFS=' ' read -ra health_results <<< "$(run_health_checks)"

    local perf_results
    IFS=' ' read -ra perf_results <<< "$(run_performance_validation)"

    # Calculate rollback score
    local rollback_score
    rollback_score=$(calculate_rollback_score security_results vitals_results health_results perf_results)

    # Determine action
    local action
    action=$(determine_rollback_action "$rollback_score")

    # Log summary
    log "=== Validation Summary ==="
    log "Security scans: ${security_results[*]}"
    log "Web Vitals: ${vitals_results[*]}"
    log "Health checks: ${health_results[*]}"
    log "Performance: ${perf_results[*]}"
    log "Rollback score: ${rollback_score}%"
    log "Action: $action"

    # Execute action
    if [[ $action == "ROLLBACK" ]]; then
        log "Initiating rollback procedure..."
        # Add rollback logic here
        # ./scripts/rollback.sh
        exit 1
    else
        log "Deployment validation successful - proceeding with deployment"
        exit 0
    fi
}

# Run main function
main "$@"