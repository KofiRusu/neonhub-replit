# Database Migration Plan - NeonHub v3.x

## Current State Analysis

### Schema Overview
- **Models**: 7 tables (users, accounts, sessions, verification_tokens, content_drafts, agent_jobs, metric_events)
- **Migrations**: 1 initial migration (2025-10-12)
- **Features**: NextAuth.js integration, content management, agent job queue, metrics collection

### Migration History
- `20251012154609_initial` - Base schema with all current models

## Production Migration Strategy

### Phase 1: Database Provisioning

#### Option A: Neon (Recommended)
```bash
# 1. Create Neon account/project at https://neon.tech
# 2. Create production database
# 3. Obtain connection string format:
# postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require
```

#### Option B: Supabase  
```bash
# 1. Create Supabase project at https://supabase.com
# 2. Navigate to Settings > Database
# 3. Copy connection string format:
# postgresql://postgres:[password]@[host]:5432/postgres
```

### Phase 2: Migration Execution

#### Safe Migration Process
1. **Backup Current State** (if migrating existing data)
2. **Run Migration in Transaction**
3. **Verify Data Integrity**
4. **Performance Check**

```bash
# Set production DATABASE_URL (store in secure env, never commit)
export DATABASE_URL="postgresql://..."

# Navigate to API directory
cd apps/api

# Check migration status (should show "No pending migrations")
npx prisma migrate status

# Deploy migrations to production
npx prisma migrate deploy

# Verify deployment
npx prisma migrate status
```

## Drift Detection & Resolution

### What Constitutes Drift?
- **Schema Drift**: Database schema differs from Prisma schema
- **Migration Drift**: Migration history inconsistent between environments  
- **Data Drift**: Unexpected data modifications

### If Drift Detected - STOP Protocol

#### 1. Immediate Actions
```bash
# DO NOT PROCEED - Document drift first
npx prisma db pull  # Generate schema from database
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
```

#### 2. Analysis Required
- Compare generated schema with current schema.prisma
- Identify source of drift (manual changes, incomplete migrations, etc.)
- Assess data impact and rollback requirements

#### 3. Resolution Options

**Option A: Reset (Safe if no critical data)**
```bash
npx prisma migrate reset  # WARNING: Destructive
npx prisma migrate deploy
```

**Option B: Repair Migration History**
```bash
# Mark specific migration as applied without running
npx prisma migrate resolve --applied [migration_name]
```

**Option C: Custom Migration**
```bash
# Create targeted migration to fix drift
npx prisma migrate dev --create-only --name fix_drift
# Edit generated migration.sql as needed
npx prisma migrate deploy
```

### Pre-Migration Safety Checklist

- [ ] Database backup created (if existing data)
- [ ] DATABASE_URL points to correct environment
- [ ] Network connectivity to database confirmed
- [ ] Prisma CLI version matches project (5.22.0)
- [ ] Environment variables validated
- [ ] Migration history reviewed
- [ ] Rollback plan documented

### Post-Migration Validation

```bash
# 1. Verify all migrations applied
npx prisma migrate status

# 2. Verify schema matches
npx prisma validate

# 3. Test database connectivity
npx prisma db execute --stdin <<< "SELECT 1;"

# 4. Verify Prisma Client generation
npx prisma generate

# 5. Run application health check
npm run start  # Should connect successfully
```

## Emergency Rollback Procedures

### Immediate Rollback (Schema Issues)
```bash
# 1. Stop application
# 2. Restore from backup
# 3. Verify connectivity
# 4. Restart application
```

### Partial Rollback (Specific Migration)
```bash
# Revert specific migration (create down migration)
# Manual process - requires SQL expertise
```

## Monitoring & Alerts

### Key Metrics to Monitor Post-Migration
- Connection pool utilization
- Query performance baselines
- Error rates (connection failures)
- Migration execution time
- Database size growth

### Success Criteria
- [ ] All tables created successfully
- [ ] Indexes applied correctly
- [ ] Foreign key constraints active
- [ ] Application connects without errors
- [ ] NextAuth.js authentication functional
- [ ] Agent jobs can be queued/processed
- [ ] Metrics collection operational

## Contact & Escalation

If migration fails or drift is detected:
1. **STOP** all deployment activities
2. Document exact error messages
3. Capture database state with `prisma db pull`
4. Contact DevOps team with migration logs
5. Do not attempt manual fixes without approval

---

**Last Updated**: 2025-10-14  
**Schema Version**: v3.0.0 (20251012154609_initial)  
**Prisma Version**: 5.22.0



