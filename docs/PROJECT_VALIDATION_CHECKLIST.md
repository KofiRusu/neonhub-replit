# Project Validation Checklist — 2025-11-20

## Repo Health
- [x] `docs/CODEX_COORDINATION_LOG.md` reflects Phase 0–3 guardian work (latest at 02:53Z).
- [x] `docs/DEV_WORKFLOW_GUIDE.md` published with canonical lint/typecheck/test commands and guardian-specific suites.
- [x] Guardian-owned Jest suites (`src/__tests__/config/env.test.ts`, `src/__tests__/services/brand-voice-ingestion.spec.ts`) pass via `pnpm --filter @neonhub/backend-v3.2 test -- …`.
- [ ] `pnpm lint` — fails in agent + connector files owned by the primary Codex.
- [ ] `pnpm typecheck` — fails in predictive-engine seed script, TensorFlow/Puppeteer mocks, orchestrator persistence tests, and SDK/TRPC contract duplication.
- [ ] `pnpm --filter ./apps/api test` — fails because `src/services/orchestration/tests/router.test.ts` still expects the old payload shape (full suite cannot complete until primary closes Phase 4/5).

## CI / Scripts
- [x] `.github/workflows/db-deploy.yml` updated to use `pnpm --filter ./apps/api …` so Prisma steps no longer hit “No projects matched the filters”.
- [x] Documented the filter nuance in `docs/DEV_WORKFLOW_GUIDE.md` so contributors call the correct workspace.
- [ ] Awaiting confirmation from primary Codex on orchestrator router + SDK changes before enabling repo-level green builds.

## How to Run Tests
- **API full run:** `pnpm --filter ./apps/api test` (expected to fail until Codex-1 finishes aligning response envelopes).
- **Guardian subset:** `pnpm --filter @neonhub/backend-v3.2 test -- src/__tests__/config/env.test.ts src/__tests__/services/brand-voice-ingestion.spec.ts`.
- **CI parity:** Mirror `pnpm lint` and `pnpm typecheck` locally before pushing; capture failures with file + line references in `docs/CODEX_COORDINATION_LOG.md`.
- **Non-agent utilities:** Targeted runs like `pnpm --filter @neonhub/backend-v3.2 test -- src/__tests__/metrics.test.ts` keep helper coverage moving without touching orchestrator logic.

## How to Debug
- **Envelope mismatches:** Compare Jest snapshots from `src/services/orchestration/tests/router.test.ts` to the schema defined in `@neonhub/orchestrator-contract`; note differences instead of patching until Codex-1 lands Phase 4 changes.
- **Type drift:** When `pnpm typecheck` complains about predictive-engine exports or SDK duplicates, record the stack trace and module path rather than editing the contracts.
- **Workflow hiccups:** If GitHub Actions fail on Prisma commands, verify the job is using the path-based filter (`pnpm --filter ./apps/api …`) added in `db-deploy.yml`.
- **RAG context issues:** Use the instructions in `docs/DEV_WORKFLOW_GUIDE.md#How-to-Debug` to trace memory ingestion before escalating to Codex-1.
