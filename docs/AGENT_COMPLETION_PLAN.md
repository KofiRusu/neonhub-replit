# Agent Completion Plan – NeonHub

## Overview
This plan operationalizes the audit by addressing concrete gaps only, keeping every existing module intact (NO rewrite). Work is grouped by layer with prioritized tasks, affected files, dependencies, and done criteria.

---

## A. Agents

### 1. Register existing production agents with orchestrator
- **Files**: `apps/api/src/services/orchestration/registry.ts`, `apps/api/src/server.ts`, individual agent entrypoints.
- **Dependencies**: Router exposure (see Orchestrator section).
- **Done**: All orchestrator-ready agents (Content, SEO, Email, Social, Support) call `registerAgent(...)` during bootstrap and appear in `listAgents()`.

### 2. Unify partial agents with orchestrator contracts

| Agent | Tasks | Files | Dependencies | Done Criteria |
| --- | --- | --- | --- | --- |
| AdAgent | Wrap generation/optimization calls in safe `generate` helper, add `handle` with intents, reuse shared OpenAI adapter | `apps/api/src/agents/AdAgent.ts`, `apps/api/src/ai/openai.ts` | Registry task above | AdAgent responds to `generate-ad` / `optimize-ad`, logs via `executeAgentRun` |
| CampaignAgent | Expose intents (create/schedule/ab-test/optimize) via `handle`, integrate `executeAgentRun`, ensure `agentJobManager` success/failure propagate | `apps/api/src/agents/CampaignAgent.ts` | Prisma + Email/Social dependencies | Orchestrator can call CampaignAgent; job + AgentRun IDs recorded |
| DesignAgent | Route to standardized OpenAI adapter, provide handle for `design-brief` & `image-variant`, mitigate console logging | `apps/api/src/agents/DesignAgent.ts` | OpenAI adapter | Both intents succeed/fail with AgentRun + logger metrics |
| InsightAgent | Guard OpenAI usage, add typed inputs, implement `handle` for `analyze-data`/`predict-trends` | `apps/api/src/agents/InsightAgent.ts` | None | Returns deterministic fallbacks, recorded via `executeAgentRun` |
| TrendAgent | Provide orchestrator handle for `discover-trends`/`subscribe`, ensure fallback data uses `makeTrend` helper | `apps/api/src/agents/TrendAgent.ts` | `lib/socialApiClient.ts` | Trend agent accessible from orchestrator |
| SMS & SocialMessaging | Surface intents for send + inbound (if synchronous), attach to orchestrator for automation flows | `apps/api/src/agents/SMSAgent.ts`, `apps/api/src/agents/SocialMessagingAgent.ts` | Consent + EventIntake logic | Telemetry emitted when orchestrator triggers SMS/DM |
| BrandVoiceAgent / AgentIntelligenceBus | Implement registration bootstrap tying bus to orchestrator. For now expose monitoring hooks rather than rewriting bus. | `apps/api/src/services/orchestration/bootstrap.ts`, `apps/api/src/agents/BrandVoiceAgent.ts` | Orchestrator bootstrap | `ensureOrchestratorBootstrap` registers bus listeners exactly once |

### 3. Input/Output validation cleanup
- **Files**: Shared Zod schemas `apps/api/src/agents/_shared/normalize.ts`, per-agent schema definitions.
- **Task**: Ensure new intents have matching Zod parsing and reuse existing `normalizeAgentInput`.
- **Done**: All orchestrator agents parse payloads with helpful error codes and reuse `invalidInput` helper.

---

## B. Orchestrator & Routing

### 1. Expose `/api/orchestrate`
- **Files**: `apps/api/src/server.ts`, `apps/api/src/routes/orchestrate.ts`.
- **Task**: Mount `orchestrateRouter` under `/api`, ensure auth + audit middleware align with plan.
- **Done**: POST `/api/orchestrate` works in local dev + tests.

### 2. Auto-register agents + bootstrap bus
- **Files**: `apps/api/src/services/orchestration/bootstrap.ts`, `apps/api/src/server.ts`, new `apps/api/src/services/orchestration/registry.seed.ts` (optional helper).
- **Task**: During server startup, ensure all orchestrator-compliant agents call `registerAgent`. Optionally provide helper that accepts `{ agentName, handler }`.
- **Done**: `listAgents()` returns entries; router no longer returns `AGENT_NOT_REGISTERED`.

### 3. Verify circuit breaker/rate limiter per agent
- **Files**: `apps/api/src/services/orchestration/router.ts`.
- **Tasks**:
  - Ensure `circuitMap`/`rateState` seeded lazily per agent and cleared on shutdown for tests.
  - Add instrumentation to `startSpan` to include agent metadata.
- **Done**: Rate limit + circuit breaker metrics record agent labels; tests assert open-circuit path.

### 4. Smoke test for routing + persistence
- **Files**: `apps/api/src/services/orchestration/tests/router.test.ts`, new integration spec hitting `/api/orchestrate`.
- **Done**: Jest test registers a mock agent via helper, sends request through router REST endpoint, validates AgentRun row created.

---

## C. RAG / Memory & Knowledge

### 1. Wire `core/memory-rag` stores
- **Files**: `core/memory-rag/src/conversation-store.ts`, `kb-store.ts`, `profile-store.ts`.
- **Tasks**:
  - Replace commented Prisma writes with guarded implementations calling shared Prisma client (injected).
  - Export factories to reuse existing `prisma` instance from API.
- **Dependencies**: No new DB tables (rely on `mem_embeddings`, `brand_voices`, `profile_memory`).
- **Done**: Each store’s methods persist/read data without TODO comments; TypeScript builds.

