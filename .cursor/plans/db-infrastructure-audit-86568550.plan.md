<!-- 86568550-3dde-4f86-b9a9-77aeebbf6605 087cb501-8159-4c9b-bc36-969fc037f1e4 -->
# Database Infrastructure 100% Readiness Verification & Completi

## Phase 0: Sync & Current State Verification

**Actions:**

1. Execute `git fetch --all && git pull` to ensure latest codebase
2. Read existing reports: `DB_COMPLETION_REPORT.md`, `DB_AUDIT.md`, `MIGRATION_SUMMARY.md`, `SEED_RUN_LOG.md`
3. Create `SYNC_LOG.md` with:

                        - Current commit hash and branch
                        - Timestamp and agent identifier (Codex)
                        - List of applied migrations from `apps/api/prisma/migrations/`
                        - File hashes of critical schema/seed files

**Deliverable:** `SYNC_LOG.md`

---

## Phase 1: Toolchain & Environment Validation

**Actions:**

1. Verify package manager: `corepack enable && pnpm -v || npm -v`
2. Check Prisma CLI: `pnpm --filter apps/api prisma -v`
3. Validate Node version: `node -v` (expect 20.17.0)
4. Confirm environment files exist (`.env`, `apps/api/.env`) with DATABASE_URL present (redacted in logs)
5. Install dependencies: `pnpm install --frozen-lockfile`

**Deliverable:** `SETUP_LOG.md` with tool versions and environment status

---

## Phase 2: Connectivity & Extensions Check

**Actions:**

1. Test database connection: `pnpm --filter apps/api prisma migrate status`
2. Verify extensions enabled:
   ```sql
   SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp','vector');
   ```

