#!/usr/bin/env bash
# test-full-sequence.sh - Run full database workflow test
# Tests all typical Prisma operations end-to-end

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "🧪 NeonHub Database Workflow Test"
echo "=================================="
echo ""

# Add repo root to PATH for pnpm shim
export PATH="$REPO_ROOT:$PATH"

TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
  local test_name="$1"
  local command="$2"
  local allow_failure="${3:-false}"
  
  echo "▶️  Test: $test_name"
  echo "   Command: $command"
  
  if eval "$command" > /tmp/test_output.log 2>&1; then
    echo "   ✅ PASSED"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    if [ "$allow_failure" = "true" ]; then
      echo "   ⚠️  FAILED (allowed)"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo "   ❌ FAILED"
      TESTS_FAILED=$((TESTS_FAILED + 1))
      echo "   Last 10 lines of output:"
      tail -10 /tmp/test_output.log | sed 's/^/     /'
    fi
  fi
  echo ""
}

# Test 1: Schema validation
run_test "Schema Validation" \
  "pnpm --filter apps/api prisma validate"

# Test 2: Migration status
run_test "Migration Status" \
  "pnpm --filter apps/api prisma migrate status"

# Test 3: Prisma client generation
run_test "Prisma Client Generation" \
  "pnpm --filter apps/api prisma generate"

# Test 4: Database connectivity
run_test "Database Connectivity" \
  "pnpm --filter apps/api prisma db execute --stdin <<< 'SELECT 1;'"

# Test 5: Check tables exist
run_test "Tables Exist Check" \
  "pnpm --filter apps/api prisma db execute --stdin <<< 'SELECT COUNT(*) FROM users;'"

# Summary
echo "=================================="
echo "📊 Test Results"
echo "=================================="
echo "✅ Passed: $TESTS_PASSED"
echo "❌ Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "⚠️  Some tests failed. Check logs above."
  exit 1
fi

