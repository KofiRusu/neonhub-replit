# Performance Testing with k6

Two k6 suites live under `tests/perf/`:

| Script | Purpose | Default load |
| --- | --- | --- |
| `smoke-api.js` | Light-touch health/auth smoke covering health, jobs, billing, connectors, metrics. | 5 VUs, 2 minutes |
| `stress-core-flows.js` | Multi-agent flow (campaign creation → email sequence → social schedule → analytics) under ramped load. | 5 → 15 VUs (4 minutes) |

## Environment variables

Set via shell or `.env` before running:

| Variable | Description | Default |
| --- | --- | --- |
| `API_BASE_URL` | Base URL of Express API (e.g., `http://localhost:3001/api`). | `http://localhost:3001/api` |
| `AUTH_BASE_URL` | Auth server hosting `api/auth/callback/credentials`. | `http://localhost:3000` |
| `API_EMAIL` / `API_PASSWORD` | Credentials for login (used if `API_BEARER_TOKEN` not provided). | `test@neonhub.local` / `TestPassword123!` |
| `API_BEARER_TOKEN` | Optional static token. If provided, login step is skipped. | unset |
| `K6_VUS`, `K6_DURATION` | Override smoke test load. | `5`, `2m` |
| `K6_STAGE_VUS_STAGE1`, `K6_STAGE_VUS_STAGE2` | Override stress ramp targets. | `5`, `15` |

> **Note:** For CI runs where the Next.js auth stack is unavailable, inject a service token via `API_BEARER_TOKEN`.

## Commands

```bash
# Smoke test (health/Auth/Billing/Connectors/Metrics)
k6 run tests/perf/smoke-api.js \
  -e API_BASE_URL=http://localhost:3001/api \
  -e AUTH_BASE_URL=http://localhost:3000 \
  -e API_EMAIL=test@neonhub.local \
  -e API_PASSWORD=TestPassword123!

# Stress core multi-agent flow
k6 run tests/perf/stress-core-flows.js \
  -e API_BASE_URL=http://localhost:3001/api \
  -e AUTH_BASE_URL=http://localhost:3000 \
  -e API_EMAIL=test@neonhub.local \
  -e API_PASSWORD=TestPassword123!
```

Artifacts (`./results/*.json`) can be uploaded via `k6 run --summary-export`.

## CI integration

- **smoke**: Runs on every push/PR in `.github/workflows/api-testing.yml` (`perf-smoke` job). Fails pipeline if any check drops below thresholds.
- **stress**: Manual trigger only via `workflow_dispatch` (`perf-stress` job) to avoid thrashing staging.

Both jobs require a bearer token stored in `secrets.API_TEST_TOKEN` (or run concurrently with the NextAuth front-end).
