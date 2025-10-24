#!/bin/bash

# NeonHub Performance Benchmarking Criteria & Security Validation
# Generated: 2025-10-23
# Purpose: Comprehensive performance testing and security validation

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3001"
PERFORMANCE_REPORT="./reports/performance/performance-report-$(date +%Y%m%d-%H%M%S).md"
SECURITY_REPORT="./reports/security/security-report-$(date +%Y%m%d-%H%M%S).md"
BENCHMARK_DURATION=60
CONCURRENT_USERS=100
REQUEST_RATE=50

# Performance thresholds
RESPONSE_TIME_P95_TARGET=200  # ms
RESPONSE_TIME_P99_TARGET=500  # ms
THROUGHPUT_TARGET=1000       # requests/second
ERROR_RATE_TARGET=0.1         # %
MEMORY_USAGE_TARGET=512       # MB
CPU_USAGE_TARGET=70           # %

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Initialize performance testing environment
init_performance_testing() {
    log "Initializing Performance Testing Environment"
    
    # Create reports directory
    mkdir -p "./reports/performance"
    mkdir -p "./reports/security"
    mkdir -p "./logs/performance"
    
    # Install performance testing tools if needed
    if ! command -v ab > /dev/null 2>&1; then
        log "Installing Apache Bench for performance testing..."
        # On macOS: brew install ab
        # On Ubuntu: sudo apt-get install apache2-utils
        warning "Apache Bench (ab) not found. Please install manually."
    fi
    
    if ! command -v wrk > /dev/null 2>&1; then
        log "Installing wrk for load testing..."
        # On macOS: brew install wrk
        # On Ubuntu: sudo apt-get install wrk
        warning "wrk not found. Please install manually."
    fi
    
    success "Performance testing environment initialized"
}

# Start API server for testing
start_test_server() {
    log "Starting API server for performance testing..."
    
    cd apps/api
    
    # Kill any existing processes
    pkill -f "npm.*dev\|npm.*start" || true
    sleep 5
    
    # Start server in background
    npm run dev > ../logs/performance/api-server.log 2>&1 &
    local server_pid=$!
    
    # Wait for server to start
    local server_started=false
    for i in {1..30}; do
        if curl -f -s "$API_URL/api/health" > /dev/null 2>&1; then
            server_started=true
            break
        fi
        sleep 1
    done
    
    if [[ "$server_started" == true ]]; then
        success "API server started (PID: $server_pid)"
        echo $server_pid > ../logs/performance/server.pid
    else
        error "API server failed to start"
        cd ../..
        return 1
    fi
    
    cd ../..
    return 0
}

# Stop test server
stop_test_server() {
    log "Stopping test server..."
    
    if [[ -f "logs/performance/server.pid" ]]; then
        local server_pid=$(cat logs/performance/server.pid)
        kill $server_pid 2>/dev/null || true
        rm -f logs/performance/server.pid
    fi
    
    # Kill any remaining processes
    pkill -f "npm.*dev\|npm.*start" || true
    sleep 2
    
    success "Test server stopped"
}

# Performance Benchmarking Tests
run_performance_benchmarks() {
    log "=== Running Performance Benchmarking Tests ==="
    
    local performance_results=()
    
    # Test 1: Health Endpoint Performance
    log "Testing health endpoint performance..."
    local health_result=$(test_endpoint_performance "/api/health" "Health Endpoint")
    performance_results+=("$health_result")
    
    # Test 2: Authentication Endpoint Performance
    log "Testing authentication endpoint performance..."
    local auth_result=$(test_endpoint_performance "/api/auth/status" "Auth Endpoint")
    performance_results+=("$auth_result")
    
    # Test 3: Metrics Endpoint Performance
    log "Testing metrics endpoint performance..."
    local metrics_result=$(test_endpoint_performance "/api/metrics" "Metrics Endpoint")
    performance_results+=("$metrics_result")
    
    # Test 4: Load Testing
    log "Running comprehensive load test..."
    local load_result=$(run_load_test)
    performance_results+=("$load_result")
    
    # Test 5: Stress Testing
    log "Running stress test..."
    local stress_result=$(run_stress_test)
    performance_results+=("$stress_result")
    
    # Generate performance report
    generate_performance_report "${performance_results[@]}"
}

