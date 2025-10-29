# Domain Attach Guide: neonhubecosystem.com → Vercel

**Status:** Ready to Execute  
**Script Location:** `scripts/attach-domain-audit.sh`  
**Mode:** DRY_RUN (safe mode) by default

---

## 📋 Quick Summary

Based on the audit in `VERCEL_DOMAIN_AUDIT_REPORT.md`, we've confirmed:
- ✅ DNS points to Vercel
- ✅ Vercel is serving requests
- ❌ Domain is NOT attached to any project (causing 404)
- ✅ Script ready to fix the issue

---

## 🚀 How to Run

### Step 1: Get Your Vercel Token

1. Go to: https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it: `NeonHub Domain Management`
4. Scope: Full Account (or at least Domain + Deployment access)
5. Click "Create"
6. Copy the token (you'll only see it once!)

### Step 2: Set the Token

```bash
export VERCEL_TOKEN="your_vercel_token_here"
```

**Security Note:** The token will only exist in your current shell session. Don't commit it to git.

### Step 3: Run in DRY_RUN Mode (Safe - No Changes)

```bash
cd /Users/kofirusu/Desktop/NeonHub
./scripts/attach-domain-audit.sh
```

This will:
- ✅ Check DNS records
- ✅ Query Vercel API for projects
- ✅ Find the matching project (NeonHub3A/neonhub)
- ✅ Show what WOULD happen
- ❌ NOT make any changes (DRY_RUN=1)

### Step 4: Review the Output

The script will show:
```
[3] Candidate projects (by repo match):
ProjectID    Name       Team                              ProdBranch  Framework  BR_MATCH
prj_xxxx     neonhub    team_abc123...                    main        nextjs     YES

[4] Selected project:
{
  "id": "prj_xxxx",
  "name": "neonhub",
  "accountId": "team_abc123...",
  "framework": "nextjs",
  "link": {
    "type": "github",
    "repo": "NeonHub3A/neonhub",
    "productionBranch": "main"
  }
}

[5] Checking attached domains for the project…
Attached count for neonhubecosystem.com: 0

[6] DRY RUN: Would attach domain "neonhubecosystem.com" to project prj_xxxx.
```

### Step 5: Execute (Actually Attach the Domain)

If the DRY_RUN output looks correct, run with `DRY_RUN=0`:

```bash
# Method 1: Edit the script
# Open scripts/attach-domain-audit.sh
# Change: DRY_RUN=1  →  DRY_RUN=0

# Then run:
./scripts/attach-domain-audit.sh
```

OR

```bash
# Method 2: Override via environment variable
DRY_RUN=0 ./scripts/attach-domain-audit.sh
```

### Step 6: Wait for DNS Propagation

After attaching:
- **Immediate:** Vercel will accept the domain
- **30-120 seconds:** DNS/CDN propagation
- **5-10 minutes:** Global edge network update

Test with:
```bash
# Should return HTTP 200 (not 404) after propagation
curl -sI https://neonhubecosystem.com

# Or open in browser:
open https://neonhubecosystem.com
```

---

## 🔧 Script Configuration

The script has configurable variables at the top:

```bash
DOMAIN="neonhubecosystem.com"           # The domain to attach
EXPECTED_REPO_SLUG="NeonHub3A/neonhub"  # Your GitHub repo
EXPECTED_BRANCH="main"                   # Production branch
TEAM_SLUG=""                            # Optional: Vercel team slug
DRY_RUN=1                               # 1=safe mode, 0=execute
```

### If You Need to Change the Repo or Branch:

Edit `scripts/attach-domain-audit.sh` and update:
```bash
EXPECTED_REPO_SLUG="YourOrg/your-repo"
EXPECTED_BRANCH="production"  # or whatever your prod branch is
```

---

## 🔍 What the Script Does

### In DRY_RUN Mode (DRY_RUN=1):
1. ✅ Checks DNS records
2. ✅ Queries Vercel API for all projects
3. ✅ Finds projects matching your repo
4. ✅ Checks if domain is already attached
5. ✅ Shows what WOULD happen
6. ❌ Does NOT make changes

### In Execute Mode (DRY_RUN=0):
1. ✅ Checks DNS records
2. ✅ Queries Vercel API for all projects
3. ✅ Finds projects matching your repo
4. ✅ Checks if domain is already attached
5. ⚠️ **ATTACHES the domain** if not already present
6. ✅ Verifies the attachment
7. ✅ Tests HTTP response

---

## 📊 Expected Output (After Successful Attach)

```
===== SUMMARY =====
Domain:        neonhubecosystem.com
Project ID:    prj_xxxxxxxxxxxx
Repo:          NeonHub3A/neonhub
Prod branch:   main
Team (acctId): team_xxxxxxxxxxxx
Dry run:       0
Attached now?: 1 (0=no, >0=yes)
==================
```

And HTTP response should show:
```
FINAL_HDR: HTTP/2 200 
FINAL_HDR: server: Vercel
FINAL_HDR: content-type: text/html; charset=utf-8
```

(Instead of the previous 404 NOT_FOUND)

---

## 🚨 Troubleshooting

### Error: "VERCEL_TOKEN not set"
```bash
export VERCEL_TOKEN="your_token_here"
# Then re-run the script
```

### Error: "No Vercel project found linked to NeonHub3A/neonhub"

**Option 1:** Check if the repo slug is correct
```bash
# View all your Vercel projects
curl -fsSL -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects?limit=200" | jq -r '.projects[] | {name, link}'
```

**Option 2:** The repo might not be connected to Vercel yet
- Go to: https://vercel.com/new
- Import the GitHub repo: `NeonHub3A/neonhub`
- Set root directory to `apps/web` (or wherever your Next.js app is)
- Deploy it
- Then re-run the script

### Error: "jq: command not found"
```bash
brew install jq
```

### Domain Attached but Still Shows 404

**Wait 2-5 minutes** for DNS/CDN propagation, then:
```bash
# Clear DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Test again
curl -sI https://neonhubecosystem.com
```

If still 404 after 10 minutes:
1. Check Vercel dashboard: Does the project have a successful deployment?
2. Check build logs: Any errors during build?
3. Verify the domain is in "Production" state (not just added)

---

## 🔐 Security Notes

- ✅ The script uses read-only API calls in DRY_RUN mode
- ⚠️ With `DRY_RUN=0`, it will ATTACH a domain (write operation)
- 🔒 Never commit VERCEL_TOKEN to git
- 🔒 The token is only in your shell session (not persisted)
- ✅ GitHub Actions uses `secrets.VERCEL_TOKEN` from repo secrets

---

## 📚 Related Documentation

- **Audit Report:** `VERCEL_DOMAIN_AUDIT_REPORT.md` (comprehensive findings)
- **Vercel Domains API:** https://vercel.com/docs/rest-api/endpoints/domains
- **DNS Setup:** https://vercel.com/docs/projects/domains/add-a-domain
- **GitHub Workflow:** `.github/workflows/release.yml` (automated deployments)

---

## ✅ Next Steps After Domain is Attached

1. **Verify the site loads:**
   ```bash
   open https://neonhubecosystem.com
   ```

2. **Run smoke tests:**
   ```bash
   ./scripts/smoke-test-production.sh https://api.neonhubecosystem.com https://neonhubecosystem.com
   ```

3. **Update SSL/HSTS settings** (if needed):
   - Go to Vercel dashboard → Project Settings → Domains
   - Verify SSL certificate is issued
   - Check HTTPS redirect is enabled

4. **Monitor for 24 hours:**
   - Check Vercel Analytics
   - Verify no 404s in logs
   - Test all major routes (/, /dashboard, /analytics, etc.)

---

## 🎯 Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Get Vercel Token | 2 min | Manual |
| Run DRY_RUN | 30 sec | Automated |
| Execute Attach | 10 sec | Automated |
| DNS Propagation | 1-5 min | Automatic |
| Site Live | 5-10 min | Automatic |

**Total:** ~10 minutes from start to finish

---

## 📞 Support

If you encounter issues:
1. Check the `VERCEL_DOMAIN_AUDIT_REPORT.md` for background
2. Review Vercel dashboard logs
3. Verify GitHub repo connection in Vercel
4. Check that the production branch has a successful deployment

**Vercel Dashboard:** https://vercel.com/dashboard  
**Project URL:** https://vercel.com/kofirusu-icloudcoms-projects/v0-neon

---

**Last Updated:** 2025-10-27  
**Script Version:** 1.0  
**Audit Report:** See `VERCEL_DOMAIN_AUDIT_REPORT.md`

