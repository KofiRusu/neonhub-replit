# Database Governance & Compliance

**Document Version:** 1.0  
**Last Updated:** 2025-10-26  
**Scope:** NeonHub Database Security, Compliance, and Data Governance

---

## Overview

This document defines governance policies, compliance requirements, data retention strategies, and security practices for the NeonHub database infrastructure.

**Compliance Frameworks:**
- GDPR (EU General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- SOC 2 Type II (Security, Availability, Confidentiality)
- HIPAA-ready architecture (if health data added)

---

## Audit Logging

### AuditLog Model

The `AuditLog` table tracks all sensitive database operations for compliance and forensics.

**Schema:**
```prisma
model AuditLog {
  id             String   @id @default(cuid())
  organizationId String?  // Tenant isolation
  userId         String?  // Actor identification
  actorType      String?  // "user", "agent", "system", "api"
  action         String   // Operation performed
  resourceId     String?  // Affected entity ID
  resourceType   String?  // Entity type (e.g., "Campaign", "Connector")
  requestHash    String?  // Request fingerprint (for deduplication)
  metadata       Json?    // Additional context
  ip             String?  // Request origin
  createdAt      DateTime @default(now())

  @@index([organizationId, createdAt])
  @@index([userId, createdAt])
  @@index([action])
}
```

### Required Audit Events

| Action | Triggered By | Retention |
|--------|--------------|-----------|
| `user.created` | User signup | 7 years |
| `user.deleted` | GDPR erasure request | 7 years |
| `permission.granted` | Admin adds role | 7 years |
| `permission.revoked` | Admin removes access | 7 years |
| `api_key.created` | API key generation | 2 years |
| `api_key.revoked` | API key deletion | 2 years |
| `data.exported` | User exports data | 7 years |
| `campaign.published` | Campaign goes live | 2 years |
| `connector.authorized` | OAuth flow completed | 2 years |
| `connector.revoked` | User disconnects app | 2 years |
| `agent.executed` | AI agent runs | 90 days |
| `data.accessed` | Sensitive data viewed | 1 year |

### Audit Log Implementation

```typescript
// apps/api/src/services/audit.ts
import { prisma } from '../lib/prisma';

export async function logAudit({
  organizationId,
  userId,
  action,
  resourceType,
  resourceId,
  metadata,
  ip,
}: {
  organizationId?: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ip?: string;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId,
      userId,
      actorType: userId ? 'user' : 'system',
      action,
      resourceType,
      resourceId,
      metadata,
      ip,
    },
  });
}

// Usage example
await logAudit({
  organizationId: org.id,
  userId: user.id,
  action: 'connector.authorized',
  resourceType: 'ConnectorAuth',
  resourceId: connectorAuth.id,
  metadata: { provider: 'SLACK', accountName: 'workspace-name' },
  ip: req.ip,
});
```

### Audit Log Retention

| Environment | Retention Period | Archival Strategy |
|-------------|------------------|-------------------|
| Development | 30 days | Delete after retention |
| Staging | 90 days | Archive to S3 after 30 days |
| Production | 7 years (compliance) | Archive to cold storage after 1 year |

**Automated Cleanup (Production):**
```sql
-- Archive logs older than 1 year to S3
-- (Run monthly via scheduled job)
COPY (
  SELECT * FROM audit_logs 
  WHERE "createdAt" < NOW() - INTERVAL '1 year'
) TO PROGRAM 'gzip | aws s3 cp - s3://neonhub-audit-archive/$(date +%Y%m).csv.gz';

-- Delete archived logs from live database
DELETE FROM audit_logs 
WHERE "createdAt" < NOW() - INTERVAL '1 year';
```

---

## RBAC & Permissions

### Role Hierarchy

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Owner** | Full workspace control | Organization founder |
| **Admin** | User + resource management | Technical leads |
| **Member** | Standard access (create, read, update own) | Marketing team |
| **Viewer** | Read-only access | Stakeholders, auditors |
| **Agent** | Automated operations (scoped) | AI agents, integrations |

### Permission Model

Granular permissions stored in `OrganizationPermission`:

| Permission Key | Description | Required Role |
|----------------|-------------|---------------|
| `workspace:manage` | Manage workspace settings, billing | Owner, Admin |
| `users:invite` | Invite new users | Owner, Admin |
| `users:remove` | Remove users | Owner, Admin |
| `agents:execute` | Run AI agents | Admin, Member |
| `agents:configure` | Edit agent configs | Admin |
| `campaigns:create` | Create campaigns | Admin, Member |
| `campaigns:publish` | Publish campaigns | Admin |
| `campaigns:view` | View campaign results | All roles |
| `connectors:connect` | Authorize connectors | Admin, Member |
| `connectors:disconnect` | Revoke connector access | Admin, Member |
| `data:export` | Export organization data | Owner, Admin |
| `data:delete` | Delete organization data | Owner only |
| `api_keys:create` | Generate API keys | Admin |
| `api_keys:revoke` | Revoke API keys | Admin |

### Row-Level Security (RLS)

Enforce tenant isolation at query level:

```typescript
// apps/api/src/middleware/tenant.ts
export function enforceTenantIsolation(req, res, next) {
  const { organizationId } = req.user;
  
  // Inject organizationId filter into all queries
  req.prisma = prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          if ('organizationId' in args.where) {
            args.where.organizationId = organizationId;
          }
          return query(args);
        },
      },
    },
  });
  
  next();
}
```

### Permission Checking

```typescript
// apps/api/src/middleware/permissions.ts
import { prisma } from '../lib/prisma';

export function requirePermission(key: string) {
  return async (req, res, next) => {
    const { userId, organizationId } = req.user;
    
    const membership = await prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
    
    const hasPermission = membership?.role?.rolePermissions.some(
      (rp) => rp.permission.key === key
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Usage
app.post('/api/campaigns', 
  authenticate,
  requirePermission('campaigns:create'),
  createCampaign
);
```

---

## Data Retention

### User Content

| Data Type | Retention | Deletion Trigger |
|-----------|-----------|------------------|
| Active drafts | Indefinite | User/admin deletes |
| Published content | 2 years | Automated cleanup |
| Deleted items | 30 days (soft delete) | Hard delete after 30 days |
| Archived campaigns | 2 years | Admin purges |

### Analytics & Metrics

| Data Type | Retention | Archival |
|-----------|-----------|----------|
| Campaign metrics | 2 years | Archive to S3 after 1 year |
| Agent run logs | 90 days | Delete after retention |
| Usage records | 7 years (billing) | Archive to cold storage |
| API call logs | 30 days | Rolling deletion |

### Vector Embeddings

| Data Type | Retention | Maintenance |
|-----------|-----------|-------------|
| Active dataset embeddings | Indefinite | VACUUM weekly |
| Archived dataset embeddings | 1 year | Delete after archive |
| Message embeddings | 2 years | Delete with conversation |
| Brand voice embeddings | Indefinite | Update on brand changes |

**Weekly Maintenance Script:**
```sql
-- Vacuum vector tables to reclaim space and optimize indexes
VACUUM ANALYZE chunks;
VACUUM ANALYZE messages;
VACUUM ANALYZE brand_voices;

-- Rebuild IVFFLAT indexes if row count changed >20%
REINDEX INDEX CONCURRENTLY chunks_embedding_cosine_idx;
```

---

## Vector Index Maintenance

### IVFFLAT Index Tuning

The `lists` parameter should be tuned based on row count:

| Rows | Lists | Query Time | Build Time |
|------|-------|------------|------------|
| <10K | 100 | Fast | Fast |
| 10K-100K | 200 | Medium | Medium |
| 100K-1M | 500 | Slow | Slow |
| >1M | 1000+ | Very slow | Very slow |

**Dynamic Tuning:**
```sql
-- Check current row count
SELECT COUNT(*) FROM chunks;

-- Update lists parameter based on count
ALTER INDEX chunks_embedding_cosine_idx 
SET (lists = GREATEST(100, (SELECT COUNT(*) FROM chunks) / 1000));

-- Rebuild index with new parameter
REINDEX INDEX CONCURRENTLY chunks_embedding_cosine_idx;
```

### Vacuum Schedule

```sql
-- Daily vacuum (low impact)
VACUUM chunks;

-- Weekly analyze (update statistics)
ANALYZE chunks;
ANALYZE messages;
ANALYZE brand_voices;

-- Monthly full vacuum (reclaim space)
VACUUM FULL chunks;  -- Requires table lock, schedule during maintenance window
```

---

## PII & Compliance

### Sensitive Fields

| Table | Field | Encryption | Access Control |
|-------|-------|------------|----------------|
| ConnectorAuth | accessToken | ✅ AES-256 | Decrypt only on use |
| ConnectorAuth | refreshToken | ✅ AES-256 | Decrypt only on refresh |
| Credential | accessToken | ✅ AES-256 | Admin + owner only |
| ApiKey | tokenHash | ✅ SHA-256 | Hashed (irreversible) |
| User | email | ❌ Plaintext | Logged in audit |
| User | stripeCustomerId | ❌ Plaintext | Admin only |

### Encryption at Rest

All database storage encrypted with:
- **Neon:** AES-256 encryption (automatic)
- **Self-hosted:** Enable PostgreSQL TDE (Transparent Data Encryption)

### Encryption in Transit

All connections use SSL/TLS:
```
DATABASE_URL=postgresql://...?sslmode=require
```

### GDPR Right to Erasure

Implement cascading deletes via foreign key constraints:

```sql
-- Deleting a user cascades to all owned entities
DELETE FROM users WHERE id = 'user-id';

-- Cascades:
-- - accounts (OAuth)
-- - sessions
-- - organization_memberships
-- - credentials
-- - connector_auths
-- - api_keys
-- - content_drafts
-- - agent_jobs
-- - campaigns (owned)
-- - feedback
-- - tasks
```

**Audit Requirements:**
```typescript
// Log erasure request
await logAudit({
  userId: user.id,
  action: 'user.deleted',
  metadata: { 
    reason: 'GDPR erasure request',
    requestedAt: new Date().toISOString(),
    verifiedBy: admin.email,
  },
});

// Delete user (triggers cascades)
await prisma.user.delete({ where: { id: user.id } });
```

### GDPR Data Export

```typescript
// apps/api/src/services/gdpr.ts
export async function exportUserData(userId: string) {
  const data = {
    user: await prisma.user.findUnique({ where: { id: userId } }),
    content: await prisma.content.findMany({ where: { authorId: userId } }),
    conversations: await prisma.conversation.findMany({ 
      where: { createdById: userId },
      include: { messages: true },
    }),
    campaigns: await prisma.campaign.findMany({ where: { ownerId: userId } }),
    connectors: await prisma.connectorAuth.findMany({ 
      where: { userId },
      select: { id: true, accountName: true, status: true, createdAt: true },
      // Exclude sensitive tokens
    }),
    auditLogs: await prisma.auditLog.findMany({ where: { userId } }),
  };
  
  return {
    exportedAt: new Date().toISOString(),
    userId,
    data,
    format: 'JSON',
  };
}
```

---

## Observability

### Key Metrics

| Metric | Threshold | Action |
|--------|-----------|--------|
| Query latency (p95) | <500ms | Alert if >1s |
| Connection pool utilization | <80% | Scale if >90% |
| Index hit rate | >95% | Rebuild indexes if <90% |
| Slow queries (>500ms) | <10/hour | Optimize if >50/hour |
| Vector search latency | <200ms | Tune IVFFLAT if >500ms |
| Database size growth | <10GB/week | Alert if >50GB/week |
| Backup success rate | 100% | Critical alert if <100% |

### Monitoring Tools

| Tool | Purpose | Alerts |
|------|---------|--------|
| Neon Metrics Dashboard | Query performance, connections | Email + Slack |
| Sentry | Application errors | PagerDuty |
| DataDog | Infrastructure metrics | Email |
| Custom scripts/db-smoke.mjs | Row counts, integrity | GitHub Actions |

### Slow Query Log

Enable in `postgresql.conf`:
```conf
log_min_duration_statement = 500  # Log queries >500ms
log_statement = 'all'             # Log all statements (dev only)
log_connections = on
log_disconnections = on
```

Query slow queries:
```sql
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 500
ORDER BY total_exec_time DESC
LIMIT 20;
```

---

## Security Checklist

- [ ] **Row-level security (RLS)** via `organizationId` filtering
- [ ] **API rate limiting** (1000 req/min default, configurable per user)
- [ ] **Connection pooling** configured (pgBouncer or Neon pooling)
- [ ] **SSL/TLS enforced** (`sslmode=require` in DATABASE_URL)
- [ ] **Secrets rotation** (API keys, connector tokens) every 90 days
- [ ] **Audit log review** (monthly SIEM analysis)
- [ ] **Backup verification** (monthly restore test)
- [ ] **Access control review** (quarterly permission audit)
- [ ] **Vector index maintenance** (weekly VACUUM, monthly REINDEX)
- [ ] **Vulnerability scanning** (Snyk, npm audit, Prisma security advisories)

---

## Incident Response

### Data Breach Protocol

1. **Identify affected records**
   ```sql
   SELECT * FROM audit_logs 
   WHERE "createdAt" > 'breach-timestamp'
   AND "resourceType" IN ('User', 'ConnectorAuth', 'ApiKey');
   ```

2. **Notify security team** (within 1 hour)
   - Slack: `#security-incidents`
   - Email: security@neonhub.ai
   - PagerDuty: Critical alert

3. **Rotate affected credentials**
   ```typescript
   await prisma.connectorAuth.updateMany({
     where: { userId: { in: affectedUserIds } },
     data: { status: 'revoked' },
   });
   
   await prisma.apiKey.updateMany({
     where: { createdById: { in: affectedUserIds } },
     data: { revokedAt: new Date() },
   });
   ```

4. **Audit log forensics**
   - Export affected audit logs
   - Identify attack vector
   - Document timeline

5. **User notification** (GDPR: within 72 hours)
   - Email affected users
   - Provide remediation steps
   - Offer credit monitoring (if PII exposed)

### Rollback Procedure

See [DB_BACKUP_RESTORE.md](./DB_BACKUP_RESTORE.md) for detailed rollback steps.

**Quick Rollback:**
1. Stop application traffic
2. Restore from last known-good backup
3. Replay WAL to desired timestamp (Neon PITR)
4. Verify data integrity (`node scripts/db-smoke.mjs`)
5. Resume traffic

---

## Compliance Audit Trail

### SOC 2 Requirements

| Control | Implementation | Verification |
|---------|----------------|--------------|
| Access control | RBAC + audit logging | Monthly access review |
| Change management | Migration version control | GitHub PR approvals |
| Backup & recovery | Automated daily backups | Monthly restore test |
| Encryption | TLS + AES-256 at rest | SSL cert monitoring |
| Audit logging | `AuditLog` table | Quarterly SIEM analysis |

### GDPR Compliance

| Requirement | Implementation | Documentation |
|-------------|----------------|---------------|
| Right to access | `/api/users/export` endpoint | [GDPR.md](../security/GDPR.md) |
| Right to erasure | Cascading delete + audit | This document |
| Data portability | JSON export format | API documentation |
| Breach notification | 72-hour alert process | Incident response plan |
| Data minimization | Retention policies | This document |

---

## Data Quality & Integrity

### Referential Integrity

All foreign keys enforce `ON DELETE CASCADE` or `ON DELETE SET NULL`:

```prisma
model OrganizationMembership {
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role         OrganizationRole? @relation(fields: [roleId], references: [id], onDelete: SetNull)
}
```

### Data Validation

Prisma schema enforces:
- ✅ Required fields (`@db.Text`, `String`, etc.)
- ✅ Unique constraints (`@@unique([userId, organizationId])`)
- ✅ Enums (`ConnectorKind`, `AgentStatus`, etc.)
- ✅ Indexes for query performance

### Consistency Checks

Monthly data integrity audit:
```sql
-- Orphaned records check
SELECT COUNT(*) FROM connector_auths ca
WHERE NOT EXISTS (
  SELECT 1 FROM connectors c WHERE c.id = ca."connectorId"
);
-- Expected: 0

-- Duplicate slugs check
SELECT slug, COUNT(*) FROM organizations
GROUP BY slug
HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- Null vector embeddings check
SELECT COUNT(*) FROM chunks WHERE embedding IS NULL;
-- Expected: 0 (all chunks should have embeddings)
```

---

**Document Owner:** Database Team  
**Review Schedule:** Quarterly  
**Next Review:** 2026-01-26  
**Compliance Frameworks:** GDPR, CCPA, SOC 2

