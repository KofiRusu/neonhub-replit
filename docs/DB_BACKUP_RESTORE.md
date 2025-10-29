# Database Backup & Restore Procedures

**Version:** 1.0  
**Last Updated:** 2025-10-28  
**Database:** Neon.tech PostgreSQL 16 + pgvector

---

## Overview

This document outlines backup and restore procedures for NeonHub's production database. All procedures are designed for Neon.tech serverless PostgreSQL with consideration for vector embeddings and multi-tenant data.

---

## Local Development Backups

### Backup

```bash
# Full database dump
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup (recommended)
pg_dump "$DATABASE_URL" | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Schema-only backup
pg_dump --schema-only "$DATABASE_URL" > schema_backup_$(date +%Y%m%d_%H%M%S).sql

# Data-only backup
pg_dump --data-only "$DATABASE_URL" > data_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore

```bash
# Restore from uncompressed backup
psql "$DATABASE_URL" < backup_YYYYMMDD_HHMMSS.sql

# Restore from compressed backup
gunzip -c backup_YYYYMMDD_HHMMSS.sql.gz | psql "$DATABASE_URL"

# Restore with transaction safety (all or nothing)
psql "$DATABASE_URL" --single-transaction < backup_YYYYMMDD_HHMMSS.sql
```

### Selective Table Backup

```bash
# Backup specific tables (e.g., connectors and auth)
pg_dump "$DATABASE_URL" \
  -t connectors \
  -t connector_auths \
  -t agents \
  -t tools \
  > connectors_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore specific tables
psql "$DATABASE_URL" < connectors_backup_YYYYMMDD_HHMMSS.sql
```

---

## Production (Neon) Backups

### Branch-Based Backups

Neon branches are the recommended backup method for production.

#### Create Backup Branch

**Via Neon Console:**
1. Navigate to https://console.neon.tech
2. Select your project
3. Go to "Branches" tab
4. Click "Create Branch"
5. Name: `backup-YYYY-MM-DD-pre-migration`
6. Source: `main` (or current production branch)
7. Click "Create"

**Via Neon CLI:**
```bash
# Install Neon CLI
npm install -g neonctl

# Login
neonctl auth

# Create backup branch
neonctl branches create \
  --project-id <project-id> \
  --name backup-$(date +%Y%m%d-%H%M%S) \
  --parent main
```

**Via API:**
```bash
curl -X POST \
  https://console.neon.tech/api/v2/projects/<project-id>/branches \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "backup-2025-10-28-pre-migration",
    "parent_id": "br-main-xxxxx"
  }'
```

#### Restore from Branch

**Option 1: Promote Branch to Main**
1. In Neon Console, go to Branches
2. Select backup branch
3. Click "Set as Primary"
4. Confirm promotion

**Option 2: Connect Application to Branch**
```bash
# Update DATABASE_URL to backup branch connection string
DATABASE_URL=postgresql://neondb_owner:****@ep-backup-branch.c-2.us-east-2.aws.neon.tech/neondb
```

**Option 3: Copy Data from Branch**
```bash
# Dump from backup branch
pg_dump "$BACKUP_BRANCH_URL" > restore_from_branch.sql

# Restore to main branch
psql "$MAIN_BRANCH_URL" < restore_from_branch.sql
```

---

### Point-in-Time Recovery (PITR)

**Retention Period:**
- Free tier: 7 days of WAL history
- Launch tier: 7 days
- Scale tier: 30 days
- Enterprise tier: Custom (up to 90 days)

#### Restore to Specific Timestamp

**Via Neon Console:**
1. Go to Branches → Create Branch
2. Select "Point in time" option
3. Choose timestamp (within retention period)
4. Create branch with desired state
5. Test branch before promoting

**Via CLI:**
```bash
neonctl branches create \
  --project-id <project-id> \
  --name restore-$(date +%Y%m%d-%H%M%S) \
  --parent main \
  --timestamp "2025-10-28T10:30:00Z"
