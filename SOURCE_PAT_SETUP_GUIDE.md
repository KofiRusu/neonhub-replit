# 🔐 SOURCE_PAT Setup Guide - Auto-Sync Pipeline

**Status:** ⚠️ **REQUIRED** - SOURCE_PAT must be configured for private repo access  
**PR:** https://github.com/NeonHub3A/neonhub/pull/3  
**Last Updated:** October 13, 2025

---

## 🎯 Quick Start (10 Minutes)

### Step 1: Create Fine-Grained Personal Access Token (Recommended)

1. **Navigate to:** https://github.com/settings/personal-access-tokens/new

2. **Configure Token:**
   ```
   Token name: NeonHub Source Read PAT
   Description: Read-only access for auto-sync pipeline
   Expiration: 90 days
   
   Resource owner: KofiRusu (your account)
   
   Repository access:
   ● Only select repositories
     ☑ KofiRusu/neon-v2.4.0
     ☑ KofiRusu/Neon-v2.5.0
     ☑ KofiRusu/NeonHub-v3.0
   
   Permissions:
   Repository permissions:
     ☑ Contents: Read-only
     ☑ Metadata: Read-only (auto-selected)
   ```

3. **Generate Token**
   - Click "Generate token"
   - **⚠️ COPY IMMEDIATELY** - You won't see it again!

---

### Step 2: Add Token to Repository Secrets

#### Option A: GitHub CLI (Recommended)
```bash
# Paste your token when prompted
gh secret set SOURCE_PAT --app actions --body "YOUR_FINE_GRAINED_TOKEN_HERE"

# Verify it was added
gh secret list | grep SOURCE_PAT
```

#### Option B: GitHub Web UI
1. **Navigate to:** https://github.com/NeonHub3A/neonhub/settings/secrets/actions
2. **Click:** "New repository secret"
3. **Configure:**
   ```
   Name: SOURCE_PAT
   Secret: [paste your token from Step 1]
   ```
4. **Click:** "Add secret"

---

### Step 3: Merge PR #3

```bash
# Review the PR
gh pr view 3

# Merge (after CI passes or if you're ready)
gh pr merge 3 --squash --delete-branch

# Or merge via GitHub UI:
# https://github.com/NeonHub3A/neonhub/pull/3
```

---

### Step 4: Trigger Test Run

```bash
# Trigger the workflow manually
gh workflow run auto-sync-from-siblings.yml

# Watch the run in real-time
gh run watch

# Or check status
gh run list --workflow=auto-sync-from-siblings.yml --limit 3
```

---

### Step 5: Verify Success

```bash
# Check state file was created
cat .neon/auto-sync-state.json

# Expected output:
# {
#   "KofiRusu/neon-v2.4.0": "abc123...",
#   "KofiRusu/Neon-v2.5.0": "def456...",
#   "KofiRusu/NeonHub-v3.0": "ghi789..."
# }

# List any PRs created
gh pr list --label auto-sync

# Check integration branches
git fetch origin
git branch -r | grep integration/auto-sync
```

---

## 🆚 Classic PAT vs. Fine-Grained PAT

### Fine-Grained PAT (Recommended) ⭐
- ✅ Limited to specific repositories
- ✅ Granular permissions (read-only)
- ✅ Visible in security log
- ✅ Organization can audit
- ⚠️ Requires manual repo selection

### Classic PAT (Simpler but Less Secure)
- ⚠️ Access to ALL private repos
- ⚠️ Broad permissions
- ✅ Works immediately without config
- ❌ Higher security risk

**Recommendation:** Use fine-grained PAT for production.

---

## 🔧 New Features in This Release

### 1. Separate Token Architecture
```yaml
# Before (insecure - single token)
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

# After (secure - separation of concerns)
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # PR operations
SOURCE_PAT: ${{ secrets.SOURCE_PAT }}      # Read source repos
```

**Benefits:**
- SOURCE_PAT has zero write permissions
- Compromised SOURCE_PAT cannot modify target repo
- Clear audit trail

### 2. Retry Logic
```typescript
function fetchWithRetry(remote: string, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      sh(`git fetch ${remote} --tags --prune`);
      return;
    } catch (e) {
      if (i === tries) throw e;
      const delay = 1500 * i; // 1.5s, 3s, 4.5s
      console.warn(`Fetch failed (attempt ${i}/${tries}), retrying in ${delay}ms`);
      // ... wait and retry
    }
  }
}
```

**Handles:**
- Transient network failures
- GitHub API rate limiting
- Temporary service disruptions

### 3. Dry-Run Mode
```json
// scripts/auto-sync/config.json
{
  "dryRun": true  // Set to true for testing
}
```