3. Document extension setup SQL for staging/prod:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS vector;
   ```


**Deliverable:** `DB_CONN_CHECK.md` with connectivity status and extension verification

---

## Phase 3: Schema Coverage & Omni-Channel Enhancement

**Current Schema Status:**

- ✅ Org/RBAC (Organization, OrganizationRole, OrganizationPermission, OrganizationMembership)
- ✅ Brand (Brand, BrandVoice with vector, EmbeddingSpace)
- ✅ Agents (Agent, AgentCapability, AgentConfig, AgentRun, Tool, ToolExecution)
- ✅ Conversations (Conversation, Message with embedding)
- ✅ RAG (Dataset, Document, Chunk with vector)
- ✅ Content & Campaigns (Content, Campaign, CampaignMetric, EmailSequence, SocialPost, ABTest)
- ✅ Governance (AuditLog)
- ✅ Auth (ApiKey, Credential, ConnectorAuth)
- ✅ Enums (AgentKind, AgentStatus, MessageRole, ConversationKind, DatasetKind, TrainStatus, ContentKind, CampaignStatus)

**Gap: ConnectorKind Enum**

Current `Connector` model uses string "category" field. Need to add:

```prisma
enum ConnectorKind {
  EMAIL
  SMS
  WHATSAPP
  REDDIT
  INSTAGRAM
  FACEBOOK
  X
  YOUTUBE
  TIKTOK
  GOOGLE_ADS
  SHOPIFY
  STRIPE
  SLACK
  DISCORD
  LINKEDIN
}
```

And update Connector model to use this enum for the `category` field.

**Actions:**

1. Review `apps/api/prisma/schema.prisma` for completeness
2. Add `ConnectorKind` enum above `model Connector`
3. Change `category String` to `category ConnectorKind` in Connector model
4. Verify vector dimensions: `Message.embedding`, `Chunk.embedding`, `BrandVoice.embedding` (currently `Unsupported("vector")` due to Prisma limitation - document this)
5. Verify indexes:

                        - `@@index([conversationId, createdAt])` on Message ✅
                        - `@@index([agentId, startedAt])` on AgentRun ✅
                        - `@@index([campaignId, kind, timestamp])` on CampaignMetric ✅
                        - `@@unique([userId, organizationId])` on OrganizationMembership ✅

6. Run `pnpm --filter apps/api prisma format && pnpm --filter apps/api prisma validate`

**Deliverable:** `SCHEMA_DIFF_NOTES.md` documenting enum addition

---

## Phase 4: Incremental Migration (If Schema Changed)

**Only if Phase 3 modified schema:**

1. Generate new migration:
   ```bash
   pnpm --filter apps/api prisma migrate dev --name 20251026_add_connector_kind_enum
   ```

2. Review generated SQL in new migration folder
3. Apply migration (if DB reachable): `pnpm --filter apps/api prisma migrate deploy`
4. If DB not reachable, generate drift SQL:
   ```bash
   pnpm --filter apps/api prisma migrate diff \
     --from-schema-datamodel apps/api/prisma/schema.prisma \
     --to-url "$DATABASE_URL" \
     --script > .tmp/db-drift-connector-enum.sql
   ```


**Deliverable:** New migration folder + updated `MIGRATION_SUMMARY.md`

---

## Phase 5: Seed Enhancement - Omni-Channel Fixtures

**Current Seed Coverage:**

- ✅ Organization "NeonHub"
- ✅ Admin user + membership
- ✅ Brand + BrandVoice with vector
- ✅ EmbeddingSpace (1536 dimensions)
- ✅ Agents (Brand Voice Copilot with capabilities)
- ✅ Conversation + Messages with embeddings
- ✅ Dataset + Documents + Chunks with vectors
- ✅ Campaign + CampaignMetric
- ✅ Content item

**Gap: Omni-Channel Connector Fixtures**

Enhance `apps/api/prisma/seed.ts` to add:

1. **Connector catalog entries** (no secrets, just metadata):
   ```typescript
   const connectors = [
     { name: 'email', displayName: 'Email', category: 'EMAIL', authType: 'smtp', 
       description: 'Send and receive emails', ... },
     { name: 'sms', displayName: 'SMS/Twilio', category: 'SMS', authType: 'api_key', ... },
     { name: 'whatsapp', displayName: 'WhatsApp Business', category: 'WHATSAPP', ... },
     { name: 'reddit', displayName: 'Reddit', category: 'REDDIT', authType: 'oauth2', ... },
     { name: 'instagram', displayName: 'Instagram', category: 'INSTAGRAM', ... },
     { name: 'facebook', displayName: 'Facebook Pages', category: 'FACEBOOK', ... },
     { name: 'x', displayName: 'X (Twitter)', category: 'X', authType: 'oauth2', ... },
     { name: 'youtube', displayName: 'YouTube', category: 'YOUTUBE', ... },
     { name: 'tiktok', displayName: 'TikTok', category: 'TIKTOK', ... },
     { name: 'google-ads', displayName: 'Google Ads', category: 'GOOGLE_ADS', ... },
     { name: 'shopify', displayName: 'Shopify', category: 'SHOPIFY', ... },
     { name: 'stripe', displayName: 'Stripe', category: 'STRIPE', ... },
   ];
   
   for (const conn of connectors) {
     await tx.connector.upsert({
       where: { name: conn.name },
       update: {},
       create: { ...conn, triggers: {}, actions: {}, authConfig: { demo: true } }
     });
   }
   ```

2. **Sample ConnectorAuth** for demo user (with placeholder tokens):
   ```typescript
   await tx.connectorAuth.create({
     data: {
       userId: founder.id,
       connectorId: emailConnector.id,
       organizationId: organization.id,
       accountName: 'demo@neonhub.ai',
       status: 'demo',
       metadata: { note: 'Seed fixture - not functional' }
     }
   });
   ```

3. **Tool entries** linking agents to connectors:
   ```typescript
   await tx.tool.upsert({
     where: { organizationId_slug: { organizationId: org.id, slug: 'send-email' } },
     create: {
       organizationId: org.id,
       agentId: emailAgent.id,
       name: 'Send Email',
       slug: 'send-email',
       inputSchema: { to: 'string', subject: 'string', body: 'string' },
       outputSchema: { messageId: 'string', status: 'string' }
     }
   });
   ```


**Actions:**

1. Open `apps/api/prisma/seed.ts`
2. Add connector catalog section after campaign creation
3. Add sample ConnectorAuth entries (no secrets)
4. Add Tool definitions for email/social posting
5. Run seed (if DB reachable): `pnpm --filter apps/api prisma db seed`
6. Capture output in `SEED_RUN_LOG.md`

**Deliverable:** Updated `apps/api/prisma/seed.ts` + `SEED_RUN_LOG.md`

---

## Phase 6: Validations & Automated Smoke Testing

**Actions:**

1. **Schema validation:**
   ```bash
   pnpm --filter apps/api prisma validate
   pnpm --filter apps/api prisma generate
   ```

2. **Create `scripts/db-smoke.mjs`** for automated row counts:
   ```javascript
   #!/usr/bin/env node
   import { PrismaClient } from '@prisma/client';
   
   const prisma = new PrismaClient();
   const models = [
     'organization', 'user', 'organizationMembership', 'organizationRole',
     'brand', 'brandVoice', 'embeddingSpace',
     'agent', 'agentCapability', 'agentRun', 'tool', 'toolExecution',
     'conversation', 'message', 'dataset', 'document', 'chunk',
     'campaign', 'campaignMetric', 'content',
     'connector', 'connectorAuth', 'credential',
     'auditLog', 'apiKey'
   ];
   
   console.log('\\n📊 Database Smoke Test\\n');
   
   for (const model of models) {
     try {
       const count = await prisma[model].count();
       console.log(`✅ ${model.padEnd(30)} ${count}`);
     } catch (err) {
       console.log(`❌ ${model.padEnd(30)} ERROR: ${err.message}`);
     }
   }
   
   await prisma.$disconnect();
   ```

3. Make executable: `chmod +x scripts/db-smoke.mjs`

4. Run smoke test (if DB reachable):
   ```bash
   node scripts/db-smoke.mjs > DB_SMOKE_RESULTS.md
   ```


**Deliverable:** `scripts/db-smoke.mjs` + updated `DB_SMOKE_RESULTS.md`

---

## Phase 7: CI/CD Deploy Verification

**Current Status:** ✅ Workflow exists at `.github/workflows/db-deploy.yml`

**Actions:**

1. Review workflow steps:

                        - ✅ Corepack/pnpm setup
                        - ✅ Dependency installation
                        - ✅ Prisma generate
                        - ✅ Migrate deploy
                        - ✅ Seed execution (optional)

2. Verify documentation at `docs/CI_DB_DEPLOY.md` (already exists ✅)
3. Document secret requirements:

                        - `DATABASE_URL` (required)
                        - `DIRECT_DATABASE_URL` (optional, for pooling)

4. Add workflow run instructions to completion report

**Deliverable:** `CI_DB_DEPLOY_REPORT.md` (update existing doc with omni-channel notes)

---

## Phase 8: Governance, Backups, and Rollback Documentation

**Gap: Missing governance docs**

**Create `docs/DB_BACKUP_RESTORE.md`:**

```markdown
# Database Backup & Restore Procedures

