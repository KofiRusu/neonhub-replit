# RAG Health Check — 2025-10-27

- **Schemas:** `messages.embedding` and `chunks.embedding` use `vector(1536)` with IVFFLAT indexes (`messages_embedding_cosine_idx`, `chunks_embedding_cosine_idx`) per `apps/api/prisma/migrations/20251026_gpt5_merge_vector/migration.sql`.
- **Data availability:** No sample embeddings exist in the repo (`prisma/seed.ts` doesn’t populate vectors). Without a running database, retrieval queries could not be executed.
- **Retrieval layer:** No service consumes these embeddings. Search routes (`apps/api/src/routes/documents.ts`, `messages.ts`) provide keyword/SQL filtering only; there is no pgvector `ORDER BY embedding <=>` query.
- **Adaptive callbacks:** `apps/api/src/services/learning/index.ts` delegates to `NeonHubPredictiveEngine.recall`, but that method is absent, so pgvector-backed recall never runs.
- **Testing:** No RAG integration tests found under `apps/api/src/__tests__` or `modules/predictive-engine/src/memory/tests`; only in-memory PgVectorStore tests exist.

**Status:** ❌ Retrieval-augmented generation is not wired. Vector indexes exist, but without seeded data, recall APIs, or orchestrator hooks, RAG cannot be validated.
