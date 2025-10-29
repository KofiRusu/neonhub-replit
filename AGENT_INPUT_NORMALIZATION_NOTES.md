# Agent Input Normalization Notes — 2025-10-27

- `apps/api/src/routes/orchestrate.ts` uses a single Zod schema for `{ agent, intent, payload, context }` but forwards `payload` as `unknown`. Individual agents do not provide their own validators, so orchestrator cannot enforce shape or coerce defaults per intent.
- Most agents expose bespoke Express routes (e.g., `apps/api/src/routes/campaign.ts`, `apps/api/src/routes/email.ts`) with ad-hoc validation or none at all. Predictive engine adapters are absent: `processMetricsForScaling(metrics: any)` in `apps/api/src/services/predictive-engine.ts` accepts `any` and forwards raw metrics to `NeonHubPredictiveEngine`.
- `modules/predictive-engine` expects strongly typed `PerformanceMetrics` / `ScalingDecision`, yet no adapters translate REST payloads into these types; CI cannot rely on type safety.
- Deterministic mocks are missing for external connectors invoked within agents (e.g., `EmailAgent` uses real providers), so test runs would require live credentials instead of sanitized fixtures.
- Required action: introduce per-agent Zod schemas (e.g., `validateCampaignSchedule`, `validateEmailSequence`) that normalize defaults before orchestrator dispatch, wrap them in adaptors exposed through `registerAgent`, and supply mock implementations for CI consistent with those schemas.
