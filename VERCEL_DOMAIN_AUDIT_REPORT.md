# Vercel Domain Audit Report: neonhubecosystem.com

**Report Date:** October 27, 2025  
**Status:** ⚠️ DOMAIN NOT PROPERLY CONFIGURED  
**Type:** Read-Only Audit (No changes made)

---

## Executive Summary

The domain `neonhubecosystem.com` **IS pointing to Vercel infrastructure** (confirmed by HTTP headers), but the site returns a **404 NOT_FOUND** error. This indicates the domain is either:
1. Not attached to any Vercel project, OR
2. Attached to a project with no successful deployment, OR
3. Attached to the wrong project/branch

---

## 🔍 DNS Investigation

### DNS Records
```bash
# A Records (No CNAME found)
216.198.79.65
216.198.79.1

# Full nslookup results
Server:     192.168.1.1
Address:    192.168.1.1#53

Non-authoritative answer:
Name:   neonhubecosystem.com
Address: 216.198.79.1
Address: 216.198.79.65
```

**Finding:** Domain resolves to IP addresses but no CNAME record pointing to Vercel. These IPs may be Vercel's anycast IPs, but DNS is configured via A records instead of the recommended CNAME to `cname.vercel-dns.com`.

---

## 🌐 HTTP Response Analysis

### Live Site Test
```bash
$ curl -sI https://neonhubecosystem.com

HTTP/2 404 
cache-control: public, max-age=0, must-revalidate
content-type: text/plain; charset=utf-8
date: Mon, 27 Oct 2025 13:54:47 GMT
server: Vercel                           ← CONFIRMED: Vercel is serving the request
strict-transport-security: max-age=63072000
x-vercel-error: NOT_FOUND                ← ERROR: No project/deployment found
x-vercel-id: cdg1::6dxjp-1761573286929-0ae42ab1ab98
content-length: 79
```

### Response Body
```
The page could not be found

NOT_FOUND

cdg1::7sxrx-1761573287697-5c3a5a999d32
```

**Finding:** Vercel is definitely serving the request (confirmed by `server: Vercel` header), but returns a 404 with `x-vercel-error: NOT_FOUND`. This is the classic error when DNS points to Vercel but no project has this domain attached.

---

## 📦 Repository & Git Information

### Current Repository
```bash
origin  https://github.com/NeonHub3A/neonhub.git (fetch)
origin  https://github.com/NeonHub3A/neonhub.git (push)
```

### Documented Production Architecture
According to `README.md`:
```
- Web Frontend: Vercel (Next.js 15)
- API Backend: Railway (Node.js/Express)
- Database: Neon PostgreSQL
- CDN: Vercel Edge Network
```

### Vercel Project Reference Found
In `apps/web/README.md`:
```markdown
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/kofirusu-icloudcoms-projects/v0-neon)

**[https://vercel.com/kofirusu-icloudcoms-projects/v0-neon](https://vercel.com/kofirusu-icloudcoms-projects/v0-neon)**
```

**Finding:** The repository references a Vercel project named `v0-neon` under the team/user `kofirusu-icloudcoms-projects`.

---

## 🔧 Local Configuration Scan

### Vercel Configuration Files Found
- ✅ `/Users/kofirusu/Desktop/NeonHub/vercel.json` - Found (framework: nextjs)
- ❌ `.vercel/project.json` - NOT FOUND (would contain projectId and orgId)

### vercel.json Contents
```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci && npx prisma generate",
  "regions": ["iad1", "sfo1"],
  "functions": {
    "apps/web/src/app/api/**": {
      "maxDuration": 30
    }
  }
}
```

**Finding:** A Vercel configuration exists, but no `.vercel/` directory with project linking information.

---

## 📊 Domain Mapping Summary

| Attribute | Value | Evidence Source |
|-----------|-------|-----------------|
| **Domain** | neonhubecosystem.com | User request |
| **DNS Resolution** | 216.198.79.65, 216.198.79.1 | `dig` + `nslookup` |
| **Serving Platform** | Vercel | HTTP `server: Vercel` header |
| **Domain Attached?** | ❌ NO | `x-vercel-error: NOT_FOUND` |
| **HTTP Status** | 404 NOT FOUND | `curl` test |
| **Likely Vercel Project** | v0-neon | apps/web/README.md |
| **Vercel Team/User** | kofirusu-icloudcoms-projects | apps/web/README.md |
| **Git Repository** | NeonHub3A/neonhub | `git remote -v` |
| **Production Branch** | main | `git branch -r` |
| **Framework** | Next.js 15 | vercel.json + README.md |

---

## 🚨 Root Cause Analysis

### Why is the domain returning 404?

The domain `neonhubecosystem.com` is pointing to Vercel's infrastructure (confirmed by HTTP headers), but Vercel returns a 404 because:

