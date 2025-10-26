# NeonHub Database Fix Plan — 2025-01-26

## Quick Runbook (TL;DR)
1. **Tooling** – Install `pnpm` (via Corepack) so Prisma can generate the client:
   ```bash
   corepack enable
   corepack prepare pnpm@9.12.2 --activate
   pnpm install --frozen-lockfile
   ```
2. **Database** – Ensure PostgreSQL ≥14 is running and reachable at `postgresql://****:****@host:5432/neonhub`. Enable required extensions once per database:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. **Schema** – Update `apps/api/prisma/schema.prisma` to add Org/RBAC, brand voice, AI agents, RAG, conversations, enums, and vector columns (see Section 3).
4. **Migrations** – Generate a new migration after applying schema edits:
   ```bash
   pnpm --filter apps/api prisma format
   pnpm --filter apps/api prisma generate
   pnpm --filter apps/api prisma migrate dev --name 20250126_org_ai_vector_bootstrap
   ```
5. **Indexes** – Apply IVFFLAT & hot-path indexes (Section 5) once migration is applied.
6. **Seeds** – Expand `apps/api/prisma/seed.ts` to insert baseline Org/Admin, Brand Voice Copilot data, agents, conversation sample, dataset + chunk, and campaign metric.
7. **Validation** – Run `pnpm --filter apps/api prisma validate`, relevant test suites, and re-check `prisma migrate status`.

---

## 1. Toolchain & Environment Hardening
- Install `pnpm` via Corepack (commands above) and update CI workflows to call `corepack enable`.
- Export `DATABASE_URL`/`DIRECT_URL` in `.env`, `.env.local`, GitHub Actions, and Render/Docker environments—redact to `postgresql://****:****@...` in logs.
- Introduce `apps/api/prisma/.env` symlink or explicit dsns in `scripts/run-cli.mjs` to keep tooling consistent.
- Consider provisioning a shared `docker-compose` service for local Postgres + pgvector:
  ```bash
  docker compose up -d postgres
  ```

## 2. Postgres Extensions & Baseline Commands
- Run the following against each environment (dev/staging/prod) to enable vector support and UUID helpers:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
- Validate extensions exist:
  ```sql
  SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');
  ```
- Lock connection settings in Prisma datasource:
  ```prisma
  datasource db {
    provider   = "postgresql"
    url        = env("DATABASE_URL")
    directUrl  = env("DIRECT_DATABASE_URL")
    extensions = [
      vector(schema: "public")
    ]
  }
  ```

## 3. Prisma Schema Changes (Draft)
Update `apps/api/prisma/schema.prisma` to include:
- **Preview features**: in `generator client`, enable `"postgresqlExtensions"`.
- **Enums**: add strict enums to align with domain taxonomy.
- **Identity & Org**: add `Organization`, `OrganizationMembership`, `OrganizationRole`, `OrganizationPermission`, `RolePermission`, `ApiKey`.
- **Brand System**: add `Brand`, `EmbeddingSpace`, `BrandVoice`, `BrandAsset`.
- **Agents**: add `Agent`, `AgentConfig`, `AgentCapability`, `AgentRun`, `Tool`, `ToolExecution`, `AgentRunMetric`.
- **Conversations**: add `Conversation` linking to Org/User, update `Message` to include `conversationId`, `role` enum, `contentJson` JSONB, `embedding Vector`.
- **Data / RAG**: add `Dataset`, `DocumentVersion` (optional), `Chunk` with vector, `ModelVersion`, `TrainingJob`, `InferenceEndpoint`.
- **Content & Campaigns**: add `Content` and `CampaignMetric`; ensure `Campaign`/`EmailSequence`/`SocialPost`/`ABTest` include `organizationId`.
- **Governance**: extend `AuditLog` with org scope, actorType enum, and request hashing.

Reference snippet (abbreviated for clarity):
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

enum AgentKind { COPILOT WORKFLOW ANALYST }
enum AgentStatus { DRAFT ACTIVE PAUSED DISABLED }
enum MessageRole { system user assistant tool }
enum ConversationKind { support campaign planning ad_hoc }
enum DatasetKind { documents faq analytics }
enum TrainStatus { queued running completed failed cancelled }
enum ContentKind { article email social_script ad_copy }
enum CampaignStatus { draft scheduled active paused completed archived }

model Organization {
  id         String   @id @default(cuid())
  slug       String   @unique
  name       String
  plan       String   @default("starter")
  settings   Json?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  members    OrganizationMembership[]
  roles      OrganizationRole[]
  brands     Brand[]
  agents     Agent[]
  datasets   Dataset[]
  campaigns  Campaign[]
  auditLogs  AuditLog[]
}

model OrganizationMembership {
  id             String        @id @default(cuid())
  organizationId String
  userId         String
  roleId         String?
  status         String        @default("active")
  invitedById    String?
  joinedAt       DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  organization   Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           OrganizationRole? @relation(fields: [roleId], references: [id], onDelete: SetNull)
  @@unique([organizationId, userId])
}

