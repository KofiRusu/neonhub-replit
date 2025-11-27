# OAuth Connectors Setup Guide

**Version:** v3.2.0  
**Last Updated:** November 2, 2025  
**Environment:** Production

---

## 🔐 Overview

NeonHub supports OAuth 2.0 authentication for 5 priority third-party connectors:

1. **Google Analytics 4 (GA4)** ✅ Complete
2. **Google Search Console (GSC)** ✅ Complete  
3. **LinkedIn** ✅ Complete
4. **Instagram** ✅ Complete
5. **Facebook Pages** ✅ Complete

All OAuth flows save credentials to the `connector_auths` database table with automatic refresh token management where supported.

---

## 🎯 Google (GA4 + GSC)

### Required Scopes (Least Privilege)

```
https://www.googleapis.com/auth/analytics.readonly
https://www.googleapis.com/auth/webmasters.readonly
https://www.googleapis.com/auth/userinfo.email
```

### Setup Steps

1. **Create Google Cloud Project**
   - Go to: https://console.cloud.google.com
   - Create new project: "NeonHub Production"

2. **Enable APIs**
   - Google Analytics Data API
   - Google Search Console API

3. **Configure OAuth Consent Screen**
   - User Type: External (for multi-tenant) or Internal (single org)
   - App name: NeonHub
   - Support email: support@neonhubecosystem.com
   - Scopes: Add the 3 scopes listed above
   - Add test users (for testing phase)

4. **Create OAuth Credentials**
   - Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://api.neonhubecosystem.com/api/oauth/google/callback`
     - `https://api.staging.neonhubecosystem.com/api/oauth/google/callback` (staging)
     - `http://localhost:4100/api/oauth/google/callback` (local dev)

5. **Get Credentials**
   - Client ID: `xxx.apps.googleusercontent.com`
   - Client secret: `GOCSPX-xxx`

6. **Set Environment Variables**
   ```env
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxx
   GOOGLE_REDIRECT_URI=https://api.neonhubecosystem.com/api/oauth/google/callback
   ```

### Testing

```bash
# Start OAuth flow
open "https://api.neonhubecosystem.com/api/oauth/google/start?userId=USER_ID&organizationId=ORG_ID"

# Should redirect to Google consent screen
# After approval, redirects back with tokens saved to database
```

---

## 💼 LinkedIn

### Required Scopes (Least Privilege)

```
r_liteprofile          # Basic profile info
r_emailaddress         # Email address
w_member_social        # Post to feed
r_organization_social  # Read org posts
```

### Setup Steps

1. **Create LinkedIn App**
   - Go to: https://www.linkedin.com/developers/apps
   - Create app: "NeonHub"
   - Company: Your LinkedIn company page

2. **Configure OAuth Settings**
   - Redirect URLs:
     - `https://api.neonhubecosystem.com/api/oauth/linkedin/callback`
     - `https://api.staging.neonhubecosystem.com/api/oauth/linkedin/callback`
     - `http://localhost:4100/api/oauth/linkedin/callback`

3. **Request Scopes**
   - Products tab → Select "Share on LinkedIn" and "Sign In with LinkedIn"
   - Add scopes listed above

4. **Get Credentials**
   - Auth tab → Client ID and Client Secret

5. **Set Environment Variables**
   ```env
   LINKEDIN_CLIENT_ID=xxx
   LINKEDIN_CLIENT_SECRET=xxx
   LINKEDIN_REDIRECT_URI=https://api.neonhubecosystem.com/api/oauth/linkedin/callback
   ```

### Limitations

⚠️ LinkedIn does not provide refresh tokens by default. Users must re-authenticate when tokens expire (typically 60 days).

---

## 📱 Instagram (Meta Graph API)

### Required Scopes (Least Privilege)

```
instagram_basic               # Basic profile info
instagram_content_publish     # Publish photos/videos
pages_show_list              # List connected Pages
```

### Setup Steps

1. **Create Meta App**
   - Go to: https://developers.facebook.com/apps
   - Create app → Type: Business
   - Add Instagram Graph API product

2. **Configure OAuth Settings**
   - App Settings → Basic
   - Add redirect URIs:
     - `https://api.neonhubecosystem.com/api/oauth/instagram/callback`
     - `https://api.staging.neonhubecosystem.com/api/oauth/instagram/callback`
     - `http://localhost:4100/api/oauth/instagram/callback`

3. **Add Instagram Test Users**
   - Roles → Instagram Testers
   - Add Instagram accounts for testing

4. **Request Advanced Access** (for production)
   - Permissions and Features
   - Request advanced access for required permissions
   - Provide use case documentation

5. **Get Credentials**
   - App ID (META_APP_ID)
   - App Secret (META_APP_SECRET)

6. **Set Environment Variables**
   ```env
   META_APP_ID=xxx
   META_APP_SECRET=xxx
   ```

### Important Notes

- ⚠️ Meta tokens are **short-lived** (1 hour by default)
- Long-lived tokens (60 days) require exchange endpoint
- Production requires **App Review** and **Advanced Access**
- Test mode limited to app admins/developers/testers

