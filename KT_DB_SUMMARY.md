# KT_DB_SUMMARY

| Item | Details |
| --- | --- |
| Schema | `apps/api/prisma/schema.prisma` (75 models / 17 enums) |
| Latest migrations | `20251101093000_add_agentic_models` + 12 historical folders in `apps/api/prisma/migrations/` |
| Extensions | `vector`, `citext`, `uuid-ossp` declared in datasource + reinforced via SQL migrations (see `20240104000000_add_agent_memory/migration.sql`) |
| Vector dimensions | 1,536 (brand_voices.embedding, messages.embedding, chunks.embedding, mem_embeddings.embedding, agent_memories.embedding) |
| Last validation | 2025-11-10 via `cd apps/api && node ../../scripts/run-cli.mjs prisma validate --schema prisma/schema.prisma` |
| Drift status | Blocked (P1001) because no reachable `$DATABASE_URL`; `.tmp/db-drift.sql` not generated |

## Model Inventory
| Domain | # Models | Highlights |
| --- | --- | --- |
| Identity & Access | 12 | Organization, OrganizationRole, OrganizationPermission, RolePermission, OrganizationMembership, User, Account, Session, VerificationToken, Credential, ApiKey, UserSettings |
| Agents & Telemetry | 11 | Agent, AgentCapability, AgentConfig, AgentRun, AgentRunMetric, RunStep, Tool, ToolExecution, AgentJob (legacy), AgentMemory/MemEmbedding, AgentRunMetric |
| Knowledge & Vector Store | 8 | EmbeddingSpace, Dataset, Document, Chunk, Conversation, Message, DatasetChunk idx, MemEmbedding |
| Marketing & Content | 18 | Persona, Keyword (`citext` term), EditorialCalendar, Brand, BrandVoice, BrandAsset, Content, ContentDraft, SocialPost, EmailSequence, SnippetLibrary, Campaign, CampaignMetric, MarketingCampaign, MarketingLead, MarketingTouchpoint, MarketingMetric, ContentDraft |
| Budget & Revenue | 9 | BudgetProfile, BudgetAllocation, BudgetLedger, BudgetTransaction, Budget, Subscription, Invoice, Payment, UsageRecord, Payout |
| Connectors & Automations | 9 | Connector, ConnectorAuth, TriggerConfig, ActionConfig, Credential, ApiKey (shared), Connector metadata tables |
| Compliance & Activity | 8 | Consent, AuditLog, Note, Event, Feedback, Task, MetricEvent, Topic |

## Enum Coverage (partial)
| Enum | Values |
| --- | --- |
| `AgentKind` | COPILOT, WORKFLOW, ANALYST |
| `AgentStatus` | DRAFT, ACTIVE, PAUSED, DISABLED |
| `MessageRole` | system, user, assistant, tool |
| `ConversationKind` | support, campaign, planning, ad_hoc |
| `DatasetKind` | documents, faq, analytics |
| `TrainStatus` | queued, running, completed, failed, cancelled |
| `ContentKind` | article, email, social_script, ad_copy |
| `CampaignStatus` | draft, scheduled, active, paused, completed, archived |
| `ConnectorKind` | EMAIL, SMS, WHATSAPP, REDDIT, INSTAGRAM, FACEBOOK, X, YOUTUBE, TIKTOK, GOOGLE_ADS, GOOGLE_SEARCH_CONSOLE, SHOPIFY, STRIPE, SLACK, DISCORD, LINKEDIN |
| `MarketingLeadStatus` | new, contacted, qualified, nurturing, converted, lost, unqualified |
| `BudgetAllocationStatus` | planned, approved, executing, completed, cancelled |

