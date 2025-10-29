# Security Preflight Summary — 2025-10-27

- `pnpm install --frozen-lockfile` → ❌ (offline sandbox; pnpm shim recommends falling back to npm).
- `npm ci` → ❌ (`EUNSUPPORTEDPROTOCOL`: workspace protocol unsupported without pnpm).
- `pnpm --filter apps/api prisma validate` executed via local Prisma CLI → ✅.
- `pnpm --filter apps/api prisma migrate status` → ❌ (`P1001`: Postgres at `localhost:5433` unreachable; Docker daemon not available in sandbox).
- `pnpm --filter apps/api prisma db seed` / `npm run seed --workspace apps/api` → ❌ (ts-node ESM mismatch + missing database).
- `npm run lint --workspace=apps/api` / `npm run typecheck --workspace=apps/api` / `npm audit` → ⏸ not executed; dependency install blocked.
- `gitleaks` / blocked pattern scans → ⏸ not executed this session.

**Remediation:** Re-run the preflight workflow on an environment with pnpm + Postgres access. Ensure `security-preflight.yml` executes `pnpm/action-setup` before Node setup and that secrets (`DATABASE_URL`, `DIRECT_DATABASE_URL`) are defined in GitHub Actions.
