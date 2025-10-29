# Database Seed Log — 2025-10-27

| Timestamp (UTC) | Command | Result | Notes |
| --- | --- | --- | --- |
| 2025-10-27 19:37:56 | `PRISMA_HIDE_DATABASE_URL=true DATABASE_URL=postgresql://neonhub:neonhub@localhost:5433/neonhub npx prisma db seed` (run inside `apps/api`) | ❌ | `ts-node --transpile-only prisma/seed.ts` failed (`ERR_UNKNOWN_FILE_EXTENSION`); Postgres instance unavailable, so no seed data written. |

Follow-up: ensure Postgres 16 + pgvector is running, then invoke seed via `npm run seed --workspace apps/api` (which wraps `tsx`) or adjust `prisma.seed` to use an ESM-friendly runner.