**Usage:**
- Test sync logic without creating PRs
- Validate filtering and risk scoring
- Debug configuration changes safely

**Output Example:**
```
[auto-sync] DRY RUN: would push integration/auto-sync/KofiRusu-neon-v2-4-0 and open PR with risk:low
[auto-sync] DRY RUN: Files: 3, TS errors: 0, Test failures: 0
```

### 4. Stricter Auto-Merge
```typescript
// Before: Auto-merge if low risk
if (risk === "low" && cfg.autoMergeLowRisk) {
  autoMergePr();
}

// After: Auto-merge only if PERFECT build
if (risk === "low" && cfg.autoMergeLowRisk && tsErrors === 0 && testFailures === 0) {
  autoMergePr();
}
```

**Impact:**
- Even low-risk changes with ANY errors require manual review
- Guarantees only perfect builds auto-merge
- Reduces risk of breaking changes

### 5. Label Auto-Creation
```yaml
- name: Ensure labels exist
  run: |
    gh label create auto-sync -c "#0366d6" -d "Automated sync PRs" || true
    gh label create risk:low -c "#2cbe4e" || true
    gh label create risk:medium -c "#fbca04" || true
    gh label create risk:high -c "#d93f0b" || true
```

**Benefits:**
- No manual label setup required
- Idempotent (safe to run multiple times)
- Consistent across all runs

---

## 🧪 Testing the Pipeline

### Test 1: Dry-Run Mode (Safe)
```bash
# Edit config
cat <<EOF > scripts/auto-sync/config.json
{
  "sourceRepos": ["KofiRusu/neon-v2.4.0", "KofiRusu/Neon-v2.5.0", "KofiRusu/NeonHub-v3.0"],
  "targetDefaultBranch": "main",
  "integrationBranchPrefix": "integration/auto-sync",
  "stateFile": ".neon/auto-sync-state.json",
  "allowConventionalTypes": ["feat", "fix", "perf", "refactor"],
  "disallowCommitTypes": ["chore", "revert", "style", "docs", "test", "build", "ci"],
  "maxCommitsPerRun": 40,
  "autoMergeLowRisk": true,
  "requireCiGreenForMerge": true,
  "dryRun": true
}
EOF

# Commit and push
git add scripts/auto-sync/config.json
git commit -m "test: enable dry-run mode"
git push origin main

# Trigger workflow
gh workflow run auto-sync-from-siblings.yml

# Review logs (no PRs will be created)
gh run view --log
```

### Test 2: Live Run (After Dry-Run Success)
```bash
# Disable dry-run
cat <<EOF > scripts/auto-sync/config.json
{
  ...,
  "dryRun": false
}
EOF

# Commit and push
git add scripts/auto-sync/config.json
git commit -m "chore: disable dry-run mode for production"
git push origin main

# Workflow will trigger automatically
# Monitor: gh run watch
```

---

## 📊 Expected Results

### With SOURCE_PAT Configured ✅
```
=== Auto Sync: Start ===
[auto-sync] Fetching from KofiRusu/neon-v2.4.0...
✓ Fetch successful
[auto-sync] Fetching from KofiRusu/Neon-v2.5.0...
✓ Fetch successful
[auto-sync] Fetching from KofiRusu/NeonHub-v3.0...
✓ Fetch successful

Integration branches created:
  - integration/auto-sync/KofiRusu-neon-v2-4-0
  - integration/auto-sync/KofiRusu-Neon-v2-5-0
  - integration/auto-sync/KofiRusu-NeonHub-v3-0

State file: .neon/auto-sync-state.json
PRs created: 0-3 (depending on changes)
Auto-merged: 0-3 (if low-risk & clean builds)

=== Auto Sync: Done ===
```

### Without SOURCE_PAT ❌
```
[auto-sync] SOURCE_PAT not set; private source repos may fail to fetch.
[auto-sync] Private repo likely: KofiRusu/neon-v2.4.0. Set SOURCE_PAT secret for access.
Error: Command failed: git fetch src_KofiRusu_neon_v2_4_0 --tags --prune
remote: Repository not found.
fatal: repository 'https://github.com/KofiRusu/neon-v2.4.0.git/' not found
```

---

## 🐛 Troubleshooting

### Issue: "SOURCE_PAT secret not found"
**Symptom:** Workflow logs show warning but still fails
**Fix:** 
```bash
# Verify secret exists
gh secret list | grep SOURCE_PAT

# If missing, add it
gh secret set SOURCE_PAT --app actions
```

### Issue: "Repository not found" despite SOURCE_PAT
**Possible Causes:**
1. PAT doesn't include the specific repository
2. PAT expired
3. PAT lacks "Contents: Read" permission
4. Repository name typo in config.json

