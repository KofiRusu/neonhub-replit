# Production Rollback Runbook

**Purpose:** Safely revert to previous healthy state  
**Max Time:** 15 minutes

---

## 🚨 When to Rollback

- Critical bug in production
- Database migration failure
- Service completely down
- Security incident

---

## 🔄 Rollback Procedure

### 1. Identify Issue (5 min)

- Check `/health` endpoint
- Review Grafana dashboards
- Check error rates in Prometheus
- Review recent deployments

### 2. Execute Rollback (10 min)

**API (Railway):**
```bash
# Via Railway dashboard
1. Go to project → Deployments
2. Find last successful deployment
3. Click "Redeploy"
4. Wait for health check
```

**Web (Vercel):**
```bash
# Via Vercel dashboard
1. Go to project → Deployments
2. Find last successful deployment
3. Click "Promote to Production"
4. Verify in ~60 seconds
```

**Database (if needed):**
```bash
# Rollback specific migration
pnpm prisma migrate resolve --rolled-back 20241101093000_problematic_migration

# Or restore from backup
gh workflow run db-restore.yml --field BACKUP_ID=latest
```

### 3. Verify (5 min)

```bash
# Run smoke tests
./scripts/post-deploy-smoke.sh \
  https://api.neonhubecosystem.com \
  https://neonhubecosystem.com

# Check metrics
curl https://api.neonhubecosystem.com/metrics | grep "5xx"
```

---

*Rollback Runbook - November 2, 2025*

