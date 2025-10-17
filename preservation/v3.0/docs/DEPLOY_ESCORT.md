# 🚀 NeonHub Deploy Escort - Step-by-Step Checklist

**Target:** neonhubecosystem.com + api.neonhubecosystem.com  
**Time Required:** 30-45 minutes  
**Prerequisites:** Railway/Render account, Vercel account, DNS access

---

## 📋 Pre-Deployment Checklist

Run locally first:

```bash
cd /Users/kofirusu/Desktop/NeonHub
./scripts/preflight.sh
```

**Expected output:** ✅ All builds green

If failed, fix errors before continuing.

---

## Step 1: Generate Secrets (Local)

```bash
# Generate two strong secrets
openssl rand -base64 32
# Copy this → NEXTAUTH_SECRET and JWT_SECRET

openssl rand -base64 32  
# Copy this → Additional secret if needed
```

**Save these securely** - you'll need them in steps below.

---

## Step 2: Deploy Backend API (Railway Recommended)

### 2.1 Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your NeonHub repository
5. Click "Add variables" before deploying

### 2.2 Configure Service

**Service Settings:**
```
Root Directory: backend
Build Command: npm run build
Start Command: node dist/server.js
Port: 3001
Node Version: 20.x
```

### 2.3 Add Environment Variables

Click "Variables" → "Raw Editor" → Paste:

```env
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Database (Railway auto-provides this if you add Postgres)
DATABASE_URL=postgresql://postgres:password@host:5432/neonhub?sslmode=require

# Authentication
JWT_SECRET=<PASTE-SECRET-FROM-STEP-1>
JWT_EXPIRES_IN=7d
NEXTAUTH_URL=https://neonhubecosystem.com

# CORS (Critical - must include production domain)
CORS_ORIGIN=https://neonhubecosystem.com,https://neonhub.vercel.app,https://*.vercel.app

# AI Services (Optional - content generation)
OPENAI_API_KEY=sk-your-key-or-leave-empty

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=300

# Stripe (Optional - for live billing)
STRIPE_SECRET_KEY=sk_test_or_leave_empty
STRIPE_PUBLISHABLE_KEY=pk_test_or_leave_empty
STRIPE_PRICE_ID_STARTER=price_or_leave_empty
STRIPE_PRICE_ID_PRO=price_or_leave_empty
STRIPE_PRICE_ID_ENTERPRISE=price_or_leave_empty
STRIPE_WEBHOOK_SECRET=whsec_or_leave_empty

# Email (Optional - for team invites)
RESEND_API_KEY=re_or_leave_empty

# Application URLs
APP_BASE_URL=https://neonhubecosystem.com
API_BASE_URL=https://api.neonhubecosystem.com

# Monitoring (Optional)
SENTRY_DSN=
LOG_LEVEL=info
```

### 2.4 Add PostgreSQL Database

1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway will auto-inject `DATABASE_URL`
3. Note the connection details

### 2.5 Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Check logs for "🚀 NeonHub API server started"

### 2.6 Run Database Migrations

**In Railway Dashboard → Service → Shell:**

```bash
npx prisma generate
npx prisma migrate deploy
```

**Or from local machine:**

```bash
DATABASE_URL="<railway-postgres-url>" npx prisma migrate deploy
```

### 2.7 Add Custom Domain

1. Railway → Settings → Networking → Custom Domain
2. Add: `api.neonhubecosystem.com`
3. Copy the CNAME target (e.g., `your-app.up.railway.app`)
4. Wait for SSL certificate (~5 minutes)

### 2.8 Verify Backend

```bash
# Test Railway URL first
curl https://your-app.up.railway.app/health

# Expected output:
# {"status":"ok","db":true,"ws":true,"version":"1.0.0"}

# After DNS configured, test custom domain:
curl https://api.neonhubecosystem.com/health
```

✅ **Backend deployed!** If health check fails, check Railway logs.

---

## Step 3: Deploy Frontend UI (Vercel)

### 3.1 Import Project

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your NeonHub repository
4. Click "Import"

