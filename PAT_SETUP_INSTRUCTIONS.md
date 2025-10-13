# 🔐 Auto-Sync PAT Setup Instructions

**Status:** ⚠️ **REQUIRED** - PAT must be configured before auto-sync can access private repos

---

## 📋 Quick Setup (10 minutes)

### Step 1: Create Personal Access Token

1. **Navigate to:** https://github.com/settings/tokens/new?scopes=repo&description=NeonHub+Auto-Sync+Pipeline

2. **Configure the token:**
   ```
   Note: NeonHub Auto-Sync Pipeline
   Expiration: 90 days (or custom)
   
   Scopes (select):
   ☑ repo
     ☑ repo:status
     ☑ repo_deployment
     ☑ public_repo
     ☑ repo:invite
     ☑ security_events
   ```

3. **Click** "Generate token"

4. **⚠️ COPY THE TOKEN IMMEDIATELY** - You won't be able to see it again!

---

### Step 2: Add Token to Repository Secrets

#### Option A: Via GitHub UI
1. **Navigate to:** https://github.com/NeonHub3A/neonhub/settings/secrets/actions

2. **Click** "New repository secret"

3. **Configure:**
   ```
   Name: AUTO_SYNC_PAT
   Secret: [paste your token from Step 1]
   ```

4. **Click** "Add secret"

#### Option B: Via GitHub CLI
```bash
# Replace YOUR_TOKEN_HERE with the actual token
gh secret set AUTO_SYNC_PAT --app actions --body "YOUR_TOKEN_HERE"

# Verify it was added
gh secret list | grep AUTO_SYNC_PAT
```

---

### Step 3: Merge the PR

1. **Review PR:** https://github.com/NeonHub3A/neonhub/pull/2

2. **Wait for CI** to pass (or merge anyway if linting issues are pre-existing)

3. **Merge** the pull request

---

### Step 4: Verify the Fix

#### Manual Workflow Trigger
```bash
# Trigger the workflow manually
gh workflow run auto-sync-from-siblings.yml

# Check the run status (wait ~1-2 minutes)
gh run list --workflow=auto-sync-from-siblings.yml --limit 3

# View detailed logs
gh run view --log
```

#### Expected Success Indicators
✅ **Workflow completes successfully** (no "Repository not found" errors)  
✅ **Integration branches created** (e.g., `integration/auto-sync/KofiRusu-neon-v2-4-0`)  
✅ **State file created:** `.neon/auto-sync-state.json`  
✅ **PRs opened** (if changes detected) with `auto-sync` label  

---

## 🔒 Security Best Practices

### Token Permissions (Fine-Grained Alternative)

For tighter security, create a **fine-grained personal access token** instead:

1. **Navigate to:** https://github.com/settings/personal-access-tokens/new

2. **Configure:**
   ```
   Token name: NeonHub Auto-Sync
   Expiration: 90 days
   
   Repository access:
   ☑ Only select repositories
     - KofiRusu/neon-v2.4.0
     - KofiRusu/Neon-v2.5.0
     - KofiRusu/NeonHub-v3.0
   
   Permissions:
   ☑ Contents: Read
   ☑ Metadata: Read (auto-selected)
   ```

3. **Generate and use** this token instead in Step 2

---

### Token Rotation Schedule

| Action | Frequency | Next Due |
|--------|-----------|----------|
| Review token usage | Monthly | [Set reminder] |
| Rotate token | Every 90 days | [Token expiry date] |
| Audit permissions | Quarterly | [Set reminder] |

**To rotate:**
1. Create new PAT (Step 1)
2. Update `AUTO_SYNC_PAT` secret (Step 2)
3. Revoke old token at https://github.com/settings/tokens

---

## ✅ Verification Checklist

After setup, verify:

- [ ] PAT secret `AUTO_SYNC_PAT` exists in repository secrets
- [ ] PR #2 is merged to main
- [ ] Workflow triggered manually (via GitHub Actions UI or CLI)
- [ ] Workflow run completes successfully
- [ ] `.neon/auto-sync-state.json` is created
- [ ] No "Repository not found" errors in logs
- [ ] Integration branches visible (if changes detected)

---

## 🧪 Test Commands

```bash
# 1. Check secret exists (won't show value)
gh secret list | grep AUTO_SYNC_PAT

# 2. Trigger workflow
gh workflow run auto-sync-from-siblings.yml

# 3. Monitor run
gh run watch

# 4. Check state file was created
cat .neon/auto-sync-state.json

# 5. List auto-sync PRs
gh pr list --label auto-sync

# 6. View integration branches
git branch -r | grep integration/auto-sync
```

---

## 🐛 Troubleshooting

### Issue: "AUTO_SYNC_PAT not found"
**Symptom:** Workflow still fails with authentication errors  
**Fix:** 
1. Verify secret name is exactly `AUTO_SYNC_PAT` (case-sensitive)
2. Check secret is at repository level (not environment-specific)
3. Re-run workflow (secrets are cached)

### Issue: "Repository not found" still occurs
**Symptom:** Git fetch fails with 404  
**Possible causes:**
1. PAT doesn't have `repo` scope
2. PAT expired
3. Repository names in config are incorrect

**Fix:**
```bash
# Verify repo names
cat scripts/auto-sync/config.json

# They should be:
# - KofiRusu/neon-v2.4.0 (lowercase neon)
# - KofiRusu/Neon-v2.5.0 (capital Neon)
# - KofiRusu/NeonHub-v3.0 (capital NeonHub)
```

### Issue: Token visible in logs
**Symptom:** Worried about token exposure  
**Explanation:** Git automatically redacts tokens in URLs  
**Verification:** Check workflow logs - you'll see `https://***@github.com/...`

---

## 📊 Expected First Run Results

### If No Changes Detected
```
- Fetches from all 3 repos ✅
- State file created with current SHAs ✅
- No PRs created (expected - repos are in sync) ✅
```

### If Changes Detected
```
- Integration branches created ✅
- PRs opened with:
  - Label: auto-sync ✅
  - Label: risk:low|medium|high ✅
  - Body: Diagnostics (files, tests, risk) ✅
- Low-risk: Auto-merge enabled ✅
- Medium/high: Requires manual review ✅
```

---

## 🔗 Related Documentation

- **PR with Fix:** https://github.com/NeonHub3A/neonhub/pull/2
- **Workflow File:** `.github/workflows/auto-sync-from-siblings.yml`
- **Orchestrator:** `scripts/auto-sync/index.ts`
- **Launch Report:** `AUTO_SYNC_LAUNCH_REPORT.md`
- **Verification Report:** `AUTO_SYNC_VERIFICATION_REPORT.md`

---

## 📞 Support

If issues persist after following this guide:
1. Check workflow logs: `gh run view --log`
2. Verify token permissions at https://github.com/settings/tokens
3. Review PR discussion: https://github.com/NeonHub3A/neonhub/pull/2

---

**🚀 Ready to enable autonomous syncing from private repos!**

