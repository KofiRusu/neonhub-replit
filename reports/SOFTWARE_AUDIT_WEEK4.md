# NeonHub Week 4 Software Audit

## Objective
Evaluate the backend surface (apps/api) for security regressions, tenant isolation gaps, and middleware ordering issues; document findings and remediation status.

## Findings & Remediations

### 1. Header-Based Impersonation (Critical)
- **Issue**: Campaign, content, metrics, and job routes trusted `x-user-id` header or demo fallbacks, enabling horizontal privilege escalation.
- **Fix**: Added `getAuthenticatedUser*` helpers that enforce `req.user` presence (populated via session/Bearer tokens). All affected routes now derive tenant IDs from the authenticated session and reject mismatches with explicit `AppError` responses.

### 2. Missing Tenant Filters (Critical)
- **Issue**: Prisma queries for content drafts, metric events, and agent jobs lacked `userId/createdById` filters, exposing cross-tenant data.
- **Fix**: Injected tenant-aware `where` clauses; metric events now persist the `userId` inside JSON `meta` and filter by it for summaries and counts. Jobs and drafts query only the owner’s records.

### 3. Stripe Webhook Parsing (High)
- **Issue**: Global `express.json()` ran before the Stripe webhook router, stripping the raw signature payload and breaking verification.
- **Fix**: Mounted `/api/billing/webhook` prior to JSON parsing. `bodyParser.raw()` remains scoped to the webhook route guaranteeing signature fidelity.

### 4. Session Cookie Parsing (High)
- **Issue**: `cookie-parser` was absent, so `requireAuth` could not access NextAuth session cookies.
- **Fix**: Installed `cookie-parser`, registered before auth middleware with `env.NEXTAUTH_SECRET`, restoring session-based authentication.

### 5. CORS Origin Validation (High)
- **Issue**: Middleware compared against `process.env.CORS_ORIGIN` and ignored array/dynamic patterns, silently allowing or blocking origins incorrectly.
- **Fix**: Synced middleware with validated `env.CORS_ORIGINS`; supports wildcard (`*.example.com`) and `regex:` patterns, responds with 403 for unknown origins, and handles preflight correctly.

### 6. Rate Limiter Fail-Open (Medium)
- **Issue**: Redis/network errors caused rate limiter to fail open in production.
- **Fix**: Production now returns HTTP 503 when rate limiting is unavailable; non-prod continues with in-memory fallback and warnings.

### 7. Billing Checkout/Portal Identity (Medium)
- **Issue**: Billing endpoints hard-coded demo user IDs/emails, bypassing authenticated context.
- **Fix**: Routes now call `getAuthenticatedUser`, validate email/customer presence, and surface validation errors when context is missing.

## Residual Risks
- Front-end (apps/web) remains mock-based and does not consume secured API endpoints; UI can still display stale/static data.
- Jest/Playwright suites are not running; regression coverage remains limited.
- Lint warnings (`any` usage, unused vars) persist across legacy modules; should be triaged separately.

## Recommendations
1. Complete UI integration to eliminate mock datasets and exercise authenticated APIs.
2. Add automated regression tests (unit + E2E) covering the newly secured routes.
3. Run middleware performance benchmark and capture baseline metrics before deployment.
4. Harden deployment scripts to ensure Stripe webhook endpoint is reachable behind TLS with raw-body support.
