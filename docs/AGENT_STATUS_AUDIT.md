# Agent Status Audit – NeonHub

## Summary
- Only five production agents (Content, SEO, Email, Social, Support) expose orchestrator-compliant `handle` methods and flow through `executeAgentRun`; `/orchestrate` is never mounted and the in-memory registry is never populated, so router-level orchestration is effectively disabled (`apps/api/src/services/orchestration/index.ts:10-105`, `apps/api/src/server.ts:129-160`).
- Most secondary agents (Ad, Campaign, Design, Insight, Trend, SMS, SocialMessaging, BrandVoice) remain standalone utilities invoked via bespoke REST handlers; they bypass rate limiting, retries, and telemetry and often talk to OpenAI directly with mock keys.
- RAG/memory is split between the pragmatic brand-voice ingestion + `mem_embeddings` tables and an unused `core/memory-rag` package whose Prisma writes are still commented out (`core/memory-rag/src/conversation-store.ts:32-118`), so long-term recall is theoretical.
- Connectors are fully described in `connectorRegistry`, but `ConnectorFactory` still defaults to mocks and the OAuth provider skips PKCE, meaning real external actions will throw unless custom plumbing is written (`apps/api/src/connectors/factory.ts:15-96`, `apps/api/src/connectors/auth/OAuth2Provider.ts:33-35`).
- Telemetry is split across `executeAgentRun` + `lib/metrics`, `observability/metrics`, `core/telemetry`, and pipeline-specific JSON loggers; tests for agents are mostly placeholder assertions so regressions around routing, memory, and connectors go undetected.

> **Clarification on TODO markers:** Any TODO references in SEO recommendation/internal-linking services, connector OAuth flows, or BrandVoice ingestion refer to work already captured in `docs/AGENT_COMPLETION_PLAN.md` Phases 3–5. Codex-1 owns those deliverables while finishing the backend↔SDK contract alignment, so Guardian agents should avoid editing those files and focus on documentation/tests only.

## Agents
| Agent | Path | Purpose | Status | Notes |
| --- | --- | --- | --- | --- |
| ContentAgent | `apps/api/src/agents/content/ContentAgent.ts` | Long-form drafts, summaries, repurposing with SEO + brand inputs | ✅ | Implements `handle`, validates payloads, records AgentRun metrics, reuses BrandVoice + SEO services |
| SEOAgent | `apps/api/src/agents/SEOAgent.ts` | Keyword discovery, intent analysis, difficulty scoring | ✅ | Fully typed, orchestrator-aware intents (`keyword-research`, `seo-audit`), produces structured outputs |
| EmailAgent | `apps/api/src/agents/EmailAgent.ts` | Sequences, subject optimization, A/B tests, personalized sends | ✅ | Uses `executeAgentRun`, queues for compose/send, BrandVoice + Resend/Twilio integrations |
| SocialAgent | `apps/api/src/agents/SocialAgent.ts` | Social copy generation, caption optimization, hashtag packs, analytics | ✅ | Provides `handle` for three intents, enforces platform limits, logs metrics |
| SupportAgent | `apps/api/src/agents/SupportAgent.ts` | Draft replies, triage, macro suggestions | ✅ | Purely deterministic logic, resolves context, records intents via `executeAgentRun` |
| AdAgent | `apps/api/src/agents/AdAgent.ts` | Ad copy + variations | ⚠️ | Direct OpenAI calls with hard-coded `'test-key-for-testing'`, no orchestrator contract, console logging only |
| CampaignAgent | `apps/api/src/agents/CampaignAgent.ts` | Multi-channel orchestration (schedule, optimize, A/B) | ⚠️ | Extensive use of Prisma + `agentJobManager`, but no `handle` method or orchestrator registration |
| DesignAgent | `apps/api/src/agents/DesignAgent.ts` | DALL·E prompt + asset recommendations | ⚠️ | Bare OpenAI usage, returns partial specs, no error telemetry or typed orchestration |
| InsightAgent | `apps/api/src/agents/InsightAgent.ts` | Trend/anomaly summaries + simple forecasts | ⚠️ | Hybrid of heuristics + OpenAI, not wired to orchestrator or queueing, no persistence |
| BrandVoiceAgent | `apps/api/src/agents/BrandVoiceAgent.ts` | Experimental AgentIntelligenceBus participant | ⚠️ | Registers against `core/aib`, but nothing bootstraps it or pipes requests; relies on filesystem knowledge instead of Prisma (`apps/api/src/agents/BrandVoiceAgent.ts:1-101`) |
| SMSAgent | `apps/api/src/agents/SMSAgent.ts` | Consent-aware SMS send/reply processing | ⚠️ | Used via `/api/sms`, but not exposed through orchestrator intents or AgentRun telemetry |
| SocialMessagingAgent | `apps/api/src/agents/SocialMessagingAgent.ts` | Instagram/X/Reddit/WhatsApp DMs | ⚠️ | Wired to `/api/social`, not orchestrator aware, no typed inputs |
| TrendAgent | `apps/api/src/agents/TrendAgent.ts` | Trend discovery + subscriptions | ⚠️ | Provides discovery helpers but no orchestrator `handle`, no event ingestion |

