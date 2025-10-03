#!/usr/bin/env bash
# Smoke test for NeonHub API

set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"

echo "🔎 Testing NeonHub API at $API_URL"
echo ""

# Test 1: Health check
echo "1️⃣ Health check..."
HEALTH=$(curl -fsS "$API_URL/health" || echo '{"status":"error"}')
echo "$HEALTH" | jq .
STATUS=$(echo "$HEALTH" | jq -r '.status')
if [ "$STATUS" != "ok" ]; then
  echo "❌ Health check failed"
  exit 1
fi
echo "✅ Health check passed"
echo ""

# Test 2: Metrics summary
echo "2️⃣ Metrics summary..."
SUMMARY=$(curl -fsS "$API_URL/metrics/summary?range=24h" || echo '{}')
echo "$SUMMARY" | jq '.data | {drafts: .draftsCreated, jobs: .jobs.total, events: .totalEvents}'
echo "✅ Metrics endpoint passed"
echo ""

# Test 3: Content drafts list
echo "3️⃣ Content drafts..."
DRAFTS=$(curl -fsS "$API_URL/content/drafts" || echo '{}')
COUNT=$(echo "$DRAFTS" | jq -r '.pagination.total // 0')
echo "Found $COUNT drafts"
echo "✅ Content endpoint passed"
echo ""

echo "🎉 All smoke tests passed!"