## Local Development Backups

### Backup
\`\`\`bash
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql
\`\`\`

### Restore
\`\`\`bash
psql "$DATABASE_URL" < backup_YYYYMMDD_HHMMSS.sql
\`\`\`

## Production (Neon) Backups

### Branch-Based Backups
1. Navigate to Neon Console
2. Create branch: `backup-YYYY-MM-DD`
3. Branch preserves full database state

### Point-in-Time Recovery
- Neon retains 7 days of WAL history (free tier)
- Enterprise: 30+ days retention
- Use Console to restore to specific timestamp

## Automated Backups

### GitHub Actions Workflow
Create `.github/workflows/db-backup.yml`:
\`\`\`yaml
name: DB Backup
on:
  schedule:
  - cron: '0 2 * * *'  # 2 AM daily
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
   - name: Backup Database
        run: |
          pg_dump "$DATABASE_URL" | gzip > backup.sql.gz
          # Upload to S3/GCS/Azure Blob
\`\`\`

## Rollback Procedures

### Revert Migration
\`\`\`bash
pnpm --filter apps/api prisma migrate resolve --rolled-back <migration_name>
\`\`\`

### Emergency Restore
\`\`\`bash
psql "$DATABASE_URL" < emergency_backup.sql
pnpm --filter apps/api prisma migrate deploy
\`\`\`

## Best Practices
- ✅ Test backups monthly
- ✅ Store backups in separate region
- ✅ Encrypt backup files
- ✅ Document restoration time (RTO)
- ✅ Maintain 30-day retention minimum
```

**Create `docs/DB_GOVERNANCE.md`:**

