#!/bin/bash
##
## Complete Deployment & Verification Script
## Deploys to staging/production and runs full validation
##

set -euo pipefail

ENVIRONMENT="${1:-staging}"

echo "🚀 NeonHub Deployment & Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENVIRONMENT"
echo ""

# Load environment URLs
if [ "$ENVIRONMENT" = "staging" ]; then
  if [ -f .env.staging/urls.env ]; then
    source .env.staging/urls.env
    API_URL="$STAGING_API_URL"
    WEB_URL="$STAGING_WEB_URL"
  else
    echo "⚠️  .env.staging/urls.env not found"
    API_URL="https://neonhub-api-staging.up.railway.app"
    WEB_URL="https://neonhub-web-staging.vercel.app"
  fi
else
  if [ -f .env.production/urls.env ]; then
    source .env.production/urls.env
    API_URL="$PRODUCTION_API_URL"
    WEB_URL="$PRODUCTION_WEB_URL"
  else
    API_URL="https://api.neonhubecosystem.com"
    WEB_URL="https://neonhubecosystem.com"
  fi
fi

echo "API URL: $API_URL"
echo "Web URL: $WEB_URL"
echo ""

# Step 1: Build
echo "1️⃣ Building application..."
pnpm -w install --frozen-lockfile
pnpm --filter @neonhub/backend-v3.2 run prisma:generate
pnpm --filter @neonhub/backend-v3.2 run build
pnpm --filter @neonhub/ui-v3.2 run build
echo "✅ Build complete"
echo ""

# Step 2: Run P0 Validation
echo "2️⃣ Running P0 validation..."
node scripts/p0-validation.mjs
echo "✅ P0 validation passed"
echo ""

# Step 3: Trigger Deployment
echo "3️⃣ Triggering deployment workflow..."
if [ "$ENVIRONMENT" = "staging" ]; then
  gh workflow run deploy-staging.yml || echo "⚠️  Workflow trigger failed (may need manual deploy)"
else
  gh workflow run deploy-prod.yml || echo "⚠️  Workflow trigger failed (may need manual deploy)"
fi
echo "⏳ Deployment triggered - waiting 60 seconds..."
sleep 60
echo ""

# Step 4: Run Smoke Tests
echo "4️⃣ Running post-deploy smoke tests..."
chmod +x scripts/post-deploy-smoke.sh
./scripts/post-deploy-smoke.sh "$API_URL" "$WEB_URL" || {
  echo "❌ Smoke tests failed"
  echo "Check logs and retry"
  exit 1
}
echo "✅ Smoke tests passed"
echo ""

# Step 5: Sample Metrics
echo "5️⃣ Sampling /metrics endpoint..."
curl -fsS "$API_URL/metrics" | head -20 > "${ENVIRONMENT}-metrics-sample.txt"
echo "✅ Metrics sampled to ${ENVIRONMENT}-metrics-sample.txt"
echo ""

# Step 6: Domain Audit (if applicable)
if [ "$ENVIRONMENT" = "production" ]; then
  echo "6️⃣ Running domain audit..."
  ./scripts/attach-domain-audit.sh || echo "⚠️  Domain not yet configured"
  echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment & Verification Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Environment: $ENVIRONMENT"
echo "API: $API_URL"
echo "Web: $WEB_URL"
echo ""
echo "Next steps:"
echo "  1. Review ${ENVIRONMENT}-metrics-sample.txt"
echo "  2. Check Grafana dashboards"
echo "  3. Monitor for 24 hours"
echo ""

