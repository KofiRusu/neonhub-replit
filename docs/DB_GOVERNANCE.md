# Database Governance & Compliance

**Version:** 1.0  
**Last Updated:** 2025-10-28  
**Compliance Frameworks:** GDPR, SOC 2, CCPA

---

## Overview

This document outlines database governance policies, compliance requirements, and operational procedures for NeonHub's multi-tenant SaaS platform.

---

## Audit Logging

### AuditLog Model

Tracks all sensitive operations for security, compliance, and forensics.

**Schema:**
```prisma
model AuditLog {
  id             String    @id @default(cuid())
  organizationId String
  userId         String
  action         String
  resourceType   String
  resourceId     String?
  metadata       Json?
  ip             String?
  userAgent      String?
  createdAt      DateTime  @default(now())

  @@index([organizationId, createdAt])
  @@index([userId, createdAt])
  @@index([action])
}
```

### Audited Actions

**User Management:**
- `user.create` - New user registration
- `user.update` - Profile modifications
- `user.delete` - Account deletion
- `user.login` - Authentication events
- `user.password_reset` - Password changes

**Organization:**
- `organization.create` - Workspace creation
- `organization.update` - Settings changes
- `organization.delete` - Workspace deletion
- `membership.add` - User invitation
- `membership.remove` - User removal
- `role.assign` - Role changes

**Data Operations:**
- `connector.auth` - Connector authentication
- `connector.revoke` - Access revocation
- `api_key.create` - API key generation
- `api_key.revoke` - API key revocation
- `export.data` - Data export requests
- `import.data` - Bulk data imports

**Agent Operations:**
- `agent.execute` - Agent execution
- `tool.execute` - Tool usage
- `campaign.publish` - Campaign activation
- `content.publish` - Content publishing

### Required Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `organizationId` | Tenant isolation | `clx1234567890` |
| `userId` | Actor identification | `clx9876543210` |
| `action` | Operation type | `connector.auth` |
| `resourceType` | Entity affected | `ConnectorAuth` |
| `resourceId` | Specific record | `clxabc123` |
| `metadata` | Additional context | `{"connector": "gmail", "scope": "readonly"}` |
| `ip` | Request origin | `192.168.1.100` |
| `userAgent` | Client info | `Mozilla/5.0...` |
| `createdAt` | Timestamp (UTC) | `2025-10-28T15:30:00Z` |

### Implementation

**Backend (Express/tRPC):**
```typescript
import { prisma } from './prisma';

async function createAuditLog({
  organizationId,
  userId,
  action,
  resourceType,
  resourceId,
  metadata,
  req
}: AuditLogInput) {
  await prisma.auditLog.create({
    data: {
      organizationId,
      userId,
      action,
      resourceType,
      resourceId,
      metadata,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  });
}

// Usage: After sensitive operation
await createAuditLog({
  organizationId: user.organizationId,
  userId: user.id,
  action: 'connector.auth',
  resourceType: 'ConnectorAuth',
  resourceId: connectorAuth.id,
  metadata: { connector: 'gmail', status: 'success' },
  req,
});
```

### Retention Policy

| Environment | Retention | Rationale |
|-------------|-----------|-----------|
| **Development** | 30 days | Limited testing data |
| **Staging** | 90 days | Extended testing period |
| **Production** | 1 year | SOC 2 requirement |
| **Compliance** | 7 years | GDPR/legal hold |

**Automated Cleanup:**
```sql
-- Production: Delete logs older than 1 year
DELETE FROM "audit_logs"
WHERE "createdAt" < NOW() - INTERVAL '1 year';

-- Compliance: Archive to cold storage
INSERT INTO "audit_logs_archive"
SELECT * FROM "audit_logs"
WHERE "createdAt" BETWEEN NOW() - INTERVAL '7 years' 
                      AND NOW() - INTERVAL '1 year';
```

---

## RBAC & Permissions

### Role Hierarchy

**1. Owner**
- Full workspace control
- Billing management
- User/role administration
- All permissions (wildcard)

**2. Admin**
- User management
- Resource management
- Agent configuration
- Cannot manage billing

**3. Member**
- Create/edit content
- Execute agents
- View analytics
- Cannot manage users

**4. Viewer**
- Read-only access
- View dashboards
- Download reports
- Cannot modify data

**5. Guest**
- Limited preview access
- Specific campaign view
- Time-bound access
- Cannot export data

### Permission Model

**Schema:**
```prisma
model OrganizationPermission {
  id             String  @id @default(cuid())
  organizationId String
  permission     String  @unique
  description    String?
  category       String?

  rolePermissions RolePermission[]
}

model RolePermission {
  id           String   @id @default(cuid())
  roleId       String
  permissionId String
  
  role       OrganizationRole       @relation(...)
  permission OrganizationPermission @relation(...)
  
  @@unique([roleId, permissionId])
}
```

