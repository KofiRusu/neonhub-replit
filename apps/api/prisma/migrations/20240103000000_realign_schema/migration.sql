-- DRAFT MIGRATION — generated during audit on 2025-01-26
-- Goal: align NeonHub database with Org/RBAC, Brand Voice, Agent telemetry, RAG, and pgvector requirements.
-- NOTE: Review and adapt before running. All statements use IF EXISTS/IF NOT EXISTS where possible for safety.

BEGIN;

-- --------------------------------------------------------------------
-- Extensions
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- --------------------------------------------------------------------
-- Identity & Organization
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" TEXT PRIMARY KEY,
    "slug" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "settings" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "organization_roles" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT organization_roles_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS organization_roles_org_slug_idx ON "organization_roles" ("organizationId", "slug");

CREATE TABLE IF NOT EXISTS "organization_permissions" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT organization_permissions_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS organization_permissions_org_key_idx ON "organization_permissions" ("organizationId", "key");

CREATE TABLE IF NOT EXISTS "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT role_permissions_role_fk FOREIGN KEY ("roleId") REFERENCES "organization_roles"("id") ON DELETE CASCADE,
    CONSTRAINT role_permissions_permission_fk FOREIGN KEY ("permissionId") REFERENCES "organization_permissions"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "organization_members" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "invitedById" TEXT,
    "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT organization_members_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
    CONSTRAINT organization_members_user_fk FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT organization_members_role_fk FOREIGN KEY ("roleId") REFERENCES "organization_roles"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS organization_members_org_user_idx ON "organization_members" ("organizationId", "userId");

CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "lastUsedAt" TIMESTAMP WITH TIME ZONE,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "revokedAt" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT api_keys_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
    CONSTRAINT api_keys_user_fk FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS api_keys_org_token_hash_idx ON "api_keys" ("organizationId", "tokenHash");

-- --------------------------------------------------------------------
-- Brand System & Embeddings
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "embedding_spaces" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimension" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT embedding_spaces_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS embedding_spaces_org_name_idx ON "embedding_spaces" ("organizationId", "name");

CREATE TABLE IF NOT EXISTS "brands" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "styleGuide" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT brands_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS brands_org_slug_idx ON "brands" ("organizationId", "slug");

