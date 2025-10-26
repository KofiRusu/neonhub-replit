# NeonHub Local UI/UX Testing Guide

Use this checklist to prepare a developer workstation for hands-on UX sessions against the NeonHub monorepo. It captures the current blockers discovered on 2025-??-?? and the mitigations required before session day.

> **Scope**: Covers the `apps/api` (Express/Prisma) backend and `apps/web` (Next.js 15) frontend. Redis/BullMQ workers are noted but not yet required for superficial UX walkthroughs.

## 1. Workstation Prerequisites
- Node.js ≥ 20.17, npm ≥ 10.8 (verify with `node --version`, `npm --version`).
- Local PostgreSQL instance reachable at `postgresql://user:pass@localhost:5432/neonhub`.
- Optional but recommended: Redis ≥ 7 if you want to exercise agent queues later.
- Install dependencies once from repo root: `npm install --workspaces`. (Use npm; pnpm is unavailable in this restricted environment.)

## 2. Environment Configuration
1. Copy templates:  
   - `cp apps/api/ENV_TEMPLATE.example apps/api/.env`  
   - `cp apps/web/ENV_TEMPLATE.example apps/web/.env.local`
2. Update credentials:  
   - Set `DATABASE_URL` (both files) to your local Postgres DSN.  
   - Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.  
   - Provide `DEMO_LOGIN_EMAIL`, `DEMO_LOGIN_PASSWORD`, `DEMO_LOGIN_NAME`, and `DEMO_LOGIN_USER_ID` if you want to change the default demo credentials (defaults: `demo@neonhub.ai` / `demo-access`).  
   - Provide `OPENAI_API_KEY`; if absent, services fall back to mock responses (acceptable for dry run).  
   - Leave Stripe/Twilio keys blank for now unless you will demonstrate billing or messaging.
3. Optional: complete `apps/web/ENV_TEMPLATE.md` toggles if you plan to showcase Sentry or real-time features.

## 3. Database Provisioning
```bash
# From repo root
npm run prisma:migrate --workspace apps/api
npm run seed --workspace apps/api
```
Seeding creates the `demo@neonhub.ai` user, content drafts, agent jobs, and baseline metrics consumed by dashboards.

## 4. Authentication Workaround
NextAuth now ships with a local Credentials provider (see `apps/web/src/lib/auth.ts`). The default login is `demo@neonhub.ai` with password `demo-access` (configurable via the `DEMO_LOGIN_*` env variables). Backend APIs still expect either a NextAuth session cookie or bearer token; missing auth returns HTTP 401 via `apps/api/src/middleware/auth.ts`.

## 5. Runtime Launch Sequence
```bash
# Terminal A – API
npm run dev --workspace apps/api

# Terminal B – Web
npm run dev --workspace apps/web
```
- API listens on `http://localhost:3001`. Web app runs at `http://localhost:3000`.
- Ensure `NEXT_PUBLIC_API_URL` points to the API port; otherwise frontend will fall back to `/api/*` proxy routes.

## 6. Quality Gates to Clear Before Sessions
These commands currently fail and must be addressed:
- `npm run lint --workspace apps/web` — fails due to unused variables in Playwright specs.
- `npm run lint --workspace apps/api` — fails; remove unused symbols (e.g., `Buffer` in `StripeConnector.ts`, `config` arg in `services/governance/index.ts`) and review the 11 lint errors.
- `npm run typecheck --workspace apps/web` — fails (`Settings` page uses typed `reduce` on untyped payload). Add explicit typing before calling `.reduce`.
- `npm run typecheck --workspace apps/api` — fails across connector and feedback routes. Align DTOs with Prisma models (`ConnectorAuth`, `CreateDocumentInput`, `CreateFeedbackInput`) and extend `AuthRequest` to include `isBetaUser`.
- Coverage snapshot (`apps/api/coverage/coverage-summary.json`) sits at ~9 %, far below the enforced 95 % threshold in `apps/api/jest.config.js`. Restore or update the Jest suite before promising fulfillment readiness.

## 7. UX Session Checklist
- ✅ Demo account seeded and sign-in path verified (custom provider or mocked session).
- ✅ Dashboard widgets (metrics, brand voice, agents) rendering non-empty data.
- ✅ Connectors tab able to list registry entries (requires `/api/connectors` endpoint to return 200).
- ✅ Critical interactions (draft generation, trend briefs, analytics summaries) confirmed against either live services or mock responses.
- ✅ Observability console open (browser devtools + API log output) to diagnose issues in real time.

## 8. Known Gaps / Mitigations
- **Mock data**: Analytics and SEO endpoints return static payloads (`apps/api/src/services/analytics.service.ts`, `seo.service.ts`). Communicate this during testing to avoid confusion.
- **Job queue**: Agent job orchestration is in-memory; long-lived UX sessions may require manual cleanup if multiple testers run in parallel.
- **Playwright tests**: Several specs (`apps/web/tests/e2e/*.spec.ts`) assume GitHub OAuth; either skip them or supply credentials.
- **CI Absence**: With pnpm unavailable locally, ensure teammates use npm commands or vendor pnpm binaries before the validation window.

## 9. Go/No-Go Criteria for Fulfillment Sign-off
- ✅ Lint and typecheck commands pass for both web and API workspaces.
- ✅ Launch sequence reproducible from clean clone within 30 minutes.
- ✅ Testers can authenticate and navigate all ten primary routes without backend 5xx errors.
- ✅ Documented workaround for any remaining mock data or disabled integrations.
- ✅ Post-session bug triage plan on file (use `docs/DELIVERY_PLAN.md` tracking).