**Granular Permissions:**

**Workspace:**
- `workspace:manage` - Organization settings
- `workspace:billing` - Payment management
- `workspace:delete` - Workspace deletion

**Users:**
- `users:invite` - Invite team members
- `users:remove` - Remove users
- `users:roles` - Assign roles

**Agents:**
- `agents:create` - Create new agents
- `agents:execute` - Run agent workflows
- `agents:configure` - Modify agent settings
- `agents:delete` - Delete agents

**Campaigns:**
- `campaigns:create` - Create campaigns
- `campaigns:publish` - Activate campaigns
- `campaigns:analytics` - View metrics
- `campaigns:delete` - Delete campaigns

**Data:**
- `data:export` - Export all data
- `data:import` - Bulk data import
- `data:delete` - Permanent deletion

**Connectors:**
- `connectors:auth` - Authenticate connectors
- `connectors:execute` - Use connector actions
- `connectors:revoke` - Revoke access

**Implementation:**
```typescript
// Middleware: Check permission
async function checkPermission(
  userId: string,
  organizationId: string,
  permission: string
): Promise<boolean> {
    const membership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
      include: {
        role: {
          include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  if (!membership) return false;
  
  // Owner has all permissions
  if (membership.role.name === 'owner') return true;

  // Check specific permission
  return membership.role.permissions.some(
    rp => rp.permission.permission === permission
  );
}

// Usage
if (!await checkPermission(userId, organizationId, 'agents:execute')) {
  throw new Error('Insufficient permissions');
}
```

---

## Data Retention

### User Content

| Content Type | Retention | Notes |
|--------------|-----------|-------|
| **Active Drafts** | Indefinite | Until deleted by user |
| **Published Content** | 2 years | Archivable after 1 year |
| **Deleted Items** | 30 days | Soft delete with recovery |
| **Archived Content** | Indefinite | Cold storage (S3 Glacier) |

### Analytics & Metrics

| Metric Type | Retention | Rationale |
|-------------|-----------|-----------|
| **Campaign Metrics** | 2 years | Business analytics |
| **Agent Run Logs** | 90 days | Debugging/optimization |
| **Usage Records** | 7 years | Billing/tax compliance |
| **API Logs** | 30 days | Security monitoring |

### Vector Embeddings

| Embedding Type | Retention | Maintenance |
|----------------|-----------|-------------|
| **Active Datasets** | Indefinite | Until dataset deleted |
| **Archived Datasets** | 1 year | Move to cold storage |
| **Index Maintenance** | Weekly | `VACUUM ANALYZE` |

**Maintenance Schedule:**
```sql
-- Weekly vector table maintenance
VACUUM ANALYZE chunks;
VACUUM ANALYZE messages;
VACUUM ANALYZE brand_voices;

-- Rebuild indexes quarterly
REINDEX INDEX CONCURRENTLY chunks_embedding_idx;
REINDEX INDEX CONCURRENTLY messages_embedding_idx;
REINDEX INDEX CONCURRENTLY brand_voices_embedding_idx;
```

---

## Vector Index Maintenance

### IVFFLAT Index Tuning

**Lists Parameter:** Should be `rows / 1000` for optimal performance.

```sql
-- Check current row counts
SELECT 
  'chunks' AS table, 
  COUNT(*) AS rows,
  COUNT(*) / 1000 AS recommended_lists
FROM chunks
UNION ALL
SELECT 
  'messages' AS table,
  COUNT(*) AS rows,
  COUNT(*) / 1000 AS recommended_lists
FROM messages;

-- Update lists parameter (example: 50,000 chunks → 50 lists)
ALTER INDEX chunks_embedding_idx 
SET (lists = 50);

-- Rebuild index after parameter change
REINDEX INDEX CONCURRENTLY chunks_embedding_idx;
```

### Index Health Monitoring

```sql
-- Check index size and usage
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size,
  idx_scan AS times_used,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE indexname LIKE '%embedding%'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

### Vacuum Schedule

**Weekly (Automated):**
```bash
#!/bin/bash
# Weekly vacuum script (run via cron)

