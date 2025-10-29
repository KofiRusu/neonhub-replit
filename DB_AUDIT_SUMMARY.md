# NeonHub Database Audit Summary — 2025-10-27

## Prisma CLI Checks
- `prisma validate --schema apps/api/prisma/schema.prisma` → ✅ schema passes structural validation.
- `prisma migrate status` → ⚠️ fails with `P1001` (cannot reach Postgres at `localhost:5433`). Docker daemon unavailable in sandbox, so no local pgvector instance is running.
- `prisma db seed` (via `npx prisma db seed` in `apps/api`) → ⚠️ `ts-node` execution fails (`Unknown file extension ".ts"`). Underlying database connectivity remains blocked, so seed could not execute.

## Migration & Schema Review
- Active migrations detected:  
  `20251012154609_initial`, `20250105_phase4_beta`, `20250126_realign_schema`, `20251026_full_org_ai_vector_bootstrap`, `20251026_gpt5_merge_vector`, `20251026_add_connector_kind_enum`, `20250215_add_agent_memory`.
- Extensions requested in migrations: `vector` (`20251026_full_org_ai_vector_bootstrap`, `20250126_realign_schema`, `20250215_add_agent_memory`) and `uuid-ossp` (`20250126_realign_schema`, `20251026_gpt5_merge_vector`).
- Vector column dimensionality enforced at 1536 for `brand_voices.embedding`, `messages.embedding`, and `chunks.embedding` in `20251026_gpt5_merge_vector/migration.sql`.
- IVFFLAT indexes present for primary vector fields: `brand_voices_embedding_cosine_idx`, `messages_embedding_cosine_idx`, `chunks_embedding_cosine_idx`, and `agent_memories_embedding_idx` (per migration SQL).

## Outstanding Actions
- Start or point Prisma to an accessible Postgres 16 + pgvector instance to confirm migrate status, extension availability, and IVFFLAT index creation in a live database.
- Fix seed runner in ESM mode (`ts-node --transpile-only` fails). Consider switching to `node --loader ts-node/esm` or `tsx`—and re-run once database connectivity is restored.
- Capture drift output once `prisma migrate diff` can contact the target database (Neon or local Docker).
