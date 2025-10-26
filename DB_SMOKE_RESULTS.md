# DB Smoke Results — 2025-10-26 20:41:18 UTC
Author = GPT-5

## Row Counts (post-seed)
| Entity | Count |
| --- | --- |
| organizations | 2 |
| users | 2 |
| brands | 2 |
| agents | 2 |
| datasets | 2 |
| conversations | 2 |
| messages | 3 |
| campaigns | 2 |
| campaign_metrics | 2 |

## Verification Steps
- Ran `node scripts/run-cli.mjs tsx apps/api/prisma/seed.ts` to execute official Prisma seed script.
- Confirmed embeddings indexes via `SELECT indexname FROM pg_indexes WHERE indexname LIKE '%embedding_cosine%';`.
- Extensions verified: `uuid-ossp`, `vector`.
