# NeonHub Deployment & Operations Guide

**Version:** 3.0+  
**Last Updated:** November 17, 2025  
**Status:** Production Architecture (Vercel + Railway + Neon.tech)

---

## Overview

NeonHub uses a hybrid deployment architecture optimized for scalability, reliability, and developer experience. The platform is deployed across multiple managed services, each chosen for its specific strengths.

### Deployment Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Production Setup                     │
├──────────────────────────────────────────────────────┤
│  Web (Vercel)  │  API (Railway)  │  DB (Neon.tech)  │
│                │                  │                   │
│  - Next.js SSR │  - Express       │  - PostgreSQL 15 │
│  - Edge CDN    │  - tRPC          │  - pgvector      │
│  - Auto-scale  │  - WebSocket     │  - Serverless    │
│  - Global      │  - Background    │  - Auto-scaling  │
│                │    Workers       │  - Branching     │
└──────────────────────────────────────────────────────┘
```

### Hosting Providers

| Component | Provider | URL |
|-----------|----------|-----|
| **Web Frontend** | Vercel | https://neonhubecosystem.com |
| **API Backend** | Railway | https://api.neonhubecosystem.com |
| **Database** | Neon.tech | Serverless PostgreSQL |
| **Cache/Queue** | Upstash/Railway | Redis |

---

## Environments

### 1. Local Development
- **Web:** http://localhost:3000
- **API:** http://localhost:3001
- **DB:** Docker PostgreSQL or Neon.tech dev branch

### 2. Staging
- **Web:** https://staging.neonhubecosystem.com
- **API:** https://api-staging.neonhubecosystem.com
- **DB:** Neon.tech staging branch

### 3. Production
- **Web:** https://neonhubecosystem.com
- **API:** https://api.neonhubecosystem.com
- **DB:** Neon.tech production database

---

## Deployment Procedures

### Web Frontend (Vercel)

**Auto-Deploy on Push:**
- Push to `main` branch → Production deploy
- Push to `dev` branch → Preview deploy
- Pull requests → Preview deploy

**Manual Deploy:**
```bash
# Via Vercel CLI
cd apps/web
vercel --prod

# Via GitHub Actions
# Workflow: .github/workflows/deploy-web.yml (planned)
```

**Environment Variables:**
Configure in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DATABASE_URL` (for NextAuth)
- OAuth credentials

**See:** [`docs/WEB_DEPLOYMENT.md`](./WEB_DEPLOYMENT.md), [`docs/VERCEL_QUICK_DEPLOY.md`](./VERCEL_QUICK_DEPLOY.md)

### API Backend (Railway)

**Auto-Deploy on Push:**
- Connected to GitHub repository
- Push to `main` → Production deploy

**Manual Deploy:**
```bash
# Via Railway CLI
railway up

# Or via GitHub Actions
# Workflow: .github/workflows/deploy-api.yml (planned)
```

**Environment Variables:**
Configure in Railway dashboard:
- `DATABASE_URL` (from Neon.tech)
- `DIRECT_DATABASE_URL`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`
- `CORS_ORIGINS`

**See:** [`docs/API_DEPLOYMENT.md`](./API_DEPLOYMENT.md)

### Database (Neon.tech)

**Migration Workflow:**
```bash
# 1. Create migration locally
cd apps/api
pnpm prisma migrate dev --name description

# 2. Test migration on dev branch
# (Neon.tech dev branch auto-created)

# 3. Apply to staging
DATABASE_URL=$STAGING_URL pnpm prisma migrate deploy

