#!/bin/bash

# QA Sentinel CI/CD Trigger Script
# Integrates QA Sentinel into CI/CD pipelines for automated validation

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Configuration
QA_SENTINEL_MODULE="${PROJECT_ROOT}/core/qa-sentinel"
LOG_FILE="${PROJECT_ROOT}/logs/qa-sentinel-ci-$(date +%Y%m%d-%H%M%S).log"
NODE_ENV=${NODE_ENV:-"production"}
CI=${CI:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

log "Starting QA Sentinel CI/CD trigger..."

# Function to check if QA Sentinel is available
check_qa_sentinel() {
    if [ ! -d "$QA_SENTINEL_MODULE" ]; then
        error "QA Sentinel module not found at $QA_SENTINEL_MODULE"
        return 1
    fi

    if [ ! -f "${QA_SENTINEL_MODULE}/package.json" ]; then
        error "QA Sentinel package.json not found"
        return 1
    fi

    success "QA Sentinel module found"
    return 0
}

# Function to install QA Sentinel dependencies
install_dependencies() {
    log "Installing QA Sentinel dependencies..."

    cd "$QA_SENTINEL_MODULE"

    if [ "$CI" = "true" ]; then
        npm ci --silent
    else
        npm install
    fi

    success "QA Sentinel dependencies installed"
}

# Function to build QA Sentinel
build_qa_sentinel() {
    log "Building QA Sentinel..."

    cd "$QA_SENTINEL_MODULE"
    npm run build

    if [ ! -d "dist" ]; then
        error "QA Sentinel build failed - dist directory not found"
        return 1
    fi

    success "QA Sentinel built successfully"
}

# Function to run pre-merge validation
run_pre_merge_validation() {
    local pipeline_id=${1:-"ci-$(date +%s)"}
    local pr_number=${2:-""}

    log "Running pre-merge QA validation (Pipeline: $pipeline_id, PR: $pr_number)..."

    cd "$QA_SENTINEL_MODULE"

    # Set environment variables for QA Sentinel
    export QA_SENTINEL_ENABLED=true
    export QA_SENTINEL_CI_MODE=true
    export QA_SENTINEL_PIPELINE_ID="$pipeline_id"
    export QA_SENTINEL_PR_NUMBER="$pr_number"

    # Run QA validation
    if npm run qa:validate; then
        success "Pre-merge QA validation passed"
        return 0
    else
        error "Pre-merge QA validation failed"
        return 1
    fi
}

# Function to run benchmark comparison
run_benchmark_comparison() {
    local build_id=${1:-"build-$(date +%s)"}

    log "Running benchmark comparison (Build: $build_id)..."

    cd "$QA_SENTINEL_MODULE"

    export QA_SENTINEL_BUILD_ID="$build_id"

    if npm run benchmark:compare; then
        success "Benchmark comparison completed"
        return 0
    else
        warning "Benchmark comparison failed or detected regressions"
        return 1
    fi
}

# Function to run anomaly detection
run_anomaly_detection() {
    log "Running anomaly detection..."

    cd "$QA_SENTINEL_MODULE"

    if npm run anomaly:detect; then
        success "Anomaly detection completed"
        return 0
    else
        error "Anomaly detection failed"
        return 1
    fi
}

# Function to generate QA report
generate_qa_report() {
    local output_file=${1:-"${PROJECT_ROOT}/reports/qa-sentinel-report-$(date +%Y%m%d-%H%M%S).json"}

    log "Generating QA report: $output_file"

    cd "$QA_SENTINEL_MODULE"

    mkdir -p "$(dirname "$output_file")"

    if npm run report:generate -- --output "$output_file"; then
        success "QA report generated: $output_file"
        return 0
    else
        error "QA report generation failed"
        return 1
    fi
}

# Function to run scheduled QA validation
run_scheduled_validation() {
    log "Running scheduled QA validation..."

    cd "$QA_SENTINEL_MODULE"

    export QA_SENTINEL_SCHEDULED=true

    if npm run qa:scheduled; then
        success "Scheduled QA validation completed"
        return 0
    else
        error "Scheduled QA validation failed"
        return 1
    fi
}

# Function to check if this is a CI environment
is_ci_environment() {
    if [ "$CI" = "true" ] || [ -n "${GITHUB_ACTIONS:-}" ] || [ -n "${GITLAB_CI:-}" ] || [ -n "${JENKINS_HOME:-}" ]; then
        return 0
    else
        return 1
    fi
}

# Function to get CI context
get_ci_context() {
    if [ -n "${GITHUB_SHA:-}" ]; then
        echo "github:${GITHUB_SHA}"
    elif [ -n "${GITLAB_OID:-}" ]; then
        echo "gitlab:${GITLAB_OID}"
    elif [ -n "${BUILD_ID:-}" ]; then
        echo "jenkins:${BUILD_ID}"
    else
        echo "local:$(date +%s)"
    fi
}

# Main execution logic
main() {
    local command=${1:-"validate"}
    local pipeline_id=${2:-"$(get_ci_context)"}
    local pr_number=${3:-""}

    log "QA Sentinel CI/CD Trigger - Command: $command, Pipeline: $pipeline_id"

    # Check if QA Sentinel is available
    if ! check_qa_sentinel; then
        exit 1
    fi

    # Install dependencies if needed
    if [ ! -d "${QA_SENTINEL_MODULE}/node_modules" ]; then
        install_dependencies
    fi

    # Build QA Sentinel if needed
    if [ ! -d "${QA_SENTINEL_MODULE}/dist" ]; then
        build_qa_sentinel
    fi

    case "$command" in
        "validate"|"pre-merge")
            if ! run_pre_merge_validation "$pipeline_id" "$pr_number"; then
                exit 1
            fi
            ;;
        "benchmark")
            if ! run_benchmark_comparison "$pipeline_id"; then
                exit 1
            fi
            ;;
        "anomaly")
            if ! run_anomaly_detection; then
                exit 1
            fi
            ;;
        "scheduled")
            if ! run_scheduled_validation; then
                exit 1
            fi
            ;;
        "report")
            local report_file="${PROJECT_ROOT}/reports/qa-sentinel-report-$(date +%Y%m%d-%H%M%S).json"
            if ! generate_qa_report "$report_file"; then
                exit 1
            fi
            ;;
        "full")
            # Run complete QA suite
            if ! run_pre_merge_validation "$pipeline_id" "$pr_number"; then
                exit 1
            fi

            if ! run_benchmark_comparison "$pipeline_id"; then
                exit 1
            fi

            if ! run_anomaly_detection; then
                exit 1
            fi

            local report_file="${PROJECT_ROOT}/reports/qa-sentinel-full-report-$(date +%Y%m%d-%H%M%S).json"
            if ! generate_qa_report "$report_file"; then
                exit 1
            fi
            ;;
        *)
            error "Unknown command: $command"
            echo "Usage: $0 [validate|benchmark|anomaly|scheduled|report|full] [pipeline_id] [pr_number]"
            exit 1
            ;;
    esac

    success "QA Sentinel CI/CD trigger completed successfully"
}

# Run main function with all arguments
main "$@"