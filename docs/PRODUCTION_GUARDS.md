# Production Guards
- **Preflight**: `node --env-file=.env scripts/preflight.mjs` (fails if any required secret is missing).
- **Runtime (global)**: `apps/api/src/server/bootstrap.ts` — call `runBootstrapGuards()` at server start (prod, mocks OFF).
- **Routes**: Sensitive endpoints may import and call the guard at top (e.g., webhooks, internal callbacks).
- **Mocks**: Keep `USE_MOCK_ADAPTERS=true` until preflight is green; flip to `false` only after secrets are set.
