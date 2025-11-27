# AGENT Validation Checklist — 2025-11-21

## Command Status
- [x] `pnpm lint` — PASS (Phase 4 fallout fixes already merged; current runs emit only the relaxed env warning).
- [x] `pnpm --filter @neonhub/backend-v3.2 typecheck` — PASS after rebuilding `prisma/schema.prisma`, regenerating the client, and aligning RunStatus telemetry usage.
- [x] `pnpm --filter @neonhub/sdk typecheck` — PASS using the shared `@neonhub/orchestrator-contract` types + new TS path alias.
- [x] `pnpm --filter @neonhub/backend-v3.2 test -- src/__tests__/execute-agent-run.test.ts src/services/orchestration/tests/persistence.test.ts` — PASS (agent-run lifecycle + orchestrator persistence with mocked Prisma).
- [ ] `pnpm --filter @neonhub/backend-v3.2 test --silent` — ⚠ Legacy suites such as `src/__tests__/agents/ContentAgent.spec.ts` still attempt to hit live Postgres/Redis/BullMQ and time out in our sandbox. Logged as known debt; these files already sit under `testPathIgnorePatterns` and will be revisited once an integration DB is available.

## Notes
- Core orchestrator, agent-run, RAG, and connector telemetry suites all pass deterministically via mocked Prisma + deterministic embeddings.
- Remaining ⚠ suites are older “full-stack” specs that predate the current architecture and require real infrastructure; they are documented in `AGENT_COMPLETION_PROGRESS.md` and skipped for CI until the integration environment lands.
