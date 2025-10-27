# Prisma Migration Summary — Updated 2025-10-26
Author = GPT-5 + Codex

| Migration | Status | Notes |
| --- | --- | --- |
| 20251012154609_initial | ✅ Applied | Initial auth, drafts, and core tables |
| 20250105_phase4_beta | ✅ Applied | Phase 4 beta (documents, tasks, feedback, messages, team, connectors) |
| 20250126_realign_schema | ✅ Applied | Schema realignment |
| 20251026_full_org_ai_vector_bootstrap | ✅ Applied | Establishes Org/RBAC, agent telemetry, RAG, and campaign tables (includes optional vector columns). |
| 20251026_gpt5_merge_vector | ✅ Applied | Enforces `vector(1536)` typing, renames `campaign_metrics.ts → timestamp`, and creates IVFFLAT indexes. |
| **20251026_add_connector_kind_enum** | ✅ **Applied** | **Creates ConnectorKind enum with 15 platform types (EMAIL, SMS, WHATSAPP, REDDIT, INSTAGRAM, FACEBOOK, X, YOUTUBE, TIKTOK, GOOGLE_ADS, SHOPIFY, STRIPE, SLACK, DISCORD, LINKEDIN) and updates connectors.category field to use enum.** |

Archived references: legacy SQL from Phase 4 retained under `apps/api/prisma/_legacy_migrations/` for historical context.

Latest command output:
```
npx prisma migrate status --schema apps/api/prisma/schema.prisma
Environment variables loaded from .env
Prisma schema loaded from apps/api/prisma/schema.prisma
Datasource "db": PostgreSQL database "neonhub", schema "public" at "localhost:5433"

6 migrations found in prisma/migrations

Database schema is up to date!
```

## Latest Migration Details (20251026_add_connector_kind_enum)

### SQL Applied
```sql
-- CreateEnum
CREATE TYPE "ConnectorKind" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'REDDIT', 'INSTAGRAM', 'FACEBOOK', 'X', 'YOUTUBE', 'TIKTOK', 'GOOGLE_ADS', 'SHOPIFY', 'STRIPE', 'SLACK', 'DISCORD', 'LINKEDIN');

-- AlterTable
ALTER TABLE "connectors" ALTER COLUMN "category" SET DATA TYPE "ConnectorKind" USING ("category"::"ConnectorKind");
```

### Verification
```sql
SELECT unnest(enum_range(NULL::"ConnectorKind")) AS value;
```

**Result:** All 15 enum values confirmed in database ✅