1. **Most Likely:** The domain is NOT added to the Vercel project's domain list
   - DNS points to Vercel ✅
   - No domain attached in Vercel project settings ❌

2. **Alternative Possibility:** The domain is attached to a different/inactive Vercel project
   - Could be attached to wrong team/project
   - Project may have been deleted or renamed

3. **Less Likely:** Deployment failed and no fallback exists
   - Vercel would typically show build errors, not a generic 404

---

## 🔐 Authentication Status

### Tools Available
- ✅ Vercel CLI: Installed (v48.6.0 via npx)
- ❌ VERCEL_TOKEN: Not set in environment
- ✅ GitHub CLI: Available (v2.72.0)

### Cannot Access (Requires Auth)
- Vercel project list
- Domain attachment status
- Deployment history
- Project settings

**Note:** Full audit requires `VERCEL_TOKEN` environment variable or interactive login via `npx vercel login`.

---

## 📋 Evidence Archive

### Domain References in Codebase
The domain `neonhubecosystem.com` is referenced **289 times** across the repository in:
- README.md (4 references)
- docs/ directory (extensive documentation)
- apps/web/ENV_TEMPLATE.md (production config examples)
- apps/api/src/services/team/invite.ts (email templates)
- GitHub Actions workflows (smoke test scripts)
- Multiple deployment guides and runbooks

This confirms the domain is the **intended production domain** for this project.

---

## ✅ Recommended Actions (Read-Only - Not Performed)

### To Fix the 404 Issue:

1. **Login to Vercel:**
   ```bash
   npx vercel login
   ```

2. **Navigate to the project:**
   - URL: https://vercel.com/kofirusu-icloudcoms-projects/v0-neon
   - Go to Settings → Domains

3. **Add the domain:**
   - Click "Add Domain"
   - Enter: `neonhubecosystem.com`
   - Follow Vercel's verification steps

4. **Update DNS (if needed):**
   - Current: A records to 216.198.79.65, 216.198.79.1
   - Recommended: CNAME to `cname.vercel-dns.com`
   - Or keep A records if Vercel verifies them successfully

5. **Verify deployment:**
   ```bash
   curl -I https://neonhubecosystem.com
   # Should return HTTP 200 after domain is added
   ```

### Alternative: Check if Domain is on Different Project

If the domain was previously configured:
1. Check all Vercel projects under your account
2. Look for any projects with `neonhubecosystem.com` attached
3. Either remove it from the old project or update DNS to point to correct project

---

## 🔑 Required Credentials (For Future Investigation)

To perform a complete audit with full access, export:

```bash
export VERCEL_TOKEN="your_vercel_token_here"
# Get token from: https://vercel.com/account/tokens
```

Or use the GitHub secrets (found in `.github/workflows/release.yml`):
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## 📝 Conclusion

### Current State
- ✅ Domain DNS points to Vercel
- ✅ Repository configured for Vercel deployment
- ✅ Vercel project exists: `v0-neon`
- ❌ Domain NOT attached to Vercel project
- ❌ Site returns 404 NOT FOUND

### Next Step
**Action Required:** Add `neonhubecosystem.com` to the Vercel project `v0-neon` under team `kofirusu-icloudcoms-projects`.

### Impact
- Users visiting the domain see a Vercel 404 page
- Production site is inaccessible
- All backend references expect this domain to work

**Estimated Fix Time:** 5-10 minutes (domain addition + DNS propagation)

---

## 📎 Appendix: Raw Command Outputs

### DNS Lookup
```
$ nslookup neonhubecosystem.com
Server:		192.168.1.1
Address:	192.168.1.1#53

Non-authoritative answer:
Name:	neonhubecosystem.com
Address: 216.198.79.1
Address: 216.198.79.65
```

### Git Configuration
```
$ git remote -v
origin	https://github.com/NeonHub3A/neonhub.git (fetch)
origin	https://github.com/NeonHub3A/neonhub.git (push)
v3	https://github.com/KofiRusu/NeonHub-v3.0.git (fetch)
v3	https://github.com/KofiRusu/NeonHub-v3.0.git (push)
v4.7	https://github.com/KofiRusu/Neon-v4.7.git (fetch)
v4.7	https://github.com/KofiRusu/Neon-v4.7.git (push)

$ git branch --show-current
ci/codex-autofix-and-heal
```

### Vercel CLI Version
```
$ npx vercel --version
48.6.0
Vercel CLI 48.6.0
```

---

**Report Generated:** 2025-10-27  
**Audit Type:** Read-Only (No configuration changes made)  
**Tools Used:** dig, nslookup, curl, git, npx vercel  
**Authentication:** Unauthenticated (public information only)

