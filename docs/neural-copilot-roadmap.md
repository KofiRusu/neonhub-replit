# Neural Copilot (NeonHub) – Capability Audit & Implementation Plan

_Last updated: 2025-10-25_

This document captures the current capabilities in the NeonHub monorepo (`apps/web`, `apps/api`) and maps them against the Neural‑Net Copilot specification. It also outlines the delivery plan to reach production parity with the spec while preserving the NeonUI design system.

---

## 1. Current State Inventory

### 1.1 Frontend (`apps/web`)
- **Design system**: shadcn/ui components under `src/components/ui`, custom neon tokens (`src/styles/tokens.css`) and glassmorphism utilities (`src/app/globals.css`).
- **Navigation / shell**: Persistent sidebar and top bar (`src/components/navigation.tsx`, `src/components/page-layout.tsx`) with placeholder authentication.
- **Domain surfaces**: Screens for Dashboard, Campaigns, Analytics, Brand Voice, Email, Social Media, Tasks, Feedback, Team, Billing, Support, etc. (see `src/app/*/page.tsx`). Majority are static or use mocked data via local hooks (`src/hooks`).
- **State**: React Query providers in `src/providers/Providers.tsx`.
- **Brand Voice UI**: Rich copilot console (`src/app/brand-voice`, `src/components/brand-voice/*`) including memory, knowledge index, presets – currently driven by stubbed data.
- **Agent tooling**: Agent dashboards and status widgets (`src/components/agent-*`, `src/app/agents/page.tsx`) referencing live metrics hooks.
- **Gaps**: No live authentication flow, no real-time API integration, missing persistent memory management UI, accessibility helpers partially wired.

### 1.2 Backend (`apps/api`)
- **Routing**: Extensive REST endpoints organised by domain (`src/routes/*.ts`) covering agents, analytics, brand voice, connectors, documents, messaging, predictive engine, etc.
- **Services**: Corresponding domain services (`src/services/**/*`) implementing business logic; many depend on external providers (OpenAI, Redis, Stripe, Twilio, etc.).
- **Agents**: Autonomous agent orchestration in `src/agents`, predictive engine wrappers, eco-optimizer modules, etc.
- **AI layer**: Prompt templates and AI utilities under `src/ai`.
- **Connectors & middleware**: Connectors to external systems (`src/connectors`), middlewares for auth, rate limiting, observability.
- **Data layer**: Prisma models and migrations in `prisma/`, DB utilities in `src/db`.
- **Observability**: Logging, telemetry setup under `src/obs`.
- **Gaps**: Many services rely on yet-to-be-configured secrets; persistent memory and contextual store implementation incomplete; agent governance/policy enforcement partially stubbed; tests outdated (incomplete `__tests__` coverage).

---

## 2. Spec Alignment & Gaps