CREATE TABLE IF NOT EXISTS "brand_voices" (
    "id" TEXT PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "embeddingSpaceId" TEXT NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "styleRulesJson" JSONB NOT NULL,
    "embedding" VECTOR(1536),
    "metrics" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT brand_voices_brand_fk FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE,
    CONSTRAINT brand_voices_space_fk FOREIGN KEY ("embeddingSpaceId") REFERENCES "embedding_spaces"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS brand_voices_brand_idx ON "brand_voices" ("brandId");

CREATE TABLE IF NOT EXISTS "brand_assets" (
    "id" TEXT PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT brand_assets_brand_fk FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- Agents & Tools
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "agents" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "version" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT agents_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS agents_org_slug_idx ON "agents" ("organizationId", "slug");

CREATE TABLE IF NOT EXISTS "agent_capabilities" (
    "id" TEXT PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT agent_capabilities_agent_fk FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "agent_configs" (
    "id" TEXT PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT agent_configs_agent_fk FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS agent_configs_agent_key_idx ON "agent_configs" ("agentId", "key");

CREATE TABLE IF NOT EXISTS "agent_runs" (
    "id" TEXT PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "datasetId" TEXT,
    "status" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "metadata" JSONB,
    CONSTRAINT agent_runs_agent_fk FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE,
    CONSTRAINT agent_runs_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS agent_runs_agent_started_idx ON "agent_runs" ("agentId", "startedAt");

CREATE TABLE IF NOT EXISTS "agent_run_metrics" (
    "id" TEXT PRIMARY KEY,
    "agentRunId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "metadata" JSONB,
    CONSTRAINT agent_run_metrics_run_fk FOREIGN KEY ("agentRunId") REFERENCES "agent_runs"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "tools" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "inputSchema" JSONB,
    "outputSchema" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT tools_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS tools_org_slug_idx ON "tools" ("organizationId", "slug");

CREATE TABLE IF NOT EXISTS "tool_executions" (
    "id" TEXT PRIMARY KEY,
    "toolId" TEXT NOT NULL,
    "agentRunId" TEXT,
    "status" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "metadata" JSONB,
    CONSTRAINT tool_executions_tool_fk FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE CASCADE,
    CONSTRAINT tool_executions_agent_run_fk FOREIGN KEY ("agentRunId") REFERENCES "agent_runs"("id") ON DELETE SET NULL
);

-- --------------------------------------------------------------------
-- Conversations & Messages
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" TEXT,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT conversations_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
    CONSTRAINT conversations_user_fk FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS conversations_org_created_idx ON "conversations" ("organizationId", "createdAt");

-- Migrate existing messages table (if present) to conversation-centric schema.
ALTER TABLE IF EXISTS "messages"
    ADD COLUMN IF NOT EXISTS "conversationId" TEXT,
    ADD COLUMN IF NOT EXISTS "authorId" TEXT,
    ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'assistant',
    ADD COLUMN IF NOT EXISTS "contentJson" JSONB,
    ADD COLUMN IF NOT EXISTS "embedding" VECTOR(1536),
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE,
    DROP COLUMN IF EXISTS "receiverId",
    DROP COLUMN IF EXISTS "senderId",
    DROP COLUMN IF EXISTS "threadId",
    DROP COLUMN IF EXISTS "replyToId";

ALTER TABLE IF EXISTS "messages"
    ADD CONSTRAINT messages_conversation_fk FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE;
ALTER TABLE IF EXISTS "messages"
    ADD CONSTRAINT messages_author_fk FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON "messages" ("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS messages_role_idx ON "messages" ("role", "createdAt");

-- --------------------------------------------------------------------
-- Data / RAG
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "datasets" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT datasets_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS datasets_org_slug_idx ON "datasets" ("organizationId", "slug");

ALTER TABLE IF EXISTS "documents"
    ADD COLUMN IF NOT EXISTS "organizationId" TEXT,
    ADD COLUMN IF NOT EXISTS "datasetId" TEXT,
    ADD COLUMN IF NOT EXISTS "embeddingSpaceId" TEXT,
    ADD CONSTRAINT documents_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
    ADD CONSTRAINT documents_dataset_fk FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE SET NULL,
    ADD CONSTRAINT documents_embedding_space_fk FOREIGN KEY ("embeddingSpaceId") REFERENCES "embedding_spaces"("id") ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "chunks" (
    "id" TEXT PRIMARY KEY,
    "datasetId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "embeddingSpaceId" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" VECTOR(1536),
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chunks_dataset_fk FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE CASCADE,
    CONSTRAINT chunks_document_fk FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE,
    CONSTRAINT chunks_embedding_space_fk FOREIGN KEY ("embeddingSpaceId") REFERENCES "embedding_spaces"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS chunks_dataset_idx_unique ON "chunks" ("datasetId", "idx");

CREATE TABLE IF NOT EXISTS "model_versions" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT model_versions_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "training_jobs" (
    "id" TEXT PRIMARY KEY,
    "modelVersionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "metrics" JSONB,
    "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT training_jobs_model_fk FOREIGN KEY ("modelVersionId") REFERENCES "model_versions"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "inference_endpoints" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "modelVersionId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT inference_endpoints_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
    CONSTRAINT inference_endpoints_model_fk FOREIGN KEY ("modelVersionId") REFERENCES "model_versions"("id") ON DELETE SET NULL
);

-- --------------------------------------------------------------------
-- Content & Campaigns
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "content" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT,
    "body" TEXT,
    "metadata" JSONB,
    "publishedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT content_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
    CONSTRAINT content_author_fk FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL
);

ALTER TABLE IF EXISTS "campaigns"
    ADD COLUMN IF NOT EXISTS "organizationId" TEXT,
    ADD CONSTRAINT campaigns_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "campaign_metrics" (
    "id" TEXT PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "payload" JSONB,
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT campaign_metrics_campaign_fk FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS campaign_metrics_campaign_kind_ts_idx ON "campaign_metrics" ("campaignId", "kind", "timestamp");

-- --------------------------------------------------------------------
-- Governance / Audit
-- --------------------------------------------------------------------
ALTER TABLE IF EXISTS "audit_logs"
    ADD COLUMN IF NOT EXISTS "organizationId" TEXT,
    ADD COLUMN IF NOT EXISTS "actorType" TEXT,
    ADD COLUMN IF NOT EXISTS "resourceType" TEXT,
    ADD COLUMN IF NOT EXISTS "requestHash" TEXT,
    ADD CONSTRAINT audit_logs_org_fk FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx ON "audit_logs" ("organizationId", "createdAt");

-- --------------------------------------------------------------------
-- Vector Index Recommendations (not executed automatically)
-- --------------------------------------------------------------------
-- Run manually after verifying data volume:
-- CREATE INDEX idx_brand_voice_embedding_cosine ON "brand_voices" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX idx_message_embedding_cosine ON "messages" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX idx_chunk_embedding_cosine ON "chunks" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMIT;
