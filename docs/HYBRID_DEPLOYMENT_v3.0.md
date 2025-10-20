# NeonHub v3.0 Hybrid Production Deployment Guide

**Version:** 3.0.0  
**Date:** 2025-10-18  
**Status:** Production Ready  
**Test Coverage:** 32/32 Core Tests Passing

## Executive Summary

This guide covers the complete production deployment of NeonHub v3.0 using a hybrid deployment strategy:
- **API Backend:** Railway or Render (Node.js/Express)
- **Web Frontend:** Vercel (Next.js)
- **Database:** PostgreSQL (Neon, Supabase, or Railway)

### What's Included in v3.0
✅ Core API with health monitoring  
✅ Web dashboard with responsive UI  
✅ PostgreSQL database with Prisma ORM  
✅ AI agent orchestration (Content, Design, Insights, Trends, Ads)  
✅ Authentication & authorization  
✅ Team management  
✅ Content generation & SEO optimization  

### Deferred to v3.1-v3.3
⏸️ Predictive engine & autoscaling (v3.1)  
⏸️ Advanced personalization (v3.2)  
⏸️ AI governance & compliance (v3.3)  

---

## Prerequisites Checklist

### Required Accounts
- [ ] GitHub account with repository access
- [ ] Railway account (for API) OR Render account
- [ ] Vercel account (for Web)
- [ ] Database provider account (Neon/Supabase/Railway)
- [ ] Domain registrar access (for custom domain)
- [ ] OpenAI API account (for AI features)

### Required Tools
- [ ] Git (v2.30+)
- [ ] Node.js (v20.x - see `.nvmrc`)
- [ ] npm (v10+)
- [ ] OpenSSL (for secret generation)
- [ ] Domain DNS access

### Required Information
- [ ] OpenAI API Key
- [ ] Database connection URL
- [ ] Custom domain name (optional)
- [ ] SMTP credentials (for email features)

---

## Phase 1: Pre-Deployment Validation

### 1.1 Repository Setup

```bash
# Clone repository
git clone <repository-url>
cd NeonHub

# Switch to production branch
git checkout main

# Verify Node version
node --version  # Should be v20.x

# Install dependencies
npm install
```

### 1.2 Local Build Validation

```bash
# Build API
cd apps/api
npm run build

# Build Web
cd ../web
npm run build

# Return to root
cd ../..
```

**Expected Output:** Both builds should complete without errors.

### 1.3 Run Tests

```bash
# Run API tests
cd apps/api
npm test

# Expected: All 32 core tests passing
```

---

## Phase 2: Database Provisioning

### Option A: Neon PostgreSQL (Recommended)

