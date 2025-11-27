# Coverage Expansion Plan

Generated 2025-11-22 from `docs/api-testing/COVERAGE_MATRIX.json`.

## Baseline snapshot

- **Total routes**: 198
- **Covered by Postman**: 54 (27.3%)
- **Domains at 100%**: `auth`, `health`, `sms`, `sitemap`, `sitemap.xml`
- **Newly expanded**: Campaigns (86.7%), Billing (66.7%), Tasks (80%), Settings (60%), Data-Trust (33.3%), Governance (33.3%), Connectors (33.3%), Metrics (66.7%), Team (40%), Social (50%)

## Coverage buckets

### Fully covered (100%)
- **Auth & Users** – login/me/logout
- **Health & System** – `/health` + `/metrics` smoke checks
- **Sitemaps & Robots** – `/sitemap.xml`, `/sitemap/invalidate`, `/robots.txt`
- **SMS** – send + inbound flows

### Partially covered (needs deeper assertions)
- **Campaigns** – new CRUD + scheduling still need validation for optimize endpoints and owner authorization branches.
- **Billing & Finance** – plan/usage/checkout/portal happy paths covered; need subscription status variations and webhook path.
- **Tasks & Workflow** – create/list/update/delete covered; add filters + conflict cases.
- **Team & Access** – invites/invitations tested; missing member CRUD + HTML accept flow.
- **Connectors** – API-key lifecycle only; need OAuth flows, action triggers.
- **Settings** – base + notifications; add brand voice + webhook segments.
- **Data-Trust & Governance** – ethics/evaluate/hash covered; missing admin-only GETs (hash verification, policy listing).
- **Keywords/Personas** – two happy paths; add update/delete variants.
- **Metrics** – scrape + events; add `/metrics/summary`.
- **Social** – DM + schedule; add inbound + sentiment endpoints.

### Not covered yet
- **Content** – `/content/drafts` suite.
- **Documents** – upload/delete.
- **Budget**, **Brand Voice**, **Marketing**, **Messages**, **Feedback**, **Eco-metrics**, **Editorial Calendar**, **Orchestration**, **Predictive**, **Person**, **Readyz** (public path mismatch), **Trends (GET/Platform/Search)**, **Email Agent** (beyond subject optimize), **TRPC routers** (agents, brand, content, seo, trends).
- **Stripe webhook** – requires signed payload fixtures.

Reasons: many endpoints rely on seeded data (documents, eco-metrics), require privileged networks (admin IP guard), or depend on external callbacks (Stripe/webhooks). These require staged fixtures before automation.

## Path to ~90% logical coverage

### Phase 1 – High-risk/high-traffic endpoints (remaining Q4 blockers)
1. **Documents & Files**
   - Add fixture upload/download/delete tests using seeded document ID.
   - Negative cases: unsupported MIME, missing metadata.
2. **Eco-metrics & Sustainability**
   - Cover carbon/energy endpoints with sample payload (use `.env` flags to guard).
3. **Messaging & Feedback**
   - Add inbox CRUD + escalate/resolution flows.
4. **Predictive & Marketing overview**
   - Verify `/predictive/execute`, `/marketing/overview`, `/marketing/campaigns`.
5. **Stripe webhook**
   - Use static fixture + `raw` body to assert signature handling.

### Phase 2 – Critical but lower frequency
1. **Brand Voice / Content personalization** – Compose + guardrail checks per campaign.
2. **Budget & Finance safeguards** – Budget planning endpoints, invalid amounts.
3. **Editorial Calendar & Keywords** – Update/delete coverage + pagination tests.
4. **Person profiles** – Consent + memory endpoints.
5. **SEO agent deep dives** – `meta`, `keywords`, `audits` variations.

### Phase 3 – Edge/admin surfaces
1. **TRPC routers** – Add HTTP calls to `/trpc/<router>.<procedure>` (use JSON-RPC payload) with auth contexts.
2. **Orchestration & queues** – Admin IP guard endpoints (use allowlisted IP via Newman CLI).
3. **Readyz path alignment** – Update router or request path to ensure 200.
4. **Analytics extras** – `/metrics/summary`, `/campaigns/:id/optimize`.

## How to add tests (playbook)

1. **Use the generator**: all routes live in `docs/api-testing/ROUTE_INDEX.json`. Feed uncovered entries into `scripts/api-testing/extend-postman-collection.mjs` so future reruns stay deterministic.
2. **Request template**:
   - Auth via collection-level bearer (`Authorization: Bearer {{access_token}}`).
   - Bodies stored as raw JSON; IDs pulled from env vars (`{{task_id}}`) or set via test scripts (`pm.environment.set`).
   - Include `pm.test('Response time < 1000 ms')` and schema assertions.
3. **Negative tests**:
   - Mirror each major domain with at least one invalid payload or unauthorized call.
   - Expect 400/401/403 and assert error codes.
4. **Golden/E2E flows**:
   - New flows live under `E2E – Multi-Agent Flow`. Mirror structure when wiring future orchestrations (e.g., Governance → Data Trust → Audit).
5. **When to add fixtures**:
   - Domains guarded by `adminIPGuard` require staging IP allowlist or `newman run --env-var USE_MOCKS=true`.
   - For file uploads, use `newman` `--bail false` and mock storage bucket (documented in README).

## Tracking progress

- After each collection update, run `node scripts/api-testing/generate-api-test-matrix.mjs` to refresh JSON + Markdown stats.
- Update `docs/api-testing/COVERAGE_MATRIX.md` and this plan with new percentages.
- Target coverage milestones:
  - **35%** – After Phase 1 subdomain completion (Documents, Eco-metrics, Messaging).
  - **55%** – After Phase 2 (Brand voice, Budget, Person).
  - **>80%** – After Phase 3 (TRPC + admin surfaces).
  - Remaining gap are webhooks/external callbacks flagged as manual.
