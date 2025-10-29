# Learning Loop Report — 2025-10-27

- **AdaptiveAgent dimension:** 1,536 (see `modules/predictive-engine/src/memory/PgVectorStore.ts` — constructor defaults to 1536 and normalizes vectors to that length).
- **Top-k recall defaults:** 5 (see `apps/api/src/services/learning/index.ts` → `recall(agent, query, k = 5)`).
- **Pipeline wiring:** `learnFrom(FeedbackEvent)` and `recall(...)` invoke `getPredictiveEngine()`, expecting the engine to expose `learn()`/`recall()` methods. `NeonHubPredictiveEngine` (`modules/predictive-engine/src/index.ts`) instantiates `PredictiveEngine` and `AdaptiveAgent` but does **not** create or expose any memory store API, so these calls no-op.
- **Persistence gaps:** `PgVectorStore` exists (writes to `agent_memories` via Prisma raw SQL) but is never instantiated in production code. No Prisma client is passed into `NeonHubPredictiveEngine`, and no `AgentMemory` repository lives under `apps/api/src/services`.
- **Telemetry:** `AdaptiveAgent` uses in-memory Q-table only. Reward updates (`updateQValue`) are unsurfaced; no metrics written to `AgentRunMetric` or `AgentMetric`.
- **Latency & query plans:** None captured; orchestrator stub never records duration, so no plan/cost data exists.

**Conclusion:** Learning loop is currently non-functional. Feedback events are accepted but discarded, vector memory isn’t populated, and adaptive metrics aren't persisted. Requires wiring `NeonHubPredictiveEngine` to `PgVectorStore`, exposing `learn/recall`, and integrating with Prisma via `AgentRun` analytics.