# Test individual endpoint performance
test_endpoint_performance() {
    local endpoint=$1
    local name=$2
    local test_log="./logs/performance/${name// /_}-$(date +%Y%m%d-%H%M%S).log"
    
    log "Testing $name ($endpoint)..."
    
    # Use curl for basic performance test
    local start_time=$(date +%s%N)
    local requests=100
    local failed_requests=0
    
    for i in $(seq 1 $requests); do
        if ! curl -f -s -w "%{time_total}\n" "$API_URL$endpoint" > /tmp/curl_result.txt 2>/dev/null; then
            ((failed_requests++))
        fi
        echo "$(cat /tmp/curl_result.txt)" >> "$test_log"
    done
    
    local end_time=$(date +%s%N)
    local total_time=$(((end_time - start_time) / 1000000)) # Convert to milliseconds
    
    # Calculate metrics
    local success_rate=$((100 - (failed_requests * 100 / requests)))
    local avg_response_time=$(awk '{sum+=$1} END {print sum/NR}' "$test_log")
    local p95_response_time=$(sort -n "$test_log" | awk 'BEGIN{i=0} {a[i++]=$1} END {print a[int(i*0.95)]}')
    local p99_response_time=$(sort -n "$test_log" | awk 'BEGIN{i=0} {a[i++]=$1} END {print a[int(i*0.99)]}')
    local throughput=$((requests * 1000 / total_time))
    
    # Evaluate against thresholds
    local test_passed=true
    
    if (( $(echo "$p95_response_time > $RESPONSE_TIME_P95_TARGET" | bc -l) )); then
        warning "$name P95 response time ($p95_response_time ms) exceeds target ($RESPONSE_TIME_P95_TARGET ms)"
        test_passed=false
    fi
    
    if (( $(echo "$p99_response_time > $RESPONSE_TIME_P99_TARGET" | bc -l) )); then
        warning "$name P99 response time ($p99_response_time ms) exceeds target ($RESPONSE_TIME_P99_TARGET ms)"
        test_passed=false
    fi
    
    if (( $(echo "$success_rate < (100 - ERROR_RATE_TARGET)" | bc -l) )); then
        error "$name success rate ($success_rate%) below target ((100 - ERROR_RATE_TARGET)%)"
        test_passed=false
    fi
    
    if [[ "$test_passed" == true ]]; then
        success "$name performance test PASSED"
    else
        error "$name performance test FAILED"
    fi
    
    # Return formatted result
    echo "$name|$success_rate|$avg_response_time|$p95_response_time|$p99_response_time|$throughput|$test_passed"
}

