# Week 1 Test Coverage Sprint — Execution Log

**Goal:** 26% → 60% coverage (reach 181 tests passing, zero failures)  
**Current Status:** 179/181 passing (2 failures in agent-run.spec.ts)  
**Timeline:** November 4-8, 2025  
**Lead:** Cursor Test Coverage

---

## 📊 Current State

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Tests Passing | 179/181 | 181/181 | 2 |
| Coverage (lines) | 26% | 60% | +34% |
| Coverage (branches) | 71.4% | 85% | +14% |
| Test Suites | 45/46 | 46/46 | 1 |
| E2E Tests | 0 | 5+ | All |

---

## 🚨 Immediate Blockers (Fix First)

### Issue #1: agent-run.spec.ts Mock Failures
**Problem:** Prisma mock not connected to service mock  
**Location:** `apps/api/src/agents/utils/__tests__/agent-run.spec.ts`  
**Root Cause:** Mock for `agent-run.service.ts` doesn't match actual function signatures  

**Fix Plan:**
1. Review mock setup in test file
2. Ensure `startRun`, `recordStep`, `finishRun` mocks return correct types
3. Verify Prisma mock has correct methods

**Status:** 🔴 TODO

---

## 📋 Week 1 Tasks (In Order)

### Phase 1: Fix Failing Tests (1-2 hours)
- [ ] Fix agent-run.spec.ts mock setup
- [ ] Verify all 181 tests pass
- [ ] Confirm coverage baseline

### Phase 2: Coverage Analysis (2-3 hours)
- [ ] Identify 0% coverage files (highest impact)
- [ ] Prioritize 5-10 services for test expansion
- [ ] Create test writing checklist

### Phase 3: Unit Tests for High-Impact Services (15-20 hours)
Target services with 0% coverage:
1. **seo/keyword-research.service.ts** (551 lines, 0%)
2. **seo/meta-generation.service.ts** (564 lines, 0%)
3. **seo/content-optimizer.service.ts** (713 lines, 0%)
4. **services/governance/index.ts** (77 lines, 0%)
5. **services/learning/index.ts** (50 lines, 0%)

### Phase 4: Router/tRPC Tests (10-15 hours)
Target low-coverage routers:
- **agent-runs.router.ts** (14.17% → target 70%)
- **agents.router.ts** (32.99% → target 70%)
- **brand.router.ts** (30.37% → target 70%)
- **content.router.ts** (46.54% → target 70%)
- **seo.router.ts** (48.55% → target 70%)

### Phase 5: E2E Smoke Tests (5-10 hours)
- [ ] Login flow
- [ ] Create campaign
- [ ] Send metrics flow
- [ ] Analytics view

### Phase 6: Coverage Reporting & CI (3-5 hours)
- [ ] Generate coverage reports
- [ ] Update CI workflows
- [ ] Create TEST_SUMMARY.md

---

## 🎯 Success Criteria

```
□ All 181 tests passing locally
□ All 181 tests passing in CI
□ Coverage ≥ 60% (lines)
□ Coverage reports in /reports
□ E2E smoke tests green
□ TEST_SUMMARY.md complete
□ Zero flaky tests
□ CI gates enforced
```

---

## 📝 Daily Checklist

**Day 1 (Mon):**
- [ ] Fix agent-run.spec.ts
- [ ] Verify all tests pass
- [ ] Start service unit tests

**Day 2 (Tue):**
- [ ] Complete keyword-research tests
- [ ] Complete meta-generation tests
- [ ] Start router tests

**Day 3 (Wed):**
- [ ] Complete router tests (agent-runs, agents, brand)
- [ ] Start content router tests
- [ ] Start E2E smoke tests

**Day 4 (Thu):**
- [ ] Complete content router tests
- [ ] Complete SEO router tests
- [ ] Finalize E2E tests

**Day 5 (Fri):**
- [ ] Generate coverage reports
- [ ] Update CI workflows
- [ ] Create TEST_SUMMARY.md
- [ ] Merge to main

---

## 📁 Files to Create/Update

### New Files
- `packages/testing/src/factories/index.ts` — Test factories
- `apps/api/test/fixtures/seeds.ts` — Test data
- `apps/api/test/msw-handlers.ts` — MSW mocks
- `tests/e2e/smoke.spec.ts` — E2E tests
- `docs/TESTING.md` — Testing guide
- `reports/TEST_SUMMARY.md` — Coverage summary

### Modified Files
- `apps/api/src/agents/utils/__tests__/agent-run.spec.ts` — Fix mocks
- `.github/workflows/ci.yml` — Add coverage gates
- `package.json` — Add test scripts
- `pnpm-workspace.yaml` — Ensure test config

---

## 🔗 Progress Tracking

Start → Fix Tests → Coverage Analysis → Unit Tests → Router Tests → E2E → CI → Done

Current Phase: **Fix Tests** 🔴

