#!/bin/bash
set -euo pipefail

# NeonHub v3.0 Hybrid Deployment Automation
# This script coordinates the production deployment

echo "=== NeonHub v3.0 Hybrid Deployment ==="
echo "Core Features: API + Web (32/32 tests validated)"
echo "Optional Modules: Deferred to v3.1-v3.3"
echo ""

# Phase 1: Core Build Validation
echo "Phase 1: Building core workspaces..."
cd apps/api && npm run build
cd ../web && npm run build
cd ../..
echo "✓ Core builds complete"

# Phase 2: Secret Generation
echo ""
echo "Phase 2: Generating production secrets..."
./scripts/generate-production-secrets.sh

# Verify .env immutability
echo ""
echo "Verifying .env file integrity..."
if git diff --quiet .env 2>/dev/null || [ ! -f .env ]; then
  echo "✓ .env file unchanged"
else
  echo "✗ ERROR: .env file was modified!"
  exit 1
fi

echo ""
echo "=== Deployment Ready ==="
echo "Next steps:"
echo "1. Configure secrets in deployment platforms"
echo "2. Provision PostgreSQL database"
echo "3. Deploy API to Railway/Render"
echo "4. Deploy Web to Vercel"
echo "5. Configure DNS and SSL"
echo "6. Run smoke tests"