### 2. Standardize embedding generation
- **Files**: `apps/api/src/services/brand-voice-ingestion.ts`, `apps/api/src/services/event-intake.service.ts`, `core/memory-rag/src/embed.ts`.
- **Task**: Route all embeddings through shared helper (`createEmbeddingsProvider` or wrapper) for deterministic tests; reuse caching where possible.
- **Done**: Tests can stub embedding provider; no direct `openai.embeddings` call without abstraction.

### 3. Deterministic RAG tests
- **Files**: `core/memory-rag/src/__tests__` (new), `apps/api/src/services/__tests__/brand-voice-ingestion.spec.ts`.
- **Task**: Add fixture-based tests that insert mock documents and assert `retrieve` returns sorted scores.
- **Done**: Jest suite seeds temporary data via Prisma and passes offline.

---

## D. Connectors & Tools

### 1. Make ConnectorFactory env-aware
- **Files**: `apps/api/src/connectors/factory.ts`, `.env` docs.
- **Task**: Support `USE_MOCK_CONNECTORS` + `FORCE_MOCK_CONNECTORS` to toggle; when real mode, instantiate existing service connectors (SlackConnector, GmailConnector, SMSConnector). Provide helpful error if credentials missing.
- **Done**: Factory returns working connector in real mode provided env creds; tests cover both branches.

### 2. OAuth PKCE + metadata handling
- **Files**: `apps/api/src/connectors/auth/OAuth2Provider.ts`.
- **Task**: Implement optional PKCE (verifier storage via short-lived in-memory map) and ensure state validation to mitigate CSRF.
- **Done**: OAuth flows pass security review; warnings removed from audit.

### 3. Connector execution telemetry
- **Files**: `apps/api/src/connectors/execution/ActionHandler.ts`, `apps/api/src/services/tool-execution.service.ts`.
- **Task**: Ensure every action/trigger call goes through `recordToolExecution` (wrap where missing), add error handling for `ToolExecution`.
- **Done**: Tool executions appear in metrics with connector label.

### 4. Complete missing connectors/tool definitions
- **Files**: service connectors lacking functionality (e.g., `GoogleSearchConsoleConnector`, `RedditConnector`, `SlackConnector` triggers).
- **Task**: Verify each connector listed in registry has at least one actionable action/trigger and typed schema.
- **Done**: `connectorRegistry.list()` returns only connectors with implementations; docs updated.

---

## E. Telemetry, Metrics & Safety

### 1. Align agent logging
- **Files**: `apps/api/src/agents/**/*.ts`, `apps/api/src/lib/logger.ts`.
- **Task**: Replace `console.*` (AdAgent, DesignAgent, InsightAgent) with sanitized logger calls; ensure errors include agent + intent metadata.
- **Done**: `rg console` over agents returns zero results.

### 2. Consolidate Prometheus exports
- **Files**: `apps/api/src/lib/metrics.ts`, `apps/api/src/observability/metrics.ts`.
- **Task**: Pick one metrics module (lib) as source of truth, re-export from observability wrapper to avoid drift. Remove duplicate counters.
- **Done**: `/metrics` shows single naming scheme; unused module deprecated or proxied.

### 3. Per-agent success/failure metrics
- **Files**: `executeAgentRun`, `apps/api/src/services/orchestration/router.ts`.
- **Task**: Ensure `recordAgentRun` called with per-agent labels, add histograms for `intent`.
- **Done**: Observing metrics shows per-agent counts increment after sample run.

### 4. Guardrails integration
- **Files**: `BrandVoiceService.compose`, `EmailAgent`, `SMSAgent`, `SocialMessagingAgent`.
- **Task**: Optionally run guardrail checks (tone + safety) before sending, log violations.
- **Done**: Compose results include guardrail metadata; senders skip/flag content when unsafe.

---

## F. SDK / Frontend Alignment

### 1. Update SDK base URL defaults
- **Files**: `core/sdk/src/index.ts`, docs.
- **Task**: Default to `http://localhost:3001` (Express) and allow overriding via `NEXT_PUBLIC_NH_API_URL`.
- **Done**: CLI example hits correct API out-of-box (no 404).

### 2. Mock transport flagging
- **Files**: `apps/web/src/providers/Providers.tsx`, `.env.example`.
- **Task**: Document `NEXT_PUBLIC_NH_USE_MOCKS=false` to enable real transport; optionally auto-detect.
- **Done**: Running web with env var uses real API; plan documents steps.

### 3. TRPC router exposure
- **Files**: `apps/api/src/server.ts`, `apps/api/src/trpc` folder.
- **Task**: Mount `appRouter` via `trpcExpress.createExpressMiddleware` under `/trpc`.
- **Done**: Frontend TRPC client communicates with backend router without mocks.

---

## NO REWRITE POLICY
This plan strictly extends the existing architecture:
- Agents keep their current files and semantics; we only add orchestrator handles, logging, and telemetry wrappers.
- Orchestrator router/policies remain intact; we expose the existing `/orchestrate` route instead of replacing router logic.
- RAG/memory enhancements reuse current Prisma tables and `core/memory-rag` package; no new storage layers.
- Connector improvements reuse the existing class-based registry; we simply toggle between mock/real paths and fill in missing logic.
- Telemetry consolidates existing metrics modules rather than introducing new observability stacks.
- SDK/frontend changes align URLs and transports without swapping frameworks.

By iteratively layering these fixes, we reach production readiness while keeping the codebase recognizable to current contributors.
