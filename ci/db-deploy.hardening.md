# DB Deploy Hardening Notes

## Goals
1. Keep `pnpm` + Node setup deterministic even in air-gapped runners.
2. Prevent transient Neon/Postgres timeouts from failing the workflow.
3. Make seeding an explicit opt-in (off by default in production).
4. Capture drift evidence + MIGRATION_RISK context whenever schema changes are destructive.

## Recommended Steps
- **Install order**
  ```yaml
  - uses: pnpm/action-setup@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 20
      cache: pnpm
  - run: corepack enable && corepack prepare pnpm@9 --activate
  ```
- **Database safety**
  ```yaml
  - name: Set PG options
    run: echo "PGOPTIONS='-c lock_timeout=120000 -c statement_timeout=600000'" >> $GITHUB_ENV
  - name: Verify connectivity
    run: pnpm --filter apps/api prisma validate
  ```
- **Retry migrate deploy**
  ```yaml
  - name: Apply migrations with retry
    run: |
      n=0; until [ $n -ge 3 ]; do
        pnpm --filter apps/api prisma migrate deploy && break
        n=$((n+1)); echo "retry $n/3..."; sleep $((15*n))
      done
      if [ $n -ge 3 ]; then exit 1; fi
  ```
- **Seed gating** – default `RUN_SEED` input to `false`. Only allow seeding when targeting staging:
  ```yaml
  - name: Seed database (manual opt-in)
    if: ${{ github.event.inputs.RUN_SEED == 'true' }}
    run: |
      n=0; until [ $n -ge 3 ]; do
        pnpm --filter apps/api prisma db seed && break
        n=$((n+1)); echo "seed retry $n/3..."; sleep $((10*n))
      done
      if [ $n -ge 3 ]; then exit 1; fi
  ```
- **Drift artifact** – after every deploy, upload `prisma migrate status` output so operators can reconcile environments.
- **MIGRATION_RISK** – require PR authors to include/ update `MIGRATION_RISK.md` whenever:
  - A table/column/index is dropped or renamed.
  - Backfills require manual coordination.
  - Feature flags gate destructive changes.

## Checklist Before Shipping
- [ ] Lockfile refreshed (`pnpm install --frozen-lockfile` succeeds locally).
- [ ] `DATABASE_URL_APP` & `DATABASE_URL_MIGRATE` secrets tested via `pnpm --filter @neonhub/backend-v3.2 run prisma:validate` + `prisma migrate status`.
- [ ] Slack/Webhook notifications redacted (no credentials echoed).
- [ ] `.tmp/db-drift.sql` reviewed/attached when drift detected.
