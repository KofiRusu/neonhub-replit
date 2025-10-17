# NeonHub Production Deployment Guide

**Target Domain:** neonhubecosystem.com  
**API Domain:** api.neonhubecosystem.com  
**Version:** 2.5.0  
**Date:** October 3, 2025

---

## 📋 Pre-Deployment Checklist

- [ ] All code merged to main branch
- [ ] Builds passing (frontend + backend)
- [ ] Environment variables documented
- [ ] Secrets generated
- [ ] Database ready
- [ ] DNS access available
- [ ] Vercel account set up
- [ ] Backend hosting chosen (Railway/Render/Fly.io)

---

## Step 1: Deploy Backend API

### Option A: Railway (Recommended)

1. **Create New Project**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your NeonHub repository

2. **Configure Service**
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Start Command: `node dist/server.js`
   - Port: 3001

3. **Add Environment Variables**
   - Copy from `docs/PRODUCTION_ENV_GUIDE.md`
   - Generate secrets: `openssl rand -base64 32`
   - Set all required variables

4. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy `DATABASE_URL` to environment variables
   - Note: Railway auto-injects `DATABASE_URL`

5. **Run Migrations**
   ```bash
   # From local machine
   DATABASE_URL="your-railway-postgres-url" npx prisma migrate deploy
   ```

6. **Generate Domain**
   - Settings → Networking → Generate Domain
   - Note the railway.app URL
   - Later: Add custom domain `api.neonhubecosystem.com`

7. **Verify Deployment**
   ```bash
   curl https://your-app.railway.app/health
   # Should return: {"status":"ok","db":true,"ws":true}
   ```

### Option B: Render

Similar process - see Render.com docs for specifics.

### Option C: Fly.io

Use `fly launch` with provided Dockerfile.

---

## Step 2: Deploy Frontend UI

### Vercel Deployment

1. **Import Project**
   - Go to https://vercel.com/new
   - Import from GitHub
   - Select NeonHub repository

2. **Configure Project**
   ```
   Framework Preset: Next.js
   Root Directory: Neon-v2.4.0/ui
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   Node.js Version: 20.x
   ```

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from `PRODUCTION_ENV_GUIDE.md`
   - Apply to: Production environment
   
   **Critical Variables:**
   ```
   NEXT_PUBLIC_SITE_URL=https://neonhubecosystem.com
   NEXT_PUBLIC_API_URL=https://api.neonhubecosystem.com
   NEXT_PUBLIC_WS_URL=wss://api.neonhubecosystem.com
   NEXTAUTH_URL=https://neonhubecosystem.com
   NEXTAUTH_SECRET=[generated-secret]
   DATABASE_URL=[your-postgres-url]
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build (~2-3 minutes)
   - Note the vercel.app URL

5. **Verify Deployment**
   - Visit https://your-app.vercel.app
   - Check that pages load
   - Verify no console errors

---

## Step 3: Configure DNS

### A) Apex Domain (neonhubecosystem.com → Vercel)

1. **In Vercel Dashboard**
   - Project → Settings → Domains
   - Click "Add"
   - Enter: `neonhubecosystem.com`
   - Click "Add"

2. **Configure DNS Records**
   
   Vercel will show required records. Add these to your DNS provider:

   **Option 1: A Record (Recommended)**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 3600
   ```

   **Option 2: CNAME (if supported)**
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

   **www subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

3. **Wait for Propagation**
   - DNS changes take 5-60 minutes
   - Check: `dig neonhubecosystem.com`
   - Vercel will auto-issue SSL certificate

### B) API Subdomain (api.neonhubecosystem.com → Backend)

1. **In DNS Provider**
   
   **If using Railway:**
   ```
   Type: CNAME
   Name: api
   Value: your-app.up.railway.app
   TTL: 3600
   ```

   **If using Render:**
   ```
   Type: CNAME
   Name: api
   Value: your-app.onrender.com
   TTL: 3600
   ```

2. **In Backend Provider**
   - Railway: Settings → Networking → Custom Domain
   - Add: `api.neonhubecosystem.com`
   - SSL auto-provisioned

3. **Verify**
   ```bash
   curl https://api.neonhubecosystem.com/health
   ```

---

## Step 4: Configure Stripe Webhook (If Using Stripe)

1. **Stripe Dashboard**
   - Developers → Webhooks → Add endpoint
   - URL: `https://api.neonhubecosystem.com/billing/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`

2. **Get Signing Secret**
   - Copy the webhook signing secret (whsec_...)
   - Add to backend environment: `STRIPE_WEBHOOK_SECRET=whsec_...`

3. **Test Webhook**
   - Use Stripe CLI: `stripe trigger payment_intent.succeeded`
   - Or make test purchase
   - Check backend logs for webhook events

---

## Step 5: Production Smoke Tests

### Automated Tests

```bash
# Update smoke test for production
export API_URL=https://api.neonhubecosystem.com
export UI_URL=https://neonhubecosystem.com

# Run smoke test
./scripts/qa-smoke-test.sh
```

### Manual Tests

**Health Checks:**
```bash
curl https://api.neonhubecosystem.com/health
# Expected: {"status":"ok","db":true,"ws":true}

curl -I https://neonhubecosystem.com
# Expected: 200 OK
```

