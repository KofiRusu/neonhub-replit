# NeonHub Project Status Audit
**Date:** 2025-10-27  
**Prepared by:** Codex Agent (on-device, low-disk mode)

---

## Executive Summary
- The repository has progressed beyond the original roadmap baselines, but runtime validation remains blocked by disk pressure and dependency corruption.
- Environment, documentation, and domain tooling are in place (`docs/OPS_COMPLETION_REPORT.md:1`, `scripts/attach-domain-audit.sh:1`), yet several services diverge from the Prisma schema and Stripe/Vercel secrets are still unset (`docs/ENV_MATRIX.md:21`).
- Most remediation can proceed with low-footprint edits (TypeScript alignment, YAML updates, secret provisioning); heavy tasks such as reinstalling dependencies or re-running Prisma client generation must wait for disk cleanup (`docs/DB_MIGRATE_STATUS.md:62`).

| Category | Previous Estimate | Updated Completion | Confidence | Notes |
|----------|------------------|--------------------|------------|-------|
| Fintech & APIs | 10% | **35%** | Medium | Billing flows wired, but Stripe secrets and plan mappings unfinished. |
| AI Layer | 20% | **45%** | Medium | Agents + predictive engine exist, still schema drift & missing tests. |
| Infra & DevOps | 30% | **70%** | High | Ops sweep done; workflows fail due to corrupted installs. |
| Backend | 40% | **50%** | Medium | Routes/services implemented; Prisma runtime and schema parity outstanding. |
| Frontend | 50% | **70%** | High | UI is feature-rich; needs real API wiring & billing guards. |
| Security & Compliance | 60% | **55%** | Medium | Policy/docs ready; secrets & audit enrichment pending. |

### Disk & Verification Constraints
- Prisma, Jest, and full pnpm workflows are still blocked until ≥5 GB is freed (`docs/DB_MIGRATE_STATUS.md:101`).
- Avoid reinstalling `node_modules`, rebuilding Next.js, or invoking `pnpm prisma generate`; defer to high-disk backlog until cleanup is complete.

---

## Fintech & APIs (≈35% complete)
**Key Assets**
- Stripe service and router (`apps/api/src/services/billing/stripe.ts:1`, `apps/api/src/routes/billing.ts:1`).
- Billing UI hooks + page (`apps/web/src/hooks/useBilling.ts`, `apps/web/src/app/billing/page.tsx:76`).
- Payment/env documentation (`docs/ENV_MATRIX.md:45`).

**Current Status**
- Back-end endpoints expose checkout/portal flows and subscription usage but require configured Stripe IDs (`apps/api/src/services/billing/stripe.ts:36-102`).
- Front-end highlights plan options yet still relies on static mappings and sandbox alerts (`apps/web/src/app/billing/page.tsx:93-117`).
- Ops documentation covers secret requirements, but GitHub/Vercel vaults remain empty (`docs/ENV_MATRIX.md:185`).

**Low-Disk Task Checklist**
- [ ] Map UI plan names to the backend `PLANS` keys and capture the env variable contract in `docs/ENV_MATRIX.md` (apps/web/src/app/billing/page.tsx:93-112, apps/api/src/services/billing/stripe.ts:36-69).
- [ ] Add sandbox fallback messaging + 429 handling to the billing endpoints to avoid runtime Stripe errors during development (apps/api/src/routes/billing.ts:21-157).
- [ ] Document manual invoice reconciliation and webhook expectations in `docs/OPS_COMPLETION_REPORT.md`.

**High-Disk / Deferred Tasks**
- Reinstall pnpm workspace and regenerate Prisma client before validating Stripe customer/subscription persistence.
- Run Stripe CLI/webhook smoke tests once node_modules are healthy.

---

## AI Layer (≈45% complete)
**Key Assets**
- Agent implementations and normalizers (`apps/api/src/agents/EmailAgent.ts:1-139`, `apps/api/src/agents/SocialAgent.ts:1-156`, `apps/api/src/agents/_shared/normalize.ts:9-104`).
- Learning + orchestrator bridge (`apps/api/src/services/learning/index.ts:1-40`, `apps/api/src/services/orchestration/router.ts:1-120`).
- Predictive engine package (`modules/predictive-engine/src/index.ts:1-200`).

**Current Status**
- Job orchestration, feedback learning, and predictive engine wrappers exist, but schema alignment and type guards are still in flight (messaging/team services, predictive adapters).
- Tests for union narrowing and adapters are scaffolded but not executed because Jest depends on the missing Prisma client.
- Agent inputs now normalize defaults, yet caller coverage is incomplete across routes and orchestrations.

**Low-Disk Task Checklist**
- [ ] Extend agent normalizers to remaining orchestrated intents and update call sites (`apps/api/src/services/orchestration/router.ts:61-108`).
- [ ] Align predictive engine DTOs with Prisma metrics schema (review `modules/predictive-engine/src/types/index.ts` vs. `apps/api/prisma/schema.prisma`).
- [ ] Add focused unit tests for `formatOrchestrateResponse` and normalization helpers without hitting Prisma (apps/api/src/routes/orchestrate.ts, apps/api/src/agents/_shared/normalize.ts).

**High-Disk / Deferred Tasks**
- Generate Prisma client and run `pnpm --filter @neonhub/backend-v3.2 test:coverage` to validate agents against the database.
- Rebuild `@neonhub/predictive-engine` package once node_modules corruption is resolved.

---

## Infra & DevOps (≈70% complete)
**Key Assets**
- Ops sweep deliverables (`docs/OPS_COMPLETION_REPORT.md:1-78`).
- Environment inventory (`docs/ENV_MATRIX.md:1-74`).
- Domain automation (`scripts/attach-domain-audit.sh:1-120`).
- Workflow catalog (`.github/workflows/*.yml`).

