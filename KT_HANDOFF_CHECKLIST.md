# KT_HANDOFF_CHECKLIST (≤30 min, mocks only)

1. **Prep environment (5 min)**
   ```bash
   cd /path/to/NeonHub
   export USE_MOCK_CONNECTORS=true
   export NODE_ENV=test
   export DATABASE_URL=postgresql://****:****@localhost:5432/neonhub_mock
   export DIRECT_DATABASE_URL=$DATABASE_URL
   corepack enable || true
   pnpm -v
   pnpm install --no-frozen-lockfile  # ok to use cached node_modules if offline
   ```

2. **Schema sanity (3 min)**
   ```bash
   cd apps/api
   node ../../scripts/run-cli.mjs prisma validate --schema prisma/schema.prisma
   ```
   - Expect `The schema ... is valid`. If DSN unavailable, skip migrate status and note `P1001` in handoff log.

3. **Mock orchestrator + queue smoke (7 min)**
   ```bash
   cd /path/to/NeonHub
   USE_MOCK_CONNECTORS=true pnpm --filter @neonhub/backend-v3.2 test -- \
     tests/orchestrate.mock.spec.ts tests/queue.mock.spec.ts \
     --runInBand --coverage=false || true
   ```
   - PASS: output shows completed AgentRun + ToolExecution records plus queue telemetry counters.
   - FAIL because of legacy suites? The only expected skips are the quarantined `keyword-research` / `setup-integration` specs—log any other offender in `KT_SIGNALS.md`.

4. **/metrics probe + ops reminder (5 min)**
   ```bash
   cd apps/api
   pnpm dev &  # or pnpm --filter @neonhub/backend-v3.2 run dev
   sleep 10
   curl -s localhost:3001/metrics | egrep 'neonhub_agent_runs|neonhub_tool_executions|neonhub_queue_jobs' | head -10
   ```
   - Confirm response includes `neonhub_` prefixed metrics (agent runs, tool executions, queue jobs). Stop dev server afterwards and hand the scrape URL to Ops so Prometheus can ingest it.

5. **Workflow spot-check (5 min)**
   ```bash
   rg -n "db-deploy" -C3 .github/workflows/db-deploy.yml
   rg -n "PGOPTIONS" .github/workflows/db-deploy.yml
   ```
   - Ensure PG options + retry + seed gating match `ci/db-deploy.hardening.md`.

6. **Security checklist (3 min)**
   - Verify `docs/security/LEAST_PRIVILEGE_ROLES.md` matches Neon console roles.
   - Confirm GitHub environment secrets use the new names: `DATABASE_URL_APP` (`neonhub_app`) and `DATABASE_URL_MIGRATE` (`neonhub_migrate`).

7. **Archive artifacts (2 min)**
   - Update `KT_SIGNALS.md` with PASS/FAIL notes (esp. if migrate/test steps blocked).
   - Run `git status` to ensure only approved KT files are staged before packaging.

---

### Agency-only actions (≤ 5 hrs)
1. **Provide DSNs** – populate `DATABASE_URL_APP` and `DATABASE_URL_MIGRATE` secrets (redacted) so `db-drift-check` and `db-deploy` workflows can reach Neon.
2. **Run Actions chain** – once secrets land, trigger GitHub Actions: `db-drift-check` → `db-deploy` → `security-preflight`, confirm `.tmp/db-drift.sql` artifact uploaded.
3. **Roll out least-privilege roles** – create `neonhub_app`, `neonhub_migrate`, `neonhub_readonly` in Neon per `docs/security/LEAST_PRIVILEGE_ROLES.md`, rotate GitHub secrets accordingly.
4. **Wire Prometheus scrape** – add `/metrics` target to Prometheus/Grafana (or Datadog) so `neonhub_*` counters feed dashboards/alerts before production sign-off.

> If any of the Agency steps require clarification, reference `KT_TASKS_BREAKDOWN.csv` (owners & acceptance) or ping Codex before proceeding.