**Page Tests:**
- [ ] https://neonhubecosystem.com/ - Homepage loads
- [ ] /dashboard - KPIs render
- [ ] /analytics - Metrics display
- [ ] /trends - Time range switching works
- [ ] /content - Can generate drafts
- [ ] /team - Invite flow works
- [ ] /billing - Stripe badge shows (Live/Sandbox)

**Real-Time Tests:**
- [ ] WebSocket connects (check console)
- [ ] Generate content → metrics:delta fires
- [ ] /trends auto-updates
- [ ] /analytics KPIs refresh

**Integration Tests:**
- [ ] Team invite sends email (or shows preview)
- [ ] Stripe checkout works (test mode)
- [ ] OAuth sign-in works
- [ ] Database queries succeed

---

## Step 6: Rollback Procedures

### Vercel Rollback

1. **Via Dashboard**
   - Deployments tab
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Via CLI**
   ```bash
   vercel rollback
   # Select deployment to rollback to
   ```

3. **Instant:** Takes ~10 seconds

### Backend Rollback

**Railway:**
```bash
# In Railway dashboard
1. Go to Deployments
2. Find last working deployment
3. Click "Redeploy"
```

**Render:**
```bash
# In Render dashboard
1. Go to Events
2. Find last successful deploy
3. Click "Rollback to this version"
```

**Manual Git Rollback:**
```bash
git revert HEAD
git push origin main
# Triggers automatic redeploy
```

### Database Rollback

```bash
# If migrations cause issues
npx prisma migrate resolve --rolled-back [migration-name]

# Restore from backup
# (Depends on database provider)
```

### DNS Rollback

- No rollback needed - DNS points to services
- Rollback services instead

---

## Step 7: Post-Deployment Verification

### Automated Checks

```bash
# Health check
curl -f https://api.neonhubecosystem.com/health || echo "API health failed"

# Sitemap
curl -f https://neonhubecosystem.com/sitemap.xml || echo "Sitemap failed"

# robots.txt
curl -f https://neonhubecosystem.com/robots.txt || echo "Robots failed"
```

### Manual Verification

**Performance:**
- [ ] Page load < 3s
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] API response < 500ms

**Security:**
- [ ] HTTPS enforced (no HTTP)
- [ ] SSL certificate valid
- [ ] Security headers present
- [ ] CORS working correctly

**Functionality:**
- [ ] All routes accessible
- [ ] Authentication works
- [ ] Database queries succeed
- [ ] WebSocket connects
- [ ] Real-time updates work

---

## Troubleshooting

### Build Failures

**Vercel:**
```bash
# Check build logs in dashboard
# Common issues:
# - Missing environment variables
# - Type errors
# - Missing dependencies

# Fix locally first:
cd Neon-v2.4.0/ui
npm run build

# Then redeploy
```

**Backend:**
```bash
# Check deployment logs
# Common issues:
# - Database connection
# - Missing secrets
# - Port binding

# Test locally:
npm run build
DATABASE_URL="test-url" npm start
```

### Database Connection Issues

```bash
# Test connection
psql "$DATABASE_URL"

# Check SSL mode
# Ensure: ?sslmode=require

# Regenerate Prisma client
npx prisma generate
npx prisma migrate deploy
```

### CORS Errors

```bash
# Verify CORS_ORIGIN includes production domain
# Check backend logs for "CORS blocked origin"

# Update backend environment:
CORS_ORIGIN=https://neonhubecosystem.com,https://*.vercel.app
```

### SSL/Certificate Issues

- Vercel: Auto-renews, wait 5 minutes if just added
- Railway: Check custom domain settings
- DNS propagation can take up to 48 hours

---

## Monitoring & Alerts

### Vercel

- **Analytics**: Auto-enabled for production
- **Speed Insights**: Enable in Project Settings
- **Log Drains**: Configure for centralized logging

### Backend (Railway/Render)

- **Logs**: View in dashboard
- **Metrics**: CPU, Memory, Network
- **Alerts**: Configure for downtime

### Sentry (Recommended)

1. Create project at sentry.io
2. Add DSN to environment variables
3. Errors auto-reported
4. Set up alerts for critical errors

---

## Maintenance

### Regular Tasks

**Weekly:**
- [ ] Check error logs (Sentry)
- [ ] Review analytics (Vercel)
- [ ] Monitor costs (providers)

**Monthly:**
- [ ] Update dependencies
- [ ] Review security advisories
- [ ] Check SSL certificates
- [ ] Database backups verified

**Quarterly:**
- [ ] Rotate secrets
- [ ] Security audit
- [ ] Performance review
- [ ] Cost optimization

---

## Success Criteria

✅ Frontend accessible at https://neonhubecosystem.com  
✅ Backend healthy at https://api.neonhubecosystem.com/health  
✅ SSL certificates valid (both domains)  
✅ All routes load successfully  
✅ Database queries working  
✅ WebSocket connections stable  
✅ Real-time updates functioning  
✅ Stripe integration active (if configured)  
✅ Email invites working (if configured)  
✅ No console errors  
✅ Performance acceptable (Lighthouse > 90)

---

**Your app is now live!** 🎉

Monitor for 24 hours and verify everything works as expected.

---

**Support:** See docs/TROUBLESHOOTING.md for common issues  
**Rollback:** Follow Step 6 above if needed  
**Updates:** Use Git → push main → auto-deploy

