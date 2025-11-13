# KT_DB_AGENT_AUDIT

## Executive Snapshot
| Area | Status | Evidence | Owner |
| --- | --- | --- | --- |
| Schema & migrations | ⚠️ Green-ish (validated locally, migrations blocked on DSN) | `KT_DB_SUMMARY.md`, `KT_SIGNALS.md` (P1001 on migrate status) | [Codex] once DSN provided |
| Vector readiness | ✅ pgvector + citext extensions enabled; IVFFLAT indexes created in `20240107_gpt5_merge_vector` | `apps/api/prisma/migrations/20240107000000_gpt5_merge_vector/migration.sql` | [Codex] |
| Seeds / fixtures | ✅ Org, personas, connectors, agents seeded idempotently | `apps/api/prisma/seed.ts` | [Codex] |
| Agent persistence | ✅ AgentRun + ToolExecution telemetry instrumented (AsyncLocalStorage + connector proxy) | `apps/api/src/agents/utils/agent-run.ts`, `apps/api/src/services/tool-execution.service.ts`, `apps/api/src/connectors/factory.ts` | [Codex] |
| Metrics & /metrics | ✅ prom-client registry + Express endpoint live | `apps/api/src/lib/metrics.ts`, `apps/api/src/server.ts:96-124` | [Codex] |
| Connectors / mocks | ✅ Factory + 17 mock providers, env flag enforced | `apps/api/src/connectors/factory.ts`, `apps/api/src/connectors/mock/index.ts` | [Codex] |
| Tests / CI | ⚠️ Targeted smoke command passes; full suite still blocked by quarantined specs & lockfile | `tests/orchestrate.mock.spec.ts`, `tests/queue.mock.spec.ts`, `KT_SIGNALS.md` | [Shared] |

---

## A. Database Deep Dive
1. **Model coverage** – 75 Prisma models grouped into identity, agent telemetry, vector/RAG, marketing, billing, and connectors (see `KT_DB_SUMMARY.md`). Every multi-tenant table carries composite uniqueness on `organizationId` to prevent cross-tenant bleed.
2. **Enums** – 17 enums enforce domain constraints (AgentKind, MessageRole, ConnectorKind, MarketingLeadStatus, etc.), reducing reliance on loose strings.
3. **Vector posture** – pgvector columns upgraded to `vector(1536)` with IVFFLAT indexes (brand voices, messages, chunks, agent_memories) and `lists=100`. Future scale-up should bump lists+`ANALYZE`. `citext` is used where case-insensitive uniqueness matters (`Keyword.term`).
4. **Seeds & referential health** – `apps/api/prisma/seed.ts` stitches baseline Org → Brand → Agent → Tool records, plus ~17 connectors and three personas/keywords so relational queries never return empty arrays in smoke tests.
5. **Gaps**
   - No reachable `DATABASE_URL` in this environment → `prisma migrate status` and `prisma migrate diff` blocked; `.tmp/db-drift.sql` absent by design.
   - `pnpm install --frozen-lockfile` fails because `pnpm-lock.yaml` doesn’t match `core/llm-adapter/package.json`. CI reproducibility depends on refreshing that lock or providing an offline store bundle.

## B. Agent Infrastructure
1. **Request pipeline** (`apps/api/src/services/orchestration/router.ts:74-210`)
   - Checks bootstrap guard (currently loads `AgentIntelligenceBus`), ensures auth + rate limit (60/min) + circuit breaker before invoking handlers.
   - Auto-creates `Agent` rows per `(org, name)` to maintain FK integrity.
   - Wraps execution with `executeAgentRun`, which now seeds AsyncLocalStorage context so downstream code knows the current run/agent/org/prisma instance.
2. **Persistence helpers**
   - `executeAgentRun` handles single-shot runs, logs, updates metrics, and now exposes its context via `getAgentRunContext()`.
   - `agent-run.service.ts` still provides `startRun/recordStep/finishRun` for orchestrated pipelines with hashed inputs, `run_step` rows, and final metrics.
3. **ToolExecution recording**
   - `apps/api/src/services/tool-execution.service.ts` + the connector proxy in `apps/api/src/connectors/factory.ts` automatically create/update `tool_executions` rows and Prometheus metrics for every connector interaction (mock or real).
   - The Prisma mock gains `tool` + `toolExecution.update` so integration/unit tests stay deterministic.
4. **Connectors**
   - `ConnectorFactory` + `apps/api/src/connectors/mock/index.ts` keep CI/test in mock mode (`USE_MOCK_CONNECTORS=true`). Real connectors still throw because secrets are intentionally absent in this air-gapped environment.
   - Seeded catalog (Gmail, Outlook, Twilio, Slack, Stripe, Shopify, TikTok, etc.) ensures admin UI surfaces always have metadata to display.
5. **Metrics**
   - `apps/api/src/lib/metrics.ts` now tracks agent, tool, queue, circuit breaker, HTTP, DB, and connector metrics. `/metrics` route returns plain text for Prometheus scrapes (Ops must add scrape config).
6. **Queues & jobs**
   - 12 BullMQ queues exist; instrumentation wraps `add/completed/failed` to keep counters in sync.
   - No worker fleet yet (only `startSeoAnalyticsJob` cron). `tests/queue.mock.spec.ts` uses a virtual BullMQ mock to prove instrumentation works without Redis.

## C. Tests, Automation, Operational Evidence
1. **Signals**
   - `KT_SIGNALS.md` captures command status: Prisma validate ✅, migrate status ❌ (missing DSN), GitHub CLI ❌ (network). Jest full run still blocked, but the targeted smoke command now passes (see section below).
2. **New smoke**
   - `tests/orchestrate.mock.spec.ts` + `tests/queue.mock.spec.ts` validate AgentRun + ToolExecution + queue telemetry using mocks only.
   - Command: `USE_MOCK_CONNECTORS=true pnpm --filter @neonhub/backend-v3.2 test -- tests/orchestrate.mock.spec.ts tests/queue.mock.spec.ts --runInBand --coverage=false`.
   - Remaining failures stem from quarantined suites (`keyword-research`, `setup-integration`) and the stale lockfile; both are documented in `KT_SIGNALS.md`.
3. **CI**
   - `.github/workflows/db-*.yml` cover drift, backup, deploy, but rely on secrets and working pnpm lockfiles. `KT_CI_SUMMARY.md` + `ci/db-deploy.hardening.md` outline improvements (PGOPTIONS, retries, seed gating).

## D. Action Plan (condensed)
| Task | Blocker removed | Owner |
| --- | --- | --- |
| Refresh pnpm lockfile / offline store | Enables `pnpm install --frozen-lockfile` in CI + workflows | [Codex] |
| Provide read-only/migrate DSNs + run drift workflows | Unblocks `prisma migrate status/diff` + `.tmp/db-drift.sql` generation | [Agency] |
| Keep quarantined Jest suites isolated or fix them | Ensures smoke command keeps running until legacy specs are rewritten | [Codex] |
| Wire Prometheus scrape + alerting | `/metrics` works locally; Ops still need scrape config and dashboards | [Agency] |
| Roll out least-privilege roles | Create `neonhub_app`, `neonhub_migrate`, `neonhub_readonly` creds in Neon + GitHub secrets | [Shared] (Codex supplies SQL/docs, Agency executes) |

Once these items are addressed, the outsource agency only needs <5 hours to plug in secrets, run `db-drift-check → db-deploy → security-preflight`, and sign off on the KT bundle.
