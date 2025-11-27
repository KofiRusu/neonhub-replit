# NeonHub Database & Data Model

**Version:** 3.0+  
**Last Updated:** November 17, 2025  
**Database:** PostgreSQL 15+ with pgvector extension  
**ORM:** Prisma

---

## Table of Contents

1. [Overview](#overview)
2. [Database Configuration](#database-configuration)
3. [Schema Organization](#schema-organization)
4. [Core Domain Models](#core-domain-models)
5. [Extensions & Special Features](#extensions--special-features)
6. [Relationships & Constraints](#relationships--constraints)
7. [Indexes & Performance](#indexes--performance)
8. [Migrations](#migrations)
9. [Common Query Patterns](#common-query-patterns)
10. [Best Practices](#best-practices)
11. [Related Documentation](#related-documentation)

---

## Overview

NeonHub uses **PostgreSQL 15+** hosted on **Neon.tech** (serverless Postgres) with the following key characteristics:

- **75+ tables** organized by domain
- **pgvector extension** for semantic search and RAG
- **citext extension** for case-insensitive text matching
- **Multi-tenancy** via `Workspace` isolation
- **Type-safe access** via Prisma ORM
- **Audit trails** with timestamps and soft deletes

### Database Stack

```
┌─────────────────────────────────────────────┐
│          Prisma ORM (Type-Safe)             │
├─────────────────────────────────────────────┤
│     PostgreSQL 15+ (Neon.tech Serverless)   │
│     ├── pgvector (embeddings)               │
│     ├── citext (case-insensitive)           │
│     └── UUID generation                     │
└─────────────────────────────────────────────┘
```

### Quick Stats

- **Total Tables:** 75+
- **Primary Extensions:** pgvector, citext, uuid-ossp
- **Migration Files:** 13 tracked migrations
- **Estimated Rows (Production):** 100K+ after GA
- **Vector Dimensions:** 1536 (OpenAI text-embedding-3-small)

---

## Database Configuration

### Connection Strings

```bash
# Production (Neon.tech)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neonhub?sslmode=require

# Direct connection (bypasses pgBouncer)
DIRECT_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neonhub?sslmode=require

# Local Development (Docker)
DATABASE_URL=postgresql://neonhub:neonhub@localhost:5432/neonhub?schema=public
```

### Environment Variables

**Required:**
- `DATABASE_URL` - Main database connection (pooled)
- `DIRECT_DATABASE_URL` - Direct connection for migrations

**Optional:**
- `PRISMA_HIDE_UPDATE_MESSAGE=1` - Hide Prisma update messages
- `DATABASE_POOL_SIZE=10` - Connection pool size

### Prisma Configuration

**File:** `apps/api/prisma/schema.prisma`

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_DATABASE_URL")
  extensions = [vector(schema: "public"), citext(schema: "public")]
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}
```

---

## Schema Organization

The database schema is organized into **10 major domains**, each with related tables and enums.

### Domain Overview

| Domain | Tables | Description |
|--------|--------|-------------|
| **Authentication** | User, Account, Session, VerificationToken | NextAuth.js authentication |
| **Multi-Tenancy** | Workspace, WorkspaceMember, Invitation | Workspace isolation |
| **AI Agents** | Agent, AgentRun, ToolExecution, Conversation | Agent execution & memory |
| **Identity & Consent** | Person, Identity, Consent, Topic, Note | LoopDrive identity graph |
| **Content** | ContentDraft, ContentVersion, ContentAnalysis | Content management |
| **Campaigns** | MarketingCampaign, MarketingCampaignPerformance, MarketingLead | Campaign orchestration |
| **Connectors** | Connector, ConnectorInstance, OAuthToken, ApiKey | External integrations |
| **SEO** | KeywordResearch, KeywordCluster, InternalLink, SeoMetrics | SEO engine |
| **Brand Voice** | BrandVoiceGuide, BrandVoiceEmbedding | Brand consistency (RAG) |
| **Analytics** | MetricEvent, AgentMetrics, AnalyticsSummary | Performance tracking |

---

## Core Domain Models

### 1. Authentication & Authorization

#### User
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  accounts      Account[]
  sessions      Session[]
  workspaces    WorkspaceMember[]
}
```

**Purpose:** Core user entity for authentication (NextAuth.js)

#### Workspace
```prisma
model Workspace {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  ownerId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  owner     User              @relation(...)
  members   WorkspaceMember[]
  agents    Agent[]
  campaigns MarketingCampaign[]
  // ... many more
}
```

**Purpose:** Multi-tenancy container; all resources belong to a workspace

### 2. AI Agents & Execution

#### Agent
```prisma
model Agent {
  id          String      @id @default(cuid())
  workspaceId String
  name        String
  kind        AgentKind   // COPILOT | WORKFLOW | ANALYST
  status      AgentStatus // DRAFT | ACTIVE | PAUSED | DISABLED
  prompt      String      @db.Text
  config      Json?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  // Relations
  workspace Workspace   @relation(...)
  runs      AgentRun[]
}
```

**Purpose:** AI agent definition with configuration

#### AgentRun
```prisma
model AgentRun {
  id           String    @id @default(cuid())
  agentId      String
  input        Json
  output       Json?
  status       String    // running | completed | failed
  startedAt    DateTime  @default(now())
  completedAt  DateTime?
  errorMessage String?
  metrics      Json?     // Performance metrics
  
  // Relations
  agent         Agent          @relation(...)
  toolExecutions ToolExecution[]
}
```

**Purpose:** Tracks individual agent executions with full telemetry

#### ToolExecution
```prisma
model ToolExecution {
  id          String    @id @default(cuid())
  agentRunId  String
  toolName    String
  input       Json
  output      Json?
  status      String    // pending | running | completed | failed
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  
  // Relations
  agentRun AgentRun @relation(...)
}
```

**Purpose:** Granular tracking of tool calls within agent runs

### 3. Identity & Consent (LoopDrive)

#### Person
```prisma
model Person {
  id          String    @id @default(cuid())
  workspaceId String
  firstName   String?
  lastName    String?
  locale      String?   @default("en-US")
  timezone    String?   @default("UTC")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  workspace  Workspace  @relation(...)
  identities Identity[]
  consents   Consent[]
  topics     Topic[]
  notes      Note[]
  memory     MemEmbedding[]
}
```

**Purpose:** Unified person identity across channels

#### Identity
```prisma
model Identity {
  id         String   @id @default(cuid())
  personId   String
  type       String   // email | phone | instagram | x | ...
  value      String   // user@example.com, +1555...
  verified   Boolean  @default(false)
  primary    Boolean  @default(false)
  createdAt  DateTime @default(now())
  
  // Relations
  person Person @relation(...)
  
  @@unique([personId, type, value])
}
```

**Purpose:** Cross-channel identity resolution

#### Consent
```prisma
model Consent {
  id        String        @id @default(cuid())
  personId  String
  channel   String        // email | sms | dm | ...
  scope     String        // marketing | transactional
  status    ConsentStatus // granted | revoked | denied | pending
  source    String?       // form | import | api
  timestamp DateTime      @default(now())
  
  // Relations
  person Person @relation(...)
}
```

**Purpose:** GDPR/CCPA compliant consent management

#### MemEmbedding (pgvector)
```prisma
model MemEmbedding {
  id         String                        @id @default(cuid())
  personId   String
  kind       String                        // fact | intent | message | objection
  text       String                        @db.Text
  embedding  Unsupported("vector(1536)")?  // pgvector
  createdAt  DateTime                      @default(now())
  
  // Relations
  person Person @relation(...)
  
  @@index([embedding(ops: VectorCosineOps)], type: Hnsw)
}
```

**Purpose:** Personal memory store for RAG-powered personalization

### 4. Content Management

#### ContentDraft
```prisma
model ContentDraft {
  id          String      @id @default(cuid())
  workspaceId String
  title       String
  body        String      @db.Text
  kind        ContentKind // article | email | social_script | ad_copy
  status      String      // draft | published | archived
  metadata    Json?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  // Relations
  workspace Workspace        @relation(...)
  versions  ContentVersion[]
  analyses  ContentAnalysis[]
}
```

**Purpose:** Content drafts with versioning

#### ContentVersion
```prisma
model ContentVersion {
  id        String   @id @default(cuid())
  draftId   String
  version   Int      @default(1)
  body      String   @db.Text
  changes   String?  @db.Text
  createdAt DateTime @default(now())
  
  // Relations
  draft ContentDraft @relation(...)
  
  @@unique([draftId, version])
}
```

**Purpose:** Content versioning for revision history

### 5. Campaign Management

#### MarketingCampaign
```prisma
model MarketingCampaign {
  id          String                     @id @default(cuid())
  workspaceId String
  name        String
  type        MarketingCampaignType      // email | social | ppc | content | ...
  status      MarketingCampaignStatus    // draft | scheduled | active | ...
  budget      Float?
  startDate   DateTime?
  endDate     DateTime?
  config      Json?
  createdAt   DateTime                   @default(now())
  updatedAt   DateTime                   @updatedAt
  
  // Relations
  workspace    Workspace                       @relation(...)
  performance  MarketingCampaignPerformance[]
  touchpoints  MarketingTouchpoint[]
}
```

**Purpose:** Campaign orchestration and tracking

#### MarketingLead
```prisma
model MarketingLead {
  id          String              @id @default(cuid())
  workspaceId String
  personId    String?
  email       String?
  phone       String?
  company     String?
  status      MarketingLeadStatus // new | contacted | qualified | ...
  grade       MarketingLeadGrade? // A | B | C | D | F
  source      String?
  score       Float?              @default(0)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  
  // Relations
  workspace   Workspace             @relation(...)
  person      Person?               @relation(...)
  touchpoints MarketingTouchpoint[]
}
```

**Purpose:** Lead tracking and scoring

### 6. Connectors & Integrations

#### Connector
```prisma
model Connector {
  id          String        @id @default(cuid())
  workspaceId String
  kind        ConnectorKind // EMAIL | SMS | WHATSAPP | INSTAGRAM | ...
  name        String
  config      Json?
  enabled     Boolean       @default(true)
  createdAt   DateTime      @default(now())
  
  // Relations
  workspace Workspace           @relation(...)
  instances ConnectorInstance[]
}
```

**Purpose:** External service integration definitions

**Supported Connectors:** EMAIL, SMS, WHATSAPP, REDDIT, INSTAGRAM, FACEBOOK, X, YOUTUBE, TIKTOK, GOOGLE_ADS, GOOGLE_SEARCH_CONSOLE, SHOPIFY, STRIPE, SLACK, DISCORD, LINKEDIN

#### ConnectorInstance
```prisma
model ConnectorInstance {
  id           String    @id @default(cuid())
  connectorId  String
  credentialId String?
  name         String?
  enabled      Boolean   @default(true)
  config       Json?
  createdAt    DateTime  @default(now())
  
  // Relations
  connector  Connector   @relation(...)
  credential OAuthToken? @relation(...)
}
```

**Purpose:** Connector instantiation with credentials

### 7. SEO Engine

#### KeywordResearch
```prisma
model KeywordResearch {
  id            String   @id @default(cuid())
  workspaceId   String
  keyword       String   @db.Citext // Case-insensitive
  searchVolume  Int?
  competition   Float?
  cpc           Float?
  intent        String?  // informational | navigational | transactional
  difficulty    Float?
  clusterId     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  workspace Workspace        @relation(...)
  cluster   KeywordCluster?  @relation(...)
  
  @@unique([workspaceId, keyword])
}
```

**Purpose:** Keyword research and clustering

#### InternalLink
```prisma
model InternalLink {
  id           String   @id @default(cuid())
  workspaceId  String
  fromUrl      String
  toUrl        String
  anchorText   String
  context      String?  @db.Text
  similarity   Float?   // Semantic similarity score
  status       String   @default("suggested") // suggested | active | removed
  createdAt    DateTime @default(now())
  
  // Relations
  workspace Workspace @relation(...)
  
  @@unique([workspaceId, fromUrl, toUrl])
}
```

**Purpose:** SEO internal linking recommendations

#### SeoMetrics
```prisma
model SeoMetrics {
  id          String   @id @default(cuid())
  workspaceId String
  url         String
  title       String?
  description String?
  clicks      Int      @default(0)
  impressions Int      @default(0)
  ctr         Float    @default(0)
  position    Float    @default(0)
  date        DateTime
  country     String?
  device      String?  // desktop | mobile | tablet
  
  // Relations
  workspace Workspace @relation(...)
  
  @@unique([workspaceId, url, date, country, device])
}
```

**Purpose:** Google Search Console metrics tracking

### 8. Brand Voice (RAG)

#### BrandVoiceGuide
```prisma
model BrandVoiceGuide {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  content     String   @db.Text
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  workspace  Workspace            @relation(...)
  embeddings BrandVoiceEmbedding[]
}
```

**Purpose:** Brand voice guidelines document

#### BrandVoiceEmbedding
```prisma
model BrandVoiceEmbedding {
  id        String                        @id @default(cuid())
  guideId   String
  chunk     String                        @db.Text
  embedding Unsupported("vector(1536)")?  // pgvector
  createdAt DateTime                      @default(now())
  
  // Relations
  guide BrandVoiceGuide @relation(...)
  
  @@index([embedding(ops: VectorCosineOps)], type: Hnsw)
}
```

**Purpose:** Vector embeddings for brand voice RAG

### 9. Analytics

#### MetricEvent
```prisma
model MetricEvent {
  id          String   @id @default(cuid())
  workspaceId String
  kind        String   // page_view | email_open | click | ...
  metadata    Json?
  timestamp   DateTime @default(now())
  
  // Relations
  workspace Workspace @relation(...)
  
  @@index([workspaceId, kind, timestamp])
}
```

**Purpose:** Raw event tracking

#### AgentMetrics
```prisma
model AgentMetrics {
  id              String   @id @default(cuid())
  agentId         String
  date            DateTime @db.Date
  totalRuns       Int      @default(0)
  successfulRuns  Int      @default(0)
  failedRuns      Int      @default(0)
  avgDuration     Float?
  totalTokens     Int      @default(0)
  totalCost       Float    @default(0)
  
  // Relations
  agent Agent @relation(...)
  
  @@unique([agentId, date])
}
```

**Purpose:** Aggregated agent performance metrics

---

## Extensions & Special Features

### pgvector - Vector Similarity Search

**Installation:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Usage in Prisma:**
```prisma
embedding Unsupported("vector(1536)")?

@@index([embedding(ops: VectorCosineOps)], type: Hnsw)
```

**Common Operations:**
```typescript
// Find similar memories
const similar = await prisma.$queryRaw`
  SELECT id, text, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
  FROM "MemEmbedding"
  WHERE "personId" = ${personId}
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 5
`;
```

**Use Cases:**
- Brand voice similarity search
- Personal memory retrieval (LoopDrive)
- Content recommendation
- Semantic search across documents

### citext - Case-Insensitive Text

**Installation:**
```sql
CREATE EXTENSION IF NOT EXISTS citext;
```

**Usage in Prisma:**
```prisma
keyword String @db.Citext
```

**Benefit:** Automatic case-insensitive matching without `LOWER()` functions

**Use Cases:**
- Keyword deduplication
- Email matching
- Username lookups

---

## Relationships & Constraints

### Multi-Tenancy Pattern

All workspace-scoped resources follow this pattern:

```prisma
model Example {
  id          String    @id @default(cuid())
  workspaceId String    // Foreign key
  // ... other fields
  
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  @@index([workspaceId])
}
```

**Benefits:**
- Automatic data isolation
- Cascade deletes when workspace is removed
- Query optimization via index

### Soft Deletes

For important records, use soft deletes:

```prisma
model Agent {
  // ... fields
  deletedAt DateTime?
  
  @@index([workspaceId, deletedAt])
}
```

**Query Pattern:**
```typescript
// Active agents only
const agents = await prisma.agent.findMany({
  where: { workspaceId, deletedAt: null }
});
```

---

## Indexes & Performance

### Primary Indexes

Every table has:
- **Primary Key:** `@id @default(cuid())` with B-tree index
- **Workspace Index:** `@@index([workspaceId])` for multi-tenancy queries

### Compound Indexes

For common query patterns:

```prisma
@@index([workspaceId, status, createdAt(sort: Desc)])
@@unique([workspaceId, name])
```

### Vector Indexes (HNSW)

For fast similarity search:

```prisma
@@index([embedding(ops: VectorCosineOps)], type: Hnsw)
```

**Performance:** HNSW provides sub-linear search time for nearest neighbor queries

### Query Optimization Tips

1. **Use `select` to limit fields:**
   ```typescript
   const users = await prisma.user.findMany({
     select: { id: true, email: true }
   });
   ```

2. **Use `include` sparingly:**
   - Only include relations you need
   - Avoid deep nesting (>3 levels)

3. **Batch operations:**
   ```typescript
   await prisma.metricEvent.createMany({
     data: events,
     skipDuplicates: true
   });
   ```

4. **Connection pooling:**
   - Neon uses pgBouncer (connection pooler)
   - Use `DATABASE_URL` (pooled) for queries
   - Use `DIRECT_DATABASE_URL` (direct) for migrations

---

## Migrations

### Migration Workflow

**Development:**
```bash
cd apps/api
pnpm prisma migrate dev --name descriptive_name
```

**Production:**
```bash
pnpm prisma migrate deploy
```

### Migration History

13 tracked migrations in `apps/api/prisma/migrations/`:

1. `20240101000000_initial` - Initial schema
2. `20240102000000_phase4_beta` - Phase 4 features
3. `20240103000000_realign_schema` - Major schema realignment
4. `20240104000000_add_agent_memory` - Agent memory tables
5. `20240105000000_add_connector_kind_enum` - Connector enums
6. `20240106000000_full_org_ai_vector_bootstrap` - Organization + AI + pgvector
7. `20240107000000_gpt5_merge_vector` - GPT-5 compatibility
8. `20250129_add_marketing_tables` - Marketing domain
9. `20251027000000_add_citext_keyword_unique` - citext for keywords
10. `20251028100000_add_link_graph` - Internal linking
11. `20251028110000_add_seo_metrics` - SEO metrics
12. `20251028_budget_transactions` - Budget tracking
13. `20251101093000_add_agentic_models` - LoopDrive tables

### Schema Drift Detection

**Check for drift:**
```bash
pnpm --filter apps/api prisma migrate status
```

**GitHub Actions:** `.github/workflows/db-drift-check.yml` runs on every PR

---

## Common Query Patterns

### 1. Find User's Workspaces
```typescript
const workspaces = await prisma.workspace.findMany({
  where: {
    members: {
      some: { userId }
    }
  },
  include: {
    members: {
      where: { userId },
      select: { role: true }
    }
  }
});
```

### 2. Get Agent Runs with Metrics
```typescript
const runs = await prisma.agentRun.findMany({
  where: {
    agentId,
    status: 'completed'
  },
  include: {
    toolExecutions: true
  },
  orderBy: { startedAt: 'desc' },
  take: 20
});
```

### 3. Search Brand Voice by Similarity
```typescript
const results = await prisma.$queryRaw`
  SELECT guide_id, chunk, 
         1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
  FROM "BrandVoiceEmbedding"
  WHERE guide_id = ${guideId}
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 5
`;
```

### 4. Aggregate Campaign Performance
```typescript
const performance = await prisma.marketingCampaignPerformance.aggregate({
  where: {
    campaignId,
    date: {
      gte: startDate,
      lte: endDate
    }
  },
  _sum: {
    impressions: true,
    clicks: true,
    conversions: true,
    spend: true
  },
  _avg: {
    ctr: true,
    cpc: true,
    cpa: true
  }
});
```

### 5. Find Person by Any Identity
```typescript
const person = await prisma.person.findFirst({
  where: {
    workspaceId,
    identities: {
      some: {
        OR: [
          { type: 'email', value: email },
          { type: 'phone', value: phone }
        ]
      }
    }
  },
  include: {
    identities: true,
    consents: true
  }
});
```

---

## Best Practices

### 1. Always Scope by Workspace
```typescript
// ✅ Good
await prisma.agent.findMany({
  where: { workspaceId }
});

// ❌ Bad (security risk!)
await prisma.agent.findMany();
```

### 2. Use Transactions for Multi-Table Updates
```typescript
await prisma.$transaction(async (tx) => {
  const agent = await tx.agent.create({ data: agentData });
  await tx.agentRun.create({ data: { agentId: agent.id, ...runData } });
});
```

### 3. Handle Unique Constraint Violations
```typescript
try {
  await prisma.user.create({ data: { email } });
} catch (e) {
  if (e.code === 'P2002') {
    throw new Error('Email already exists');
  }
  throw e;
}
```

### 4. Use `findFirstOrThrow` for Required Records
```typescript
// Throws if not found
const workspace = await prisma.workspace.findFirstOrThrow({
  where: { id: workspaceId }
});
```

### 5. Batch Read/Write Operations
```typescript
// Use createMany for bulk inserts
await prisma.metricEvent.createMany({
  data: events,
  skipDuplicates: true
});

// Use findMany with IN for bulk reads
await prisma.agent.findMany({
  where: { id: { in: agentIds } }
});
```

---

## Related Documentation

### Core Database Docs
- [`DB_COMPLETION_REPORT.md`](../DB_COMPLETION_REPORT.md) - Comprehensive deployment report
- [`DB_DEPLOYMENT_GUIDE.md`](../DB_DEPLOYMENT_GUIDE.md) - Deployment procedures
- [`docs/DATABASE_PROVISIONING.md`](./DATABASE_PROVISIONING.md) - Neon.tech setup
- [`docs/DATABASE_AUTONOMOUS_DEPLOYMENT_GUIDE.md`](./DATABASE_AUTONOMOUS_DEPLOYMENT_GUIDE.md) - Automated deployment
- [`docs/DB_GOVERNANCE.md`](./DB_GOVERNANCE.md) - Governance framework

### Security & Operations
- [`docs/security/LEAST_PRIVILEGE_ROLES.md`](./security/LEAST_PRIVILEGE_ROLES.md) - Database role management
- [`docs/DB_MIGRATION_RECOVERY_GUIDE.md`](./DB_MIGRATION_RECOVERY_GUIDE.md) - Migration recovery procedures
- [`docs/DB_BACKUP_RESTORE.md`](./DB_BACKUP_RESTORE.md) - Backup strategies

### Schema Source
- [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma) - **Source of truth for schema**

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2025  
**Maintained By:** NeonHub Database Team  
**Next Review:** December 1, 2025

