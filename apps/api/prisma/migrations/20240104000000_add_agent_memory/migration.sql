BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "agent_memories" (
    "id" TEXT PRIMARY KEY,
    "agent" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "agent_memories"
    ADD CONSTRAINT agent_memories_agent_key_unique UNIQUE ("agent", "key");

CREATE INDEX IF NOT EXISTS agent_memories_agent_key_idx ON "agent_memories" ("agent", "key");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'agent_memories_embedding_idx'
    ) THEN
        EXECUTE 'CREATE INDEX agent_memories_embedding_idx ON "agent_memories" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100)';
    END IF;
END$$;

COMMIT;
