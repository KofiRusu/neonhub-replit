# Database Provisioning Guide - NeonHub v3.x Production

## Overview

This guide covers provisioning a managed PostgreSQL database for NeonHub v3.x production deployment. Choose between Neon (recommended) or Supabase.

## Schema Summary

**Tables**: 7 core tables  
**Features**: NextAuth.js integration, content management, AI agent jobs, analytics  
**Size**: Initial ~50MB, estimated growth 10-50GB/year depending on usage

### Table Structure
- `users` - User accounts and profiles
- `accounts` - OAuth provider accounts (NextAuth)
- `sessions` - User sessions (NextAuth)
- `verification_tokens` - Email verification (NextAuth)
- `content_drafts` - AI-generated content storage
- `agent_jobs` - Async job queue for AI agents
- `metric_events` - Analytics and usage tracking

## Option A: Neon Database (Recommended)

### Why Neon?
- ✅ Built for serverless/edge deployments
- ✅ Automatic scaling and connection pooling
- ✅ Excellent Railway/Render integration
- ✅ Built-in branching for staging environments
- ✅ Competitive pricing for production workloads

### Provisioning Steps

1. **Create Account**
   ```bash
   # Visit: https://neon.tech
   # Sign up with GitHub/Google
   ```

2. **Create Project**
   ```bash
   Project Name: neonhub-production
   Region: us-east-1 (or closest to your users)
   PostgreSQL Version: 15+ (recommended)
   ```

3. **Configure Database**
   ```bash
   Database Name: neonhub
   Owner: neondb_owner (default)
   ```

4. **Obtain Connection Details**
   ```bash
   # Format: postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require
   # Example: postgresql://neondb_owner:abc123@ep-cool-fire-123.us-east-1.aws.neon.tech/neonhub?sslmode=require
   ```

5. **Security Configuration**
   - Enable connection pooling
   - Set connection limits (recommend: 20-50 for production)
   - Configure IP allowlist if required
   - Enable audit logging

### Neon-Specific Optimizations

```sql
-- Connection pooling optimization
SET statement_timeout = '30s';
SET idle_in_transaction_session_timeout = '10s';

-- JSON performance (for agent_jobs.input/output)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

## Option B: Supabase Database

### Why Supabase?
- ✅ Generous free tier
- ✅ Built-in auth (can complement NextAuth)
- ✅ Real-time subscriptions available
- ✅ Good developer experience

### Provisioning Steps

1. **Create Project**
   ```bash
   # Visit: https://supabase.com/dashboard
   # Create new project
   Project Name: neonhub-production
   Region: us-east-1
   Database Password: [secure-password]
   ```

2. **Database Configuration**
   ```bash
   # Navigate to Settings > Database
   # Connection info tab
   ```

3. **Obtain Connection String**
   ```bash
   # Format: postgresql://postgres:[password]@[host]:5432/postgres
   # Example: postgresql://postgres:your-password@db.abc123.supabase.co:5432/postgres
   ```

4. **Security Setup**
   - Configure Row Level Security (RLS) if using Supabase auth
   - Set connection pooling mode: Transaction
   - Configure SSL mode: Require

## Production Configuration Checklist

### Database Settings
- [ ] **Connection Limits**: Set appropriate max connections (20-100)
- [ ] **SSL**: Enforce SSL connections (`sslmode=require`)
- [ ] **Backup**: Enable automated daily backups
- [ ] **Monitoring**: Set up connection/performance alerts
- [ ] **Scaling**: Configure auto-scaling policies

### Security Hardening
- [ ] **Network**: Restrict access to application IPs only
- [ ] **Credentials**: Use strong, unique passwords (32+ chars)
- [ ] **Rotation**: Plan for regular credential rotation
- [ ] **Audit**: Enable connection and query logging
- [ ] **Encryption**: Verify data-at-rest encryption enabled

### Performance Optimization
- [ ] **Connection Pooling**: Enable with appropriate pool size
- [ ] **Indexes**: Verify all migration indexes applied
- [ ] **Query Analysis**: Set up slow query monitoring
- [ ] **Cache**: Consider Redis for session storage if needed

## Connection Testing

### Local Testing
```bash
# Test connection from local environment
export DATABASE_URL="postgresql://..."
cd apps/api
npx prisma migrate status  # Should show migration history
npx prisma studio  # Visual database browser
```

### Production Validation
```bash
# Test from deployment environment
psql $DATABASE_URL -c "SELECT version();"
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

## Monitoring Setup

### Key Metrics to Track
- **Connection Count**: Monitor active connections vs limits
- **Query Performance**: Track slow queries (>1s)
- **Storage Growth**: Monitor database size over time
- **Error Rates**: Track connection failures and query errors

### Recommended Tools
- Neon: Built-in monitoring dashboard
- Supabase: Built-in metrics + external APM
- External: Datadog, New Relic, or Prometheus

## Cost Optimization

### Neon Pricing Considerations
- **Compute**: Pay for active usage time
- **Storage**: Charged per GB stored
- **Data Transfer**: Minimal charges for typical usage
- **Branches**: Development/staging branches

### Supabase Pricing
- **Free Tier**: 500MB storage, 2 projects
- **Pro Tier**: $25/month, 8GB storage included
- **Scaling**: Pay for additional storage/compute

## Backup & Disaster Recovery

### Automated Backups
```bash
# Neon: Automatic point-in-time recovery (7-30 days)
# Supabase: Daily automated backups

# Additional manual backup
pg_dump $DATABASE_URL > neonhub_backup_$(date +%Y%m%d).sql
```

### Recovery Testing
- [ ] Test backup restoration process
- [ ] Verify backup integrity monthly
- [ ] Document recovery time objectives (RTO)
- [ ] Plan for cross-region disaster recovery

## Environment Management

### Database Environments
- **Production**: Primary customer-facing database
- **Staging**: Pre-production testing (Neon branch recommended)
- **Development**: Local development (can use local PostgreSQL)

### Branch Strategy (Neon)
```bash
# Create staging branch from production
# Neon Console: Create Branch > From: main > Name: staging
# Use staging DATABASE_URL for pre-production testing
```

---

**Next Steps**: After provisioning, proceed to MIGRATION_PLAN.md for safe migration execution.



