# 🚀 NeonHub Production Readiness — Action Checklist

**Generated:** October 30, 2025  
**Overall Status:** ⚠️ **75% READY** (3 critical blockers)  
**Target:** 100% in 3 weeks

---

## ⚡ URGENT (Week 1) — Must Fix Before Deploy

### 🔴 Priority 1: Test Suite (2 days)
- [ ] **Fix heap limit errors**
  ```bash
  export NODE_OPTIONS="--max-old-space-size=4096"
  pnpm --filter @neonhub/backend-v3.2 exec jest --runInBand --coverage
  ```
- [ ] Mock heavy dependencies (Prisma, TensorFlow, Puppeteer) in test setup
- [ ] Verify 70%+ coverage achieved
- [ ] **Commit:** `fix(tests): resolve heap limit + restore coverage`

### 🔴 Priority 2: AgentRun Persistence (2-3 days)
- [ ] **Wire `executeAgentRun()` into orchestrator router**
  - File: `apps/api/src/services/orchestration/router.ts` line 87-133
  - Import: `import { executeAgentRun } from "../../agents/utils/agent-run.js";`
  - Wrap handler execution in `executeAgentRun()` call
- [ ] Verify `AgentRun` records created in database
- [ ] Update `AgentRunMetric` on completion/failure
- [ ] Add integration test
- [ ] **Commit:** `feat(orchestrator): implement AgentRun persistence`

### 🔴 Priority 3: Database Drift Check (1 day)
- [ ] **Start Docker Postgres**
  ```bash
  docker compose -f docker-compose.db.yml up -d
  ```
- [ ] **Run drift check**
  ```bash
  pnpm --filter @neonhub/backend-v3.2 exec prisma migrate diff \
    --from-schema-datamodel apps/api/prisma/schema.prisma \
    --to-url "$DATABASE_URL" --script > .tmp/db-drift.sql
  ```
- [ ] Review `.tmp/db-drift.sql` for unexpected changes
- [ ] If clean: trigger `db-deploy` workflow on GitHub
- [ ] **Commit:** `chore(db): verify drift + deploy to Neon.tech`

---

## ⚠️ IMPORTANT (Week 2) — Production Hardening

### Prometheus Metrics (1 day)
- [ ] Install `prom-client`: `pnpm add prom-client --filter @neonhub/backend-v3.2`
- [ ] Add `/metrics` endpoint to `apps/api/src/server.ts`
- [ ] Track: `agent_runs_total`, `agent_run_duration_seconds`, `circuit_breaker_failures`
- [ ] Test: `curl http://localhost:4000/metrics`
- [ ] **Commit:** `feat(monitoring): add Prometheus metrics`

### Connector Mock Mode (2 days)
- [ ] Add `USE_MOCK_CONNECTORS=true` env flag
- [ ] Create mock implementations for Gmail, Slack, Twilio SMS
- [ ] Wire mocks into connector factory
- [ ] Update tests to use mocks
- [ ] **Commit:** `feat(connectors): add deterministic mock mode`

### Smoke Tests & Staging (1 day)
- [ ] Run: `./scripts/post-deploy-smoke.sh`
- [ ] Deploy to Railway/Vercel staging
- [ ] Verify health checks pass
- [ ] **Commit:** `chore(deploy): validate staging environment`

---

## ✅ NICE TO HAVE (Week 3) — Pre-Production

### Security Validation (2 days)
- [ ] Run Gitleaks: `gh workflow run security-preflight.yml`
- [ ] Run CodeQL analysis (via workflow)
- [ ] Run dependency audit: `pnpm audit --audit-level=high`
- [ ] Fix high/critical vulnerabilities
- [ ] **Commit:** `chore(security): pre-production audit + fixes`

### Least-Privilege DB Roles (1 day)
- [ ] Create `neonhub_app` role (DML only) on Neon.tech
- [ ] Create `neonhub_migrate` role (DDL + CONNECT)
- [ ] Update `DATABASE_URL` to use `neonhub_app`
- [ ] Update CI/CD to use `neonhub_migrate` for migrations
- [ ] **Commit:** `feat(db): implement least-privilege roles`

### Production Deployment (2 days)
- [ ] Backup Neon.tech: `gh workflow run db-backup.yml`
- [ ] Deploy migrations: `gh workflow run db-deploy.yml` (RUN_SEED=false)
- [ ] Deploy API to Railway
- [ ] Deploy Web to Vercel
- [ ] Verify: `curl https://neonhubecosystem.com/api/health`
- [ ] Monitor logs for 24 hours
- [ ] Tag release: `git tag v3.2.0-prod && git push --tags`

---

## 📊 Current Readiness Scorecard

| Layer | Status | Readiness | Priority |
|-------|---------|-----------|----------|
| Database | ✅ | 95% | LOW |
| CI/CD | ✅ | 90% | LOW |
| Agent Orchestrator | 🔴 | 45% | **CRITICAL** |
| Test Suite | 🔴 | 30% | **CRITICAL** |
| Monitoring | ⚠️ | 40% | HIGH |
| Connectors | ⚠️ | 60% | MED |
| Documentation | ✅ | 85% | LOW |

**Overall:** 75% → Target: 100% in 3 weeks

---

## 🚨 Blockers Summary

| Blocker | Impact | Effort | Status |
|---------|--------|--------|--------|
| **Test heap limit** | Cannot verify quality | 2 days | 🔴 URGENT |
| **AgentRun persistence missing** | No audit trail | 2-3 days | 🔴 URGENT |
| **No Prometheus metrics** | Blind operations | 1 day | ⚠️ HIGH |

---

## 📁 Related Documents

- **Full Audit:** `PRODUCTION_READINESS_REPORT.md` (527 lines)
- **Database Runbook:** `DB_DEPLOYMENT_RUNBOOK.md`
- **Agent Status:** `AGENT_INFRA_COMPLETION_REPORT.md`
- **Executive Summary:** `EXECUTIVE_SUMMARY_OCT28.md`

---

**Next Step:** Start with Priority 1 (Test Suite) — estimated 2 days.
