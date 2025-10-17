# Rollback Procedures - NeonHub v3.x

## Overview

This document outlines rollback procedures for all components of the NeonHub deployment in case of production issues.

## Emergency Contacts & Escalation

### Immediate Response (< 5 minutes)
1. **Check monitoring dashboards** (Vercel, Railway/Render, database)
2. **Verify issue scope** (web, API, database, or external services)
3. **Execute appropriate rollback** (see procedures below)

### Escalation Path
- **Level 1**: Automatic rollback via platform dashboards
- **Level 2**: Manual code revert + redeploy
- **Level 3**: Database rollback (requires approval)

---

## Web App Rollback (Vercel)

### Automatic Rollback (Fastest - 30 seconds)
```bash
# Via Vercel Dashboard
1. Go to Vercel Dashboard > Project > Deployments
2. Find previous successful deployment
3. Click "..." > "Promote to Production"
4. Confirm - rollback is immediate
```

### CLI Rollback
```bash
# List recent deployments
vercel list

# Promote specific deployment to production
vercel promote <deployment-url> --scope=<team>

# Alternative: rollback to previous
vercel rollback
```

### Git-Based Rollback
```bash
# If deployment issue is code-related
git log --oneline -10  # Find last good commit
git revert <bad-commit-hash>
git push origin main

# Vercel auto-deploys the revert
# Monitor deployment in dashboard
```

---

## API Rollback (Railway/Render)

### Railway Rollback
```bash
# Via Dashboard (Fastest)
1. Railway Dashboard > Project > Deployments
2. Click "Rollback" on previous successful deployment
3. Confirm - takes 1-2 minutes

# Via CLI
railway rollback
railway status  # Verify rollback success
```

### Render Rollback
```bash
# Via Dashboard
1. Render Dashboard > Service > Deploys
2. Find previous successful deploy
3. Click "Rollback" button
4. Confirm - takes 2-3 minutes
```

### Manual Git Rollback (Both Platforms)
```bash
# Push previous commit to trigger redeploy
git log --oneline -10
git push origin <last-good-commit>:main --force

# Or revert specific commit
git revert <bad-commit-hash>
git push origin main
```

---

## Database Rollback (⚠️ REQUIRES APPROVAL)

### Point-in-Time Recovery (Neon)
```bash
# ⚠️ DESTRUCTIVE - REQUIRES APPROVAL BEFORE EXECUTION ⚠️

# Via Neon Console
1. Neon Console > Database > Backups
2. Select restore point (up to 7-30 days)
3. Create new branch from restore point
4. Test on new branch first
5. If verified, update DATABASE_URL to new branch

# Update environment variables
# Railway/Render: Update DATABASE_URL in dashboard
# Vercel: Update DATABASE_URL in environment variables
```

### Supabase Rollback
```bash
# ⚠️ DESTRUCTIVE - REQUIRES APPROVAL BEFORE EXECUTION ⚠️

# Via Supabase Dashboard
1. Supabase Dashboard > Database > Backups
2. Select backup point
3. Click "Restore" (creates new project)
4. Update DATABASE_URL in all environments
```

### Migration Rollback
```bash
# ⚠️ USE WITH EXTREME CAUTION ⚠️

# For schema-only rollback (no data loss)
cd apps/api

# Check migration history
npx prisma migrate status

# Create manual migration to undo changes
npx prisma migrate dev --create-only --name rollback_feature_x

# Edit the migration.sql to reverse changes
# Example: DROP TABLE, ALTER TABLE to remove columns, etc.

# Apply rollback migration
npx prisma migrate deploy

# Verify schema
npx prisma validate
```

---

## External Service Issues

### Stripe Issues
```bash
# Switch to test mode temporarily (if critical)
1. Update STRIPE_SECRET_KEY to test key
2. Update STRIPE_WEBHOOK_SECRET to test webhook secret
3. Redeploy API
4. Display maintenance message for billing features

# Or disable billing temporarily
# Comment out Stripe routes in API and redeploy
```

