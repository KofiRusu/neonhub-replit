# CI Validation Report – 2025-11-22

## api-testing.yml
- **Triggers**: push/PR to `main` + `develop`, and nightly cron (02:00 UTC).
- **Services**: Postgres 16-alpine with health checks and exposed port 5432.
- **api-tests job**:
  - Sets up Node 20 + pnpm 9.12.2.
  - Runs `pnpm install`, `pnpm prisma:generate`, `pnpm prisma:migrate:deploy`, and seeds data.
  - Boots `apps/api` on port 3001, waits via curl loop, then invokes `pnpm test:api:newman`.
  - Publishes `reports/newman/newman-results.xml` as artifact + GitHub test report; posts PR comment on success.
- **perf-smoke job**:
  - Depends on `api-tests`; gated by `secrets.API_TEST_TOKEN`.
  - Repeats DB/API bootstrap sequence, installs k6 via `grafana/setup-k6-action@v0.5.0`, and runs `k6 run tests/perf/smoke-api.js` with env overrides.
  - Cleans API PID after run.

## perf-stress.yml
- Manual `workflow_dispatch` with VU overrides; also gated on `API_TEST_TOKEN`.
- Mirrors bootstrap steps from smoke job, then executes `k6 run tests/perf/stress-core-flows.js`.
- Ensures cleanup of `/tmp/api-perf.pid` even on failure.

## Notes / Recommendations
- Secrets required: `API_TEST_TOKEN` (+ optional `API_TEST_EMAIL`, `API_TEST_PASSWORD`). Without them, perf jobs are skipped safely.
- Both workflows rely on the NextAuth credential endpoint; if front-end not available, provide bearer token secrets.
- Consider uploading k6 summary artifacts (e.g., `--summary-export`) in a future iteration for historical tracking.
