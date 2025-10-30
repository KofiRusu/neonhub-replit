# Google Analytics 4 & Search Console OAuth Setup Guide

**Purpose:** Enable real-time analytics data ingestion for NeonHub SEO Engine  
**Owner:** Marketing Ops + DevOps  
**Status:** Required for Phase 6F completion  
**Estimated Time:** 2-3 hours

---

## Prerequisites

- [ ] Google Account with admin access to GA4 property
- [ ] Google Search Console property verified for `neonhubecosystem.com`
- [ ] Access to NeonHub production environment variables
- [ ] Billing enabled on Google Cloud (for API access)

---

## Step 1: Create Google Cloud Project

### 1.1 Navigate to Google Cloud Console

```
https://console.cloud.google.com/
```

### 1.2 Create New Project

1. Click "Select a project" dropdown (top navigation)
2. Click "NEW PROJECT"
3. **Project name:** `neonhub-analytics`
4. **Organization:** (select your org)
5. Click "CREATE"

### 1.3 Enable Required APIs

Navigate to **APIs & Services > Library** and enable:

1. **Google Analytics Data API (GA4)**
   - Search: "Google Analytics Data API"
   - Click the API
   - Click "ENABLE"

2. **Google Search Console API**
   - Search: "Search Console API"
   - Click the API
   - Click "ENABLE"

3. **Google Analytics Reporting API** (legacy, optional)
   - Only if using Universal Analytics data

---

## Step 2: Create OAuth 2.0 Credentials

### 2.1 Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** (or Internal if G Suite)
3. Click "CREATE"

**App Information:**
- **App name:** `NeonHub SEO Engine`
- **User support email:** `support@neonhubecosystem.com`
- **App logo:** (optional, upload NeonHub logo)
- **App domain:**
  - Homepage: `https://neonhubecosystem.com`
  - Privacy policy: `https://neonhubecosystem.com/privacy`
  - Terms of service: `https://neonhubecosystem.com/terms`
- **Developer contact:** `dev@neonhubecosystem.com`

**Scopes:**
- Click "ADD OR REMOVE SCOPES"
- Add the following scopes:
  ```
  https://www.googleapis.com/auth/analytics.readonly
  https://www.googleapis.com/auth/webmasters.readonly
  ```
- Click "UPDATE"
- Click "SAVE AND CONTINUE"

**Test users:**
- Add your Google account email
- Click "SAVE AND CONTINUE"

### 2.2 Create OAuth Client ID

1. Go to **APIs & Services > Credentials**
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. **Application type:** Web application
4. **Name:** `NeonHub SEO Analytics Client`

**Authorized JavaScript origins:**
```
https://neonhubecosystem.com
http://localhost:3000  (for local development)
```

**Authorized redirect URIs:**
```
https://neonhubecosystem.com/api/auth/google/callback
http://localhost:3000/api/auth/google/callback
```

5. Click "CREATE"

### 2.3 Download Credentials

1. **Client ID** and **Client Secret** will be displayed
2. Click "DOWNLOAD JSON" (save as `google-oauth-credentials.json`)
3. **⚠️ IMPORTANT:** Store securely, never commit to git

---

## Step 3: Configure Environment Variables

### 3.1 Extract Credentials

From the downloaded JSON file, extract:
- `client_id`
- `client_secret`

### 3.2 Add to `.env` Files

**Production (`.env`):**
```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID="123456789-abc123def456.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-Abc123Def456Ghi789Jkl012"
GOOGLE_REDIRECT_URI="https://neonhubecosystem.com/api/auth/google/callback"

# GA4 Configuration
GA4_PROPERTY_ID="123456789"
GA4_MEASUREMENT_ID="G-XXXXXXXXX"

# Search Console
GSC_SITE_URL="https://neonhubecosystem.com"
```

**Local Development (`apps/api/.env.local`):**
```bash
GOOGLE_CLIENT_ID="123456789-abc123def456.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-Abc123Def456Ghi789Jkl012"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
GA4_PROPERTY_ID="123456789"
GSC_SITE_URL="https://neonhubecosystem.com"
```

### 3.3 Add to Deployment Secrets

**Vercel:**
```bash
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GA4_PROPERTY_ID
vercel env add GSC_SITE_URL
```

**Railway:**
```bash
railway variables set GOOGLE_CLIENT_ID="..."
railway variables set GOOGLE_CLIENT_SECRET="..."
```

---

## Step 4: Verify GA4 Property Access

### 4.1 Find GA4 Property ID