# 4. Apply to production
DATABASE_URL=$PROD_URL pnpm prisma migrate deploy
```

**Branching Strategy:**
- **Main branch:** Production
- **Dev branch:** Development
- **Preview branches:** Per-feature testing

**See:** [`docs/DATABASE_AUTONOMOUS_DEPLOYMENT_GUIDE.md`](./DATABASE_AUTONOMOUS_DEPLOYMENT_GUIDE.md), [`docs/DB_DEPLOYMENT_GUIDE.md`](./DB_DEPLOYMENT_GUIDE.md)

---

## Pre-Deployment Checklist

### Before Every Deploy

- [ ] All tests passing (`pnpm test`)
- [ ] Linting clean (`pnpm lint`)
- [ ] TypeScript builds (`pnpm typecheck`)
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] API health check passes
- [ ] Frontend builds successfully

### First-Time Setup

- [ ] Domain DNS configured
- [ ] SSL certificates issued (auto via Vercel/Railway)
- [ ] Database provisioned (Neon.tech)
- [ ] Environment secrets added
- [ ] Monitoring configured
- [ ] Backup strategy enabled

**See:** [`docs/DEPLOY_CHECKLIST.md`](./DEPLOY_CHECKLIST.md)

---

## Domain Configuration

### Attach Custom Domain

**Web (Vercel):**
1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `neonhubecosystem.com`
3. Configure DNS (Vercel provides records)
4. Wait for SSL certificate (automatic)

**API (Railway):**
1. Railway Dashboard → Project → Settings → Networking
2. Add custom domain: `api.neonhubecosystem.com`
3. Add CNAME record pointing to Railway
4. SSL auto-configured

**See:** [`docs/DOMAIN_ATTACH_PROD.md`](./DOMAIN_ATTACH_PROD.md), [`docs/DOMAIN_ATTACH_STAGING.md`](./DOMAIN_ATTACH_STAGING.md)

---

## CI/CD Workflows

### GitHub Actions

**Workflows:**
- **`ci.yml`** - Main CI pipeline (lint, test, build)
- **`db-deploy.yml`** - Database migrations
- **`db-drift-check.yml`** - Schema drift detection
- **`security-preflight.yml`** - Security checks

**Workflow Example:**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
```

**See:** [`GITHUB_WORKFLOWS_GUIDE.md`](../GITHUB_WORKFLOWS_GUIDE.md), [`docs/CI_CD_SETUP.md`](./CI_CD_SETUP.md)

---

## Monitoring & Observability

### Health Checks

**API Health Endpoint:**
```bash
curl https://api.neonhubecosystem.com/health

# Expected:
{
  "status": "ok",
  "db": true,
  "ws": true,
  "version": "3.0.0"
}
```

### Prometheus Metrics

**Endpoint:** `https://api.neonhubecosystem.com/metrics`

**Key Metrics:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration
- `agent_runs_total` - Agent executions
- `agent_run_duration_seconds` - Agent execution time
- `db_query_duration_seconds` - Database query time

### Logging

**Structured JSON Logs:**
```json
{
  "level": "info",
  "message": "Agent run completed",
  "agentId": "ag_123",
  "duration": 3542,
  "timestamp": "2025-11-17T10:00:00Z"
}
```

**Log Aggregation:**
- Railway built-in logs
- Export to external services (Datadog, LogDNA, etc.)

**See:** [`docs/OBSERVABILITY_GUIDE.md`](./OBSERVABILITY_GUIDE.md), [`docs/OBSERVABILITY_PROD.md`](./OBSERVABILITY_PROD.md)

---

## Rollback Procedures

### Web (Vercel)

**Instant Rollback:**
1. Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

**Via CLI:**
```bash
vercel rollback
```

### API (Railway)

**Rollback Steps:**
1. Railway Dashboard → Deployments
2. Select previous deployment
3. Click "Redeploy"

### Database

**Caution:** Database rollbacks are complex.

**Safe Rollback:**
```bash
# 1. Create backup
pg_dump $DATABASE_URL > backup.sql

# 2. Apply rollback migration (if exists)
pnpm prisma migrate resolve --rolled-back 20251117_migration_name

# 3. If destructive, restore from backup
psql $DATABASE_URL < backup.sql
```

**See:** [`docs/ROLLBACK_RUNBOOK.md`](./ROLLBACK_RUNBOOK.md), [`docs/ROLLBACK.md`](./ROLLBACK.md)

---

## Production Operations

### Runbooks

- **[`docs/PRODUCTION_RUNBOOK.md`](./PRODUCTION_RUNBOOK.md)** - Production operations
- **[`docs/LOCAL_RUNBOOK.md`](./LOCAL_RUNBOOK.md)** - Local development
- **[`docs/RUNBOOK.md`](./RUNBOOK.md)** - General runbook

### Maintenance Tasks

