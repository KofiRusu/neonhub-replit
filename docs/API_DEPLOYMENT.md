# API Deployment Guide - Railway/Render

## Overview

This guide covers deploying the NeonHub API to Railway (recommended) or Render with zero-downtime deployment practices.

## Pre-Deployment Checklist

- [ ] Database provisioned and `DATABASE_URL` ready
- [ ] All environment variables prepared (see `docs/ENV.MD`)
- [ ] API builds successfully locally
- [ ] Migration plan reviewed
- [ ] Health endpoints tested

## Option A: Railway Deployment (Recommended)

### Why Railway?
- ✅ Excellent Git integration and auto-deploys
- ✅ Built-in PostgreSQL if needed
- ✅ Simple environment variable management
- ✅ Auto-scaling and zero-downtime deployments
- ✅ Competitive pricing for production apps

### Deployment Steps

#### 1. Project Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new
# Project name: neonhub-api-production
```

#### 2. Connect Repository
```bash
# Link to GitHub repository
# Railway Dashboard > New Project > Deploy from GitHub
# Select: your-org/neonhub
# Root directory: apps/api
```

#### 3. Build Configuration
```yaml
# railway.json (create in apps/api/)
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm ci && npm run build",
    "startCommand": "npx prisma migrate deploy && npm run start"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "always"
  }
}
```

#### 4. Environment Variables
```bash
# Set via Railway Dashboard or CLI
railway variables set DATABASE_URL="postgresql://..."
railway variables set NEXTAUTH_SECRET="your-32-char-secret"
railway variables set NEXTAUTH_URL="https://app.yourdomain.com"
railway variables set CORS_ORIGINS="https://app.yourdomain.com"
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."
railway variables set RESEND_API_KEY="re_..."
railway variables set OPENAI_API_KEY="sk-proj-..."
railway variables set NODE_ENV="production"
railway variables set PORT="3001"

# Optional monitoring
railway variables set SENTRY_DSN="https://...@sentry.io/..."
```

#### 5. Custom Domain Setup
```bash
# Railway Dashboard > Settings > Domains
# Add custom domain: api.yourdomain.com
# Configure DNS CNAME: api.yourdomain.com -> proxy.railway.app
```

#### 6. Deploy
```bash
# Deploy current branch
railway up

# Monitor deployment
railway logs --follow
```

#### 7. Post-Deploy Verification
```bash
# Check health endpoint
curl -sS https://api.yourdomain.com/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-14T...","database":"connected"}
```

### Railway Optimization

#### Scaling Configuration
```bash
# Railway Dashboard > Settings > Scaling
# CPU: 1-2 vCPU recommended
# Memory: 1-2 GB recommended  
# Auto-scaling: Enable if traffic varies
```

#### Monitoring Setup
```bash
# Enable Railway observability
# Dashboard > Metrics tab for CPU/Memory/Response times
# Set up alerting for high error rates
```

## Option B: Render Deployment

### Why Render?
- ✅ Simple pricing model
- ✅ Automatic SSL certificates
- ✅ Built-in monitoring dashboard
- ✅ Good performance for API workloads

### Deployment Steps

#### 1. Create Web Service
```bash
# Render Dashboard > New > Web Service
# Repository: Connect your GitHub repo
# Branch: main (or deployment branch)
# Root Directory: apps/api
```

#### 2. Build & Start Configuration
```yaml
# render.yaml (create in repository root)
services:
  - type: web
    name: neonhub-api
    env: node
    region: oregon
    plan: standard
    branch: main
    rootDir: apps/api
    buildCommand: npm ci && npm run build
    startCommand: npx prisma migrate deploy && npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: neonhub-db
          property: connectionString
```

#### 3. Environment Variables
```bash
# Render Dashboard > Environment
# Add each environment variable from docs/ENV.MD
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=https://app.yourdomain.com
CORS_ORIGINS=https://app.yourdomain.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
OPENAI_API_KEY=sk-proj-...
```

#### 4. Custom Domain
```bash
# Render Dashboard > Settings > Custom Domains
# Add: api.yourdomain.com
# Configure DNS CNAME: api.yourdomain.com -> your-service.onrender.com
```

#### 5. Deploy
```bash
# Automatic deployment on git push to main branch
git push origin main

# Manual deploy via dashboard if needed
```

### Render Optimization

#### Performance Settings
```bash
# Instance Type: Standard (recommended for production)
# Auto-Deploy: Enable for CI/CD
# Health Check Path: /health
```

## Post-Deployment Tasks

### 1. Database Migration
```bash
# This runs automatically in start command, but verify:
# Check Render/Railway logs for migration success
# Look for: "Migration engine completed successfully"
```

### 2. Health Verification
```bash
# Test all health endpoints
curl -sS https://api.yourdomain.com/health
curl -sS https://api.yourdomain.com/health/database  
curl -sS https://api.yourdomain.com/health/external

# Expected responses should show all services connected
```

### 3. Enable Monitoring
```bash
# Railway: Built-in metrics dashboard
# Render: Built-in observability

# Optional: External monitoring (recommended)
# - Datadog APM
# - New Relic
# - Sentry (already configured if SENTRY_DSN set)
```

### 4. Performance Testing
```bash
# Load test critical endpoints
ab -n 100 -c 10 https://api.yourdomain.com/health
ab -n 50 -c 5 https://api.yourdomain.com/api/content/generate-post

# Monitor response times and error rates
```

## Security Configuration

### 1. Network Security
```bash
# Both platforms provide DDoS protection
# Consider Cloudflare for additional WAF if high traffic expected
```

### 2. Rate Limiting
```javascript
// Already configured in server.ts
// Review limits for production traffic:
// - General: 100 requests/15min per IP
// - API endpoints: May need adjustment based on usage
```

### 3. CORS Configuration
```bash
# Ensure CORS_ORIGINS only includes production domains
# Never use '*' in production
# Example: "https://app.yourdomain.com,https://www.yourdomain.com"
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check Node version (should be 20+)
# Verify package.json scripts exist
# Check for missing dependencies
```

#### Database Connection Issues
```bash
# Verify DATABASE_URL format
# Check network connectivity
# Verify migration completion in logs
```

#### Environment Variable Issues
```bash
# Check all required vars are set
# Verify no typos in variable names
# Check URL formatting (https://, proper encoding)
```

### Debug Commands
```bash
# Railway logs
railway logs --tail 100

# Render logs  
# Available in Dashboard > Logs tab

# Database connectivity test
psql $DATABASE_URL -c "SELECT 1;"
```

## Rollback Procedures

### Quick Rollback (Railway)
```bash
# Rollback to previous deployment
railway rollback

# Or deploy specific commit
railway up --commit abc123
```

### Quick Rollback (Render)
```bash
# Render Dashboard > Deploys
# Click "Rollback" on previous successful deployment
```

### Emergency Procedures
1. **Service Down**: Immediately rollback via platform dashboard
2. **Database Issues**: Check migration logs, may need manual intervention
3. **High Error Rates**: Monitor logs, consider scaling up resources
4. **Memory Issues**: Increase instance size, check for memory leaks

## Cost Optimization

### Railway Pricing
- **Hobby**: $5/month (good for staging)
- **Pro**: $20/month (recommended for production)
- **Usage-based**: CPU/Memory/Network charges

### Render Pricing  
- **Standard**: $25/month per service
- **Pro**: $85/month (high traffic)
- **Includes**: SSL, DDoS protection, monitoring

---

**Next Steps**: After API deployment, proceed to Phase E (Web Deployment) and Phase F (Integration Testing).



