# Staging Domain Configuration

**Environment:** Staging  
**Target Domains:**
- `app.staging.neonhubecosystem.com` → Web (Vercel)
- `api.staging.neonhubecosystem.com` → API (Railway)

---

## 🌐 Expected DNS Configuration

### Web Application (Vercel)

**Domain:** `app.staging.neonhubecosystem.com`

**DNS Records:**
```dns
Type    Name                                Value                           TTL
────────────────────────────────────────────────────────────────────────────
CNAME   app.staging.neonhubecosystem.com   cname.vercel-dns.com           3600
```

**Vercel Configuration:**
1. Go to Vercel Project Settings → Domains
2. Add domain: `app.staging.neonhubecosystem.com`
3. Vercel will provide CNAME target
4. Add DNS record with your domain registrar

---

### API Backend (Railway)

**Domain:** `api.staging.neonhubecosystem.com`

**DNS Records:**
```dns
Type    Name                                Value                           TTL
────────────────────────────────────────────────────────────────────────────
CNAME   api.staging.neonhubecosystem.com   <railway-project>.up.railway.app 3600
```

**Railway Configuration:**
1. Go to Railway Project → Settings → Networking
2. Add custom domain: `api.staging.neonhubecosystem.com`
3. Railway will provide CNAME target
4. Add DNS record with your domain registrar

---

## 🔍 DNS Verification

### Check DNS Propagation

```bash
# Web (Vercel)
dig app.staging.neonhubecosystem.com CNAME +short

# API (Railway)
dig api.staging.neonhubecosystem.com CNAME +short

# Check from multiple locations
curl https://dnschecker.org/api/app.staging.neonhubecosystem.com/CNAME
```

### Test SSL/TLS

```bash
# Vercel (auto-provisions SSL)
curl -I https://app.staging.neonhubecosystem.com

# Railway (auto-provisions SSL)
curl -I https://api.staging.neonhubecosystem.com/health
```

---

## ⚙️ Environment Variables

### Vercel (Web)

Set in Vercel Dashboard → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://api.staging.neonhubecosystem.com
NEXT_PUBLIC_SITE_URL=https://app.staging.neonhubecosystem.com
NEXTAUTH_URL=https://app.staging.neonhubecosystem.com
DATABASE_URL=<neon-staging-connection-string>
NEXTAUTH_SECRET=<generate-with-openssl>
GITHUB_ID=<oauth-client-id>
GITHUB_SECRET=<oauth-secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_***
NODE_ENV=staging
```

### Railway (API)

Set in Railway Dashboard → Project → Variables:

```
DATABASE_URL=<neon-staging-connection-string>
PORT=4100
NODE_ENV=staging
CORS_ORIGINS=https://app.staging.neonhubecosystem.com
NEXTAUTH_SECRET=<same-as-vercel>
JWT_SECRET=<generate-secure-secret>
OPENAI_API_KEY=sk-proj-***
STRIPE_SECRET_KEY=sk_test_***
STRIPE_WEBHOOK_SECRET=whsec_***
RESEND_API_KEY=re_***
GOOGLE_CLIENT_ID=***.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=***
GOOGLE_REDIRECT_URI=https://api.staging.neonhubecosystem.com/api/oauth/google/callback
LINKEDIN_CLIENT_ID=***
LINKEDIN_CLIENT_SECRET=***
LINKEDIN_REDIRECT_URI=https://api.staging.neonhubecosystem.com/api/oauth/linkedin/callback
USE_MOCK_CONNECTORS=false
```

---

## 🧪 Post-Configuration Testing

### 1. Health Checks

```bash
# API health
curl https://api.staging.neonhubecosystem.com/health

# Expected:
# {"status":"ok","db":true,"ws":true,"version":"3.2.0"}

# Web homepage
curl -I https://app.staging.neonhubecosystem.com

# Expected: HTTP/2 200 or 301/308 redirect
```

### 2. Metrics Endpoint

```bash
curl https://api.staging.neonhubecosystem.com/metrics | head -20

# Should show Prometheus metrics
```

### 3. CORS Configuration

```bash
# Test from web origin
curl -H "Origin: https://app.staging.neonhubecosystem.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://api.staging.neonhubecosystem.com/api/content/draft

# Should return Access-Control-Allow-Origin header
```

### 4. OAuth Flows

```bash
# Test Google OAuth redirect
curl -I "https://api.staging.neonhubecosystem.com/api/oauth/google/start?userId=test&organizationId=test"

# Expected: 302 redirect to accounts.google.com
```

---

## 🔧 Troubleshooting

### Domain Not Resolving

1. Check DNS propagation (can take up to 48 hours)
2. Verify CNAME records are correct
3. Clear local DNS cache: `sudo dscacheutil -flushcache` (macOS)
4. Use alternative DNS: `dig @8.8.8.8 api.staging.neonhubecosystem.com`

### SSL Certificate Issues

- Vercel: Auto-provisions in ~60 seconds after DNS verification
- Railway: Auto-provisions after custom domain added
- Check certificate: `openssl s_client -connect api.staging.neonhubecosystem.com:443 -servername api.staging.neonhubecosystem.com`

### CORS Errors

1. Verify `CORS_ORIGINS` includes exact staging web URL
2. Check for trailing slashes (shouldn't have them)
3. Ensure protocol matches (https:// not http://)

---

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] DNS records created with registrar
- [ ] Vercel project created and configured
- [ ] Railway project created and configured
- [ ] Environment variables set in both platforms
- [ ] OAuth apps created (Google, LinkedIn)
- [ ] Stripe test mode webhooks configured
- [ ] Database migrations applied to staging branch

### Post-Deployment

- [ ] DNS resolves correctly
- [ ] SSL certificates provisioned
- [ ] Health endpoints return 200
- [ ] Metrics endpoint operational
- [ ] CORS headers present
- [ ] OAuth flows redirect correctly
- [ ] Smoke tests passing
- [ ] Monitoring stack connected

---

## 📞 Support

**Railway Dashboard:** https://railway.app/project/neonhub-api-staging  
**Vercel Dashboard:** https://vercel.com/neonhub/neonhub-web-staging  
**DNS Checker:** https://dnschecker.org

**Audit Script:** `scripts/attach-domain-audit.sh`

---

*Last Updated: November 2, 2025*  
*Environment: Staging*  
*Status: Configuration Ready*