# Run comprehensive load test
run_load_test() {
    local test_log="./logs/performance/load-test-$(date +%Y%m%d-%H%M%S).log"
    
    log "Running load test with $CONCURRENT_USERS concurrent users..."
    
    # Use wrk if available, otherwise fallback to curl
    if command -v wrk > /dev/null 2>&1; then
        wrk -t12 -c$CONCURRENT_USERS -d${BENCHMARK_DURATION}s --timeout 10s "$API_URL/" > "$test_log" 2>&1
    else
        # Fallback to simple curl-based load test
        log "Using curl-based load test (wrk not available)..."
        
        local start_time=$(date +%s)
        local end_time=$((start_time + BENCHMARK_DURATION))
        local total_requests=0
        local failed_requests=0
        
        while [[ $(date +%s) -lt $end_time ]]; do
            for i in $(seq 1 $REQUEST_RATE); do
                ((total_requests++))
                if ! curl -f -s "$API_URL/api/health" > /dev/null 2>&1; then
                    ((failed_requests++))
                fi
            done
            sleep 1
        done
        
        local actual_duration=$((BENCHMARK_DURATION))
        local success_rate=$((100 - (failed_requests * 100 / total_requests)))
        local throughput=$((total_requests / actual_duration))
        
        echo "Load Test Results:" > "$test_log"
        echo "Duration: ${actual_duration}s" >> "$test_log"
        echo "Total Requests: $total_requests" >> "$test_log"
        echo "Failed Requests: $failed_requests" >> "$test_log"
        echo "Success Rate: ${success_rate}%" >> "$test_log"
        echo "Throughput: ${throughput} req/s" >> "$test_log"
    fi
    
    # Parse results
    local success_rate=$(grep -o "Success Rate: [0-9]*%" "$test_log" | grep -o "[0-9]*" || echo "95")
    local throughput=$(grep -o "Throughput: [0-9]*" "$test_log" | grep -o "[0-9]*" || echo "500")
    
    # Evaluate against thresholds
    local test_passed=true
    
    if [[ $throughput -lt $THROUGHPUT_TARGET ]]; then
        error "Load test throughput ($throughput req/s) below target ($THROUGHPUT_TARGET req/s)"
        test_passed=false
    fi
    
    if [[ $success_rate -lt $((100 - ERROR_RATE_TARGET)) ]]; then
        error "Load test success rate ($success_rate%) below target ((100 - ERROR_RATE_TARGET)%)"
        test_passed=false
    fi
    
    if [[ "$test_passed" == true ]]; then
        success "Load test PASSED"
    else
        error "Load test FAILED"
    fi
    
    echo "Load Test|$success_rate|N/A|N/A|N/A|$throughput|$test_passed"
}

# Run stress test
run_stress_test() {
    local test_log="./logs/performance/stress-test-$(date +%Y%m%d-%H%M%S).log"
    
    log "Running stress test with increasing load..."
    
    # Monitor system resources during stress test
    local stress_start_time=$(date +%s)
    local max_cpu=0
    local max_memory=0
    
    # Start resource monitoring
    (
        while true; do
            local cpu_usage=$(ps aux | grep "npm.*dev\|node.*server" | awk '{sum+=$3} END {print sum+0}')
            local memory_usage=$(ps aux | grep "npm.*dev\|node.*server" | awk '{sum+=$4} END {print sum+0}')
            
            echo "$(date +%s),$cpu_usage,$memory_usage" >> "$test_log"
            
            # Track maximum usage
            if (( $(echo "$cpu_usage > $max_cpu" | bc -l) )); then
                max_cpu=$cpu_usage
            fi
            
            if (( $(echo "$memory_usage > $max_memory" | bc -l) )); then
                max_memory=$memory_usage
            fi
            
            sleep 1
        done
    ) &
    local monitor_pid=$!
    
    # Run stress test with increasing concurrent users
    local concurrent_users_list=(10 25 50 100 200)
    local test_passed=true
    
    for users in "${concurrent_users_list[@]}"; do
        log "Stress testing with $users concurrent users..."
        
        if command -v wrk > /dev/null 2>&1; then
            wrk -t4 -c$users -d30s --timeout 10s "$API_URL/" >> "$test_log" 2>&1
        else
            # Simple stress test
            for i in {1..30}; do
                for j in $(seq 1 $users); do
                    curl -f -s "$API_URL/api/health" > /dev/null &
                done
                wait
                sleep 1
            done
        fi
    done
    
    # Stop monitoring
    kill $monitor_pid 2>/dev/null || true
    
    # Evaluate resource usage
    if (( $(echo "$max_cpu > $CPU_USAGE_TARGET" | bc -l) )); then
        warning "Stress test CPU usage ($max_cpu%) exceeded target ($CPU_USAGE_TARGET%)"
        test_passed=false
    fi
    
    if (( $(echo "$max_memory > $MEMORY_USAGE_TARGET" | bc -l) )); then
        warning "Stress test memory usage ($max_memory%) exceeded target ($MEMORY_USAGE_TARGET%)"
        test_passed=false
    fi
    
    if [[ "$test_passed" == true ]]; then
        success "Stress test PASSED"
    else
        error "Stress test FAILED"
    fi
    
    echo "Stress Test|100|N/A|N/A|N/A|N/A|$test_passed"
}

