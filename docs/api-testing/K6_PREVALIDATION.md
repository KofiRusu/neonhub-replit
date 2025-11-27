# k6 Prevalidation – 2025-11-22

## Smoke Suite (`tests/perf/smoke-api.js`)
- **Auth handling**: Prefers `API_BEARER_TOKEN`, otherwise logs in via `/api/auth/callback/credentials` using `API_EMAIL`/`API_PASSWORD`.
- **Configuration**: Defaults to 5 VUs / 2 minutes (`K6_VUS`, `K6_DURATION` overrides). Thresholds enforce `p95 < 800 ms` and `checks > 99%`.
- **Coverage**: Health, Readiness, Jobs, Billing Plan, Connectors inventory, Metrics scrape.
- **Headers**: Applies Bearer token only where required; health endpoints remain public.

## Stress Suite (`tests/perf/stress-core-flows.js`)
- **Stages**: Ramp from Stage1 → Stage2 → cooldown with env overrides `K6_STAGE_VUS_STAGE1` / `K6_STAGE_VUS_STAGE2`.
- **Flow**: Login → create campaign → generate email sequence → schedule social post → fetch analytics → delete campaign.
- **Data hygiene**: Uses timestamped campaign names and deletes each campaign at the end of the iteration.
- **Auth**: Same bearer-token fallback as smoke suite; `authParams` ensures JSON headers for POSTs.

## Static Validation
- Syntax checked with `cat <file> | node --input-type=module --check`.
- No syntax issues detected.

## Notes
- These scripts expect the NextAuth credential callback to be available; CI falling back to `API_BEARER_TOKEN` is documented in `docs/api-testing/PERF_TESTING_WITH_K6.md`.
- When running locally, ensure the API seeds fixture IDs referenced by Postman envs (campaign, sms). Scripts do not rely on those IDs; they create/delete their own data.