```

---

## Automated Backups

### GitHub Actions Workflow

Create `.github/workflows/db-backup.yml`:

```yaml
name: DB Backup

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:      # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      
      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          BACKUP_FILE="neonhub_backup_${TIMESTAMP}.sql.gz"
          
          echo "Creating backup: $BACKUP_FILE"
          pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
          
          echo "Backup size: $(ls -lh $BACKUP_FILE | awk '{print $5}')"
          echo "backup_file=$BACKUP_FILE" >> $GITHUB_OUTPUT
        id: backup
      
      - name: Upload to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-2
        run: |
          aws s3 cp "${{ steps.backup.outputs.backup_file }}" \
            s3://neonhub-backups/database/ \
            --storage-class STANDARD_IA
      
      - name: Notify Slack
        if: always()
        run: |
          STATUS="${{ job.status }}"
          EMOJI="✅"
          [ "$STATUS" != "success" ] && EMOJI="❌"
          
          curl -X POST "${{ secrets.SLACK_WEBHOOK_URL }}" \
            -H 'Content-type: application/json' \
            -d "{\"text\":\"${EMOJI} Database backup ${STATUS}: ${{ steps.backup.outputs.backup_file }}\"}"
```

### Backup Script

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/neonhub_${TIMESTAMP}.sql.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
echo "🔄 Creating database backup..."
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

# Calculate size
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup created: $BACKUP_FILE ($SIZE)"

# Cleanup old backups
echo "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "neonhub_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "✨ Backup complete!"
```

**Usage:**
```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
```

---

## Rollback Procedures

### Revert Migration

```bash
# Mark migration as rolled back (does not undo SQL)
cd apps/api
npx prisma migrate resolve --rolled-back <migration_name>

# Example:
npx prisma migrate resolve --rolled-back 20251028_budget_transactions
```

**Note:** This only updates migration records. You must manually restore data.

### Emergency Restore (Full Database)

```bash
# 1. Stop application traffic (set maintenance mode)
# 2. Drop current database (⚠️ DESTRUCTIVE)
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 3. Restore from backup
psql "$DATABASE_URL" < emergency_backup.sql

# 4. Reapply migrations to sync state
cd apps/api
npx prisma migrate deploy

# 5. Verify integrity
node ../../scripts/db-smoke.mjs

# 6. Resume traffic
```

### Partial Restore (Specific Tables)

```bash
# Restore only affected tables
pg_restore --table=connectors \
           --table=connector_auths \
           --dbname="$DATABASE_URL" \
           backup_YYYYMMDD.dump

# Or with SQL backup:
psql "$DATABASE_URL" << 'EOF'
BEGIN;
TRUNCATE connectors CASCADE;
\i connectors_backup_YYYYMMDD.sql
COMMIT;
EOF
```

---

## Backup Verification

### Test Restore (Monthly)

```bash
#!/bin/bash
# Test restore to temporary database

# 1. Create test database
TEST_DB_URL="postgresql://localhost:5432/neonhub_restore_test"
createdb neonhub_restore_test

# 2. Restore backup
psql "$TEST_DB_URL" < latest_backup.sql

# 3. Run smoke tests
DATABASE_URL="$TEST_DB_URL" node scripts/db-smoke.mjs

# 4. Cleanup
dropdb neonhub_restore_test
```

### Backup Integrity Check

```bash
# Verify backup file is not corrupted
gunzip -t backup_YYYYMMDD_HHMMSS.sql.gz && echo "✅ Backup integrity OK"

# Verify row counts match
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM connectors;" 
# Compare with backup
```

---

## Storage Recommendations

### Storage Options

| Option | Cost | Durability | Retrieval Time | Best For |
|--------|------|------------|----------------|----------|
| **Neon Branches** | Included | High | Instant | Recent backups (7-30 days) |
| **S3 Standard** | $0.023/GB/mo | 99.999999999% | Immediate | Hot backups |
| **S3 Standard-IA** | $0.0125/GB/mo | 99.999999999% | Immediate | Warm backups (30-90 days) |
| **S3 Glacier** | $0.004/GB/mo | 99.999999999% | 1-5 minutes | Cold backups (> 90 days) |
| **S3 Deep Archive** | $0.00099/GB/mo | 99.999999999% | 12 hours | Compliance (7 years) |

### Retention Strategy

