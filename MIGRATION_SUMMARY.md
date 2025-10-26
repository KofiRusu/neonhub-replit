# Prisma Migration Summary — 2025-10-26 20:41:18 UTC
Author = GPT-5

| Migration | Status | Notes |
| --- | --- | --- |
| 20251026_full_org_ai_vector_bootstrap | ✅ Applied via `pnpm --filter apps/api prisma migrate reset` | Establishes Org/RBAC, agent telemetry, RAG, and campaign tables (includes optional vector columns). |
| 20251026_gpt5_merge_vector | ✅ Applied via `pnpm --filter apps/api prisma migrate deploy` | Enforces `vector(1536)` typing, renames `campaign_metrics.ts → timestamp`, and creates IVFFLAT indexes. |

Archived references: legacy SQL from Phase 4 retained under `apps/api/prisma/_legacy_migrations/` for historical context.

Latest command output:
```
./pnpm --filter apps/api prisma migrate status
Environment variables loaded from .env
Prisma schema loaded from apps/api/prisma/schema.prisma
Datasource "db": PostgreSQL database "neonhub", schema "public" at "localhost:5433"

2 migrations found in prisma/migrations

Database schema is up to date!
```