## Extensions & Vector Indexing
- Datasource enables `vector(schema: "public")` + `citext(schema: "public")`; migrations also call `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.
- Vector columns cast to `vector(1536)` inside `20240107000000_gpt5_merge_vector/migration.sql`, paired with IVFFLAT indexes:
  - `brand_voices_embedding_cosine_idx`
  - `messages_embedding_cosine_idx`
  - `chunks_embedding_cosine_idx`
  - `agent_memories_embedding_idx` (created in `20240104000000_add_agent_memory` via DO block)
- Time-series indexes include `campaign_metrics_campaignId_kind_timestamp_idx`, `events` indexes on `(organizationId, occurredAt)`, and `metric_events` JSON-path filters.
- `keywords.term` stored as `@db.Citext` with `@@unique([term], map: "ux_keyword_term_ci")` for case-insensitive uniqueness.

## Keys & Secondary Indexes
- Composite uniqueness everywhere multi-tenancy matters: `Agent(organizationId, slug)`, `Dataset(organizationId, slug)`, `Persona.name`, `Connector.name`, `BudgetProfile(organizationId, slug)`.
- Cardinality-sensitive indexes: `AgentRun(agentId, startedAt)`, `Message(conversationId, createdAt)`, `RunStep(runId, name)`, `MarketingTouchpoint(organizationId, occurredAt)`, `MemEmbedding(personId, createdAt)`.
- Sensitive cascades explicitly declared, e.g. deleting an Organization cascades into Agent, AgentRun, Campaign, Budget, etc.; `ToolExecution` cascades from Tool.

## Seed Baseline (`apps/api/prisma/seed.ts`)
- Org + Brand: creates/updates `organization` slug `primary`, default brand `neonhub`, and admin `user` (`admin@neonhub.ai`).
- Personas & Keywords: seeds three personas (Creator Pro, Event Planner, Hospitality Marketer) with six intent-tagged keywords tied via citext-safe normalization.
- Editorial calendar: four scheduled/planned entries staggered over 3–21 days.
- Connector catalog: ~17 connectors (Gmail, Outlook, Twilio SMS, WhatsApp Business, Reddit Ads, Instagram Graph, Facebook Marketing, X Ads, YouTube Studio, TikTok Ads, Google Ads, Shopify, Stripe, Slack, Discord, etc.) complete with auth metadata, triggers, actions, and rate-limit context.
- ConnectorAuth seeds: pre-link Gmail workspace, Twilio messaging, and Stripe (pending) to prove relational integrity without exposing credentials.
- Agent templates: workflow/email agents with `capabilities`, `settings`, and attached `tools` providing sample JSON schemas; ensures downstream Tool relations are hydrated for tests.
- Script uses `upsert`/`findFirst` guards for idempotency.

## Validation & Drift Status
- ✅ `node ../../scripts/run-cli.mjs prisma validate --schema prisma/schema.prisma`
- ⚠️ `node ../../scripts/run-cli.mjs prisma migrate status --schema prisma/schema.prisma` → `Error: P1001 Can't reach database server at localhost:5433` (local Postgres absent; production DSN unavailable).
- 🚫 `pnpm --filter @neonhub/backend-v3.2 exec prisma migrate diff` not run (no DSN to point `--to-url`). `.tmp/db-drift.sql` therefore not created.

## Follow-ups
1. **Request/Inject DSN:** Agency must supply redacted `postgresql://****:****@host:5432/db` for drift + deploy workflows, or expose Neon shadow DB.
2. **Lockfile Refresh:** Regenerate `pnpm-lock.yaml` (or provide tarball) so `--frozen-lockfile` no longer halts installs.
3. **MIGRATION_RISK.md:** required whenever a non-append-only change (drops/renames) ships; not needed yet but keep template handy.
4. **pgvector VACUUM plan:** Document `ALTER INDEX ... SET (lists=200)` once vector tables exceed 50k rows; currently lists=100 per migration.
5. **Automate backups:** `db-backup.yml` exists; ensure AWS secrets configured so nightly dumps leave GitHub artifact + S3 (see KT_CI_SUMMARY).