```markdown
# Database Governance & Compliance

## Audit Logging

### AuditLog Model
Tracks all sensitive operations:
- User actions (create, update, delete)
- Permission changes
- API key generation/revocation
- Data access patterns

### Required Fields
- `organizationId`: Tenant isolation
- `userId`: Actor identification
- `action`: Operation type
- `resourceType` + `resourceId`: What was affected
- `metadata`: Additional context
- `ip`: Request origin
- `createdAt`: Timestamp

### Retention Policy
- Dev/Staging: 30 days
- Production: 1 year
- Compliance (GDPR/SOC2): 7 years

## RBAC & Permissions

### Role Hierarchy
1. **Owner**: Full workspace control
2. **Admin**: User + resource management
3. **Member**: Standard access
4. **Viewer**: Read-only access

### Permission Model
Granular permissions via `OrganizationPermission`:
- `workspace:manage`
- `agents:execute`
- `campaigns:publish`
- `data:export`

## Data Retention

### User Content
- Active drafts: Indefinite
- Published content: 2 years
- Deleted items: 30-day soft delete

### Analytics & Metrics
- Campaign metrics: 2 years
- Agent run logs: 90 days
- Usage records: 7 years (billing)

### Vector Embeddings
- Active datasets: Indefinite
- Archived: 1 year
- Maintenance: VACUUM ANALYZE weekly

## Vector Index Maintenance

### IVFFLAT Index Tuning
\`\`\`sql
-- Update lists parameter based on row count
ALTER INDEX chunks_embedding_cosine_idx 
SET (lists = <rows/1000>);

-- Rebuild index after bulk inserts
REINDEX INDEX CONCURRENTLY chunks_embedding_cosine_idx;
\`\`\`

### Vacuum Schedule
\`\`\`sql
VACUUM ANALYZE chunks;
VACUUM ANALYZE messages;
VACUUM ANALYZE brand_voices;
\`\`\`

## PII & Compliance

### Sensitive Fields
- Encrypted at rest: `ConnectorAuth.accessToken`, `Credential.accessToken`
- Hashed: `ApiKey.tokenHash`
- Redacted in logs: All tokens, emails (partial)

### GDPR Right to Erasure
\`\`\`typescript
// Cascade deletes via FK constraints
await prisma.user.delete({ where: { id: userId } });
// Cascades: accounts, sessions, memberships, credentials, etc.
\`\`\`

### Data Export
\`\`\`typescript
// User data package
const export = {
  user: await prisma.user.findUnique({ where: { id } }),
  content: await prisma.content.findMany({ where: { authorId: id } }),
  conversations: await prisma.conversation.findMany({ where: { createdById: id } }),
  // ... all user-owned entities
};
\`\`\`

## Observability

### Key Metrics
- Query latency (p50, p95, p99)
- Connection pool utilization
- Index hit rates
- Slow query log (>500ms)
- Vector search performance

### Monitoring Tools
- Prisma Accelerate (optional)
- Neon Metrics Dashboard
- Custom Sentry alerts

## Security Checklist

- [ ] Row-level security (RLS) via organization_id filtering
- [ ] API rate limiting (1000 req/min default)
- [ ] Connection pooling configured
- [ ] SSL/TLS enforced (`sslmode=require`)
- [ ] Secrets rotation (90 days)
- [ ] Audit log review (monthly)

## Incident Response

### Data Breach Protocol
1. Identify affected records
2. Notify security team
3. Rotate affected credentials
4. Audit log forensics
5. User notification (GDPR 72hr)

### Rollback Procedure
1. Stop application traffic
2. Restore from last known-good backup
3. Replay WAL to desired timestamp
4. Verify data integrity
5. Resume traffic
```

**Deliverable:** `docs/DB_BACKUP_RESTORE.md` + `docs/DB_GOVERNANCE.md`

---

## Phase 9: Final Completion Report Update

**Actions:**

1. Open existing `DB_COMPLETION_REPORT.md`
2. Update with new information:

                        - Add omni-channel connector coverage section
                        - List all 12+ connector types seeded
                        - Document ConnectorKind enum addition
                        - Link to new governance docs
                        - Update smoke test results with connector counts
                        - Add db-smoke.mjs automation note

3. Verify all acceptance criteria:

                        - ✅ `prisma validate` passes
                        - ✅ No pending migrations
                        - ✅ Seed includes omni-channel fixtures
                        - ✅ IVFFLAT indexes present
                        - ✅ Governance docs complete
                        - ✅ CI/CD workflow ready
                        - ✅ Backup/rollback procedures documented

4. Declare final gate: **"100% READY"** only if all above confirmed

**Final Report Structure:**

