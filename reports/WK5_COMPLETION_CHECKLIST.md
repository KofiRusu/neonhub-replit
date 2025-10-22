# Week 5 Completion Workflow

1. **Wire Marketing Agent UI**
   - Replace mock data in `apps/web/src/app/agents/page.tsx` with authenticated fetch hooks.
   - Surface agent run status, logs, and controls via live socket.io streams.
2. **Analytics Dashboard**
   - Implement real metrics calls to `/metrics/summary` and websocket deltas.
   - Add chart components backed by tenant-scoped data.
3. **Billing & Budget Guardrails**
   - Connect billing UI to `/api/billing/*` endpoints (plan, usage, invoices).
   - Enforce plan limits visually; add alerts when approaching quotas.
4. **Credential & Settings UI**
   - Hook credential manager to `/api/credentials` routes.
   - Complete settings forms backed by `/api/settings` with optimistic updates.
5. **E2E Automation**
   - Finalize Playwright suite for login, campaign creation, billing checkout, and analytics sanity checks (`npm run test:e2e -- --workers=1 --reporter=list`).
6. **Performance Benchmarking**
   - Run `node scripts/benchmark-middleware.js` against staging; document results (<5 ms target).
7. **Deployment Handoff**
   - Produce runbooks covering environment promotion, rollback guards, and monitoring dashboards.