| Spec Pillar | Current Coverage | Key Gaps / Required Work |
|-------------|------------------|--------------------------|
| **NLU & Generation** | OpenAI integrations in `src/services/*`, prompt orchestration for brand voice and content. Frontend copilot UIs exist. | Need unified LLM gateway supporting multiple providers (GPT‑4o, Claude, Gemini); translation/summarisation pipelines; citation-supporting responses. |
| **Persistent Memory** | Brand voice memory stubs (`src/components/brand-voice/BrandMemoryPanel.tsx`), backend memory services not finalised. | Implement memory store (Postgres + vector DB), explicit/implicit memory APIs, memory governance UI, incognito sessions. |
| **Connectors & Integrations** | Connector scaffolding (`src/connectors`), routes for CRM/email/social. | Complete connector implementations, permissions onboarding, MCP-style connector SDK, sync jobs & queue management. |
| **Autonomous Agents** | Agents defined in `src/agents`, orchestration services exist. | Finish trigger definitions, monitoring dashboards, safety rails, background worker runners, user-defined agent builder UI. |
| **Data Analysis & Visualisation** | Analytics routes + charts on frontend dashboards. | Hook charts to real data, add Excel/Power BI exports, deep reasoning analytics, anomaly detection. |
| **Creativity & Content** | Brand voice & content editors with stub data, AI service wrappers. | End-to-end generation flows (email/social/blog/video), asset library, image/video generation integrations. |
| **Developer Copilot** | Limited (code-related tooling not surfaced). | Build developer portal, repository indexing, IDE integration endpoints, documentation generator. |
| **Multimodal Interaction** | UI ready for text; minimal audio/video hooks. | Add speech-to-text, text-to-speech, image understanding endpoints, mobile voice UI. |
| **Collaboration** | Messaging/support routes, notifications stubs. | Implement real-time coauthoring, meeting summaries, project board sync, multi-user memory context. |
| **Personalization & EQ** | Tone presets in Brand Voice UI. | Sentiment detection, adaptive tone, wellness guardrails, proactive reminders. |
| **Privacy & Safety** | Middleware for auth/rate limiting/security; governance modules skeleton. | Complete privacy controls (memory viewer, redaction, temporary chats), compliance automation (SOC2/GDPR), escalation paths. |
| **Extensibility** | Module architecture, connectors folder. | Plugin marketplace, model selection UI, sandboxed extension runner. |
| **Deployment & Ops** | CI scripts (needs repair), Dockerfiles, Railway/Vercel configs. | Re-establish automated pipelines, infra-as-code parity, rollback strategies, autoscaling configs. |

---

## 3. Delivery Plan (High-Level Sprints)

### Sprint 0 – Foundations (1 week)
- Repair CLI tooling (`scripts/run-cli.mjs`) and workspace scripts.
- Restore dependency health, Prisma migrations, lint/type/test baselines.
- Stabilise design system (neon tokens, global utilities, navigation).
- Audit secrets/config; document local runbooks.

### Sprint 1 – Core Copilot & Memory (2 weeks)
- Implement unified LLM gateway with provider switching.
- Stand up memory service (Prisma models + vector store) with API and UI for Brand Voice memory management.
- Deliver incognito sessions and memory control centre.
- Wire Brand Voice page to real APIs.

### Sprint 2 – Connectors & Automation (2–3 weeks)
- Finalise CRM/email/social connectors with consent flows.
- Activate autonomous agents: trigger definitions, monitoring dashboard, execution logs.
- Implement background workers (BullMQ/Redis) with retry/backoff and auditing.
- Add policy console UI for agent safety oversight.

### Sprint 3 – Analytics & Insights (2 weeks)
- Hook dashboard/analytics views to real metrics endpoints (timeseries, campaign KPIs).
- Build summarisation/reporting endpoints producing meeting notes, action items.
- Integrate decision-support (recommendations, forecasting) using predictive engine.
- Performance optimisations (React Query caching, SSR/ISR strategy).

### Sprint 4 – Collaboration & Personalisation (2 weeks)
- Real-time messaging/document co-authoring (WebSocket channel, optimistic UI).
- Meeting assistant: ingestion, summary, calendar integration.
- Sentiment/tone adaptation pipeline with UI toggles.
- Memory-driven reminders & proactive suggestions.

### Sprint 5 – Extensibility & Launch Prep (2 weeks)
- Plugin/MCP connector framework and developer onboarding flow.
- Model marketplace UI (select GPT‑4o/Claude/Gemini/local).
- Harden security/compliance (audit trails, consent vault, DLP scanners).
- Production readiness: CI/CD reinstated (lint/type/test/build), observability dashboards, load testing, documentation refresh.

---

## 4. Immediate Actions (Next Work Sessions)
1. **CLI reliability** – done via `scripts/run-cli.mjs`; remaining Prisma cache permissions to be addressed with custom `PRISMA_ENGINES_DIR`.
2. **Design alignment** – neon tokens, glassmorphism, accessibility utilities merged into `apps/web` to match NeonUI.
3. **Deep audit** – expand verification of backend services (tests, coverage) and identify missing data sources ahead of Sprint 1 kickoff.

---

For detailed task breakdowns and engineering tickets, convert each sprint into user stories within the team backlog system (e.g., Linear/Jira) referencing the directory paths above.
