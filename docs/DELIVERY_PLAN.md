# NeonHub Publishing Readiness Plan

## Executive Summary
- This assessment blends the capability audit in `docs/neural-copilot-roadmap.md` with the end-to-end roadmap in `devmap.md` and the current repository state (`apps/api`, `apps/web`, shared modules) to determine how close NeonHub is to a publishable, production-quality release.
- The monorepo delivers a polished Next.js 15 UI and an Express + Prisma backend with extensive domain coverage (agents, analytics, connectors, billing, governance). However, multiple subsystems still rely on mock data, critical governance modules are partially stubbed, and quality gates fall far short of the 95 % coverage target enforced in `apps/api/jest.config.js`.
- A focused four-phase launch plan—Stabilize, Complete, Harden, Release—will close the remaining gaps. Immediate priorities are to restore automated quality signals, attach the UI to live APIs, finish persistent memory and connector provisioning, and document operating procedures for the go-live window.

## Current State Inventory

### Frontend (apps/web)
- Next.js App Router with glassmorphism Neon UI shell, React Query providers, and rich copilot surfaces (`src/app/brand-voice`, `src/components/brand-voice/*`, `src/components/agent-*`).
- Most data flows are still mocked: analytics panels draw from static hooks, copilot intents rely on REST endpoints that currently emit synthetic payloads, and authentication flows depend on unconfigured NextAuth providers.
- Playwright scenarios exist under `apps/web/tests/e2e`, but critical paths are skipped or require real credentials, leaving automation coverage thin.

### Backend (apps/api)
- Express routes span the Neural Copilot domains outlined in `docs/neural-copilot-roadmap.md`—agents, analytics, brand voice, connectors, predictive services, governance, and support.
- Connectors (`src/connectors/services/*`) implement real OAuth flows, retry policies, and polling triggers, but registry lifecycle, credential storage, and webhooks still need end-to-end validation.
- Core AI services (`src/ai/openai.ts`, `src/agents/**`) enforce job orchestration and Prisma persistence, yet default to mock-mode unless `OPENAI_API_KEY` is configured.
- Analytics, SEO, and trend endpoints currently return static values (see `src/services/analytics.service.ts`, `src/services/seo.service.ts`), so UI KPIs never reflect live campaigns.

### Quality & Tooling
- Jest config (`apps/api/jest.config.js`) demands 95 % global coverage, but the latest `apps/api/coverage/coverage-summary.json` shows roughly 9 % lines/functions covered; the suite fails locally when run with `pnpm --filter apps/api test:coverage`.
- Linting (`pnpm lint`) and type checks (`pnpm type-check`) span all workspaces, yet no CI signal confirms they are passing today.
- Playwright and Jest rely on environment scaffolding from `tests/setup/env.ts`, but there is no documented fixture strategy for connectors or AI mocks.

### Operations & Delivery
- Dockerfiles for API and Web, Railway/Vercel manifests, and smoke scripts (`scripts/smoke-test-production.sh`) exist, aligning with the deployment strategy in `devmap.md` Phase 5.
- Environment templates cover most secrets, though sensitive values (LLM providers, Stripe, Redis, vector stores) remain unset by default and lack rotation guidance.
- Documentation is extensive but fragmented; contributors must piece together workflows from `STATUS.md`, `DEVELOPMENT_WORKFLOW.md`, and numerous phase reports.

## Gap Analysis vs Strategic Roadmaps

| Pillar | Roadmap Expectation | Current Implementation | Gap & Needed Work |
| --- | --- | --- | --- |
| Persistent Memory & Incognito (Neural Copilot Sprint 1) | Vector-backed memory APIs, governance UI, incognito mode | Memory panels in UI and Prisma schemas exist; backend services not wired to real store | Finalize memory service + vector DB integration, surface controls in `/brand-voice`, add privacy toggles |
| Unified LLM Gateway (Sprint 1) | Multi-provider (GPT‑4o, Claude, Gemini) selection & routing | `generateText` wraps OpenAI only, mock fallback when key absent | Build provider abstraction, secrets management, usage telemetry, and UI model selector |
| Connector Framework Expansion (Sprint 2 / Devmap Phase 4) | MCP-style SDK, 50+ connectors, queue-backed polling | Registry + 10 connectors written, background worker scaffolding present but not operational | Harden credential vault, add queue worker (BullMQ) deployment, write integration tests for Tier 1 connectors |
| Autonomous Agent Controls | Trigger builder, monitoring dashboards, safety policies | Agents defined (`src/agents/*`), UI dashboards partially wired | Finish trigger configuration UI, implement governance policies, alerting, and log search |
| Analytics & Insights | Live metrics, forecasting, anomaly detection | Static executive summaries and KPIs | Connect analytics routes to real data, integrate predictive engine (`modules/predictive-engine`), add reporting jobs |
| Quality Gates | CI with lint/type/test, 95 % coverage | Local coverage ~9 %, CI status unknown | Restore CI workflow, add missing unit/integration/E2E tests, provide deterministic fixtures |
| Compliance & Security (Devmap Phase 5) | SOC2/GDPR controls, audit trails, DLP | Middleware and rate limiting in place; audit/compliance stubs | Implement redaction flows, audit logs, retention policies, penetration test checklist |