## Orchestrator & Routing
- Router stack (`apps/api/src/services/orchestration/router.ts`) has retries, circuit breaker, rate limiting, and AgentRun persistence. However, nothing ever calls `registerAgent` outside of Jest, so `route()` immediately returns `AGENT_NOT_REGISTERED`.
- `/api/orchestrate` is defined in `apps/api/src/routes/orchestrate.ts` but never mounted in `server.ts`, so the documented endpoint is unreachable.
- The default runtime path is TRPC’s `agentsRouter` which imports agent singletons directly and invokes their `handle` methods with the `ctx.prisma` instance, bypassing rate limits, queue metrics, and circuit breakers (`apps/api/src/trpc/routers/agents.router.ts`).
- `ensureOrchestratorBootstrap` instantiates `AgentIntelligenceBus` from `core/aib`, but there is no follow‑up registration or integration with the TRPC/REST entry points (`apps/api/src/services/orchestration/bootstrap.ts:5-18`).
- `executeAgentRun` + `run-context` provide consistent AgentRun + ToolExecution persistence for the agents that do use orchestrator contracts; older flows still rely on `agentJobManager` + `agent_job` rows.

## Queues & Execution
- BullMQ queues are predeclared for intake/email/sms/social/learning/seo jobs and automatically emit Prometheus telemetry (`apps/api/src/queues/index.ts`). Email, SMS, and Social agents enqueue compose/send tasks but there are no processors in this repo, so jobs rely on external workers.
- `AgentJobManager` is still the main abstraction for longer-running operations (campaign planning, scheduling, hashtag packs). It records JSON blobs per job but does not cross-link with AgentRun IDs or ToolExecutions.
- Predictive Engine endpoints (`apps/api/src/routes/predictive.ts`) wrap `modules/predictive-engine` and expose scaling decisions, but nothing in the agent layer feeds performance metrics into that service beyond optional `agent-learning.service.ts`.

## RAG / Memory / Knowledge
- Brand voice ingestion stores parsed guidelines + `text-embedding-3-small` vectors in `brand_voices` and `embedding_space` tables, plus `searchSimilarBrandVoice` exposes pgvector similarity (`apps/api/src/services/brand-voice-ingestion.ts:201-275`).
- `EventIntakeService` normalizes channel events, auto-creates people via `PersonService`, embeds summaries into `mem_embeddings`, and updates personas (`apps/api/src/services/event-intake.service.ts:1-155`).
- `PersonService` exposes identity resolution, consent, note/memory helpers, but vector retrieval is basic and `core/memory-rag` is not wired—its Prisma interactions are still commented out, so the “memory store” package is conceptual only.
- Lightweight session/doc caches under `apps/api/src/ai/memory` log JSONL files to `logs/`, useful for demos but not multi-tenant safe.
- Knowledge sources like `lib/fsdb` + `services/brandVoice.service.ts` still read from the filesystem, not Prisma, so BrandVoiceAgent answers can drift from the data captured by `brand-voice-ingestion`.

## Connectors & Tools
- `registerConnectors` instantiates 21 production-grade connector classes (Slack, Gmail, Sheets, Trello, Stripe, etc.) so metadata + OAuth flows are in place (`apps/api/src/connectors/index.ts`).
- Credential management encrypts tokens in Prisma and can downscope contexts per user/account (`apps/api/src/connectors/auth/CredentialManager.ts`).
- `ConnectorFactory` (used by legacy tooling) still defaults to mock connectors and throws for “real” modes, so any code depending on that factory cannot reach the production services despite the registry supporting them (`apps/api/src/connectors/factory.ts:15-96`).
- OAuth provider lacks PKCE and persists no state secrets, so security hardening is pending (`apps/api/src/connectors/auth/OAuth2Provider.ts:33-35`).
- `recordToolExecution` ties connector actions back to the orchestrated AgentRun context when invoked via instrumented proxies, but many agents (Ad, Design, Insight) bypass this wrapper entirely.