**Recommended:**
- **Daily backups:** Keep 7 days (S3 Standard)
- **Weekly backups:** Keep 4 weeks (S3 Standard-IA)
- **Monthly backups:** Keep 12 months (S3 Glacier)
- **Yearly backups:** Keep 7 years (S3 Deep Archive) - for compliance

**Lifecycle Policy:**
```json
{
  "Rules": [
    {
      "Id": "NeonHub-Backup-Lifecycle",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 365,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 2555
      }
    }
  ]
}
```

---

## Best Practices

### ✅ Do's

- ✅ Test backups monthly (restore to staging)
- ✅ Store backups in separate region (disaster recovery)
- ✅ Encrypt backup files (`gpg` or `openssl`)
- ✅ Document restoration time objective (RTO)
- ✅ Maintain 30-day retention minimum
- ✅ Use Neon branches for quick rollbacks
- ✅ Automate daily backups via GitHub Actions
- ✅ Monitor backup job success/failure
- ✅ Keep backup credentials secure (1Password, Vault)

### ❌ Don'ts

- ❌ Don't backup to the same server as database
- ❌ Don't skip backup verification
- ❌ Don't store backups unencrypted
- ❌ Don't forget to backup pgvector extension state
- ❌ Don't rely on single backup method
- ❌ Don't neglect off-site backups
- ❌ Don't ignore backup failures

---

## Disaster Recovery (DR)

### Recovery Time Objective (RTO)

- **Neon Branch Restore:** < 5 minutes
- **S3 Standard Restore:** < 15 minutes
- **S3 Glacier Restore:** 1-5 minutes + restore time
- **Full Database Rebuild:** < 1 hour

### Recovery Point Objective (RPO)

- **Neon PITR:** Up to 30 days (Scale tier)
- **Daily Backups:** Last 24 hours
- **Weekly Backups:** Last 7 days

### DR Runbook

**Scenario: Complete Database Loss**

1. **Assess Situation**
   - Confirm database is unreachable
   - Determine last known-good state
   - Notify stakeholders

2. **Retrieve Backup**
   - Find most recent backup (S3 or Neon branch)
   - Verify backup integrity
   - Download/prepare backup

3. **Provision New Database**
   - Create new Neon project (if needed)
   - Configure extensions (pgvector, uuid-ossp)
   - Set connection pooling

4. **Restore Data**
   - Restore from backup
   - Apply pending migrations
   - Verify data integrity

5. **Update Application**
   - Update DATABASE_URL secrets
   - Redeploy applications
   - Run smoke tests

6. **Post-Mortem**
   - Document incident
   - Review backup procedures
   - Implement improvements

---

## Encryption

### Encrypt Backup

```bash
# Using GPG
pg_dump "$DATABASE_URL" | gzip | gpg -c --cipher-algo AES256 > backup_encrypted.sql.gz.gpg

# Using OpenSSL
pg_dump "$DATABASE_URL" | gzip | openssl enc -aes-256-cbc -salt -out backup_encrypted.sql.gz.enc
```

### Decrypt and Restore

```bash
# Using GPG
gpg -d backup_encrypted.sql.gz.gpg | gunzip | psql "$DATABASE_URL"

# Using OpenSSL
openssl enc -aes-256-cbc -d -in backup_encrypted.sql.gz.enc | gunzip | psql "$DATABASE_URL"
```

---

## Contact & Support

**Database Administrator:** devops@neonhub.ai  
**Emergency Contact:** +1-XXX-XXX-XXXX  
**Neon Support:** https://neon.tech/docs/support  
**Slack Channel:** #database-ops

---

## Appendix: Neon-Specific Commands

### List Branches
```bash
neonctl branches list --project-id <project-id>
```

### Get Branch Details
```bash
neonctl branches get <branch-id> --project-id <project-id>
```

### Delete Old Backup Branch
```bash
neonctl branches delete <branch-id> --project-id <project-id>
```

### Get Connection String for Branch
```bash
neonctl connection-string <branch-id> --project-id <project-id>
```

---

**Document Version:** 1.0  
**Next Review:** 2025-11-28  
**Owner:** DevOps Team
