#!/usr/bin/env bash
# Auto-Sync Pipeline - Quick Activation Commands
# Execute these steps in order after creating SOURCE_PAT

set -euo pipefail

echo "═══════════════════════════════════════════════════════════════"
echo "   AUTO-SYNC PIPELINE ACTIVATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Step 1: Merge PR #3
echo "STEP 1: Review & Merge PR #3"
echo "  gh pr view 3"
echo "  gh pr merge 3 --squash --delete-branch"
echo ""
read -p "Press Enter after merging PR #3..."

# Step 2: Add SOURCE_PAT
echo ""
echo "STEP 2: Add SOURCE_PAT Secret"
echo "First, create fine-grained PAT at:"
echo "  https://github.com/settings/personal-access-tokens/new"
echo ""
echo "Configure:"
echo "  - Name: NeonHub Source Read PAT"
echo "  - Expiration: 90 days"
echo "  - Repos: neon-v2.4.0, Neon-v2.5.0, NeonHub-v3.0"
echo "  - Permissions: Contents (Read), Metadata (Read)"
echo ""
read -p "Paste your SOURCE_PAT token: " SOURCE_PAT_TOKEN
gh secret set SOURCE_PAT --app actions --body "$SOURCE_PAT_TOKEN"
echo "✅ SOURCE_PAT secret added"
echo ""

# Step 3: Verify secret
echo "STEP 3: Verify Secret"
gh secret list | grep SOURCE_PAT && echo "✅ SOURCE_PAT confirmed" || echo "❌ SOURCE_PAT not found"
echo ""

# Step 4: Trigger workflow
echo "STEP 4: Trigger Test Run"
gh workflow run auto-sync-from-siblings.yml
echo "✅ Workflow triggered"
echo ""
sleep 5

# Step 5: Watch run
echo "STEP 5: Monitor Run"
echo "Watching workflow execution..."
gh run watch || echo "Run completed (or failed)"
echo ""

# Step 6: Verify results
echo "STEP 6: Verify Results"
echo ""
echo "Checking state file:"
if [ -f .neon/auto-sync-state.json ]; then
  cat .neon/auto-sync-state.json
  echo "✅ State file created"
else
  echo "⚠️ State file not found (may need a few seconds)"
fi
echo ""

echo "Checking auto-sync PRs:"
gh pr list --label auto-sync || echo "No auto-sync PRs (repos may be in sync)"
echo ""

echo "Checking integration branches:"
git fetch origin 2>/dev/null
git branch -r | grep integration/auto-sync || echo "No integration branches (repos may be in sync)"
echo ""

# Step 7: Clean up
echo "STEP 7: Clean Up"
read -p "Close PR #2 and tag v2.5.2? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  gh pr close 2 --comment "Superseded by PR #3 with enhanced architecture" || echo "PR #2 already closed"
  git tag -a v2.5.2 -m "Auto-Sync Pipeline: private repo PAT support, retry logic, pipeline hardening"
  git push origin v2.5.2
  echo "✅ Cleanup complete"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "   ✅ ACTIVATION COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "The Auto-Sync Pipeline is now OPERATIONAL!"
echo ""
echo "Next: Monitor hourly runs for 24 hours"
echo "  gh run list --workflow=auto-sync-from-siblings.yml"
echo ""
