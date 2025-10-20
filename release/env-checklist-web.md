# Web Environment Variables Checklist

**Platform:** Vercel  
**Application:** NeonHub Web v3.0  
**Last Updated:** 2025-10-18

## Required Environment Variables

### API Configuration

- [ ] `NEXT_PUBLIC_API_URL`
  - **Value:** Your production API URL
  - **Description:** Backend API base URL
  - **Required:** Yes
  - **Example:** `https://api.your-domain.com`
  - **Note:** Must include protocol (https://) and no trailing slash

### Authentication

- [ ] `NEXTAUTH_URL`
  - **Value:** Your production web URL
  - **Description:** Frontend application URL for NextAuth
  - **Required:** Yes
  - **Example:** `https://your-domain.com`
  - **Note:** Must match your actual domain

- [ ] `NEXTAUTH_SECRET`
  - **Value:** Generated from `scripts/generate-production-secrets.sh`
  - **Description:** NextAuth encryption key (min 32 characters)
  - **Required:** Yes
  - **Security:** Store in Vercel environment variables as secret
  - **Note:** Must match value used in API deployment

## Optional Environment Variables

### Analytics & Monitoring

- [ ] `NEXT_PUBLIC_GA_ID`
  - **Value:** Google Analytics measurement ID
  - **Description:** Google Analytics tracking
  - **Required:** No
  - **Example:** `G-XXXXXXXXXX`

- [ ] `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`
  - **Value:** Vercel Analytics ID
  - **Description:** Vercel Analytics tracking
  - **Required:** No
  - **Note:** Auto-configured if enabled in Vercel

### Feature Flags

- [ ] `NEXT_PUBLIC_ENABLE_ANALYTICS`
  - **Value:** `true` | `false`
  - **Description:** Enable/disable analytics
  - **Required:** No
  - **Default:** `true`

- [ ] `NEXT_PUBLIC_ENABLE_ERROR_REPORTING`
  - **Value:** `true` | `false`
  - **Description:** Enable/disable error reporting
  - **Required:** No
  - **Default:** `true`

### External Services

- [ ] `NEXT_PUBLIC_SENTRY_DSN`
  - **Value:** Sentry DSN for client-side error tracking
  - **Description:** Frontend error tracking
  - **Required:** No
  - **Example:** `https://...@sentry.io/...`

## Environment Variable Types

### Public Variables (NEXT_PUBLIC_*)
Variables prefixed with `NEXT_PUBLIC_` are:
- Exposed to the browser
- Bundled into the client-side JavaScript
- Should NOT contain secrets
- Visible in browser DevTools

### Private Variables
Variables without `NEXT_PUBLIC_` prefix are:
- Only available server-side
- Used during build time and API routes
- Safe for secrets like `NEXTAUTH_SECRET`

## Vercel Configuration

### Setting Variables in Vercel

1. Go to Project Settings > Environment Variables
2. Add variables for each environment:
   - **Production:** Used for production deployments
   - **Preview:** Used for PR preview deployments
   - **Development:** Used for local development

### Recommended Setup

```
Variable Name: NEXT_PUBLIC_API_URL
Production:    https://api.your-domain.com
Preview:       https://api-preview.your-domain.com
Development:   http://localhost:3001
```

## Security Checklist

- [ ] No secrets in `NEXT_PUBLIC_*` variables
- [ ] `NEXTAUTH_SECRET` marked as sensitive in Vercel
- [ ] API URL uses HTTPS in production
- [ ] All public variables reviewed for sensitive data
- [ ] Environment variables set for all environments (Production/Preview/Development)

## Validation Commands

### Check Variables Locally

```bash
# View environment variables during build
npm run build

# Check public variables in browser console
console.log(process.env.NEXT_PUBLIC_API_URL)
```

### Verify After Deployment

```bash
# Check if web can reach API
curl https://your-domain.com/api/health

# Verify environment in browser DevTools
# Open browser console and check window.env or similar
```

## Platform-Specific Notes

### Vercel

- **Automatic Redeploy:** Changes to environment variables automatically trigger redeployment
- **Branch-Specific:** Can set different values per Git branch
- **Secrets:** Mark sensitive variables with lock icon
- **Preview Deployments:** Each PR gets its own environment
- **Environment Inheritance:** Development inherits from Preview, Preview inherits from Production

### Environment Types

1. **Production Environment**
   - Used for: `main` or `master` branch deployments
   - Domain: Your primary domain
   - Use: Production API URLs and credentials

2. **Preview Environment**
   - Used for: Pull request deployments
   - Domain: Auto-generated preview URLs
   - Use: Staging or preview API URLs

3. **Development Environment**
   - Used for: Local development with `vercel dev`
   - Domain: localhost
   - Use: Local API URLs

## Common Configuration Scenarios

### Scenario 1: Single Production Environment

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<your-secret>
```

### Scenario 2: With Preview Environment

**Production:**
```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXTAUTH_URL=https://your-domain.com
```

**Preview:**
```bash
NEXT_PUBLIC_API_URL=https://api-staging.your-domain.com
NEXTAUTH_URL=https://preview.your-domain.com
```

### Scenario 3: With Analytics

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<your-secret>
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Post-Deployment Validation

After setting environment variables:

1. **Trigger Deployment**
   ```bash
   # Commit and push to trigger automatic deployment
   git push origin main
   ```

2. **Check Build Logs**
   - Verify no missing environment variable errors
   - Check that public variables are being injected

3. **Test in Browser**
   ```javascript
   // Open browser DevTools console on your site
   console.log(process.env.NEXT_PUBLIC_API_URL)
   // Should output your API URL
   ```

4. **Verify API Connection**
   - Navigate to your web app
   - Check browser Network tab
   - Verify requests going to correct API URL

5. **Test Authentication**
   - Try to sign in
   - Verify redirects work correctly
   - Check session persistence

## Troubleshooting

### Issue: API requests failing

**Solution:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check for trailing slashes (should not have them)
- Ensure URL includes protocol (https://)
- Verify CORS settings in API

### Issue: Authentication not working

**Solution:**
- Confirm `NEXTAUTH_URL` matches your actual domain
- Verify `NEXTAUTH_SECRET` is same as API deployment
- Check that secret is at least 32 characters
- Clear browser cookies and try again

### Issue: Variables not updating

**Solution:**
- Trigger a new deployment after changing variables
- Clear Vercel build cache if needed
- Verify correct environment (Production/Preview/Development)
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Public variables undefined in browser

**Solution:**
- Ensure variable name starts with `NEXT_PUBLIC_`
- Rebuild application after adding variables
- Check browser console for build-time errors
- Verify variable is set in correct environment

## Migration Notes

When updating environment variables:

1. **Update Vercel first** (to avoid downtime)
2. **Deploy new version** (automatic on variable change)
3. **Test thoroughly** before directing traffic
4. **Keep old values** as backup for rollback

## Best Practices

- ✅ Use descriptive variable names
- ✅ Document each variable's purpose
- ✅ Set variables for all environments
- ✅ Use separate secrets for each environment
- ✅ Review public variables for sensitive data
- ❌ Never commit secrets to repository
- ❌ Don't expose API keys in public variables
- ❌ Don't use production secrets in preview/development

## Quick Reference

| Variable | Type | Required | Example |
|----------|------|----------|---------|
| NEXT_PUBLIC_API_URL | Public | Yes | https://api.your-domain.com |
| NEXTAUTH_URL | Private | Yes | https://your-domain.com |
| NEXTAUTH_SECRET | Private | Yes | Generated 32+ char string |
| NEXT_PUBLIC_GA_ID | Public | No | G-XXXXXXXXXX |
| NEXT_PUBLIC_SENTRY_DSN | Public | No | https://...@sentry.io/... |

---

**Last Verified:** 2025-10-18  
**Version:** 3.0.0  
**Platform:** Vercel