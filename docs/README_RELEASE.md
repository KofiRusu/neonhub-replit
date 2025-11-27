# NeonHub Release Pack (Air-Gap Ready)

## What’s ready
- Docs: Fintech, Webhooks, Ledger, Risk, Runbook, Deploy Checklist, API Surface
- Monitoring paths: metrics folder + docker-compose placeholders
- Postman: Fintech_Mocks collection
- Final Audit: dependency-free (Node)

## What to do on host (once available)
1. Seed pnpm store / install (use host-helper script).
2. `pnpm -w prisma generate` then `pnpm -w run test:ci` (light).
3. Start Prometheus stack (optional), verify `/api/metrics`.
4. Delete/disable `/api/dev/trigger-run` before production.