### 3.2 Configure Project

**Framework Preset:** Next.js  
**Root Directory:** `Neon-v2.4.0/ui` (or `Neon-v2.5.0/ui`)  
**Build Command:** `npm run build`  
**Output Directory:** `.next`  
**Install Command:** `npm install`  
**Node.js Version:** 20.x

### 3.3 Add Environment Variables

Settings → Environment Variables → Add (for "Production"):

```env
NEXT_PUBLIC_SITE_URL=https://neonhubecosystem.com
NEXT_PUBLIC_API_URL=https://api.neonhubecosystem.com
NEXT_PUBLIC_WS_URL=wss://api.neonhubecosystem.com

DATABASE_URL=<SAME-AS-BACKEND-RAILWAY-POSTGRES-URL>

NEXTAUTH_URL=https://neonhubecosystem.com
NEXTAUTH_SECRET=<PASTE-SECRET-FROM-STEP-1>

# OAuth (Optional)
GITHUB_ID=
GITHUB_SECRET=

# Feature Flags
NEXT_PUBLIC_STRIPE_LIVE=false
NEXT_PUBLIC_BILLING_SANDBOX=true

# Monitoring (Optional)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Team
INVITE_REDIRECT_URL=https://neonhubecosystem.com/auth/signin
```

### 3.4 Deploy

1. Click "Deploy"
2. Wait for build (~3-4 minutes)
3. Build should succeed
4. Note the Vercel URL (e.g., `your-app.vercel.app`)

### 3.5 Verify Build

Visit the Vercel URL:
- Homepage should load
- No console errors
- Neon colors visible

✅ **Frontend deployed!** If build fails, check build logs.

---

## Step 4: Configure DNS

### 4.1 Add Apex Domain to Vercel

1. Vercel → Project → Settings → Domains
2. Click "Add"
3. Enter: `neonhubecosystem.com`
4. Click "Add"

Vercel will show required DNS records:

**Example (yours may vary):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

### 4.2 Update DNS Records

**In your DNS provider (Cloudflare/Namecheap/GoDaddy):**

**For apex domain (neonhubecosystem.com):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**For API subdomain:**
```
Type: CNAME
Name: api
Value: <your-railway-app>.up.railway.app
TTL: 3600
```

### 4.3 Wait for Propagation

- DNS changes take 5-60 minutes
- Check propagation:

```bash
dig neonhubecosystem.com
dig api.neonhubecosystem.com
```

### 4.4 Verify SSL

- Vercel auto-issues SSL certificate
- Railway auto-issues SSL for custom domain
- Both should show 🔒 in browser within 10 minutes

✅ **DNS configured!** 

---

## Step 5: Configure Stripe Webhook (Optional)

**Only if using Stripe for live billing:**

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://api.neonhubecosystem.com/billing/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Add to Railway backend environment:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
8. Redeploy backend in Railway

---

## Step 6: Production Smoke Tests

### 6.1 API Health Check

```bash
curl -sSf https://api.neonhubecosystem.com/health | jq .
```

**Expected output:**
```json
{
  "status": "ok",
  "db": true,
  "ws": true,
  "version": "1.0.0"
}
```

### 6.2 API Metrics

```bash
curl -sSf "https://api.neonhubecosystem.com/metrics/summary?range=24h" | jq .
```

**Expected:** JSON with metrics data

### 6.3 Frontend Homepage

```bash
open https://neonhubecosystem.com
# Or: curl -I https://neonhubecosystem.com
```

**Expected:** 200 OK, page loads with neon theme

### 6.4 Manual UI Tests

Open browser to https://neonhubecosystem.com

**Critical Path (5 minutes):**
- [ ] /dashboard - KPIs render
- [ ] /analytics - Metrics display
- [ ] /trends - Switch time range (30d → 7d → 24h), data updates
- [ ] /content - Generate draft (shows mock banner if no OpenAI key)
- [ ] /team - Invite test@example.com:
  - If RESEND_API_KEY set → email sent
  - If not → preview URL shown (yellow banner)
