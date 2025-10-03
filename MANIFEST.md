# Repository Cleanup Manifest
**Generated:** 2025-10-03  
**Branch:** chore/cleanup-20251003  
**Purpose:** Archive redundant files, organize documentation, keep app buildable

---

## 📊 Summary Statistics

```bash
Total candidates identified: ~50+ items
Estimated space to reclaim: ~500MB+ (build artifacts)
Archive location: _archive/2025-10-03/
```

---

## 🗑️ Category 1: Build Artifacts (Auto-regenerable)

**Action:** Move to archive (can be rebuilt anytime)

### Directories to Archive:
```
./Neon-v2.4.0/ui/.next        (~100MB - Next.js build)
./AutoOpt/orchestrator/dist   (TypeScript compiled output)
./frontend/.next              (~100MB - Old Next.js build)
./dist                        (Root dist - build output)
./Neon0.2/dist               (Old version build)
./backend/dist               (Backend compiled output)
./Neon-v2.5.0/ui/.next       (~100MB - Next.js build)
./coverage                    (Test coverage reports)
```

**Total:** 8 directories  
**Estimated size:** ~500-800MB  
**Impact:** NONE - All regenerable via `npm run build`

---

## 🗂️ Category 2: Documentation Files (To Organize)

**Action:** Move to /docs/ folder (except README.md & STATUS.md)

### Files to Move to /docs/:
```
AUDIT_REPORT.md               (Audit documentation)
CHANGES.md                    (Historical changes)
COMPLETE.md                   (Completion notes)
DEPLOYMENT.md                 (Deployment guide - keep accessible)
FINAL_SUMMARY.md              (Project summary)
IMPLEMENTATION_PROGRESS.md    (Progress tracking)
PHASE1_COMPLETE.md            (Phase documentation)
PHASE3_COMPLETE.md            (Phase documentation)
QUICKSTART.md                 (Quick start guide)
README_V0_WORKFLOW.md         (v0 workflow docs)
RELEASE_v2.5.0.md            (Release notes)
SETUP.md                      (Setup instructions)
UI_AUDIT.md                   (UI audit report)
V0_MASTER_PROMPT.md           (v0 prompts)
V0_PROMPTS.md                 (v0 prompts)
V0_WORKFLOW_GUIDE.md          (v0 workflow)
VERCEL_BUILD_FIX.md          (Build fix notes)
```

**Total:** 17 markdown files  
**Keep at root:** README.md, STATUS.md  
**Impact:** Cleaner root, organized documentation

---

## 📁 Category 3: Potentially Old/Redundant Directories

**Action:** ANALYZE FIRST - Need confirmation before archiving

### Candidates for Review:
```
AutoOpt/                      (Auto-optimization tool - is this still used?)
Neon0.2/                     (Old version 0.2 - superseded by v2.5.0)
frontend/                     (Standalone frontend - duplicate of Neon-v2.x/ui?)
orchestrator/                 (Orchestrator service - integrated elsewhere?)
packages/                     (Monorepo packages - are these active?)
services/                     (Old services - migrated to backend/?)
src/                         (Root src - duplicate of backend/src?)
tests/                       (Root tests - duplicate of backend/tests?)
```

**Total:** 8 directories  
**Status:** NEEDS MANUAL REVIEW  
**Impact:** UNKNOWN - Requires confirmation

**⚠️  DECISION NEEDED:** Should these be archived or kept?

---

## 🧹 Category 4: OS Cruft & Temporary Files

**Action:** Remove or archive

### Found:
```
(None found - repository is clean!)
```

**Total:** 0 files  
**Impact:** None

---

## 🖼️ Category 5: Large Media Files

**Action:** Archive if in root (keep if in public/)

### Found:
```
(None found in root - all media properly organized in public/ folders)
```

**Total:** 0 files  
**Impact:** None

---

## 📋 Execution Plan

### Phase 1: Safe Archival (EXECUTE)
1. ✅ Move build artifacts to `_archive/2025-10-03/`
2. ✅ Create `/docs` and move documentation files
3. ✅ Keep README.md and STATUS.md at root

### Phase 2: Review & Decide (MANUAL)
4. ⏸️  Review old directories (AutoOpt, Neon0.2, frontend, etc.)
5. ⏸️  Decide: Archive or Keep?
6. ⏸️  Document decision in STATUS.md

### Phase 3: Verify (AUTOMATED)
7. ✅ Build frontend: `pnpm -C Neon-v2.4.0/ui build`
8. ✅ Build backend: `pnpm -C backend build`
9. ✅ Run smoke tests if available

---

## ✅ Safety Guarantees

### Protected Paths (Never Touched):
- ✅ /backend (production backend)
- ✅ /Neon-v2.4.0/ui (production UI)
- ✅ /Neon-v2.5.0 (latest version)
- ✅ /.github (CI/CD workflows)
- ✅ /scripts (automation scripts)
- ✅ docker-compose.yml
- ✅ vercel.json
- ✅ README.md
- ✅ All node_modules/ (any depth)
- ✅ All prisma/ migrations/
- ✅ All src/, app/, components/, public/
- ✅ All .env*, .git*, package.json, tsconfig.json

### What Gets Archived:
- Build caches (.next, dist, coverage)
- Historical documentation (moved to /docs)
- Potentially old directories (after review)

### What Gets Preserved:
- All source code
- All configurations
- All dependencies
- All git history
- All production apps

---

## 🎯 Expected Outcomes

### After Cleanup:
- ✅ ~500-800MB disk space reclaimed
- ✅ Cleaner root directory (fewer files)
- ✅ Organized documentation (/docs folder)
- ✅ Preserved git history (using git mv)
- ✅ All builds still work
- ✅ Zero functional changes

### Rollback Plan:
```bash
# If anything breaks:
git checkout main
git branch -D chore/cleanup-20251003

# Or restore specific files:
git checkout HEAD -- path/to/file
```

---

## 📝 Notes

1. **Build artifacts** are safe to archive - they regenerate on `npm run build`
2. **Documentation** is preserved in /docs with better organization
3. **Old directories** need manual review before archiving
4. **All moves** use `git mv` to preserve history
5. **Builds verified** before final commit

---

**Status:** Ready for Phase 1 execution  
**Risk Level:** LOW (only archiving regenerable builds and organizing docs)  
**Rollback:** Easy (git checkout)

