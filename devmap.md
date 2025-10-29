# NeonHub Development Map — Status Aligned (2025-10-28)

This document translates the strategic roadmap into an actionable status view. It combines the original planning intent with the latest evidence from the 2025‑10‑27 audit set (`docs/DEV_MAP_PROGRESS_AUDIT_2025-10-27.md`, `READY_STATUS.md`, `DB_COMPLETION_REPORT.md`, `CONNECTOR_AUDIT.md`, etc.).

## Phase Snapshot

| Phase | Primary Objective | Status | Progress* | Key Evidence |
| --- | --- | --- | --- | --- |
| **Phase 1 – Foundation & Strategic Planning** | Requirements, architecture, governance | ⚠️ In Progress | ~72 % | docs/DEV_MAP_PROGRESS_AUDIT_2025-10-27.md |
| **Phase 2 – Design & Prototyping** | UX system, prototypes, validation | ⚠️ In Progress | ~62 % | docs/DEV_MAP_PROGRESS_AUDIT_2025-10-27.md |
| **Phase 3 – Core Development / MVP** | Orchestrator, connectors, DB, CI | 🔴 Blocked | ~48 % | DB_COMPLETION_REPORT.md, AGENT_COVERAGE.md, CONNECTOR_AUDIT.md |
| **Phase 4 – Feature Expansion / Beta** | Advanced workflows, AI, marketplace | 🔴 Blocked | ~32 % | RAG_HEALTH.md, LEARNING_LOOP_REPORT.md |
| **Phase 5 – Release Candidate & GA** | Hardening, launch readiness | 🔴 Blocked | ~22 % | READY_STATUS.md, FINAL_LOCKDOWN_CHECKLIST.md |
| **Phase 6 – Maintenance & Growth** | Post-GA iteration & scaling | ⭘ Not Started | 0 % | n/a |

_\*Progress percentages inherit from docs/DEV_MAP_PROGRESS_AUDIT_2025-10-27.md and will tighten as CI evidence improves._

---

## Phase Details & Action Items

### Phase 1 – Foundation & Strategic Planning
**Status:** ⚠️ In Progress (~70 %)  
**Completed so far**
- Stakeholder sessions and environment inventories captured (`SESSION_SYNC_LOG.md`, `ENV_PRESENCE_REPORT.md`).
- Deployment runbooks and governance drafts exist (`DB_DEPLOYMENT_RUNBOOK.md`, `FINAL_LOCKDOWN_CHECKLIST.md`).
- Type ownership between SDK and API aligned (Channel/Objective definitions unified in `apps/api/src/types/agentic.ts`).

**Outstanding**
- Runtime secrets still missing; pnpm toolchain not fully provisioned (`ENV_PRESENCE_REPORT.md`, `SECURITY_PREFLIGHT_SUMMARY.md`).
- Governance checks in the lockdown checklist remain open (`FINAL_LOCKDOWN_CHECKLIST.md`).
- `pnpm install --frozen-lockfile` continues to fail in offline environments; node_modules cannot be restored until registry access is re-enabled (`logs/verification/phase0-dependencies.log`).

**Next Focus**
1. Populate required secrets across environments, following `ENV_TEMPLATE.example`.
2. Finalize governance tasks (branch protections, access reviews) and re-run `FINAL_LOCKDOWN_CHECKLIST.md`.
3. Confirm pnpm availability on CI and local by executing `./scripts/verify-local.sh`.

### Phase 2 – Design & Prototyping
**Status:** ⚠️ In Progress (~60 %)  
**Completed so far**
- Prior Next.js shell and design tokens are in place (`apps/web/src/app/layout.tsx`, shadcn components).
- Historical prototypes documented in roadmap archives (e.g., `PHASE_4_BETA_PROGRESS.md`).
- SDK rebuild and type surface corrections unblock future UI compile once dependencies return (`core/sdk/src/modules/*`).

**Outstanding**
- No recent usability or accessibility validations tied to the new SEO and analytics flows.
- Campaign builder v0 lacks product-level QA notes.

**Next Focus**
1. Schedule a design QA session once backend endpoints stabilize.
2. Produce updated accessibility & usability notes in `docs/UI_AUDIT.md`.
3. Refresh prototype alignment with new orchestrator/connector expectations.

### Phase 3 – Core Development / MVP
**Status:** 🔴 Blocked (~45 %)  
**Completed so far**
- Prisma schema and agents/bus scaffolding exist (`apps/api/prisma/schema.prisma`, `apps/api/src/services/orchestration`).
- Offline repository tooling (PnPM shim, runbook, repo map) established (`docs/LOCAL_RUNBOOK.md`, `scripts/repo-map.mjs`).
- API type alignment pass completed (Channel/Objective exports, Prisma JSON casts, agent job payload typing) — see `apps/api/src/types/agentic.ts`, `services/event-intake.service.ts`, `services/budget.service.ts`, `services/learning-loop.service.ts`, `agents/SocialMessagingAgent.ts`, `trpc/routers/agents.router.ts`.