psql "$DATABASE_URL" << 'SQL'
VACUUM ANALYZE chunks;
VACUUM ANALYZE messages;
VACUUM ANALYZE brand_voices;
SQL
```

**Monthly (Manual):**
```sql
-- Full vacuum (requires downtime or low traffic)
VACUUM FULL chunks;
VACUUM FULL messages;
VACUUM FULL brand_voices;
```

---

## PII & Compliance

### Sensitive Fields

**Encrypted at Rest:**
- `ConnectorAuth.accessToken` - OAuth access tokens
- `ConnectorAuth.refreshToken` - OAuth refresh tokens
- `ConnectorAuth.apiKey` - API keys
- `ConnectorAuth.apiSecret` - API secrets
- `Credential.accessToken` - Generic credential tokens

**Hashed:**
- `ApiKey.tokenHash` - API key SHA-256 hash
- `User.password` - User passwords (via NextAuth)

**Redacted in Logs:**
- All tokens → `***REDACTED***`
- Email addresses → `u***@example.com` (partial)
- Phone numbers → `+1-***-***-1234` (last 4 digits)
- API keys → `neon_***abc123` (first 8 + last 6 chars)

### Implementation

**Token Encryption (AES-256-GCM):**
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Usage
const encryptedToken = encrypt(accessToken);
await prisma.connectorAuth.create({
  data: {
    ...otherFields,
    accessToken: encryptedToken,
  },
});
```

**Log Redaction:**
```typescript
function redactSensitiveData(obj: any): any {
  const sensitive = ['accessToken', 'refreshToken', 'apiKey', 'apiSecret', 'password'];
  
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }
  
  const redacted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitive.includes(key)) {
      redacted[key] = '***REDACTED***';
    } else if (key === 'email' && typeof value === 'string') {
      const [local, domain] = value.split('@');
      redacted[key] = `${local[0]}***@${domain}`;
    } else {
      redacted[key] = redactSensitiveData(value);
    }
  }
  
  return redacted;
}

// Usage in logger
logger.info('User action', redactSensitiveData(userData));
```

---

## GDPR Compliance

### Right to Erasure

**User Deletion (Cascading):**
```typescript
// Delete user and all associated data
await prisma.user.delete({
  where: { id: userId },
});

// Cascades to (via FK constraints):
// - accounts
// - sessions
// - organizationMemberships
// - connectorAuths
// - credentials
// - apiKeys
// - auditLogs (soft delete - mark as deleted)
// - content (transfer to organization or delete)
// - agentRuns
// - conversations
```

**Soft Delete for Audit Logs:**
```sql
-- Instead of DELETE, mark as redacted
UPDATE "audit_logs"
SET 
  "userId" = 'DELETED_USER',
  "metadata" = jsonb_set("metadata", '{gdpr_deleted}', 'true'),
  "ip" = '0.0.0.0',
  "userAgent" = 'REDACTED'
WHERE "userId" = $1;
```

### Right to Access (Data Export)

**User Data Package:**
```typescript
async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: true,
      organizationMemberships: {
        include: { organization: true, role: true },
      },
      content: true,
      conversations: {
      include: { messages: true },
      },
      connectorAuths: {
        select: {
          connector: true,
          accountName: true,
          status: true,
          createdAt: true,
          // Exclude tokens
        },
      },
    },
  });
  
  return {
    personal_info: {
      email: user.email,
      name: user.name,
      created_at: user.createdAt,
      email_verified: user.emailVerified,
    },
    organizations: user.organizationMemberships.map(m => ({
      organization: m.organization.name,
      role: m.role.name,
      joined_at: m.createdAt,
    })),
    content: user.content.map(c => ({
      title: c.title,
      kind: c.kind,
      created_at: c.createdAt,
    })),
    conversations: user.conversations.length,
    connectors: user.connectorAuths.map(ca => ({
      connector: ca.connector.name,
      account: ca.accountName,
      status: ca.status,
    })),
  };
}
```

### Consent Management

**Schema:**
```prisma
model Consent {
  id             String   @id @default(cuid())
  personId       String
  consentType    String   // 'marketing', 'analytics', 'personalization'
  granted        Boolean
  grantedAt      DateTime?
  revokedAt      DateTime?
  ipAddress      String?
  userAgent      String?
  
  person Person @relation(...)
  
  @@index([personId, consentType])
}
```

**Implementation:**
```typescript
async function recordConsent({
  personId,
  consentType,
  granted,
  req,
}: ConsentInput) {
  await prisma.consent.create({
    data: {
      personId,
      consentType,
      granted,
      grantedAt: granted ? new Date() : null,
      revokedAt: !granted ? new Date() : null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });
}

// Check consent before action
async function canSendMarketing(personId: string): Promise<boolean> {
  const consent = await prisma.consent.findFirst({
    where: {
      personId,
      consentType: 'marketing',
      granted: true,
    },
    orderBy: { grantedAt: 'desc' },
  });
  
  return !!consent;
}
```

---

## Observability

### Key Metrics

**Database Performance:**
- Query latency (p50, p95, p99)
- Connection pool utilization
- Cache hit rate
- Slow query count (>500ms)

**Vector Search:**
- IVFFLAT search latency
- Index size growth
- Vacuum duration
- Dead tuple ratio