---

## 📘 Facebook Pages

### Required Scopes (Least Privilege)

```
pages_show_list           # List managed Pages
pages_read_engagement     # Read Page insights
pages_manage_posts        # Create/publish posts
pages_manage_metadata     # Update Page settings
```

### Setup Steps

**Same app as Instagram** - Meta apps cover both Facebook and Instagram.

1. Add Facebook Login product to same app
2. Configure same redirect URIs
3. Request permissions listed above
4. App Review for production use

### Testing

```bash
# Start OAuth flow
open "https://api.neonhubecosystem.com/api/oauth/facebook/start?userId=USER_ID&organizationId=ORG_ID"
```

---

## 🔍 Google Search Console (GSC)

### Implementation

GSC uses the **same OAuth flow as Google Analytics** since both are Google APIs using the same OAuth client.

**Scopes included in Google OAuth:**
```
https://www.googleapis.com/auth/webmasters.readonly
```

**Route:**
```
/api/oauth/gsc/start → redirects to /api/oauth/google/start
```

**Result:** When user completes Google OAuth, tokens are saved for **both GA4 and GSC** connectors.

---

## 🔄 Token Refresh

### Automatic Refresh (Google Only)

Google OAuth provides **refresh tokens** that NeonHub uses automatically:

```typescript
// oauth.service.ts handles refresh
const tokens = await getConnectorTokens(userId, 'GOOGLE_ANALYTICS');
// If expired, automatically refreshes using refresh_token
```

### Manual Re-Authentication (Meta, LinkedIn)

**LinkedIn:** No refresh tokens → users must re-auth after expiry  
**Meta:** Short-lived tokens (1h) → upgrade to long-lived (60 days) via exchange:

```typescript
// TODO: Implement Meta token exchange endpoint
POST /api/oauth/meta/exchange-token
{
  "shortLivedToken": "xxx",
  "userId": "xxx"
}
```

---

## 🧪 Testing OAuth Flows

### Local Development

```bash
# 1. Start API
export USE_MOCK_CONNECTORS=false
export GOOGLE_CLIENT_ID=xxx
export GOOGLE_CLIENT_SECRET=xxx
export GOOGLE_REDIRECT_URI=http://localhost:4100/api/oauth/google/callback
pnpm --filter @neonhub/backend-v3.2 run dev

# 2. Trigger OAuth
open "http://localhost:4100/api/oauth/google/start?userId=test-user&organizationId=test-org"

# 3. Check database
# Query connector_auths table for new entry
```

### Staging

```bash
open "https://api.staging.neonhubecosystem.com/api/oauth/linkedin/start?userId=USER&organizationId=ORG"
```

---

## 🔐 Security Best Practices

### Credential Storage

- ✅ Never log access tokens
- ✅ Store in `connector_auths` table (encrypted at rest by database)
- ✅ Use environment variables for client secrets
- ✅ Rotate secrets periodically

### Scopes

- ✅ Request minimum necessary scopes
- ✅ Document why each scope is needed
- ✅ Regular audit of scope usage

### State Parameter

- ✅ Generate cryptographically random state
- ✅ Store temporarily (10 min expiry)
- ✅ Validate on callback (CSRF protection)

---

## 📋 Production Checklist

### Before Launching OAuth

- [ ] All OAuth apps created (Google, LinkedIn, Meta)
- [ ] Redirect URIs configured for production domain
- [ ] Environment variables set in Railway/Vercel
- [ ] Scopes requested and approved (Meta App Review if needed)
- [ ] Test accounts configured
- [ ] Token refresh tested
- [ ] Error handling verified
- [ ] Logging configured (no secrets in logs)

### After Launch

- [ ] Monitor OAuth success rate
- [ ] Track token refresh failures
- [ ] Alert on high failure rates
- [ ] Regular credential rotation

---

## 🛠️ Troubleshooting

### OAuth Flow Fails

1. Check redirect URI matches exactly (including http/https)
2. Verify client ID/secret are correct
3. Check scopes are approved for app
4. Review app is not in development mode (for production)

### Token Refresh Fails

1. Check refresh token is saved in database
2. Verify token hasn't been revoked
3. Check API credentials haven't changed
4. Review scope changes (may invalidate tokens)

### Database Errors

1. Ensure `connector_auths` table exists (migration applied)
2. Check unique constraint on `userId + connectorKind`
3. Verify organization membership

---

## 📚 Reference

**OAuth Routes:**
- `GET /api/oauth/google/start` — Google (GA4 + GSC)
- `GET /api/oauth/linkedin/start` — LinkedIn
- `GET /api/oauth/instagram/start` — Instagram
- `GET /api/oauth/facebook/start` — Facebook Pages

**Service:**
- `apps/api/src/services/oauth.service.ts` — Token management

**Database:**
- Table: `connector_auths`
- Columns: userId, connectorKind, accessToken, refreshToken, expiresAt, scopes, metadata

---

*Last Updated: November 2, 2025*  
*NeonHub v3.2.0 — Production OAuth Setup*

