# NeonHub Operations Runbook

**Version:** 3.2.0  
**Last Updated:** 2025-10-20

## Table of Contents
1. [Deployment Procedures](#deployment-procedures)
2. [Database Migrations](#database-migrations)
3. [Environment Setup](#environment-setup)
4. [Health Checks](#health-checks)
5. [Troubleshooting](#troubleshooting)
6. [Rollback Procedures](#rollback-procedures)
7. [Common Issues](#common-issues)

---

## Deployment Procedures

### Pre-Deployment Checklist
- [ ] All tests passing (`npm test`)
- [ ] Lint clean (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup taken
- [ ] Rollback plan documented

### Railway API Deployment

```bash
# 1. Verify environment variables
railway variables

# Required variables:
# - DATABASE_URL
# - NEXTAUTH_SECRET
# - ENCRYPTION_KEY
# - GITHUB_ID, GITHUB_SECRET
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
# - OPENAI_API_KEY

# 2. Deploy
railway up

# 3. Run migrations
railway run npx prisma migrate deploy

# 4. Verify deployment
curl https://your-api.railway.app/health
```

### Vercel Web Deployment

```bash
# 1. Set environment variables in Vercel dashboard
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET

# 2. Deploy
vercel --prod

# 3. Verify
curl https://your-app.vercel.app
```

### Post-Deployment Verification

```bash
# Run smoke tests
./scripts/smoke-test-production.sh

# Check health endpoint
curl https://api.neonhub.com/health | jq

# Expected response:
# {
#   "status": "healthy",
#   "version": "3.2.0",
#   "checks": {
#     "database": { "status": "ok" },
#     "stripe": { "status": "ok" },
#     "openai": { "status": "ok" }
#   }
# }
```

---

## Database Migrations

### Running Migrations

**Development:**
```bash
cd apps/api
npx prisma migrate dev --name migration_description
```

**Production:**
```bash
# Always backup first!
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Deploy migrations
npx prisma migrate deploy

# Verify migration
npx prisma migrate status
```

### Rollback Migration

```bash
# Identify migration to rollback to
npx prisma migrate status

# Manual rollback (if needed)
psql $DATABASE_URL -f backup_YYYYMMDD_HHMMSS.sql
```

### Schema Sync (Development Only)

```bash
# Push schema changes without creating migration
npx prisma db push
```

---

## Environment Setup

### Required Environment Variables

**API ([`apps/api/.env`](apps/api/.env)):**

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/neonhub

# Auth
NEXTAUTH_SECRET=<min-32-chars>          # Generate: openssl rand -base64 32
NEXTAUTH_URL=https://your-app.com
GITHUB_ID=<github-oauth-client-id>
GITHUB_SECRET=<github-oauth-secret>
GOOGLE_CLIENT_ID=<google-oauth-id>
GOOGLE_CLIENT_SECRET=<google-oauth-secret>

# Security
ENCRYPTION_KEY=<64-hex-chars>            # Generate: openssl rand -hex 32

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_FREE=price_...
STRIPE_PRODUCT_FREE=prod_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRODUCT_PRO=prod_...
STRIPE_PRICE_ENTERPRISE=price_...
STRIPE_PRODUCT_ENTERPRISE=prod_...

# OpenAI
OPENAI_API_KEY=sk-...

# Observability
SENTRY_DSN=https://...@sentry.io/...
NODE_ENV=production
PORT=4000
```

**Web ([`apps/web/.env`](apps/web/.env)):**

```bash
NEXT_PUBLIC_API_URL=https://api.neonhub.com
NEXTAUTH_URL=https://app.neonhub.com
NEXTAUTH_SECRET=<same-as-api>
DATABASE_URL=<same-as-api>
```

### Generating Secrets

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY (must be exactly 64 hex characters)
openssl rand -hex 32

# Verify encryption key length
echo $ENCRYPTION_KEY | wc -c  # Should output 65 (64 + newline)
```

---

## Health Checks

### API Health Endpoint

```bash
curl https://api.neonhub.com/health
```

**Response Structure:**
```json
{
  "status": "healthy" | "degraded",
  "version": "3.2.0",
  "checks": {
    "database": { "status": "ok" | "error", "latency": 10 },
    "stripe": { "status": "ok" | "error" },
    "openai": { "status": "ok" | "error" }
  },
  "timestamp": "2025-10-20T14:00:00.000Z"
}
```

### Monitoring Alerts

Set up alerts for:
- HTTP 500 errors > 1% of requests
- Health check failures
- Database connection failures
- API response time > 1s (p95)
- Memory usage > 80%
- CPU usage > 90%

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failures

**Symptom:** Users cannot log in, see "Authentication failed"

**Diagnosis:**
```bash
# Check auth configuration
echo $NEXTAUTH_SECRET | wc -c  # Must be > 32
echo $NEXTAUTH_URL              # Must match deployment URL

# Check OAuth credentials
curl https://github.com/login/oauth/authorize?client_id=$GITHUB_ID
```

**Solution:**
- Verify `NEXTAUTH_SECRET` is set and > 32 characters
- Ensure `NEXTAUTH_URL` matches your domain
- Check OAuth app configuration in GitHub/Google console
- Verify callback URLs match: `https://your-app.com/api/auth/callback/github`

#### 2. Credential Decryption Errors

**Symptom:** "Decryption failed" or "Invalid encryption key"

**Diagnosis:**
```bash
# Check encryption key
echo $ENCRYPTION_KEY | wc -c  # Must be exactly 65 (64 + newline)

# Check database for encrypted credentials
psql $DATABASE_URL -c "SELECT id, provider, \"encryptedData\" FROM \"Credential\" LIMIT 1;"
```

**Solution:**
- Verify `ENCRYPTION_KEY` is exactly 64 hex characters
- **CRITICAL:** If encryption key changed, old credentials cannot be decrypted
- Re-authenticate users to generate new encrypted credentials

#### 3. Stripe Webhook Failures

**Symptom:** Webhook events not processing, subscriptions not updating

**Diagnosis:**
```bash
# Check webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Check recent webhook deliveries in Stripe Dashboard
# https://dashboard.stripe.com/webhooks
```

**Solution:**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook endpoint is accessible: `https://api.neonhub.com/api/webhook/stripe`
- Review webhook logs in Stripe dashboard
- Ensure webhook signature validation is working

#### 4. Database Connection Issues

**Symptom:** "P1001: Can't reach database server"

**Diagnosis:**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'neonhub';"
```

**Solution:**
- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Review connection pool settings in Prisma
- Check firewall rules allow connections

#### 5. Campaign Scheduling Failures

**Symptom:** Campaigns not sending at scheduled time

**Diagnosis:**
```bash
# Check scheduled campaigns
psql $DATABASE_URL -c "SELECT id, name, status, \"scheduledFor\" FROM \"Campaign\" WHERE status = 'SCHEDULED';"

# Check background job processor
# (If using BullMQ or similar)
```

**Solution:**
- Verify system time is correct
- Check timezone configuration
- Review background job processor logs
- Ensure adequate resources for job execution

### Logs & Debugging

**API Logs:**
```bash
# Railway
railway logs --tail 100

# Local
tail -f logs/api.log
```

**Database Queries:**
```bash
# Enable query logging in Prisma
# Add to schema.prisma:
# log = ["query", "info", "warn", "error"]

# Or check PostgreSQL logs
psql $DATABASE_URL -c "SELECT query FROM pg_stat_statements ORDER BY calls DESC LIMIT 10;"
```

---

## Rollback Procedures

### Quick Rollback

**Railway API:**
```bash
# Rollback to previous deployment
railway rollback

# Or deploy specific version
railway deploy --service api --environment production
```

**Vercel Web:**
```bash
# Rollback in Vercel dashboard or CLI
vercel rollback https://neonhub-xxx.vercel.app
```

### Database Rollback

```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Or rollback specific migration
npx prisma migrate resolve --rolled-back migration_name
```

### Complete Rollback Procedure

1. **Stop incoming traffic** (maintenance mode)
2. **Backup current state**
   ```bash
   pg_dump $DATABASE_URL > pre_rollback_$(date +%Y%m%d_%H%M%S).sql
   ```
3. **Rollback application** (Railway/Vercel)
4. **Rollback database** (if schema changed)
5. **Verify health checks**
6. **Resume traffic**
7. **Monitor for issues**

---

## Common Issues

### High CPU Usage

**Diagnosis:**
- Check active campaigns
- Review database query performance
- Check for runaway background jobs

**Solution:**
- Scale up resources temporarily
- Optimize slow queries
- Implement rate limiting

### Memory Leaks

**Diagnosis:**
```bash
# Check memory usage
railway metrics

# Profile Node.js
node --inspect dist/src/server.js
```

**Solution:**
- Restart service
- Review recent code changes
- Check for unclosed database connections
- Implement connection pooling

### Quota Exceeded

**Symptom:** "Campaign limit reached" for paying users

**Diagnosis:**
```sql
SELECT 
  u.email,
  s.tier,
  COUNT(c.id) as campaign_count
FROM "User" u
JOIN "Subscription" s ON s."userId" = u.id
JOIN "Campaign" c ON c."userId" = u.id
GROUP BY u.email, s.tier;
```

**Solution:**
- Verify subscription status in Stripe
- Check usage counter accuracy
- Reset usage if incorrect
- Contact user to confirm subscription

---

## Emergency Contacts

- **On-Call Engineer:** [Configure PagerDuty/OpsGenie]
- **Database Admin:** [DBA contact]
- **Security Team:** [Security contact]
- **Stripe Support:** https://support.stripe.com

## Monitoring Dashboards

- **API Metrics:** https://railway.app/project/neonhub
- **Web Metrics:** https://vercel.com/neonhub
- **Database:** [PostgreSQL monitoring tool]
- **Error Tracking:** https://sentry.io/neonhub
- **Uptime:** [Status page URL]

---

## Maintenance Windows

- **Preferred:** Sunday 02:00-04:00 UTC (lowest traffic)
- **Maximum Duration:** 2 hours
- **Notification:** 24 hours advance notice
- **Status Page:** Update before/during/after maintenance

---

## Security Incident Response

1. **Identify** the security issue
2. **Contain** the threat (disable affected features)
3. **Notify** security team immediately
4. **Investigate** scope and impact
5. **Remediate** the vulnerability
6. **Communicate** with affected users (if data breach)
7. **Document** the incident and lessons learned

---

## Performance Baselines

**API Response Times:**
- Health check: < 50ms
- Simple queries: < 200ms
- Complex operations: < 1s
- Campaign creation: < 500ms

**Database:**
- Connection pool: 10-20 connections
- Query latency (p95): < 100ms
- Connection time: < 50ms

**Web App:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

---

## Backup & Recovery

### Automated Backups
- **Frequency:** Daily at 03:00 UTC
- **Retention:** 30 days
- **Location:** [Backup storage location]

### Manual Backup
```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress
gzip backup_*.sql

# Upload to secure storage
aws s3 cp backup_*.sql.gz s3://neonhub-backups/
```

### Recovery Testing
- **Frequency:** Monthly
- **Procedure:** Restore backup to staging environment
- **Verification:** Run smoke tests

---

## Contact & Escalation

For issues not covered in this runbook:
1. Check [GitHub Issues](https://github.com/neonhub/neonhub/issues)
2. Review [Sentry errors](https://sentry.io/neonhub)
3. Escalate to on-call engineer
4. Create incident report

---

**Last Review:** 2025-10-20  
**Next Review:** 2025-11-20