## Telemetry, Logging & Safety
- `executeAgentRun` writes status/timing, attaches metrics via Prometheus counters in `apps/api/src/lib/metrics.ts`, and exposes `/metrics`. There's a second metrics implementation under `apps/api/src/observability/metrics.ts` plus `core/telemetry`, none of which are imported anywhere, resulting in duplicate, unused plumbing.
- `BrandVoiceService.guardrail` redacts forbidden patterns/PII but only runs when `/api/brand-voice/guardrail` is called; Email/SMS direct sends do not automatically run guardrails (`apps/api/src/services/brand-voice.service.ts:113-190`).
- Pipeline-specific metrics (`apps/api/src/ai/utils/metrics.ts`) append JSONL files rather than emitting structured telemetry, so costs and verification scores are not exposed alongside Prometheus.
- Authentication middleware uses raw Prisma lookups and logs via `console.error` on failure (`apps/api/src/middleware/auth.ts:1-66`), bypassing the sanitized logger.

## Current Issues & Gaps
- `orchestrate()` simply proxies to `route()` and `/api/orchestrate` is never mounted, so no REST caller can exercise the orchestrator stack (`apps/api/src/services/orchestration/index.ts:10-105`, `apps/api/src/server.ts:129-160`).
- `registerAgent` is never invoked in runtime code; only Jest tests populate the registry, leaving router lookups empty in production (`apps/api/src/services/orchestration/registry.ts:1-38`).
- Several agents call OpenAI directly with fallback keys and no orchestrator `handle` (`apps/api/src/agents/AdAgent.ts:7-120`, `apps/api/src/agents/DesignAgent.ts:5-103`, `apps/api/src/agents/InsightAgent.ts:5-119`), so they lack telemetry, retries, and circuit protection.
- The AgentIntelligenceBus is initialized but no agent ever registers with it, so BrandVoiceAgent broadcasts evaporate (`apps/api/src/services/orchestration/bootstrap.ts:5-18`, `apps/api/src/agents/BrandVoiceAgent.ts:1-101`).
- ConnectorFactory still throws “not implemented” errors for real connectors even though production connectors exist (`apps/api/src/connectors/factory.ts:70-93`).
- SEO recommendation + internal-linking services remain TODO-heavy and reference unimplemented data queries (`apps/api/src/services/seo/recommendations.service.ts:303-620`, `apps/api/src/services/seo/internal-linking.service.ts:134-513`).
- TRPC routers (`apps/api/src/trpc/router.ts`) are never attached to the Express server, so the web app’s TRPC client cannot call the backend directly.
- Agent tests are superficial or skipped (`apps/api/src/agents/__tests__/CampaignAgent.test.ts:1-110`, `apps/api/src/agents/__tests__/EmailAgent.test.ts.skip`), leaving routing, queueing, and telemetry unverified.
- `core/memory-rag` (conversation/profile/kb stores) has all Prisma writes commented out, so the package cannot persist anything despite being imported via bootstrap scripts (`core/memory-rag/src/conversation-store.ts:32-118`, `core/memory-rag/src/kb-store.ts:58-150`).
- The web app forces the SDK into mock mode via `setTransport(mockTransport)` unless an env flag disables it, so no UI flows hit the real API by default (`apps/web/src/providers/Providers.tsx:5-11`); the SDK also defaults to `http://localhost:4000`, which doesn't match the Express server (`core/sdk/src/index.ts:16-45`).

## What's Working vs. Still Theoretical
### Working Today
- Direct TRPC mutations for `agents.execute`, `agents.listRuns`, etc. hit Content/SEO/Email/Social/Support agents with proper `AgentExecutionContext`.
- BullMQ queues exist for email/SMS/social jobs and emit queue metrics; `agentJobManager` persists job lifecycle in Prisma for campaign, social, and email flows.
- Brand-voice ingestion + guardrails produce real embeddings and metadata stored in Postgres with pgvector.
- Connector metadata/credential storage, Slack/Gmail/Twilio service classes, and OAuth flows are in place for manual invocation through `/api/connectors`.
- Predictive Engine routes expose scaling decisions and surface health stats from `modules/predictive-engine`.

### Still Theoretical / Incomplete
- `/api/orchestrate`, node discovery, failover, and scaling APIs return canned responses and have no persistence or registries behind them.
- AgentIntelligenceBus, QA Sentinel, eco-optimizer, AI governance, data trust, and `core/memory-rag` packages live in `/core` but are not imported by the API.
- Real connector execution via `ConnectorFactory` is disabled; OAuth lacks PKCE and connectors referenced by the SDK (`/agents`, `/agents/execute`, `/jobs`) do not exist in Express.
- Automated RAG/memory retrieval for agents relies on stubbed in-memory/session stores; no agent calls into `core/memory-rag` or pgvector search outside brand voice.
- Frontend SDK defaults to mock transport and base URL `http://localhost:4000`, so UI flows never exercise the Express orchestrator unless developers override env vars.