**Fix:**
```bash
# Check config
cat scripts/auto-sync/config.json | grep sourceRepos

# Verify repo names (case-sensitive!)
gh repo list KofiRusu --limit 20 | grep -i neon
```

### Issue: Fetch retry exhausted
**Symptom:** All 3 retry attempts fail
**Possible Causes:**
1. Network connectivity issues
2. GitHub API outage
3. Invalid PAT

**Fix:**
- Check GitHub status: https://www.githubstatus.com/
- Verify PAT is valid: try cloning manually
- Check workflow logs for specific error

### Issue: Low-risk PRs not auto-merging
**Expected:** New stricter criteria now require perfect builds
**Behavior:**
- Must have `risk === "low"`
- Must have `tsErrors === 0`
- Must have `testFailures === 0`

**Not a bug:** This is intentional to prevent ANY errors from auto-merging.

---

## 🔒 Security Checklist

- [ ] SOURCE_PAT is fine-grained (limited repos)
- [ ] SOURCE_PAT has minimal permissions (Contents: Read only)
- [ ] SOURCE_PAT expiration ≤ 90 days
- [ ] Calendar reminder set for token rotation
- [ ] Token stored only in GitHub Secrets (never in code)
- [ ] Old PR #2 closed (superseded by #3)

---

## 📈 Monitoring & Maintenance

### Daily Checks (Automated)
```bash
# Check recent workflow runs
gh run list --workflow=auto-sync-from-siblings.yml --limit 10

# Success rate should be > 95%
```

### Weekly Review
```bash
# List auto-sync PRs
gh pr list --label auto-sync --state all

# Review any stuck PRs
# Merge or close as appropriate
```

### Monthly Maintenance
```bash
# Review state file for anomalies
cat .neon/auto-sync-state.json | jq .

# Audit sync statistics
gh run list --workflow=auto-sync-from-siblings.yml --json conclusion,createdAt | jq '.[] | {date: .createdAt, success: (.conclusion == "success")}'
```

### Quarterly Review
- [ ] Audit SOURCE_PAT usage
- [ ] Review risk scoring effectiveness
- [ ] Tune auto-merge criteria if needed
- [ ] Update source repo list if new versions released

---

## 🚀 Post-Verification Actions

After successful first run:

### 1. Tag Release
```bash
git checkout main
git pull origin main
git tag -a v2.5.2 -m "Auto-Sync Pipeline: private repo PAT support, retry logic, pipeline hardening"
git push origin v2.5.2
```

### 2. Close Old PR
```bash
# Close superseded PR #2
gh pr close 2 --comment "Superseded by PR #3 with enhanced PAT architecture and retry logic"
```

### 3. Update Documentation
Announce in team channels:
```
✅ Auto-Sync Pipeline Now Live!

The pipeline now automatically:
- Syncs from 3 private repos hourly
- Filters by conventional commits
- Runs full CI + smoke tests
- Auto-merges clean low-risk changes
- Creates PRs for manual review

Config: scripts/auto-sync/config.json
Logs: GitHub Actions → Auto Sync from Sibling Repos
```

### 4. Enable Branch Protection (Recommended)
```
Navigate to: https://github.com/NeonHub3A/neonhub/settings/branches

Create rule for 'main':
☑ Require pull request reviews before merging
☑ Require status checks to pass:
  - build
  - test
  - type-check
☑ Dismiss stale reviews
☑ Require signed commits (optional)
```

---

## 📋 Complete Verification Checklist

### Pre-Merge (PR #3)
- [x] Code changes reviewed
- [x] Workflow file updated with SOURCE_PAT
- [x] Orchestrator updated with retry logic
- [x] Dry-run mode implemented
- [x] Stricter auto-merge criteria added
- [x] Label bootstrap added to workflow
- [x] All tests pass

### Post-Merge
- [ ] PR #3 merged to main
- [ ] SOURCE_PAT secret created (fine-grained)
- [ ] SOURCE_PAT secret added to repo
- [ ] Manual workflow triggered
- [ ] Workflow completed successfully
- [ ] `.neon/auto-sync-state.json` created
- [ ] Integration branches visible (if changes)
- [ ] PRs created with correct labels (if changes)
- [ ] Low-risk PRs auto-merged (if applicable)

### Production Readiness
- [ ] Branch protection rules configured
- [ ] Token rotation reminder set (90 days)
- [ ] Team notified of new pipeline
- [ ] Monitoring dashboard configured (optional)
- [ ] v2.5.2 release tagged

---

## 🛡️ Security Best Practices