**Business Metrics:**
- Active organizations
- Daily active users
- Agent executions per day
- Connector authentications per day

### Monitoring Tools

**Neon Metrics Dashboard:**
- CPU usage
- Memory usage
- Connection count
- Query duration
- Storage usage

**Prisma Insights (Optional):**
- Query analysis
- N+1 detection
- Slow query alerts
- Connection pool health

**Custom Alerts (Sentry/DataDog):**
```typescript
// Alert on slow queries
prisma.$on('query', (e) => {
  if (e.duration > 500) {
    logger.warn('Slow query detected', {
      query: e.query,
      duration: e.duration,
      params: e.params,
    });
  }
});
```

### Monitoring Queries

**Connection Pool:**
```sql
SELECT 
  COUNT(*) AS total_connections,
  COUNT(*) FILTER (WHERE state = 'active') AS active,
  COUNT(*) FILTER (WHERE state = 'idle') AS idle
FROM pg_stat_activity
WHERE datname = 'neondb';
```

**Slow Queries:**
```sql
SELECT 
  query,
  calls,
  total_exec_time / 1000 AS total_seconds,
  mean_exec_time / 1000 AS mean_seconds,
  max_exec_time / 1000 AS max_seconds
FROM pg_stat_statements
WHERE mean_exec_time > 500  -- 500ms
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Index Usage:**
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE 'pg_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

---

## Security Checklist

### Database Level

- [ ] **Row-Level Security (RLS)** - Filter by `organizationId`
- [ ] **SSL/TLS Enforced** - `sslmode=require` in connection string
- [ ] **Connection Pooling** - Configured via Neon pooler
- [ ] **IP Allowlist** - Restrict to known application IPs (production)
- [ ] **Secrets Rotation** - Rotate `DATABASE_URL` every 90 days

### Application Level

- [ ] **API Rate Limiting** - 1000 req/min per user (configurable)
- [ ] **Input Validation** - Prisma types + Zod schemas
- [ ] **SQL Injection Protection** - Prisma parameterized queries
- [ ] **Token Encryption** - AES-256-GCM for connector tokens
- [ ] **Audit Logging** - All sensitive operations logged

### Operational

- [ ] **Backup Verification** - Monthly restore tests
- [ ] **Audit Log Review** - Weekly review of suspicious activity
- [ ] **Dependency Updates** - Monthly Prisma/Postgres updates
- [ ] **Penetration Testing** - Quarterly security audits
- [ ] **Incident Response Plan** - Documented and tested

---

## Incident Response

### Data Breach Protocol

**Severity Levels:**

**P0 - Critical (< 1 hour)**
- Database exposed publicly
- Mass data exfiltration
- Ransomware attack

**P1 - High (< 4 hours)**
- Unauthorized access to production database
- Multiple account compromises
- PII exposure

**P2 - Medium (< 24 hours)**
- Single account compromise
- Non-PII data leak
- Configuration vulnerability

**P3 - Low (< 7 days)**
- Attempted unauthorized access (blocked)
- Minor configuration issue

### Response Steps

**1. Identify Affected Records**
   ```sql
-- Find affected audit logs
SELECT * FROM "audit_logs"
WHERE "createdAt" BETWEEN $incident_start AND $incident_end
  AND ("action" LIKE '%delete%' OR "action" LIKE '%export%')
ORDER BY "createdAt" DESC;

-- Identify compromised connectors
SELECT * FROM "connector_auths"
WHERE "lastUsedAt" BETWEEN $incident_start AND $incident_end
  AND "status" = 'active';
```

**2. Contain Breach**
- Rotate DATABASE_URL immediately
- Revoke compromised API keys
- Disable affected user accounts
- Block suspicious IP addresses

**3. Forensics**
```sql
-- Export audit logs for analysis
COPY (
  SELECT * FROM "audit_logs"
  WHERE "createdAt" BETWEEN $incident_start AND $incident_end
) TO '/tmp/incident_audit_logs.csv' CSV HEADER;
```

**4. Notification**
- Notify security team immediately
- Contact affected users within 72 hours (GDPR)
- Report to authorities if required (GDPR/CCPA)
- Update status page

**5. Remediation**
- Patch vulnerability
- Enhanced monitoring
- Review access controls
- Update incident playbook

---

## Contact & Escalation

**Database Administrator:** dba@neonhub.ai  
**Security Team:** security@neonhub.ai  
**Emergency Hotline:** +1-XXX-XXX-XXXX  
**Slack Alerts:** #database-alerts  
**PagerDuty:** database-oncall

---

**Document Version:** 1.0  
**Next Review:** 2025-11-28  
**Owner:** Security & Compliance Team  
**Approved By:** CTO, Head of Security