1. Go to [neon.tech](https://neon.tech)
2. Create new project: "neonhub-production"
3. Select region closest to your users
4. Copy connection string

**Connection String Format:**
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create new project: "neonhub-production"
3. Navigate to Settings > Database
4. Copy "Connection string" (Direct connection)

### Option C: Railway PostgreSQL

1. In Railway project, click "+ New"
2. Select "Database > PostgreSQL"
3. Copy `DATABASE_URL` from Variables tab

### 2.1 Database Schema Migration

```bash
cd apps/api

# Set DATABASE_URL temporarily for migration
export DATABASE_URL="your-connection-string"

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

**Validation:**
```bash
npx prisma studio
# Verify tables exist: User, Post, Agent, Job, etc.
```

---

## Phase 3: Secret Generation

### 3.1 Generate Production Secrets

```bash
# From repository root
chmod +x scripts/generate-production-secrets.sh
./scripts/generate-production-secrets.sh
```

This creates: `release/production-secrets-[timestamp].txt`

**Contents:**
```
NEXTAUTH_SECRET=<generated-secret>
JWT_SECRET=<generated-secret>
SESSION_SECRET=<generated-secret>
```

⚠️ **CRITICAL:** Store these in a secure password manager. Do NOT commit to git.

---

## Phase 4: API Deployment (Railway)

### 4.1 Railway Setup

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your NeonHub repository
5. Select `apps/api` as root directory

### 4.2 Configure Build Settings

In Railway project settings:

**Build Command:**
```bash
cd apps/api && npm install && npm run build
```

**Start Command:**
```bash
cd apps/api && npm run start:prod
```

**Root Directory:** `/apps/api`

### 4.3 Environment Variables

Add these variables in Railway dashboard:

```bash
# Core
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=<your-neon-connection-string>

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<from-secrets-file>
JWT_SECRET=<from-secrets-file>
SESSION_SECRET=<from-secrets-file>

# OpenAI
OPENAI_API_KEY=<your-openai-key>

# CORS
CORS_ORIGIN=https://your-web-domain.vercel.app

# Optional: Sentry
SENTRY_DSN=<your-sentry-dsn>
```

### 4.4 Deploy

1. Click "Deploy" in Railway
2. Wait for build to complete
3. Railway will provide a URL: `https://neonhub-api-production.up.railway.app`

### 4.5 Verify API Deployment

```bash
# Health check
curl https://your-api-url.railway.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-18T...",
  "uptime": 123
}
```

---

## Phase 5: Web Deployment (Vercel)

### 5.1 Vercel Setup

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `cd apps/web && npm run build`
   - **Output Directory:** `apps/web/.next`

### 5.2 Environment Variables

Add in Vercel project settings:

```bash
# API Connection
NEXT_PUBLIC_API_URL=https://your-api-url.railway.app

# Authentication
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<from-secrets-file>

# Optional: Analytics
NEXT_PUBLIC_GA_ID=<your-ga-id>
```

### 5.3 Deploy

1. Click "Deploy"
2. Vercel will build and deploy automatically
3. You'll receive a URL: `https://neonhub.vercel.app`

### 5.4 Verify Web Deployment

```bash
# Check homepage
curl -I https://your-web-url.vercel.app

# Expected: HTTP 200 OK
```

---

## Phase 6: DNS Configuration

### 6.1 Custom Domain for API

**In Railway:**
1. Go to Settings > Domains
2. Click "Custom Domain"
3. Enter: `api.your-domain.com`
4. Add CNAME record in your DNS:

```
CNAME api.your-domain.com -> your-project.up.railway.app
```

### 6.2 Custom Domain for Web

**In Vercel:**
1. Go to Settings > Domains
2. Add domain: `your-domain.com` and `www.your-domain.com`
3. Add DNS records:

```
A     @                76.76.21.21
CNAME www              cname.vercel-dns.com
```

### 6.3 SSL Certificates

Both Railway and Vercel automatically provision SSL certificates via Let's Encrypt.

**Verification:**
```bash
# Test SSL
curl -I https://api.your-domain.com/api/health
curl -I https://your-domain.com
```

---

## Phase 7: Post-Deployment Configuration

### 7.1 Update CORS Settings

In Railway environment variables, update:
```bash
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
```

Redeploy API in Railway.

### 7.2 Update NextAuth URLs

In both Railway (API) and Vercel (Web):
```bash
NEXTAUTH_URL=https://your-domain.com
```

### 7.3 Database Connection Pooling

For production database, enable connection pooling:

**Neon:**
- Use pooled connection string: `postgresql://...?pgbouncer=true`

**Supabase:**
- Use "Connection pooling" URL from dashboard

---

## Phase 8: Smoke Testing

### 8.1 Automated Smoke Tests

```bash
# From repository root
chmod +x scripts/smoke-test-production.sh
./scripts/smoke-test-production.sh https://api.your-domain.com https://your-domain.com
```

### 8.2 Manual Smoke Tests

#### API Tests
```bash
# Health
curl https://api.your-domain.com/api/health

# Auth endpoint
curl https://api.your-domain.com/api/auth/providers
```

#### Web Tests
1. Navigate to `https://your-domain.com`
2. Verify homepage loads
3. Test login flow
4. Create test content
5. Verify agent functionality

### 8.3 Performance Testing

```bash
# Load testing with k6 (optional)
k6 run --vus 10 --duration 30s scripts/load-test.js
```

---

## Phase 9: Monitoring Setup

### 9.1 UptimeRobot Configuration

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add monitors:

**API Monitor:**
- Type: HTTP(S)
- URL: `https://api.your-domain.com/api/health`
- Interval: 5 minutes

**Web Monitor:**
- Type: HTTP(S)
- URL: `https://your-domain.com`
- Interval: 5 minutes

### 9.2 Railway Monitoring

Built-in metrics available in Railway dashboard:
- CPU usage
- Memory usage
- Network traffic
- Request logs

### 9.3 Vercel Analytics

Enable in Vercel dashboard:
1. Go to Analytics tab
2. Enable Web Analytics
3. Enable Speed Insights

### 9.4 Sentry Error Tracking (Optional)

If configured:
1. Verify errors are being captured
2. Set up alert rules
3. Configure issue routing

---

## Phase 10: Documentation & Handoff

### 10.1 Update Documentation

Create internal runbook with:
- Production URLs
- Admin credentials
- Emergency contacts
- Rollback procedures

### 10.2 Team Access

Grant access to:
- Railway project (developers)
- Vercel project (developers)
- Database (DBA/lead developers only)
- DNS management (DevOps)

### 10.3 Status Page

Consider setting up:
- [status.io](https://status.io)
- [statuspage.io](https://statuspage.io)

Public URL: `https://status.your-domain.com`

---

## Troubleshooting

### Build Failures

**API Build Fails:**
```bash
# Check Node version matches .nvmrc
node --version

# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Web Build Fails:**
```bash
# Verify environment variables
echo $NEXT_PUBLIC_API_URL

# Check for TypeScript errors
npm run type-check
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# If connection fails:
# 1. Verify connection string format
# 2. Check IP allowlist (if applicable)
# 3. Ensure SSL is enabled
```

### CORS Errors

Update `CORS_ORIGIN` in Railway to include all frontend domains:
```bash
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com,https://preview-branch.vercel.app
```

### SSL Certificate Issues

Both platforms auto-renew certificates. If issues occur:

**Railway:**
- Remove and re-add custom domain
- Certificates regenerate automatically

**Vercel:**
- Check DNS propagation: `dig your-domain.com`
- Certificates provision within 24 hours

---

## Rollback Procedures

### Emergency Rollback

#### Railway API Rollback
1. Go to Deployments tab
2. Find last working deployment
3. Click "Redeploy"

#### Vercel Web Rollback
1. Go to Deployments
2. Find previous deployment
3. Click "Promote to Production"

### Database Rollback

⚠️ **Use with extreme caution**

```bash
# Revert last migration
cd apps/api
npx prisma migrate resolve --rolled-back [migration-name]
```

### DNS Rollback

Update DNS records to point to previous infrastructure:
- TTL affects propagation time
- Expect 5-60 minutes for changes to propagate

---

## Security Checklist

- [ ] All secrets stored in platform secret managers (not in code)
- [ ] Database connections use SSL
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured with specific origins (not `*`)
- [ ] Rate limiting enabled
- [ ] Error messages don't expose sensitive data
- [ ] Database user has minimal required permissions
- [ ] Regular security updates scheduled

---

## Performance Optimization

### API Optimization
- [ ] Enable Railway auto-scaling if needed
- [ ] Configure database connection pooling
- [ ] Enable Redis caching (optional)
- [ ] Set up CDN for static assets

### Web Optimization
- [ ] Enable Vercel Edge Caching
- [ ] Configure Image Optimization
- [ ] Enable Compression
- [ ] Set up analytics for Core Web Vitals

---

## Maintenance Schedule

### Weekly
- Review error logs in Sentry
- Check uptime reports
- Monitor database size

### Monthly
- Review and rotate API keys
- Update dependencies
- Performance audit
- Cost review

### Quarterly
- Security audit
- Load testing
- Disaster recovery drill
- Documentation updates

---

## Support Contacts

### Platform Support
- **Railway:** support@railway.app
- **Vercel:** support@vercel.com
- **Neon:** support@neon.tech

### Internal Contacts
- **DevOps Lead:** [Your contact]
- **Database Admin:** [Your contact]
- **Security Lead:** [Your contact]

---

## Appendix A: Environment Variable Reference

See:
- [`release/env-checklist-api.md`](../release/env-checklist-api.md)
- [`release/env-checklist-web.md`](../release/env-checklist-web.md)

---

## Appendix B: Architecture Diagram

```
┌─────────────┐
│   Users     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   Vercel Edge   │
│   (CDN/WAF)     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  Next.js Web    │─────▶│  Railway API │
│  (Vercel)       │◀─────│  (Node.js)   │
└─────────────────┘      └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  PostgreSQL  │
                         │  (Neon)      │
                         └──────────────┘
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2025-10-18 | Initial hybrid deployment guide |

---

**End of Deployment Guide**

For questions or issues, please open a GitHub issue or contact the DevOps team.