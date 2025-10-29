# Orchestrator Audit — 2025-10-27

## Current Flow (code references)
- `apps/api/src/services/orchestration/index.ts`: exposes `orchestrate`, `initializeOrchestrator`, `registerNode`, `discoverNodes`, etc. Most functions are stubs that log and return canned responses; none write to the database.
- `router.ts`: implements request routing with rate-limit + retry + circuit breaker layers, calling `registry.ts` to find agent handlers. Successful responses are returned directly without persistence.
- `registry.ts`: in-memory map of handlers with no backing store; lost on process restart.
- `bootstrap.ts`: lazily instantiates `AgentIntelligenceBus` from `core/aib/index.ts`, but does not preload agents or hydrate state.
- `policies.ts`: provides reusable retry/circuit wrappers only.

## Persistence Gaps
- `AgentRun`, `AgentRunMetric`, and `ToolExecution` models defined in `apps/api/prisma/schema.prisma` are never touched by orchestration code. Existing agents still rely on the legacy `AgentJob` table (see `apps/api/src/agents/base/AgentJobManager.ts`).
- `orchestrate()` does not create an `AgentRun` record before dispatch, nor does it update status/metrics after completion or failure.
- Tool executions triggered by agents (e.g., connectors) are not recorded in `ToolExecution`.

## Control Plane Gaps
- No global registry of agent metadata (`AgentDefinition`) is used to auto-register handlers; registration is manual and scattered.
- `routeRequest`, `getSystemHealth`, `evaluateScaling`, `executeFailover`, `getOrchestrationMetrics`, `updateConfiguration`, and `shutdownOrchestrator` all return static data; they do not integrate with queues, metrics, or persistence.
- There is no linkage between `AgentIntelligenceBus` events and the orchestrator API. Agent broadcasts are not surfaced to `/api/orchestration/*` routes.

## Required Remediation
1. Implement `orchestrate()` to:
   - Create an `AgentRun` row with contextual metadata (agent, intent, dataset, user/org).
   - Invoke the agent via the registry and record duration/outcome.
   - Persist `AgentRunMetric` entries for latency, retries, vector recalls, etc.
   - Upsert `ToolExecution` rows for any downstream connector usage (interface required from agents).
2. Replace stubbed node management methods with actual persistence (e.g., `orchestrator_nodes` table) or remove unsupported endpoints.
3. Tie `AgentIntelligenceBus` registrations into the orchestrator bootstrap and ensure graceful shutdown unregisters agents.
4. Store orchestrator state / circuit status in Redis or Prisma for multi-instance resilience.
