# Phase 0 Remediation - Revalidation Report

**Date:** October 28, 2025  
**Objective:** Restore true green baseline for lint/test/build across all workspaces  
**Status:** 🟡 IN PROGRESS

---

## Environment

```
Node.js: v20.17.0
pnpm: 9.12.1
Docker: 28.1.1
TypeScript: 5.9.3
ESLint: 9.38.0 (root), 8.57.1 (some workspaces)
```

---

## Changes Made

### 1. ESLint Configuration ✅

**Created Root Flat Config:**
- File: `eslint.config.mjs`
- Format: ESM flat config (ESLint 9+)
- Features:
  - Unified rules across all workspaces
  - TypeScript support via `typescript-eslint`
  - Prettier integration
  - Test file rules with jest plugin
  - Comprehensive ignore patterns

**SDK ESLint Config:**
- File: `core/sdk/eslint.config.mjs`
- Extends root configuration
- Result: ✅ `pnpm lint` passes with 0 errors

### 2. Dependencies Installed ✅

**Root Level:**
- `@eslint/js` - ESLint recommended config
- `typescript-eslint` - TypeScript ESLint support
- `eslint-config-prettier` - Prettier integration
- `eslint-plugin-jest` - Jest test rules
- `@jest/globals` - Jest global types
- `@types/jest` - Jest TypeScript types

### 3. SDK Fixes ✅

**File: `core/sdk/src/client.ts`**

**Issue 1:** Explicit `any` type (line 160)
- **Before:** `let errorData: any;`
- **After:** `let errorData: unknown;`
- **Fix:** Added proper type casting with `as Record<string, unknown>`

**Issue 2:** Lexical declaration in case block (line 182)
- **Before:** `case 429: const retryAfter = ...`
- **After:** `case 429: { const retryAfter = ... }`
- **Fix:** Wrapped case block in braces for proper scoping

**File: `core/sdk/package.json`**
- Updated lint script: `eslint src --ext .ts` → `eslint .`
- Now uses flat config properly

**Results:**
- ✅ Lint: 0 errors
- ✅ Build: Success (CJS 16.22 KB, ESM 14.35 KB, DTS 13.25 KB)
- ⏳ Tests: Pending (2 timeout issues documented in Phase 1)

---

## Workspace Lint Status

| Workspace | Status | Errors | Notes |
|-----------|--------|--------|-------|
| core/sdk | ✅ PASS | 0 | Fixed + passing |
| apps/api | ⏳ TBD | ? | Pending validation |
| apps/web | ⏳ TBD | ? | Pending validation |
| modules/predictive-engine | ⏳ TBD | ? | Known stub code |
| core/qa-sentinel | ⏳ TBD | ? | Experimental module |

---

## Known Issues (Pre-existing)

### From Phase 0 Baseline:

1. **modules/predictive-engine** - 20 lint errors (unused imports/variables)
2. **core/qa-sentinel** - Build errors (rootDir config, missing deps)
3. **core/orchestrator-global** - Missing dependencies (axios, uuid)
4. **Test Suites** - 15 fail to compile (TypeScript issues, not test logic)
5. **Prisma CLI Wrapper** - `scripts/run-cli.mjs` fails to resolve binary

All documented in `docs/RISKS.md`

---

## Blockers Remaining

### To Achieve Full Green Baseline:

1. **🔴 High Priority:** Fix apps/api lint errors
   - Location: Multiple service files with unused variables
   - Action: Remove dead code or prefix with `_`
   
2. **🟡 Medium Priority:** Fix apps/web lint errors
   - Location: Component prop type mismatches
   - Action: Align types with Next.js 15 requirements

3. **🟢 Low Priority:** Fix experimental modules
   - modules/predictive-engine
   - core/qa-sentinel
   - Action: Add eslint-disable or fix incrementally

### Test Issues:

4. **🔴 High Priority:** Fix Prisma field mismatches
   - File: `apps/api/src/__tests__/routes/documents.test.ts`
   - Issue: Tests reference non-existent fields (version, parentId, etc.)
   - Action: Align with current Prisma schema

5. **🟢 Low Priority:** Stabilize SDK timeout tests
   - Already documented in Phase 1 completion log
   - Deferred to Phase 10 (comprehensive testing improvements)

---

## Next Steps

### Immediate (This Session):

1. Run full workspace lint: `pnpm -w lint > logs/lint-after.log 2>&1`
2. Identify and fix critical lint errors in apps/api and apps/web
3. Run typecheck: `pnpm -w typecheck > logs/typecheck-after.log 2>&1`
4. Fix test compilation issues
5. Run full test suite: `pnpm -w test -- --coverage > logs/test-after.log 2>&1`
6. Run build: `pnpm -w build > logs/build-after.log 2>&1`
7. Document final results
8. Commit with message: `chore(ci): Phase-0 remediation (lint+tests+sdk-eslint green)`

### Acceptance Gate:

- [ ] `pnpm -w lint` → ≤10 warnings, 0 critical errors
- [ ] `pnpm -w typecheck` → 0 errors in core apps
- [ ] `pnpm -w test` → All core test suites pass
- [ ] `pnpm -w build` → Success for all workspaces
- [ ] Evidence logs created in `logs/`
- [ ] Changes committed

---

## Files Modified

### Created:
- `eslint.config.mjs` (root)
- `core/sdk/eslint.config.mjs`
- `docs/evidence/PHASE0_REVALIDATED.md` (this file)

### Modified:
- `core/sdk/src/client.ts` (2 lint fixes)
- `core/sdk/package.json` (lint script update)

### Logs Created:
- `logs/lint-initial.log` (captured baseline)
- `logs/lint-after.log` (pending)
- `logs/test-after.log` (pending)
- `logs/build-after.log` (pending)
- `logs/typecheck-after.log` (pending)

---

## Progress Tracking

**Phase 0 Remediation Progress:** 30% Complete

- [✅] ESLint flat config created
- [✅] SDK dependencies installed
- [✅] SDK lint errors fixed
- [✅] SDK builds successfully
- [⏳] Full workspace lint validation
- [⏳] API/Web lint fixes
- [⏳] Test compilation fixes
- [⏳] Full build validation
- [⏳] Evidence collection complete

---

**Status:** 🟡 IN PROGRESS  
**Next Action:** Full workspace lint scan + fixes  
**Estimated Completion:** This session  

---

*Report will be updated as remediation progresses*