1. Go to **Google Analytics** (https://analytics.google.com/)
2. Select your GA4 property
3. Go to **Admin** (gear icon, bottom left)
4. Under "Property" column, click **Property Settings**
5. Copy **Property ID** (format: `123456789`)

### 4.2 Grant Service Account Access (Optional)

For server-to-server access without OAuth:

1. In GA4 Admin, go to **Property Access Management**
2. Click "+" (Add users)
3. Add your service account email: `neonhub-analytics@PROJECT_ID.iam.gserviceaccount.com`
4. Role: **Viewer**
5. Click "Add"

---

## Step 5: Verify Search Console Property

### 5.1 Check Property Verification

1. Go to **Google Search Console** (https://search.google.com/search-console)
2. Select property: `https://neonhubecosystem.com`
3. Verify ownership is confirmed (green checkmark)

### 5.2 Add Additional Users (if needed)

1. Go to **Settings** (gear icon)
2. Click "Users and permissions"
3. Add service account or team members
4. Permission: **Full** or **Restricted**

---

## Step 6: Test OAuth Flow

### 6.1 Start Local Development Server

```bash
cd /Users/kofirusu/Desktop/NeonHub
pnpm --filter apps/api dev
```

### 6.2 Trigger OAuth Flow

**Option A: Manual Test (Browser)**
```
http://localhost:3001/api/auth/google
```

Expected flow:
1. Redirect to Google OAuth consent screen
2. User grants permissions
3. Redirect back to `/api/auth/google/callback`
4. Access token stored in session

**Option B: Automated Test (cURL)**
```bash
# Get authorization URL
curl http://localhost:3001/api/auth/google/authorize

# Follow the URL in browser
# After redirect, copy the 'code' parameter from URL

# Exchange code for access token
curl -X POST http://localhost:3001/api/auth/google/token \
  -H "Content-Type: application/json" \
  -d '{"code":"4/0AfJohXm..."}'
```

### 6.3 Test Data Fetching

```bash
# Test GA4 data fetch
curl http://localhost:3001/api/analytics/ga4/metrics \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Test Search Console data fetch
curl http://localhost:3001/api/seo/search-console/metrics \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response: JSON with metrics (impressions, clicks, CTR, etc.)

---

## Step 7: Verify BullMQ Job Runs

### 7.1 Check Job Logs

```bash
# View API logs
pnpm --filter apps/api logs

# Look for: "[seo-analytics] Synced Google Search Console metrics"
```

### 7.2 Check Database for New Data

```sql
-- Check if SEOMetric table is being populated
SELECT 
  COUNT(*) as total_metrics,
  MAX(created_at) as last_sync,
  COUNT(DISTINCT url) as unique_urls
FROM seo_metrics
WHERE created_at > NOW() - INTERVAL '1 day';
```

Expected result: `total_metrics > 0`, `last_sync < 24 hours ago`

---

## Troubleshooting

### Issue 1: "redirect_uri_mismatch"

**Symptom:** OAuth error: "The redirect URI in the request does not match..."

**Solution:**
1. Go to Google Cloud Console > Credentials
2. Edit OAuth client
3. Ensure redirect URI exactly matches (check trailing slashes)
4. Wait 5 minutes for changes to propagate

---

### Issue 2: "insufficient_permissions"

**Symptom:** API returns 403 Forbidden

**Solution:**
1. Check OAuth scopes include:
   - `https://www.googleapis.com/auth/analytics.readonly`
   - `https://www.googleapis.com/auth/webmasters.readonly`
2. Re-authenticate user to request new scopes
3. Revoke access in Google Account settings and re-authorize

---

### Issue 3: "property_not_found"

**Symptom:** GA4 API returns "Property ID not found"

**Solution:**
1. Verify `GA4_PROPERTY_ID` is numeric (not measurement ID starting with `G-`)
2. Ensure authenticated user has Viewer access to GA4 property
3. Check property is GA4 (not Universal Analytics)

---

### Issue 4: "site_not_verified"

**Symptom:** Search Console API returns "Site not verified"

**Solution:**
1. Go to Search Console > Settings > Ownership verification
2. Ensure DNS TXT record or HTML file verification is complete
3. Wait up to 48 hours for verification to propagate
4. Ensure authenticated user has "Owner" or "Full" permission

---

## Security Best Practices

### 1. Rotate Credentials Regularly

- [ ] Rotate OAuth Client Secret every 90 days
- [ ] Update in all environments (production, staging, local)

### 2. Use Service Accounts for Production

Instead of user OAuth, create a service account:

```bash
gcloud iam service-accounts create neonhub-analytics \
  --display-name "NeonHub SEO Analytics"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member "serviceAccount:neonhub-analytics@PROJECT_ID.iam.gserviceaccount.com" \
  --role "roles/analytics.viewer"
```

### 3. Audit Access Logs

- [ ] Review OAuth tokens issued in Google Cloud Console
- [ ] Monitor API usage in Google Cloud > APIs & Services > Dashboard
- [ ] Set up alerts for unusual activity (Sentry, CloudWatch)

---

## Next Steps

After completing OAuth setup:

1. ✅ **Update Progress Report**
   - Mark Phase 6F as 100% complete
   - Update blockers status

2. ✅ **Enable Production Dashboard**
   - Replace mocked analytics data
   - Wire `seo.getMetrics` tRPC endpoint

3. ✅ **Schedule Daily Sync**
   - Verify BullMQ job runs at midnight UTC
   - Monitor for failures

4. ✅ **Train Team**
   - Share this guide with Marketing Ops
   - Document credential rotation process

---

## Useful Links

- **Google Cloud Console:** https://console.cloud.google.com/
- **GA4 API Documentation:** https://developers.google.com/analytics/devguides/reporting/data/v1
- **Search Console API:** https://developers.google.com/webmaster-tools/v1/api_reference_index
- **OAuth 2.0 Playground:** https://developers.google.com/oauthplayground/
- **NeonHub Analytics Dashboard:** https://neonhubecosystem.com/dashboard/seo

---

**Document Owner:** DevOps Team  
**Last Updated:** October 30, 2025  
**Next Review:** November 30, 2025