```markdown
# NeonHub DB 100% Readiness Report — [Timestamp]
Author: Codex

## Executive Summary
✅ All 9 phases completed
✅ Omni-channel connector infrastructure ready
✅ Governance & compliance documentation complete

## Environment
- Node: 20.17.0
- Prisma: [version]
- Postgres: 16 + pgvector
- Extensions: uuid-ossp, vector

## Schema Coverage
[Existing sections...]

### NEW: Omni-Channel Connector Coverage
- ConnectorKind enum: EMAIL, SMS, WHATSAPP, REDDIT, INSTAGRAM, FACEBOOK, X, YOUTUBE, TIKTOK, GOOGLE_ADS, SHOPIFY, STRIPE
- Connector catalog: 12 platforms seeded
- ConnectorAuth: Demo fixtures present
- Tool definitions: Email, Social, SMS tools linked to agents

## Performance & Indexes
[Existing sections...]

## Seed Contents
[Existing sections...]
- NEW: 12 connector catalog entries
- NEW: 2+ sample ConnectorAuth records
- NEW: 3+ Tool definitions for omni-channel

## Automation
- NEW: scripts/db-smoke.mjs for automated row counts
- CI/CD: .github/workflows/db-deploy.yml (verified)

## Governance
- NEW: docs/DB_BACKUP_RESTORE.md (backup/restore procedures)
- NEW: docs/DB_GOVERNANCE.md (audit, RBAC, retention, compliance)

## Final Gate
✅ **DATABASE 100% PRODUCTION READY**

All domains covered, omni-channel infrastructure in place, governance complete.
Ready for staging/production deployment via GitHub Actions.

## Next Actions
1. Add DATABASE_URL secret to GitHub Actions
2. Run workflow: .github/workflows/db-deploy.yml
3. Verify deployment with: node scripts/db-smoke.mjs
```

**Deliverable:** Updated `DB_COMPLETION_REPORT.md` with comprehensive status

---

## Verification Checklist

Before declaring 100% complete:

- [ ] SYNC_LOG.md created with latest commit
- [ ] SETUP_LOG.md shows tool versions
- [ ] DB_CONN_CHECK.md confirms extensions
- [ ] SCHEMA_DIFF_NOTES.md documents ConnectorKind enum
- [ ] New migration created (if schema changed)
- [ ] apps/api/prisma/seed.ts includes 12+ connectors
- [ ] SEED_RUN_LOG.md shows connector rows created
- [ ] scripts/db-smoke.mjs executable and functional
- [ ] DB_SMOKE_RESULTS.md shows connector/auth counts
- [ ] docs/DB_BACKUP_RESTORE.md complete
- [ ] docs/DB_GOVERNANCE.md complete
- [ ] CI_DB_DEPLOY_REPORT.md updated
- [ ] DB_COMPLETION_REPORT.md updated with all new sections
- [ ] All files committed (except .env)

## Success Criteria

✅ All enums present (including ConnectorKind)

✅ All indexes verified (IVFFLAT + composites)

✅ Seeds include omni-channel fixtures (12+ connectors)

✅ Governance docs complete (backup, RBAC, retention)

✅ Automation scripts functional (db-smoke.mjs)

✅ CI/CD documented and ready

✅ No secrets in code

✅ Completion report declares 100% READY

### To-dos

- [ ] Phase 0: Git sync and create SYNC_LOG.md with current state
- [ ] Phase 1: Validate toolchain and create SETUP_LOG.md
- [ ] Phase 2: Test DB connectivity and verify extensions, create DB_CONN_CHECK.md
- [ ] Phase 3: Add ConnectorKind enum to schema and document in SCHEMA_DIFF_NOTES.md
- [ ] Phase 4: Generate and apply migration for ConnectorKind enum if schema changed
- [ ] Phase 5: Enhance seed.ts with 12+ omni-channel connector fixtures and sample ConnectorAuth
- [ ] Phase 6: Create scripts/db-smoke.mjs and run smoke tests, update DB_SMOKE_RESULTS.md
- [ ] Phase 7: Verify CI/CD workflow and update CI_DB_DEPLOY_REPORT.md with omni-channel notes
- [ ] Phase 8: Create docs/DB_BACKUP_RESTORE.md and docs/DB_GOVERNANCE.md
- [ ] Phase 9: Update DB_COMPLETION_REPORT.md with omni-channel coverage and all new documentation