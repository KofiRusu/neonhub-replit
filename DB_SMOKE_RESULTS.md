
2025-10-26T23:44:32Z — db-smoke.mjs update
- Added `scripts/db-smoke.mjs` for automated row-count + index verification.
- Execution currently blocked (`MODULE_NOT_FOUND: '.prisma/client/default'`) because Prisma Client artifacts are missing (offline env prevents `prisma generate`).
- Run `npm run prisma:generate --workspace=apps/api` once dependencies are restored to regenerate `.prisma/client` before executing the smoke script.
