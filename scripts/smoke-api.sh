#!/usr/bin/env bash
set -euo pipefail
: "${API_URL:=https://api.neonhubecosystem.com}"
echo "🔎 Health"
curl -sSf "$API_URL/health" | jq .
echo "🔎 Metrics (24h)"
curl -sSf "$API_URL/metrics/summary?range=24h" | jq .
echo "✅ API smoke ok"