**Current Status**
- Templates, checklists, and runbooks are in place; CI workflows continue to fail due to shared dependency corruption.
- Disk space guidance is documented but not yet executed (`docs/DB_MIGRATE_STATUS.md:62-114`).
- Security-preflight and Codex auto-fix workflows require dependency guardrails and cache validation updates.

**Low-Disk Task Checklist**
- [ ] Patch failing GitHub workflows to short-circuit on dependency corruption (add `pnpm store status` + integrity guards).
- [ ] Update domain script defaults (TEAM_SLUG, DRY_RUN tips) in `scripts/attach-domain-audit.sh`.
- [ ] Add a lightweight “disk budget” section to `docs/DB_MIGRATE_STATUS.md`.

**High-Disk / Deferred Tasks**
- Execute disk cleanup + reinstall routines prior to rerunning CI pipelines.
- Rehydrate pnpm store and rebuild caches.

---

## Backend (≈50% complete)
**Key Assets**
- Express routes covering billing, messaging, campaigns, etc. (`apps/api/src/routes/*.ts`).
- Services with Prisma accessors (`apps/api/src/services/messaging.service.ts:1-196`, `apps/api/src/services/team.service.ts:1-120`).
- Prisma schema (`apps/api/prisma/schema.prisma:641-702`).

**Current Status**
- Routes and services are feature-rich but some still assume legacy Prisma shapes (e.g., messaging metadata, team membership connectors) and cannot be verified without regenerated client code.
- Prisma runtime validation is paused until disk is freed; migrations exist but are not deployable.
- Audit logging emits metadata but omits contextual fields consumers expect (`apps/api/src/middleware/auditLog.ts:9-37`).

**Low-Disk Task Checklist**
- [ ] Reconcile messaging/team service payloads with current Prisma schema (apps/api/src/services/messaging.service.ts:136-183, apps/api/src/services/team.service.ts:63-119).
- [ ] Enrich audit log metadata with route identifiers and request IDs (apps/api/src/middleware/auditLog.ts:19-33).
- [ ] Document manual fallback steps for Prisma generation in `docs/DB_MIGRATE_STATUS.md`.

**High-Disk / Deferred Tasks**
- `pnpm prisma generate`, `pnpm --filter @neonhub/backend-v3.2 typecheck`, and Jest suites once node_modules are rebuilt.
- Database migration validation against Neon/pgvector.

---

## Frontend (≈70% complete)
**Key Assets**
- Next.js dashboards and billing UI (`apps/web/src/app/billing/page.tsx:1-155`, `apps/web/src/app/dashboard/page.tsx`).
- Shared component library + hooks (`apps/web/src/components`, `apps/web/src/hooks/useBilling.ts`).
- Brand voice and agent interfaces (various `/app` routes).

**Current Status**
- UI state flows are mature with feature toggles and sandbox checks, but numerous areas still render mock data or expect API stubs (`apps/web/src/app/billing/page.tsx:26-104`).
- Billing upgrade flow blocks when Stripe env variables are missing but the user messaging needs to mirror backend plan keys.
- Frontend relies on environment flags that are documented yet not provisioned in Vercel.

**Low-Disk Task Checklist**
- [ ] Swap static plan arrays for data fetched from `/billing/plan` and `/billing/usage` with graceful fallback (`apps/web/src/app/billing/page.tsx:80-118`).
- [ ] Centralize billing status banner logic in a shared component for reuse across dashboards.
- [ ] Update frontend .env template to highlight required Stripe publishable keys and sandbox flag.

**High-Disk / Deferred Tasks**
- Full Next.js build verification (`pnpm --filter apps/web build`) after dependencies are healthy.
- Playwright E2E runs once backend endpoints are stable.

---

## Security & Compliance (≈55% complete)
**Key Assets**
- Security policy and governance docs (`SECURITY.md:1-120`, `security/audit-allowlist.json`).
- Audit middleware + logging utilities (`apps/api/src/middleware/auditLog.ts:9-33`, `apps/api/src/lib/audit.ts`).
- ENV matrix with rotation schedules (`docs/ENV_MATRIX.md:21-72`).

**Current Status**
- Policies, templates, and escalation paths are documented, but GitHub/Vercel secrets are still pending owner action (`docs/ENV_MATRIX.md:185`).
- Audit middleware currently records only resource IDs/type, missing request/action context, and consumer expectations are unclear.
- Automated security workflows (security-preflight.yml) still fail with the shared dependency issue.

**Low-Disk Task Checklist**
- [ ] Populate GitHub Actions secrets vault with non-production keys (reference `docs/ENV_MATRIX.md:185`).
- [ ] Extend audit metadata to capture route names, tenant context, and user agent strings (`apps/api/src/middleware/auditLog.ts:19-32`).
- [ ] Add a compliance checklist appendix (SOC2/GDPR) to `SECURITY.md`.

**High-Disk / Deferred Tasks**
- Run dependency audits (`pnpm audit`, `npm audit`) after node_modules cleanup.
- Execute security-preflight workflow once CI environment is healthy.

---

## Next Steps Summary
1. **Free Disk Space & Rebuild Dependencies (blocking)** – follow `docs/DB_MIGRATE_STATUS.md` before attempting Prisma or CI runs.
2. **Apply Low-Disk Fixes First** – normalize agent inputs, extend audit metadata, patch YAML workflows, and update docs/secrets.
3. **Schedule High-Disk Operations** – after cleanup, reinstall dependencies, regenerate Prisma client, and re-run CI to validate changes.

This staged plan keeps momentum while respecting current storage constraints and sets each domain up for final integration once the environment is healthy.
