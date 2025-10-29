# NeonHub Codex Coordination Status — Oct 28, 2025

**Git State:** Commit `1172513` on branch `main`  
**Node:** v20.17.0  
**Package Manager:** pnpm 9.12.1  
**Overall Completion:** 47% (Phase 3 MVP BLOCKED)

---

## 🎯 Critical Path: Two-Terminal Coordination

### Terminal A: Infrastructure & Backend Lead
**Primary Focus:** Database → Agents → Testing → Security  
**Owner:** Codex Window 1  
**Status File:** `logs/terminal-a-progress.md`

### Terminal B: Frontend & SEO Lead  
**Primary Focus:** UI → Content → Analytics → Marketing  
**Owner:** Codex Window 2  
**Status File:** `logs/terminal-b-progress.md`

---

## 🚨 Critical Blockers (Ordered by Dependency)

### P0 — Toolchain Restoration (TERMINAL A)
- **Issue:** node_modules missing, Prisma client not generated
- **Blocker:** pnpm install fails with ENOTFOUND registry.npmjs.org
- **Action:** Restore with network access OR use offline cache
- **Blocks:** Everything downstream

### P0 — Database Connectivity (TERMINAL A)
- **Issue:** Can't reach database at localhost:5433
- **Current:** Neon.tech production DB exists but blocked in sandbox
- **Action:** Use Neon cloud DB with proper DATABASE_URL
- **Blocks:** Migrations, seeding, agent persistence

### P1 — TypeScript Errors (TERMINAL A)
- **Count:** 20 errors across backend
- **Impact:** Cannot build or deploy
- **Action:** Fix after dependencies restored
- **Files:** Likely in agents/, services/, routes/

### P1 — Agent Orchestrator (TERMINAL A)
- **Issue:** No agents use orchestrator pattern or persist to AgentRun
- **Impact:** No audit trail, telemetry, or mock capability
- **Action:** Implement orchestrator contract for all 10 agents
- **Blocks:** Production readiness

### P1 — Connector Implementation (TERMINAL A)
- **Issue:** Only 4/15 connectors partially implemented
- **Missing:** SMS, WhatsApp, Reddit, Instagram, Facebook, YouTube, TikTok, Google Ads, Shopify, LinkedIn
- **Action:** Complete implementations with mock support
- **Blocks:** Omni-channel features

### P2 — Jest Configuration (TERMINAL A)
- **Issue:** Tests won't run (ts-jest config broken)
- **Impact:** Cannot validate code quality
- **Action:** Fix jest.config + jest.setup files
- **Blocks:** CI/CD

### P2 — SEO System (TERMINAL B)
- **Issue:** 0% functional, returns fake data
- **Status:** Routes exist, implementation incomplete
- **Action:** Build keyword pipeline → content generator → analytics loop
- **Blocks:** Marketing features

### P2 — UI Agent Integration (TERMINAL B)
- **Issue:** Frontend not wired to agent tRPC endpoints
- **Action:** Create agent dashboards with live data
- **Blocks:** User-facing features

---

## 📋 Completed Work (Preserve)

### ✅ Recent Wins (Oct 27-28)
- [x] Toolchain identified (Node 20.17.0, pnpm 9.12.1)
- [x] Type normalization complete (Channel/Objective in agentic.ts)
- [x] Prisma JSON casting aligned across services
- [x] EmailAgent escaped quotes fixed
- [x] SDK Phase-2 handshake layer added
- [x] 11 database migrations exist and validated
- [x] DB Infrastructure 9-phase plan documented

### ✅ Infrastructure (Production Ready)
- [x] Neon.tech PostgreSQL 16 + pgvector
- [x] Docker compose configurations
- [x] 12 GitHub Actions workflows
- [x] Environment templates and security guidelines
- [x] Comprehensive documentation (50+ MD files)

### ✅ Schema Coverage (Prisma)
- [x] Org/RBAC models complete
- [x] Brand + BrandVoice with vector embeddings
- [x] 10 Agent models + capabilities
- [x] Conversation + Message with embeddings
- [x] RAG (Dataset, Document, Chunk) with vectors
- [x] Content + Campaign models
- [x] Connector + ConnectorAuth models
- [x] AuditLog + governance

