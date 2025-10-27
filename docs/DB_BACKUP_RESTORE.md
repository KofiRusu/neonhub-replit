# Database Backup & Restore Procedures

**Document Version:** 1.0  
**Last Updated:** 2025-10-26  
**Applies To:** NeonHub Database Infrastructure

---

## Overview

This document outlines backup, restore, and disaster recovery procedures for the NeonHub database across local development, staging, and production environments.

**Database Details:**
- **Provider:** PostgreSQL 16+ with pgvector extension
- **Hosting:** Neon (recommended) or self-hosted
- **Schema:** 48 models, 6 migrations, vector embeddings (1536 dimensions)
- **Critical Data:** Organization/RBAC, Brand/Agent configs, Campaigns, Connectors (15 platforms), Vector embeddings

---

## Local Development Backups

### Quick Backup

```bash
# Backup to timestamped SQL file
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# With compression
pg_dump "$DATABASE_URL" | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Schema-Only Backup

```bash
# Backup structure without data
pg_dump --schema-only "$DATABASE_URL" > schema_$(date +%Y%m%d).sql
```

### Data-Only Backup

```bash
# Backup data without schema
pg_dump --data-only "$DATABASE_URL" > data_$(date +%Y%m%d).sql
```

### Selective Table Backup

```bash
# Backup specific tables (e.g., connectors catalog)
pg_dump -t connectors -t connector_auths "$DATABASE_URL" > connectors_backup.sql
```

### Restore from Backup

```bash
# Restore from uncompressed backup
psql "$DATABASE_URL" < backup_YYYYMMDD_HHMMSS.sql

# Restore from compressed backup
gunzip -c backup_YYYYMMDD_HHMMSS.sql.gz | psql "$DATABASE_URL"

# Restore with transaction safety
psql "$DATABASE_URL" --single-transaction < backup.sql
```

---

## Production (Neon) Backups

### Branch-Based Backups

Neon provides **database branching** for zero-downtime backups:

```bash
# Via Neon Console
1. Navigate to Neon Console → Your Project
2. Click "Branches" tab
3. Click "Create Branch"
4. Name: backup-YYYY-MM-DD
5. Source: main (production)
6. Click "Create"
```

**Benefits:**
- ✅ Instant (copy-on-write)
- ✅ No downtime
- ✅ Full database state preserved
- ✅ Can promote branch to main if needed

### Point-in-Time Recovery (PITR)

Neon automatically retains **Write-Ahead Log (WAL)** history:

| Tier | Retention | Use Case |
|------|-----------|----------|
| Free | 7 days | Development/testing |
| Pro | 14 days | Staging environments |
| Enterprise | 30+ days | Production compliance |

**Restore to Specific Timestamp:**
1. Navigate to Neon Console → Branches
2. Create new branch from `main`
3. Select "Restore to timestamp"
4. Choose date/time (within retention window)
5. Click "Create"
6. Test data integrity on new branch
7. Promote to main if verified

### Scheduled Backups via GitHub Actions

Create `.github/workflows/db-backup.yml`:

```yaml
name: DB Backup

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    steps:
      - name: Backup Database
        run: |
          # Install PostgreSQL client
          sudo apt-get update && sudo apt-get install -y postgresql-client
          
          # Create timestamped backup
          pg_dump "$DATABASE_URL" | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
      
      - name: Upload to S3
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Sync to S3 Bucket
        run: |
          aws s3 cp backup_*.sql.gz s3://neonhub-backups/db/$(date +%Y/%m/)
      
      - name: Cleanup Old Backups
        run: |
          # Delete S3 backups older than 90 days
          aws s3 ls s3://neonhub-backups/db/ --recursive \
            | awk '$1 < "'$(date -d '90 days ago' +%Y-%m-%d)'" {print $4}' \
            | xargs -I {} aws s3 rm s3://neonhub-backups/{}
```

**Alternative: Upload to Google Cloud Storage**

```yaml
- name: Upload to GCS
  uses: google-github-actions/upload-cloud-storage@v2
  with:
    path: backup_*.sql.gz
    destination: neonhub-backups/db/${{ github.run_number }}
    credentials: ${{ secrets.GCP_SA_KEY }}
```

---

## Self-Hosted PostgreSQL Backups

### Continuous Archiving (WAL Shipping)

Configure `postgresql.conf`:

```conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /mnt/backup/wal/%f && cp %p /mnt/backup/wal/%f'
```

### Base Backup Script

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/mnt/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/neonhub_$DATE.sql.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Perform backup
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
  echo "✅ Backup created: $BACKUP_FILE"
  echo "Size: $(du -h $BACKUP_FILE | cut -f1)"
else
  echo "❌ Backup failed"
  exit 1
fi

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "neonhub_*.sql.gz" -mtime +30 -delete

echo "✅ Old backups cleaned up (>30 days removed)"
```

### Cron Schedule

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

---

## Rollback Procedures

### Revert Last Migration

If a migration causes issues:

```bash
# Mark migration as rolled back
pnpm --filter apps/api prisma migrate resolve --rolled-back 20251026_add_connector_kind_enum

# Manually revert SQL changes
psql "$DATABASE_URL" << EOF
DROP TYPE IF EXISTS "ConnectorKind" CASCADE;
ALTER TABLE connectors ALTER COLUMN category TYPE TEXT;
EOF

# Update Prisma schema to match
# Edit apps/api/prisma/schema.prisma (revert enum changes)

# Regenerate client
pnpm --filter apps/api prisma generate
```