**Daily:**
- Check health endpoints
- Review error logs
- Monitor performance metrics

**Weekly:**
- Review database performance
- Check disk usage
- Update dependencies (security patches)

**Monthly:**
- Full security audit
- Performance optimization review
- Backup verification

### Incident Response

**Severity Levels:**
- **P0 (Critical):** Site down, data loss
- **P1 (High):** Major feature broken
- **P2 (Medium):** Minor feature broken
- **P3 (Low):** Cosmetic issues

**Response SOP:**
1. Acknowledge incident
2. Assess severity
3. Communicate status
4. Mitigate (rollback if needed)
5. Root cause analysis
6. Post-mortem

---

## Backup & Disaster Recovery

### Database Backups

**Neon.tech Auto-Backups:**
- **Frequency:** Continuous WAL archiving
- **Retention:** 7 days (standard), 30 days (pro)
- **Point-in-time Recovery:** Available

**Manual Backup:**
```bash
# Full backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20251117.sql
```

### Application Backups

**Git Repository:**
- All code versioned in Git
- Tags for releases

**Configuration:**
- Environment variables documented
- Secrets stored in password manager

**See:** [`docs/DB_BACKUP_RESTORE.md`](./DB_BACKUP_RESTORE.md)

---

## Security Considerations

### Secrets Management

**Never commit secrets!**

**Use environment variables:**
- Vercel: Dashboard → Settings → Environment Variables
- Railway: Dashboard → Variables
- Local: `.env` files (gitignored)

### SSL/TLS

- Auto-configured by Vercel and Railway
- Certificates auto-renewed
- Force HTTPS (redirect HTTP → HTTPS)

### Access Control

- **Database:** Least privilege roles
- **API:** Rate limiting, authentication
- **Admin:** 2FA enabled

**See:** [`docs/SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md), [`docs/SECURITY_READINESS.md`](./SECURITY_READINESS.md)

---

## Scaling

### Horizontal Scaling

**Web (Vercel):**
- Auto-scales on demand
- Edge caching for static content
- Serverless functions

**API (Railway):**
- Manual scaling: Adjust replicas
- Auto-scaling: Coming soon

### Vertical Scaling

**Database (Neon.tech):**
- Auto-scales compute resources
- Storage scales automatically

### Performance Optimization

**Caching:**
- Redis for API response caching
- React Query caching on frontend
- CDN caching for static assets

**Database:**
- Connection pooling (pgBouncer)
- Query optimization
- Indexes on hot queries

---

## Cost Management

### Estimated Monthly Costs

- **Vercel (Pro):** $20/month
- **Railway (Hobby):** $5-20/month
- **Neon.tech (Pro):** $20-50/month
- **Total:** ~$50-100/month

### Cost Optimization

- Enable caching to reduce database queries
- Optimize images (next/image)
- Use static generation where possible
- Monitor LLM API usage (OpenAI costs)

---

## Related Documentation

### Deployment Documentation
- [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) - General deployment
- [`docs/HYBRID_DEPLOYMENT_v3.0.md`](./HYBRID_DEPLOYMENT_v3.0.md) - Hybrid strategy
- [`docs/PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) - Production deploy
- [`docs/QUICK_DEPLOYMENT_GUIDE.md`](./QUICK_DEPLOYMENT_GUIDE.md) - Quick guide

### Operations Documentation
- [`docs/PRODUCTION_RUNBOOK.md`](./PRODUCTION_RUNBOOK.md) - Production ops
- [`docs/OBSERVABILITY_GUIDE.md`](./OBSERVABILITY_GUIDE.md) - Monitoring
- [`docs/SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md) - Security

### Database Operations
- [`docs/DATABASE_AUTONOMOUS_DEPLOYMENT_GUIDE.md`](./DATABASE_AUTONOMOUS_DEPLOYMENT_GUIDE.md)
- [`docs/DB_DEPLOYMENT_GUIDE.md`](./DB_DEPLOYMENT_GUIDE.md)
- [`docs/DB_GOVERNANCE.md`](./DB_GOVERNANCE.md)

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2025  
**Maintained By:** NeonHub DevOps Team  
**Next Review:** December 1, 2025

