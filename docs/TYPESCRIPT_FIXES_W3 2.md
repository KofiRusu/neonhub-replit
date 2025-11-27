# TypeScript Fixes - Week 3

**Pre-existing errors:** 5  
**Status:** Documented for resolution  
**Impact:** Non-blocking (build succeeds with warnings)

---

## 🔍 Identified Issues

1. **src/ai/utils/cost.ts** — Missing `model` property in CostRow
2. **src/pages/api/**/*.ts** — Cannot find module 'next' (4 files)
3. **src/__mocks__/**/*.ts** — Jest type inference issues (excluded from build)

---

## ✅ Resolution Strategy

### Issue 1: Cost.ts (Quick Fix)

Add `model` property to cost entries or make optional in type definition.

### Issue 2: Legacy Next.js Pages (Delete or Isolate)

These files are unused (routes are in apps/web). Exclude from tsconfig or delete.

### Issue 3: Mock Type Issues (Already Handled)

Excluded from build via tsconfig.json `exclude` array.

---

## 📋 Type-Check in CI

Added to required workflows - see updated ci.yml and deploy workflows.

**Note:** Due to scope, focusing on production deployment readiness. TypeScript strict mode improvements deferred to post-launch optimization.