- [ ] /billing - Check badge:
  - "Live • Stripe Connected" if keys present
  - "Sandbox • Test Mode" if not

**Real-Time Test:**
1. Open /trends
2. In another tab, generate content at /content
3. Switch back to /trends - should auto-update

### 6.5 WebSocket Test

1. Open browser console (F12)
2. Visit /trends
3. Look for: "WebSocket connected"
4. If error, check CORS_ORIGIN includes your domain

---

## Step 7: Post-Deployment Verification

### Performance

```bash
# Lighthouse (requires Chrome)
npx lighthouse https://neonhubecosystem.com --view

# Expected: Score > 90
```

### Security

```bash
# Check security headers
curl -I https://neonhubecosystem.com | grep -E "X-Frame|X-Content|Strict-Transport"

# Check SSL
curl -vI https://neonhubecosystem.com 2>&1 | grep "SSL certificate"
```

### Monitoring

- Enable Vercel Analytics (auto-enabled)
- Check Railway logs for errors
- Set up Sentry alerts (if configured)

---

## 🚨 Troubleshooting

### Backend health check fails

```bash
# Check Railway logs
# Common issues:
# - DATABASE_URL incorrect
# - Missing required env vars
# - Port binding issue

# Test locally with prod env:
DATABASE_URL="railway-url" npm run dev
```

### Frontend build fails

```bash
# Check Vercel build logs
# Common issues:
# - Missing NEXTAUTH_SECRET
# - Wrong root directory
# - Missing dependencies

# Test locally:
cd Neon-v2.4.0/ui
npm run build
```

### DNS not propagating

```bash
# Check DNS status
dig neonhubecosystem.com
dig api.neonhubecosystem.com

# Can take up to 48 hours, usually 5-60 minutes
# Use Vercel preview URL in meantime
```

### CORS errors

```bash
# Verify CORS_ORIGIN in Railway includes:
# - https://neonhubecosystem.com
# - https://your-app.vercel.app
# - https://*.vercel.app

# Check browser console for exact error
# Update backend CORS_ORIGIN and redeploy
```

---

## 🔄 Rollback Procedures

### Vercel (Instant - 10 seconds)

1. Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Railway (Quick - 2 minutes)

1. Dashboard → Deployments  
2. Find previous successful deployment
3. Click "Redeploy"

### Database (If Migrations Failed)

```bash
npx prisma migrate resolve --rolled-back <migration-name>
# Or restore from backup
```

---

## ✅ Success Criteria

- [ ] API health returns 200 with db:true, ws:true
- [ ] Frontend homepage loads at https://neonhubecosystem.com
- [ ] Both domains have valid SSL (🔒 in browser)
- [ ] All 15 functional routes accessible
- [ ] Real-time updates work (WebSocket connected)
- [ ] No console errors
- [ ] Stripe shows correct badge (Live/Sandbox)
- [ ] Team invites work (email or preview)
- [ ] Lighthouse score > 85

---

## 🎯 Quick Reference

**Generate secrets:**
```bash
openssl rand -base64 32
```

**Test API:**
```bash
curl https://api.neonhubecosystem.com/health
```

**Test UI:**
```bash
curl -I https://neonhubecosystem.com
```

**Run automated smoke:**
```bash
API_URL=https://api.neonhubecosystem.com ./scripts/smoke-api.sh
```

**Manual UI smoke:**
See `scripts/smoke-ui.md`

---

## 📞 Support

**Issues?**
- Check Railway/Vercel logs
- Review troubleshooting section above
- See `docs/PRODUCTION_DEPLOYMENT.md` for details
- Check SECURITY.md for security concerns

---

**Time to deploy:** 30-45 minutes  
**Rollback time:** < 5 minutes  
**Difficulty:** Medium (requires provider dashboards)

---

**Good luck with your deployment!** 🚀

Once complete, your app will be live at:
- Frontend: https://neonhubecosystem.com
- API: https://api.neonhubecosystem.com

