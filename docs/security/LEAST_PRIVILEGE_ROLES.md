# Least-Privilege Role Plan (Postgres 16 + pgvector)

> Never paste real DSNs here. Always redact as `postgresql://****:****@host:5432/db`.

## Roles & Privileges
```sql
-- Migration / schema owner role
CREATE ROLE neonhub_migrate LOGIN PASSWORD '****';
GRANT USAGE ON SCHEMA public TO neonhub_migrate;
GRANT CREATE ON SCHEMA public TO neonhub_migrate;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neonhub_migrate;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neonhub_migrate;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO neonhub_migrate;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO neonhub_migrate;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO neonhub_migrate;

-- Application role (DML only)
CREATE ROLE neonhub_app LOGIN PASSWORD '****';
GRANT USAGE ON SCHEMA public TO neonhub_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO neonhub_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO neonhub_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO neonhub_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO neonhub_app;
GRANT EXECUTE ON FUNCTION vector_cosine(vector, vector) TO neonhub_app;

-- Read-only analytics role
CREATE ROLE neonhub_readonly LOGIN PASSWORD '****';
GRANT USAGE ON SCHEMA public TO neonhub_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO neonhub_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO neonhub_readonly;
```

## Secret Mapping
| Secret name | Role | Used by | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | `neonhub_app` | API runtime, BullMQ workers, Playwright smoke tests | include `?sslmode=require` for Neon |
| `DIRECT_DATABASE_URL` | `neonhub_migrate` | Prisma migrate deploy + drift workflows | Must point at writer endpoint; keep out of app pods |
| `READONLY_DATABASE_URL` | `neonhub_readonly` | /metrics exporters, ad-hoc reporting | Optional but recommended so Grafana/Prometheus cannot mutate data |

## Rotation Procedure
1. Generate new random passwords in Neon console (or `ALTER ROLE ... PASSWORD`).
2. Update GitHub environment secrets + deployment platform secrets atomically.
3. Run `pnpm --filter @neonhub/backend-v3.2 exec prisma migrate status` using the new `DIRECT_DATABASE_URL` to confirm connectivity.
4. Delete old credentials from Neon history once all services deploy successfully.

## Compliance Notes
- Prisma `.env` files should never store the migration DSN; only the CI system or `pnpm db:migrate` should see it.
- When running `db-drift-check.yml`, set `READONLY_DATABASE_URL` instead of full `DATABASE_URL` if only schema diff is required.
- Document destructive changes in `MIGRATION_RISK.md` and link them in PR descriptions so Agency approvers know when to block deploys.