### Token Management
✅ **DO:**
- Use fine-grained tokens
- Set shortest practical expiration (90 days)
- Grant minimum required permissions
- Rotate before expiration
- Revoke immediately if compromised
- Store only in GitHub Secrets

❌ **DON'T:**
- Share tokens in chat/email
- Commit tokens to code
- Use classic tokens with full access
- Set "never expire"
- Grant write permissions for read-only needs

### Audit Trail
```bash
# View token usage in GitHub
# Settings → Developer settings → Personal access tokens → [your token]
# See "Last used" timestamp

# Review workflow runs
gh run list --workflow=auto-sync-from-siblings.yml --json createdAt,conclusion,event

# Check for unauthorized access attempts
# (Review failed runs for suspicious patterns)
```

---

## 📊 Success Metrics

Track these KPIs:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Workflow success rate | > 95% | `gh run list --json conclusion` |
| Auto-merge rate | 20-40% | Count auto-merged vs total PRs |
| Mean PR review time | < 24h | Time from PR open to merge |
| False positive rate | < 10% | Low-risk that should've been higher |
| Token rotation compliance | 100% | Never let token expire |

---

## 🔄 Token Rotation Procedure

**Every 90 days (or before expiration):**

1. **Create new fine-grained PAT** (same config as original)
2. **Update secret:**
   ```bash
   gh secret set SOURCE_PAT --app actions --body "NEW_TOKEN_HERE"
   ```
3. **Verify workflow still works:**
   ```bash
   gh workflow run auto-sync-from-siblings.yml
   gh run watch
   ```
4. **Revoke old token:**
   - Go to: https://github.com/settings/personal-access-tokens
   - Find old "NeonHub Source Read PAT"
   - Click "Revoke"

5. **Update rotation log:**
   ```bash
   echo "$(date): Rotated SOURCE_PAT" >> .neon/token-rotation.log
   git add .neon/token-rotation.log
   git commit -m "chore: rotate SOURCE_PAT token"
   ```

---

## 🎓 Advanced Configuration

### Adjust Retry Behavior
Edit `scripts/auto-sync/index.ts`:
```typescript
// Increase retries for unreliable networks
fetchWithRetry(remoteName, 5); // was 3

// Adjust delay
const delay = 3000 * i; // 3s, 6s, 9s instead of 1.5s, 3s, 4.5s
```

### Add More Source Repos
Edit `scripts/auto-sync/config.json`:
```json
{
  "sourceRepos": [
    "KofiRusu/neon-v2.4.0",
    "KofiRusu/Neon-v2.5.0",
    "KofiRusu/NeonHub-v3.0",
    "KofiRusu/neon-v2.6.0"  // Add new repo
  ]
}
```

**Don't forget:** Update SOURCE_PAT to include new repo!

### Enable More Commit Types
Edit `scripts/auto-sync/config.json`:
```json
{
  "allowConventionalTypes": ["feat", "fix", "perf", "refactor", "docs"]  // Added docs
}
```

### Change Sync Frequency
Edit `.github/workflows/auto-sync-from-siblings.yml`:
```yaml
on:
  schedule:
    - cron: "0 */6 * * *"  # Every 6 hours instead of hourly
```

---

## 📞 Support & Help

### If Workflow Fails
1. Check logs: `gh run view --log`
2. Verify SOURCE_PAT: `gh secret list`
3. Test token manually:
   ```bash
   git clone https://YOUR_SOURCE_PAT@github.com/KofiRusu/neon-v2.4.0.git /tmp/test
   ```
4. Review PR #3 discussion

### If Auto-Merge Not Working
1. Check criteria:
   - Risk must be "low"
   - TS errors must be exactly 0
   - Test failures must be exactly 0
   - `autoMergeLowRisk` must be true in config
2. Review PR labels (should have `risk:low`)
3. Check branch protection doesn't block auto-merge

### If Too Many/Few Changes Synced
1. Review conventional commit filtering
2. Adjust `allowConventionalTypes` in config
3. Check path filters in `scripts/auto-sync/filters.ts`
4. Review risk scoring in `scripts/auto-sync/risk.ts`

---

## 🔗 Related Documentation

- **PR #3:** https://github.com/NeonHub3A/neonhub/pull/3
- **Launch Report:** `AUTO_SYNC_LAUNCH_REPORT.md`
- **Verification Report:** `AUTO_SYNC_VERIFICATION_REPORT.md`
- **README:** Auto Sync Pipeline section
- **Workflow:** `.github/workflows/auto-sync-from-siblings.yml`
- **Config:** `scripts/auto-sync/config.json`

---

**🎊 Ready to enable secure, autonomous syncing from private repositories!**