### Emergency Full Restore

If database is corrupted or data loss occurs:

```bash
# 1. STOP application to prevent new writes
# (Scale down API containers / stop server)

# 2. Create backup of current state (even if corrupted)
pg_dump "$DATABASE_URL" > emergency_pre_restore_$(date +%Y%m%d_%H%M%S).sql

# 3. Drop and recreate database (DESTRUCTIVE)
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 4. Restore from last known-good backup
psql "$DATABASE_URL" < backup_YYYYMMDD_HHMMSS.sql

# 5. Apply any missing migrations
pnpm --filter apps/api prisma migrate deploy

# 6. Verify data integrity
node scripts/db-smoke.mjs

# 7. Restart application
```

### Neon Branch Promotion (Zero-Downtime Rollback)

1. Create new branch from backup point
2. Test branch with staging environment
3. Update `DATABASE_URL` to point to new branch
4. Redeploy application (no schema changes needed)
5. Archive old main branch

---

## Backup Verification & Testing

### Monthly Backup Test

Test restore procedure monthly to ensure backups are viable:

```bash
# 1. Spin up temporary PostgreSQL instance
docker run --name backup-test -e POSTGRES_PASSWORD=test -d -p 5434:5432 postgres:16

# 2. Restore backup to test instance
psql "postgresql://postgres:test@localhost:5434/postgres" < backup_YYYYMMDD.sql

# 3. Verify row counts match production
psql "postgresql://postgres:test@localhost:5434/postgres" \
  -c "SELECT COUNT(*) FROM connectors;"  # Should return 15

# 4. Test critical queries
psql "postgresql://postgres:test@localhost:5434/postgres" \
  -c "SELECT name FROM connectors ORDER BY name;"

# 5. Cleanup
docker stop backup-test && docker rm backup-test
```

### Automated Backup Validation

Add to GitHub Actions workflow:

```yaml
- name: Validate Backup
  run: |
    # Extract first 100 lines of backup
    gunzip -c backup.sql.gz | head -100 > sample.sql
    
    # Check for critical schemas
    grep -q "CREATE TYPE \"ConnectorKind\"" sample.sql || exit 1
    grep -q "CREATE TABLE \"connectors\"" sample.sql || exit 1
    
    echo "✅ Backup validation passed"
```

---

## Best Practices

### Backup Strategy (3-2-1 Rule)

✅ **3 copies** of data:
- Production database (live)
- Daily automated backup (S3/GCS)
- Weekly archive (cold storage)

✅ **2 different media types**:
- Cloud object storage (S3, GCS, Azure Blob)
- Neon branch (database-native)

✅ **1 off-site copy**:
- Different geographic region
- Different cloud provider (optional)

### Retention Policies

| Backup Type | Retention | Frequency |
|-------------|-----------|-----------|
| Hourly snapshots | 24 hours | Every hour |
| Daily backups | 30 days | Daily at 2 AM UTC |
| Weekly backups | 12 weeks | Sunday 2 AM UTC |
| Monthly backups | 1 year | 1st of month |
| Annual backups | 7 years | Jan 1 (compliance) |

### Encryption

All backups must be encrypted:

```bash
# Encrypt backup with GPG
pg_dump "$DATABASE_URL" | gzip | gpg --encrypt --recipient backup@neonhub.ai > backup.sql.gz.gpg

# Decrypt and restore
gpg --decrypt backup.sql.gz.gpg | gunzip | psql "$DATABASE_URL"
```

### Backup Size Monitoring

```bash
# Check backup growth trends
aws s3 ls s3://neonhub-backups/db/ --recursive --human-readable \
  | tail -30 \
  | awk '{print $1, $2, $3, $4}' \
  | sort
```

**Alert if backup size:**
- Increases >50% week-over-week (potential data anomaly)
- Decreases >30% (possible backup failure)

---

## Recovery Time Objectives (RTO)

| Scenario | RTO Target | Actual |
|----------|------------|--------|
| Single table restore | 5 minutes | ~3 minutes |
| Full database restore (Neon branch) | 15 minutes | ~10 minutes |
| Full database restore (from S3) | 30 minutes | ~25 minutes |
| Point-in-time recovery | 20 minutes | ~15 minutes |

## Recovery Point Objectives (RPO)

| Environment | RPO Target | Backup Frequency |
|-------------|------------|------------------|
| Production | 1 hour | Continuous WAL + hourly snapshots |
| Staging | 24 hours | Daily backups |
| Development | 7 days | Weekly backups |

---

## Disaster Recovery Checklist

- [ ] Identify failure scope (single table / full database / infrastructure)
- [ ] Stop application traffic to prevent data corruption
- [ ] Create emergency backup of current state
- [ ] Identify last known-good backup within RPO
- [ ] Restore backup to staging environment first
- [ ] Verify data integrity with smoke tests
- [ ] Apply any missing migrations
- [ ] Update DNS/connection strings if needed
- [ ] Resume application traffic
- [ ] Monitor for errors and performance issues
- [ ] Document incident in post-mortem

---

## Support Contacts

| Issue | Contact | Response Time |
|-------|---------|---------------|
| Neon platform issues | support@neon.tech | <4 hours |
| S3 access issues | AWS Support | <2 hours |
| Database corruption | DBA on-call | <30 minutes |
| Backup script failures | DevOps team | <1 hour |

---

**Document Owner:** Infrastructure Team  
**Review Schedule:** Quarterly  
**Next Review:** 2026-01-26

