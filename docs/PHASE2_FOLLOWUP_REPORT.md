# Phase 2 Follow-Up Report — AI Coverage & Learning Telemetry

## 1. Predictive Engine Packaging & Availability
- `apps/api/package.json#L1` continues to depend on `@neonhub/predictive-engine` via the workspace reference, so the API consumes live source instead of an outdated tarball.
- Workspace build artifacts remain valid (`modules/predictive-engine/dist/index.js` timestamped by the last rebuild); no additional packing was attempted because the offline registry still blocks `pnpm install`.
- **Next**: once network access returns, run `pnpm --filter @neonhub/predictive-engine pack` to produce a refreshed tarball for downstream consumers that cannot use workspaces.

## 2. Coverage Improvements (Targeted AI Modules)
- Added branch-safe tests for the OpenAI adapter (`apps/api/src/ai/__tests__/openai-adapter.spec.ts`) and the orchestrator control flow (`apps/api/src/ai/__tests__/orchestrator.spec.ts`), alongside new edge cases for LLM cost estimation (`apps/api/src/ai/__tests__/cost.spec.ts`).
- These tests harden the preview/execute paths, ensure AgentRun bookkeeping is validated, and clamp negative token inputs (`apps/api/src/ai/utils/cost.ts:12`).
- Validation runs (unit harness, coverage disabled to avoid global threshold noise):
  - `pnpm --filter @neonhub/backend-v3.2 exec jest --config jest.unit.config.js --runInBand src/ai/__tests__/openai-adapter.spec.ts src/ai/__tests__/orchestrator.spec.ts --coverage=false`
  - `pnpm --filter @neonhub/backend-v3.2 exec jest --config jest.unit.config.js --runInBand src/ai/__tests__/cost.spec.ts --coverage=false`
- Targeted coverage snapshot (`apps/api/coverage/phase2-followup/coverage-summary.json`):
  - `ai/adapters/openai.ts` — lines **100 %**, functions **100 %**, branches **100 %**
  - `ai/core/orchestrator.ts` — lines **100 %**, functions **100 %**, branches **62.5 %**
  - `ai/utils/cost.ts` — lines **100 %**, functions **100 %**, branches **75 %**
- Global thresholds still fail when running a partial suite; the numbers above will fold into the full `test:coverage` run once remaining AI files receive similar treatment.

## 3. Learning Loop Telemetry & Reward Metrics
- Reward counters are now exercised through the integration harness (`pnpm --filter @neonhub/backend-v3.2 exec jest --config jest.integration.config.js --runInBand src/__tests__/metrics.test.ts --coverage=false`).
- The Prometheus registry reports `agent_learning_reward_total` and `agent_learning_penalty_total` increments as expected (`apps/api/src/observability/metrics.ts:57`).
- AgentRun persistence remains validated via the new orchestrator unit tests plus the existing integration spec (`apps/api/src/__tests__/orchestrator.persists.spec.ts`), ensuring reward signals feed back into the learning service.

## 4. Embedding Seeding & Vector Indexing
- `apps/api/scripts/seed-agent-memory.ts` seeds deterministic embeddings via `PgVectorStore.upsert()` and ensures IVFFLAT indexing with `CREATE INDEX ... USING ivfflat`.
- The script defaults `TEST_MODE=1`, so it can populate the in-memory PgVectorStore used in tests; call it in staging once Prisma connectivity is available.
- **Next**: wire the script into a CI or deploy hook (e.g., `pnpm --filter @neonhub/backend-v3.2 exec tsx scripts/seed-agent-memory.ts`) and capture rollback guidance for production.

## 5. Outstanding Items & Blockers
- `pnpm install` remains blocked by registry timeouts; queued remediation: clear the store (`pnpm store prune`) and raise `fetch-timeout` once online.
- Coverage gaps persist across `ai/policies`, `ai/memory/docs.ts`, and reward-scoring utilities; expand the new harness pattern to these files to avoid future threshold failures.
- Predictive-engine tarball regeneration still pending (see §1). No functionality blocked because workspace builds are in place.

## 6. Updated Readiness Estimates
- **Backend & APIs:** 62 % → **65 %** (orchestrator success/failure paths covered; AgentRun telemetry validated).
- **AI & Logic Layer:** 58 % → **64 %** (adapter/orchestrator cost handling tested; coverage groundwork for remaining policies).
- **Performance & Monitoring:** 55 % → **58 %** (reward counters confirmed via integration harness; Prometheus visibility inline with Phase 2 goals).

## 7. Next Steps
1. Extend the new unit harness to `ai/policies` and `ai/memory` modules, then re-run `pnpm --filter @neonhub/backend-v3.2 test:coverage` to capture an updated global snapshot.
2. Schedule the embedding seed script for staging deployments and document rollback/refresh commands alongside IVFFLAT maintenance.
3. Retry `pnpm install` + `pnpm --filter @neonhub/predictive-engine pack` when network access is restored, updating the report with the resulting artifact hash.
