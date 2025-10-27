# Remediation Plan — 2025-10-27

## P0 — Immediate Blockers (Unblock builds & runtime)
1. **Restore TypeScript/Next workspace toolchain**  
   Files: `apps/api/package.json`, `apps/web/package.json`  
   Commands:
   - `npm install --workspace apps/api typescript@5.6.3 @types/node@20 --save-dev`
   - `npm install --workspace apps/web typescript@5.6.3 @types/node@20 next@15 --save`
   - `npm dedupe` (root) to ensure single TypeScript copy exposes `lib.*.d.ts`
   Notes: verify `node_modules/typescript/lib/lib.es2022.d.ts` and Next CLI exist before rerunning `npm run build --workspace apps/api` and `apps/web`.
2. **Guard encryption helper when ENCRYPTION_KEY missing**  
   Files: `apps/api/src/lib/encryption.ts`, `apps/api/src/config/env.ts`  
   Commands:
   - Add lazy initialization that no-ops in non-production when key absent.
   - Document local secret step: `export ENCRYPTION_KEY=$(openssl rand -hex 32)`.
   Notes: prevent process crash in tests; emit warning instead of throw in dev/test.
3. **Realign Docker Compose contexts**  
   Files: `docker-compose.yml`, `docker-compose.db.yml`  
   Commands:
   - Update backend build context to `./apps/api` and web to `./apps/web`.
   - Run `docker compose build api web` to validate context paths post-change.
   Notes: align service names with current folder structure and ports.

## P1 — Priority Follow-up (Foundation for telemetry & CI)
1. **Wire AgentRun telemetry + persistence**  
   Files: `apps/api/src/services/orchestration/*`, `apps/api/src/services/metrics.ts`  
   Notes: persist execution metadata into `AgentRun`/`AgentRunMetric`, broadcast to metrics channel.
2. **Expose agents via typed RPC**  
   Files: `apps/api/src/routes`, `apps/web/src/hooks/useCopilotRouter.ts`  
   Notes: generate tRPC client or REST schema and remove placeholder `_api` stub.
3. **Re-enable CI alerts & Slack notifications**  
   Files: `.github/workflows/*.yml`, `scripts/ci-cd`  
   Notes: add Slack webhook step for failures; ensure workflows call repaired build/lint/test commands.
4. **Document and automate Prisma migrate status**  
   Files: `apps/api/package.json`, `docs/DB_BACKUP_RESTORE.md`  
   Notes: include script alias (`npm run prisma:status`) and add to release checklist once toolchain restored.

## P2 — Enhancements & UX polish
1. **Ship theme toggle & accessibility improvements**  
   Files: `apps/web/src/components/AppShell.tsx`, `apps/web/src/components/theme-provider.tsx`.
2. **Generate sitemap & keyword index**  
   Files: `apps/web/next.config.ts`, `apps/web/scripts/*`, `apps/api/prisma/schema.prisma` (keyword tables if needed).
3. **Implement Geo map & Performance Copilot modules**  
   Files: `apps/web/src/app/*`, `apps/api/src/services/*` (new endpoints for geo/performance data).
4. **Replace QA Sentinel stub with real benchmark logic**  
   Files: `core/qa-sentinel/*`, `.github/workflows/qa-sentinel.yml`.

## PR Checklist (apply to each remediation PR)
- [ ] Update dependencies and lockfiles (`npm install`, `npm dedupe`) without introducing new audit warnings.
- [ ] Run `npm run build --workspace apps/api` and `npm run build --workspace apps/web` (pass).
- [ ] Execute `npm run lint --workspaces` and `npm run typecheck --workspaces`.
- [ ] Run API tests (`npm run test --workspace apps/api`) and document coverage deltas.
- [ ] For Docker updates, run `docker compose config` to validate syntax.
- [ ] Update relevant docs (README, env guides) and link evidence in PR description.
- [ ] Request DevOps/Security review for encryption and workflow changes.