---

## 📊 Phase Status Matrix

| Phase | Completion | Terminal Lead | Next Milestone |
|-------|-----------|---------------|----------------|
| Phase 1 (Foundation) | 72% | Shared | Complete governance checklist |
| Phase 2 (Design) | 62% | Terminal B | UI component audit |
| **Phase 3 (MVP)** | **48%** | **Both** | **Unblock toolchain + DB** |
| Phase 4 (Beta) | 32% | Terminal B | RAG + Learning loop |
| Phase 5 (GA) | 22% | Both | CI/CD green + security |
| Phase 6 (Post-GA) | 0% | Future | Not started |

---

## 🔄 Coordination Protocol

### Daily Sync Points
1. **Morning:** Both terminals update progress files
2. **Midday:** Check for blocking dependencies
3. **Evening:** Commit atomic changes, update this file

### Conflict Avoidance
- **Terminal A owns:** apps/api/src/agents/, apps/api/src/services/, apps/api/src/routes/
- **Terminal B owns:** apps/web/src/, docs/seo/, docs/marketing/
- **Shared (coordinate):** core/sdk/, apps/api/prisma/schema.prisma

### Communication
- Update progress in `logs/terminal-{a,b}-progress.md`
- Flag blockers in this file under "🚨 NEW BLOCKERS"
- Commit messages: Use conventional commits with (terminal-a) or (terminal-b) suffix

---

## 🎯 Success Criteria (14-Week GA Target)

### Week 1-2 (Current)
- [ ] Restore node_modules + Prisma client
- [ ] Database connected and seeded
- [ ] Fix 20 TypeScript errors
- [ ] Fix Jest configuration
- [ ] 3+ agents with orchestrator integration

### Week 3-4
- [ ] All 10 agents orchestrator-ready
- [ ] 15 connectors implemented with mocks
- [ ] Test coverage 80%+
- [ ] SEO keyword pipeline functional

### Week 5-6
- [ ] Agent dashboards live in UI
- [ ] Content generator operational
- [ ] RAG + Learning loop restored
- [ ] Security preflight passing

### Week 7-8
- [ ] Test coverage 95%
- [ ] CI/CD fully green
- [ ] Analytics dashboard complete
- [ ] Billing integration

### Week 9-10
- [ ] Security hardening complete
- [ ] Performance optimization
- [ ] Documentation finalized
- [ ] Staging deployment

### Week 11-12
- [ ] Beta testing
- [ ] Bug fixes
- [ ] Production deployment
- [ ] Smoke tests passing

### Week 13-14
- [ ] **GA LAUNCH**
- [ ] Monitoring active
- [ ] Support documentation
- [ ] Marketing ready

---

## 📁 Key File Locations

### Database
- Schema: `apps/api/prisma/schema.prisma`
- Migrations: `apps/api/prisma/migrations/`
- Seed: `apps/api/prisma/seed.ts`
- DB Plan: `.cursor/plans/db-infrastructure-audit-86568550.plan.md`

### Agents
- Implementations: `apps/api/src/agents/`
- Orchestrator: `apps/api/src/services/orchestration/`
- Coverage Audit: `AGENT_COVERAGE.md`

### Connectors
- Implementations: `apps/api/src/connectors/services/`
- Mocks: `apps/api/src/connectors/mocks/`
- Audit: `CONNECTOR_AUDIT.md`

### Testing
- API Tests: `apps/api/src/__tests__/`
- Jest Config: `apps/api/jest.config.js`
- Test Results: `AGENT_TEST_RESULTS.md`

### Documentation
- Executive Summary: `EXECUTIVE_SUMMARY_OCT28.md`
- Development Map: `devmap.md`
- Deployment Runbook: `DB_DEPLOYMENT_RUNBOOK.md`

---

## 🚨 NEW BLOCKERS (Add Here)

_Both terminals: Add blocking issues discovered during execution_

---

**Last Updated:** 2025-10-28 (Initialization)  
**Next Review:** After Week 1 milestones completed