**Outstanding**
- Database migrations/seeds cannot run; Postgres unavailable (`DB_COMPLETION_REPORT.md`).
- Agent runs lack persistence and normalization (`AGENT_COVERAGE.md`, `AGENT_INPUT_NORMALIZATION_NOTES.md`).
- Jest suite fails before running tests (ts-jest config) (`AGENT_TEST_RESULTS.md`).
- Connector enums vs. registry mismatch; mocks missing (`CONNECTOR_AUDIT.md`, `CONNECTOR_FIX_PLAN.md`).
- Toolchain restoration blocked by registry access; type fixes need compilation pass once install succeeds (`logs/verification/phase0-baseline.log`).

**Next Focus**
1. Restore node_modules (registry access required) then bring up Postgres and rerun `pnpm --filter apps/api prisma migrate deploy`.
2. Implement AgentRun persistence and normalization as outlined in `ORCHESTRATOR_AUDIT.md`.
3. Fix ts-jest configuration (`jest.setup.ts`, tsconfig) to remove TS1343 failures; target 95 % coverage.
4. Align connector enums with registry, provide sandbox mocks, and rerun connector audit.

### Phase 4 – Feature Expansion / Beta
**Status:** 🔴 Blocked (~30 %)  
**Completed so far**
- SEO routing suite unified with recent API work (`apps/api/src/routes/seo`).
- Initial analytics and billing stubs exist in web app.
- Predictive engine vector store tightened to support deterministic embeddings in offline test mode (`modules/predictive-engine/src/memory`).

**Outstanding**
- Learning loop/RAG components disabled (`LEARNING_LOOP_REPORT.md`, `RAG_HEALTH.md`).
- Marketplace/connectors incomplete; AI agents not feeding dashboards.
- Security workflows stalled (IVFFLAT validation, rate limiting).

**Next Focus**
1. Restore adaptive memory + RAG (seed vector store, wire `AdaptiveAgent`).
2. Finish connector mocks to support beta workflows.
3. Execute security validation scripts (`SECURITY_PREFLIGHT_SUMMARY.md`) once DB is live.

### Phase 5 – Release Candidate & GA
**Status:** 🔴 Blocked (~20 %)  
**Completed so far**
- Runbooks and release notes templates prepared (`DB_DEPLOYMENT_RUNBOOK.md`, `RELEASE_NOTES_TEMPLATE.md`).

**Outstanding**
- CI db deploy & security workflows not executed (`CI_DB_DEPLOY_REPORT.md`).
- READY status ❌; lockdown write-up incomplete (`READY_STATUS.md`, `FINAL_LOCKDOWN_CHECKLIST.md`).
- pnpm install unresolved on CI.

**Next Focus**
1. After Phase 3 fixes, run the CI db deploy job and capture new log.
2. Close remaining Go/No-Go checklist items and update `READY_STATUS.md`.
3. Produce GA pricing/support briefs from the business plan once tech gates turn green.

### Phase 6 – Maintenance & Growth
**Status:** ⭘ Not Started  
**Prerequisites**
- GA launch (Phase 5) must complete.
- Monitoring stack, connector marketplace, and community programs currently absent.

**Prep Work**
1. Draft maintenance OKRs and release cadence once GA is approved.
2. Define metrics dashboard requirements (tying into `docs/analytics-dashboard.md`).
3. Formalise dual-agent verification loop (Cursor implementation + Codex validation) and record deltas in `PROGRESS_REPORT.md` each sprint.

---

## Cross-Phase Priorities
1. **Dependency Restoration:** regain registry access so pnpm install succeeds (blocks Prisma, lint/test/build).
2. **Database Availability:** once packages restore, run Prisma migrations + seeds → prerequisite for Phases 3–5.
3. **Tooling Reliability:** fix pnpm/Node toolchain, Jest config, and CI workflows.
4. **Orchestrator & Agents:** deliver persistence, normalization, and coverage to unlock AI features.
5. **Security & Compliance:** rerun preflight scripts and close open findings (`SECURITY_PREFLIGHT_SUMMARY.md`).
6. **Documentation Sync:** update runbooks and audits as each blocker is cleared; keep `docs/DEV_MAP_PROGRESS_AUDIT_2025-10-27.md` in sync or roll a new dated audit.

---

## Next 3 Sprints (Proposed)
1. **Sprint 1:** Database/Prisma restoration, Jest repair, connector enum alignment.
2. **Sprint 2:** Agent persistence + normalization, RAG pipeline, security preflight.
3. **Sprint 3:** CI deploy workflows, READY checklist closure, GA readiness artifacts.

Update this document with real metrics and links after each sprint review to keep the roadmap and execution aligned.
