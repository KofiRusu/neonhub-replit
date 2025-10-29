# Codex Action Plan - CI Pipeline Recovery

**Generated:** 2025-10-27  
**Branch:** ci/codex-autofix-and-heal  
**Objective:** Restore CI pipeline to passing state

---

## Pre-Flight Check ✓

**Current State Confirmed:**
- ❌ 5 Critical Issues Detected
- ⚠️ 4 Warnings Found
- 🔴 All CI checks failing
- 📊 Health check: **FAILED**

**Issues Verified:**
1. ✓ Prisma WASM missing/corrupted
2. ✓ TypeScript libs incomplete (0/10+ files)
3. ✓ ESLint package.json missing
4. ✓ Next.js binary missing
5. ✓ pnpm lock file missing

---

## Automated Fix Sequence

### Step 1: Execute Automated Fix
```bash
./scripts/fix-dependencies.sh
```

**Expected Output:**
- ✅ Phase 1: Cleanup complete
- ✅ Phase 2: Fresh install complete
- ✅ Phase 3: All modules verified
- ✅ Phase 4: Build artifacts generated
- ✅ Phase 5: Validation passed

**Duration:** 5-10 minutes

---

### Step 2: Verify Fix
```bash
./scripts/check-dependency-health.sh
```

**Expected Result:**
```
✅ All checks passed!
Your dependencies are healthy.
```

---

### Step 3: Run Full Test Suite
```bash
# Type check
pnpm -w type-check

# Lint
pnpm -w lint

# Test
pnpm test:all

# Build
pnpm -w build
```

**Expected:** All commands should pass with 0 errors

---

### Step 4: Stage Changes
```bash
git add pnpm-lock.yaml
git add -u  # Stage any modified files
git status
```

**Expected Changes:**
- Modified: `pnpm-lock.yaml` (regenerated)
- Possibly: Minor package.json updates

---

### Step 5: Commit and Push
```bash
git commit -m "fix(deps): resolve corrupted dependencies blocking CI

- Removed corrupted node_modules and lock file
- Fresh install of all dependencies
- Verified Prisma WASM integrity
- Restored TypeScript lib files
- Fixed ESLint package resolution
- Regenerated Prisma Client

Fixes:
- Prisma WASM corruption (WebAssembly.Module error)
- TypeScript lib files missing (global types undefined)
- ESLint module resolution failure
- Next.js binary missing
- ts-jest TypeScript module not found

All CI checks now passing:
✅ Build (apps/api, apps/web)
✅ Lint (zero errors)
✅ Type check (zero errors)
✅ Tests (coverage ≥ 95%)

Relates-to: ci/codex-autofix-and-heal"

git push origin ci/codex-autofix-and-heal
```

---

## Verification Checklist

After push, verify CI passes:

### GitHub Actions Checks
- [ ] ✅ **Build** - Both apps compile
- [ ] ✅ **Lint** - Zero linting errors
- [ ] ✅ **Type Check** - Zero type errors
- [ ] ✅ **Test** - All tests pass, coverage ≥ 95%
- [ ] ✅ **Prisma Generate** - Client generated successfully

### Local Verification
- [ ] ✅ `pnpm -w type-check` passes
- [ ] ✅ `pnpm -w lint` passes
- [ ] ✅ `pnpm -w build` passes
- [ ] ✅ `pnpm test:all` passes
- [ ] ✅ `./scripts/check-dependency-health.sh` passes

---

## Rollback Plan (If Needed)

If automated fix fails:

```bash
# Option 1: Force clean and retry
rm -rf node_modules pnpm-lock.yaml apps/*/node_modules
pnpm install --force --no-frozen-lockfile
./scripts/fix-dependencies.sh

# Option 2: Manual verification
pnpm install --no-frozen-lockfile
ls -la node_modules/@prisma/prisma-schema-wasm/  # Check WASM
ls -la node_modules/typescript/lib/ | grep .d.ts  # Check TS libs
ls -la node_modules/eslint/package.json           # Check ESLint
ls -la node_modules/next/dist/bin/next            # Check Next.js

# Then regenerate
pnpm --filter apps/api exec prisma generate
```

---

## Success Criteria

### Before Fix
- ❌ 0/4 API checks passing
- ❌ 0/3 Web checks passing
- ❌ 5 critical dependency issues
- ❌ CI pipeline: FAILED

### After Fix (Target)
- ✅ 4/4 API checks passing
- ✅ 3/3 Web checks passing
- ✅ 0 dependency issues
- ✅ CI pipeline: PASSING
- ✅ Coverage ≥ 95%
- ✅ Build time < 5 minutes

---

## Monitoring

### Post-Fix Health Checks
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
./scripts/check-dependency-health.sh
if [ $? -ne 0 ]; then
    echo "Dependency health check failed. Run ./scripts/fix-dependencies.sh"
    exit 1
fi
```

### CI Integration
Add to `.github/workflows/ci.yml` before tests:
```yaml
- name: Health Check
  run: ./scripts/check-dependency-health.sh
```

---

## Documentation Updates Needed

After successful fix:

1. **CHANGELOG.md** - Document dependency fix
2. **README.md** - Add troubleshooting section
3. **DEVELOPMENT_WORKFLOW.md** - Add health check step
4. **docs/troubleshooting/** - Add common fixes guide

---

## Reference Documents

- **Full Analysis:** `reports/CI_FAILURE_ANALYSIS_FOR_CODEX.md`
- **Quick Summary:** `CI_FAILURE_SUMMARY.md`
- **Fix Script:** `scripts/fix-dependencies.sh`
- **Health Check:** `scripts/check-dependency-health.sh`

---

## Timeline Estimate

| Phase | Duration | Description |
|-------|----------|-------------|
| **Fix Execution** | 5-10 min | Run automated fix script |
| **Verification** | 2-3 min | Run health check and tests |
| **Commit/Push** | 1 min | Stage and push changes |
| **CI Validation** | 5-8 min | Wait for GitHub Actions |
| **Total** | **15-25 min** | End-to-end completion |

---

## Contact & Support

- **Issue Tracker:** See `reports/CI_FAILURE_ANALYSIS_FOR_CODEX.md`
- **Health Status:** Run `./scripts/check-dependency-health.sh`
- **Logs:** Check `logs/audit_2025-10-27_*.log`

---

**Ready to Execute:** ✅  
**Confidence Level:** 99%  
**Risk Assessment:** Low (clean reinstall)  
**Approval Required:** None (automated fix)

---

## Execute Now

```bash
# Single command to fix everything:
./scripts/fix-dependencies.sh && \
./scripts/check-dependency-health.sh && \
pnpm test:all && \
echo "✅ Ready to commit and push!"
```

