# Database Migration Recovery Guide (NeonHub & Agent Infra)

This playbook covers the steps required to restore database functionality when the Prisma migrations have not been applied because the Neon/Postgres endpoint was unreachable during local or CI runs.

---

## 1. Collect Connection Details

| Item | Value | Notes |
| --- | --- | --- |
| Neon endpoint | `postgresql://neondb_owner:<password>@<host>/<db>?sslmode=require` | Replace with the live host / password |
| Local fallback (Docker) | `postgresql://neonhub:neonhub@localhost:5433/neonhub` | Provided by `docker-compose.db.yml` |
| Prisma schema (NeonHub API) | `apps/api/prisma/schema.prisma` | For the main NeonHub project |
| Prisma schema (Agent Infra API) | `agent-infra/apps/api/prisma/schema.prisma` | For the background worker/API |

> **Tip:** keep both URLs in `apps/api/.env` and `agent-infra/apps/api/.env` as `DATABASE_URL` / `DIRECT_DATABASE_URL`. When switching between Neon and local Docker, run the seed again.

---

## 2. Ensure a Reachable Postgres Instance

1. **Remote (preferred):** verify Neon DNS + credentials by running  
   ```bash
   psql "$DATABASE_URL" -c 'SELECT version();'
   ```  
   If the host cannot be resolved, open the Neon console and confirm the connection string or create a new branch.

2. **Local fallback (Docker):**
   ```bash
   docker compose -f docker-compose.db.yml up -d postgres
   export DATABASE_URL="postgresql://neonhub:neonhub@localhost:5433/neonhub"
   ```
   Wait for `pg_isready` to report success before continuing.

3. **File-system fallback:** if Docker is unavailable, initialise a local Postgres cluster (e.g. via `initdb`) and update the URL accordingly.

---

## 3. Apply Prisma Migrations

### NeonHub API (`/apps/api`)

```bash
cd /path/to/NeonHub
export DATABASE_URL="postgresql://..."
export DIRECT_DATABASE_URL="$DATABASE_URL"

./pnpm --filter apps/api prisma migrate deploy
./pnpm --filter apps/api prisma db seed   # optional, idempotent
```

If `pnpm` is unavailable, use the repository shim:

```bash
export PATH="$PWD:$PATH"
pnpm --filter apps/api prisma migrate deploy
```

The SQL applied corresponds to `apps/api/prisma/migrations/20251027233223_init_neonhub_db/migration.sql`.

### Agent Infra API (`/agent-infra/apps/api`)

```bash
cd /path/to/NeonHub/agent-infra
export DATABASE_URL="postgresql://..."
export DIRECT_DATABASE_URL="$DATABASE_URL"

npm run prisma:migrate --workspace @agent-infra/api   # or pnpm equivalent
npm run prisma:seed --workspace @agent-infra/api      # optional
```

> **Manual fallback:** If Prisma CLI access is blocked, execute the SQL in the migration file via `psql -f migration.sql`. The file already contains enum + table definitions.

---

## 4. Verify Schema Integrity

After migrations succeed:

```bash
psql "$DATABASE_URL" <<'SQL'
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
\d "AgentRun";
\d "Workflow";
SQL
```

Run the Prisma checks:

```bash
pnpm --filter apps/api prisma validate
pnpm --filter apps/api exec prisma migrate status --schema apps/api/prisma/schema.prisma
```

For agent-infra:

```bash
npm run prisma:generate --workspace @agent-infra/api
npm run typecheck --workspace @agent-infra/api
```

---

## 5. Restart Services

With the database online:

### NeonHub monorepo
```bash
pnpm run dev            # or pnpm --filter apps/api dev
```

### Agent Infra monorepo
```bash
pnpm --filter @agent-infra/api build
pnpm --filter @agent-infra/worker build
pnpm --filter @agent-infra/api dev      # API (requires DB + Redis)
pnpm --filter @agent-infra/worker dev   # Worker (requires DB + Redis)
```

If running from compiled output due to watch limitations:
```bash
node apps/api/dist/server.js
node apps/worker/dist/index.js
```

---

## 6. Troubleshooting Checklist

- **`P1001: Can't reach database server`**  
  - Verify network/firewall policies, ensure the host/port resolve.
  - Test with `psql` to rule out Prisma-specific issues.

- **`pnpm` unavailable**  
  - Use the local shim (`./pnpm`). Consider `npm install` followed by `npx prisma migrate deploy`.

- **Agent API exits with `localhost:5442` error**  
  - Update the worker/API `.env` files with the correct `DATABASE_URL` before starting.

- **Docker permission denied**  
  - Use remote Neon or local Postgres outside Docker (e.g. `brew services start postgresql`).

Document every recovery run in `DB_COMPLETION_REPORT.md` (NeonHub) or a new `agent-infra/DB_RECOVERY_LOG.md` so future audits know the exact state.