## Path to Publishing

### Phase 0 – Stabilize Tooling (Week 1)
- Restore CI pipelines: ensure `pnpm lint`, `pnpm type-check`, `pnpm --filter apps/api test:coverage`, and Playwright smoke suites pass in automation.
- Introduce deterministic fixtures for AI, connectors, and Prisma so coverage can be raised without live credentials.
- Document environment bootstrap (LLM keys, Redis/queue, vector store) in a single `docs/ENV_SETUP_GUIDE.md`.

### Phase 1 – Complete Core Copilot (Weeks 2–3)
- Wire Brand Voice UI to live memory/knowledge APIs; implement memory CRUD, incognito sessions, and governance review panes.
- Build the multi-provider LLM gateway with fallback + cost controls; expose model selection in UI and agent configs.
- Finish analytics pipelines: connect to metrics tables, enable executive summary generation via predictive engine.

### Phase 2 – Harden Connectors & Agents (Weeks 4–5)
- Deploy BullMQ worker service, finalize retry/backoff telemetry, and add queue monitoring dashboards.
- Complete OAuth flows, secure credential vault, and introduce connector health checks surfaced in `/settings/integrations`.
- Ship agent safety center: policy editing, escalation workflows, and run history with export.

### Phase 3 – Launch Prep & Publishing (Weeks 6–7)
- Conduct full regression suite (Jest + Playwright + load tests) with 95 % coverage and publish reports.
- Freeze schema, finalize migrations, run production-like dry run via docker-compose + smoke scripts.
- Update documentation (README, `docs/neural-copilot-roadmap.md`, `devmap.md`) to reflect GA scope; prepare release notes and on-call playbooks.
- Execute soft launch (invite-only), capture telemetry, then publish GA release (tag, changelog, blog).

## Immediate Action Checklist
1. Run `pnpm --filter apps/api test:coverage` and commit to closing the gap to ≥60 % before expanding scope.
2. Catalog every route that still returns mock data; create backend tickets to replace mocks with real implementations (priority: analytics, trends, brand voice memory).
3. Stand up Redis + Postgres locally and verify agent job lifecycle end-to-end (`src/agents/content/ContentAgent.ts`).
4. Audit Playwright tests, remove `test.skip` usage where possible, and add stub auth fixtures for CI.
5. Consolidate deployment documentation into a single publishing runbook (draft under `/docs`).

## Risk Register
- **Quality Signal Blind spot** – Without working CI and coverage, regressions will ship unnoticed. *Mitigation:* rebuild pipelines during Phase 0, block merges lacking green checks.
- **Connector Credential Drift** – OAuth flows and polling jobs may fail silently without monitoring. *Mitigation:* add health endpoints, connector integration tests, and alerting dashboards.
- **LLM Cost & Latency** – Multi-provider gateway may introduce unpredictable costs. *Mitigation:* enforce rate limits, add usage dashboards, and configure per-model budgets.
- **Compliance Exposure** – Memory store and analytics can leak PII if not governed. *Mitigation:* implement redaction/audit features before GA; involve security review in Phase 3.

## Exit Criteria for Publishing
- ✅ Backend + frontend tests ≥95 % coverage with mock providers and deterministic fixtures.
- ✅ All analytics, trends, and brand voice endpoints return live data sourced from Prisma or external services—no static stubs.
- ✅ Connector registry supports production OAuth storage, health reporting, and queue workers deployed.
- ✅ Documentation and runbooks updated, and dry-run deployment validated via smoke tests.
- ✅ Observability (logs, metrics, alerts) instrumented for the launch stack (API, workers, web).

## Key References
- `docs/neural-copilot-roadmap.md` – Capability audit and sprint plan for the Neural Copilot launch.
- `devmap.md` – Strategic roadmap covering phases from Pre-Alpha through GA and post-launch evolution.
- `STATUS.md`, `DEVELOPMENT_WORKFLOW.md`, `apps/api/coverage/coverage-summary.json`, `apps/api/jest.config.js` – Source data for current readiness snapshot.