### Resend/Email Issues
```bash
# Email service fallback already built-in
# Service automatically falls back to mock mode if RESEND_API_KEY unavailable

# To force mock mode:
1. Remove RESEND_API_KEY from environment
2. Redeploy API
3. Check logs - should show "mock mode" messages
```

### OpenAI Issues
```bash
# Disable AI features temporarily
1. Set OPENAI_API_KEY to empty or invalid value
2. Redeploy API
3. AI agents will return cached/fallback responses

# Or implement circuit breaker (already in code)
# Service degrades gracefully when OpenAI unavailable
```

---

## Monitoring & Verification

### Post-Rollback Verification Checklist
```bash
# 1. Run smoke tests
./scripts/smoke.sh

# 2. Check all critical endpoints
curl -sS https://app.yourdomain.com/health
curl -sS https://api.yourdomain.com/health

# 3. Test user flows
# - User signup/login
# - Dashboard access
# - API functionality
# - Payment flow (if not in maintenance)

# 4. Monitor error rates
# Check Vercel/Railway/Render dashboards for:
# - Error rate < 1%
# - Response time normal
# - No 5xx errors

# 5. Database connectivity
# Verify API can connect to database
# Check for connection pool exhaustion
```

### Communication Plan
```bash
# Internal notification (Slack/Teams)
"🚨 ROLLBACK EXECUTED: [Component] rolled back due to [issue]. 
Current status: [status]. ETA for fix: [time]"

# User notification (if needed)
# Status page update or banner in app
"We've temporarily rolled back a recent update. 
All services are operational. We're working on a fix."
```

---

## Prevention & Monitoring

### Rollback Triggers (Auto-Alert)
- Error rate > 5% for 2+ minutes
- Response time > 5s for 2+ minutes  
- Database connection failures
- External service failures affecting core features

### Monitoring Setup
```bash
# Vercel Analytics - Core Web Vitals alerts
# Railway/Render - Resource usage and error rate alerts
# Database - Connection count and query performance alerts
# External APIs - Response time and rate limit alerts

# Recommended alerting thresholds:
# - Web: LCP > 2.5s, FID > 100ms, CLS > 0.1
# - API: Response time > 1s, Error rate > 1%
# - DB: Connection count > 80%, Query time > 500ms
```

### Staged Rollback Strategy
1. **Immediate**: Rollback web app (user-facing issues)
2. **Secondary**: Rollback API (backend issues)  
3. **Last Resort**: Database rollback (data corruption only)

### Testing Rollback Procedures
```bash
# Monthly rollback drill (staging environment)
1. Deploy intentional "bad" code to staging
2. Execute rollback procedures
3. Verify rollback speed and completeness
4. Document any issues or improvements
5. Update procedures based on learnings
```

---

## Recovery Procedures

### After Successful Rollback
1. **Investigate root cause** - Review logs, metrics, code changes
2. **Create fix** - Address issue in development environment
3. **Test thoroughly** - Staging deployment + full test suite
4. **Gradual rollout** - Deploy fix during low-traffic hours
5. **Monitor closely** - Watch metrics for 2+ hours post-deployment

### Communication Timeline
- **Immediate** (< 5 min): Internal team notification
- **15 minutes**: Status update to stakeholders  
- **1 hour**: Preliminary root cause analysis
- **24 hours**: Full incident report with prevention measures

---

## Emergency Contacts

### Platform Support
- **Vercel**: Support dashboard or email
- **Railway**: Discord community or support email
- **Render**: Support dashboard
- **Neon**: Support email or Discord
- **Supabase**: Support dashboard

### Team Escalation
1. **Primary**: Engineering team lead
2. **Secondary**: DevOps/Infrastructure lead  
3. **Executive**: CTO/Technical founder

Remember: **Fast rollback is better than perfect rollback**. Get the system stable first, investigate second.



