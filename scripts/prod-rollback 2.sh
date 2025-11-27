#!/bin/bash
##
## Production Rollback Script
## Reverts to last known healthy state
##

set -euo pipefail

echo "🔄 NeonHub Production Rollback"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  WARNING: This will revert to previous deployment"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Rollback cancelled."
  exit 0
fi

echo ""
echo "1️⃣ Fetching last healthy deployment..."
# Get last successful workflow run
LAST_HEALTHY=$(gh run list --workflow=deploy-prod.yml --status=success --limit=1 --json databaseId --jq '.[0].databaseId')

echo "   Last healthy run: #$LAST_HEALTHY"
echo ""

echo "2️⃣ Reverting database migrations..."
echo "   Run: pnpm prisma migrate resolve --rolled-back"
echo "   (Manual step - requires database access)"
echo ""

echo "3️⃣ Redeploying previous image..."
echo "   Railway: Redeploy from commit SHA"
echo "   Vercel: Rollback via dashboard"
echo ""

echo "✅ Rollback steps documented"
echo "📖 See: docs/ROLLBACK_RUNBOOK.md for detailed procedures"

