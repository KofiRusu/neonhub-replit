# Agent Coverage Audit — 2025-10-27

| Agent | Implementation | API Surface | Status |
| --- | --- | --- | --- |
| AdAgent | `apps/api/src/agents/AdAgent.ts` | REST endpoints under `apps/api/src/routes/agents.ts` (`/ad/*`) | ❌ No orchestrator handler; direct OpenAI calls without deterministic mocks; bypasses `AgentRun`. |
| BrandVoiceAgent | `apps/api/src/agents/BrandVoiceAgent.ts` | Consumed indirectly via AIB (no express route) | ⚠️ Registers with `AgentIntelligenceBus` but not persisted via orchestrator; depends on missing `getBrandProfile/searchKnowledge` services. |
| CampaignAgent | `apps/api/src/agents/CampaignAgent.ts` | `apps/api/src/routes/campaign.ts` | ⚠️ Uses `AgentJob` + Prisma; lacks `AgentRun` writes; relations use helper `connectById` (ok). Needs normalization + orchestrator wiring. |
| ContentAgent | `apps/api/src/agents/content/ContentAgent.ts` | `apps/api/src/routes/content.ts` (`/content/*`) | ⚠️ Handles validation via Zod but still writes to `AgentJob`; orchestrator integration missing. |
| DesignAgent | `apps/api/src/agents/DesignAgent.ts` | `apps/api/src/routes/agents.ts` (`/design/*`) | ❌ No orchestrator metadata/handler contract; relies on direct OpenAI calls. |
| EmailAgent | `apps/api/src/agents/EmailAgent.ts` | `apps/api/src/routes/email.ts` | ⚠️ Prisma writes exist; scheduling uses real providers; lacks `handle()` contract and deterministic mocks. |
| InsightAgent | `apps/api/src/agents/InsightAgent.ts` | `apps/api/src/routes/agents.ts` (`/insight/*`) | ❌ Direct REST call; no orchestrator hook; analytics not persisted into `AgentRunMetric`. |
| SEOAgent | `apps/api/src/agents/SEOAgent.ts` | `apps/api/src/routes/seo.ts` | ⚠️ Outputs computed analytics but bypasses orchestrator + telemetry. |
| SocialAgent | `apps/api/src/agents/SocialAgent.ts` | `apps/api/src/routes/trends.ts` & `agents.ts` | ⚠️ Same Express-only pattern; no normalization; connectors rely on live APIs. |
| SupportAgent | `apps/api/src/agents/SupportAgent.ts` | `apps/api/src/routes/support.ts` | ❌ No orchestrator contract; relies on OpenAI completions without mocks/tests. |

**Summary:** None of the production agents expose the required `meta` + `handle()` contract for the orchestrator or persist to `AgentRun`/`ToolExecution`. Express routers call implementation classes directly, so orchestration, rate limiting, and telemetry layers are bypassed.