model BrandVoice {
  id               String   @id @default(cuid())
  brandId          String
  embeddingSpaceId String
  promptTemplate   String   @db.Text
  styleRulesJson   Json
  embedding        Bytes    @ignore // placeholder until `Vector` is available
  brand            Brand    @relation(fields: [brandId], references: [id], onDelete: Cascade)
  embeddingSpace   EmbeddingSpace @relation(fields: [embeddingSpaceId], references: [id], onDelete: Cascade)
}

model Message {
  id              String          @id @default(cuid())
  conversationId  String
  authorId        String?
  role            MessageRole
  contentJson     Json
  embedding       Unsupported("vector") @db.Vector(1536)
  createdAt       DateTime @default(now())
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  author          User?        @relation(fields: [authorId], references: [id], onDelete: SetNull)
  @@index([conversationId, createdAt])
  @@index([role, createdAt])
}

model Chunk {
  id               String   @id @default(cuid())
  datasetId        String
  embeddingSpaceId String
  documentId       String
  idx              Int
  text             String   @db.Text
  embedding        Unsupported("vector") @db.Vector(1536)
  metadata         Json?
  createdAt        DateTime @default(now())
  dataset          Dataset  @relation(fields: [datasetId], references: [id], onDelete: Cascade)
  embeddingSpace   EmbeddingSpace @relation(fields: [embeddingSpaceId], references: [id], onDelete: Cascade)
  document         Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  @@unique([datasetId, idx])
  @@index([embeddingSpaceId])
}
```
> **Note:** Replace `Unsupported("vector")` with the actual Prisma vector type once `postgresqlExtensions` is enabled; ensure dimensions align with your embedding provider.

## 4. Migration Draft & Execution
- Create a timestamped folder (already scaffolded in this task): `apps/api/prisma/migrations/20250126_realign_schema/migration.sql`.
- Populate it with idempotent SQL (see file excerpt below) covering:
  - Extension checks.
  - Creation of org/RBAC tables.
  - Creation of brand voice, embedding spaces, datasets, chunks, conversations, agents, tool telemetry, content, campaign metrics.
  - Alterations to existing tables (e.g., `messages` -> conversation-based layout).
- Run migration locally with Prisma after schema updates (`pnpm --filter apps/api prisma migrate dev --name 20250126_org_ai_vector_bootstrap`).
- For prod/staging, use `pnpm --filter apps/api prisma migrate deploy` after review.
- Keep `.tmp/db-drift.sql` up to date for future drift checks.

## 5. Index & Performance Posture
After applying migrations, execute SQL to create vector and time-series indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_chunk_embedding_cosine
  ON "Chunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_message_embedding_cosine
  ON "Message" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_agent_run_started
  ON "AgentRun" ("agentId", "startedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_metric_ts
  ON "CampaignMetric" ("campaignId", "kind", "timestamp");
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_key_token_hash
  ON "ApiKey" ("organizationId", "tokenHash");
CREATE INDEX IF NOT EXISTS idx_conversation_org_created
  ON "Conversation" ("organizationId", "createdAt" DESC);
```
Tune IVFFLAT `lists` and `SET maintenance_work_mem` per environment size.

## 6. Seed Data Expansion
Update `apps/api/prisma/seed.ts` to create a minimum viable dataset:
- Organization + admin membership for `demo@neonhub.ai`.
- Brand & BrandVoice with prompt template and style rules.
- EmbeddingSpace entry (e.g., `{ provider: "openai", model: "text-embedding-3-large", dimension: 3072 }`).
- Agent definitions (COPILOT + capabilities `["knowledge", "drafting", "analysis"]`).
- Conversation, first message (with placeholder embedding array converted to vector), and sample documents/dataset/chunks.
- Campaign + CampaignMetric entries referencing Org + Brand.
- Wrap vector inserts with `Prisma.sql` raw queries until Prisma vector type generation is complete.

Example snippet:
```ts
await prisma.organization.upsert({
  where: { slug: "demo" },
  update: {},
  create: {
    slug: "demo",
    name: "Demo Org",
    plan: "starter",
    members: {
      create: {
        user: { connect: { email: "demo@neonhub.ai" } },
        status: "active",
      },
    },
  },
});
```
Use deterministic IDs for e2e tests and wrap seeding in a transaction.

## 7. Validation & QA
- Run Prisma checks:
  ```bash
  pnpm --filter apps/api prisma validate
  pnpm --filter apps/api prisma migrate status
  ```
- Regenerate clients for web mirror:
  ```bash
  pnpm --filter apps/web prisma generate
  ```
- Execute automated suites:
  ```bash
  pnpm lint
  pnpm type-check
  pnpm --filter apps/api test:coverage
  pnpm --filter apps/web test:e2e
  ```
- Add integration tests covering Org scoping, agent runs, conversation embeddings, and dataset retrieval.

## 8. Observability & Governance Follow-Up
- Extend `AuditLog` writes in services to include organization context, resource identifiers, and hashed payloads for compliance.
- Backfill brand/agent/conversation data from existing production stores before cutover.
- Monitor vector index performance (`pg_stat_user_indexes`) and vacuum schedules after ingestion.
- Document rollback plan: export schema/table backups via `pg_dump` before applying migrations.
