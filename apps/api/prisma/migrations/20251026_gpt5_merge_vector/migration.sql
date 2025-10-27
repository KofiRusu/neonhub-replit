-- GPT-5 vector refinements and campaign metric alignment
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

ALTER TABLE "brand_voices"
  ALTER COLUMN "embedding" TYPE vector(1536) USING "embedding";

ALTER TABLE "messages"
  ALTER COLUMN "embedding" TYPE vector(1536) USING "embedding";

ALTER TABLE "chunks"
  ALTER COLUMN "embedding" TYPE vector(1536) USING "embedding";

ALTER TABLE "campaign_metrics"
  RENAME COLUMN "ts" TO "timestamp";

DROP INDEX IF EXISTS "idx_chunk_embedding_cosine";
DROP INDEX IF EXISTS "idx_message_embedding_cosine";

CREATE INDEX IF NOT EXISTS "brand_voices_embedding_cosine_idx"
  ON "brand_voices" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS "messages_embedding_cosine_idx"
  ON "messages" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS "chunks_embedding_cosine_idx"
  ON "chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS "campaign_metrics_campaignId_kind_timestamp_idx"
  ON "campaign_metrics" ("campaignId", "kind", "timestamp");

COMMIT;
