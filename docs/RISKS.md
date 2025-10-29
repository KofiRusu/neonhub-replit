# NeonHub Risk Register

**Last Updated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")  
**Phase:** 0 (Pre-Flight Validation)

---

## Risk Categories

- 🔴 **Critical** - Blocks core functionality
- 🟡 **High** - Impacts user experience or development workflow
- 🟢 **Medium** - Minor issues, workarounds available
- ⚪ **Low** - Cosmetic or non-functional issues

---

## Active Risks

### 🟢 RISK-001: Lint Errors in Predictive Engine Module
**Category:** Code Quality  
**Severity:** Medium  
**Status:** Known Issue  
**Discovered:** Phase 0

**Description:**  
20 ESLint errors in `modules/predictive-engine` related to unused variables and imports.

**Impact:**  
- `pnpm -w lint` fails
- No functional impact on core apps
- CI workflow will fail on lint step

**Mitigation:**  
- Core API and Web apps function normally
- Tests pass independently
- Documented in baseline report

**Resolution Plan:**  
- Phase 10: Clean up unused imports
- Add lint ignore rules if intentional
- Update CI to allow warnings in experimental modules

**Owner:** TBD  
**Target:** Phase 10

---

### 🟢 RISK-002: Build Errors in QA Sentinel Module
**Category:** Build System  
**Severity:** Medium  
**Status:** Known Issue  
**Discovered:** Phase 0

**Description:**  
TypeScript compilation errors in `core/qa-sentinel` related to rootDir configuration and cross-module imports.

**Error Details:**
```
- TS6059: File not under 'rootDir'
- TS6307: File not listed in tsconfig file list
- TS2307: Cannot find module '@tensorflow/tfjs-node'
- TS7016: Missing type declarations for 'stats-lite'
```

**Impact:**  
- `pnpm -w build` fails
- QA Sentinel module non-functional
- Core apps (api/web) build successfully independently

**Mitigation:**  
- Core functionality unaffected
- QA Sentinel is experimental feature
- Core apps can be built individually

**Resolution Plan:**  
1. Fix tsconfig.json rootDir paths
2. Install missing dependencies (@tensorflow/tfjs-node, @types/stats-lite)
3. Review cross-module import strategy
4. Add to Phase 10 cleanup

**Owner:** TBD  
**Target:** Phase 10

---

### 🟢 RISK-003: Orchestrator Global Missing Dependencies
**Category:** Dependencies  
**Severity:** Medium  
**Status:** Known Issue  
**Discovered:** Phase 0

**Description:**  
`core/orchestrator-global` test suite fails due to missing `axios` and `uuid` packages.

**Impact:**  
- Test suite fails for orchestrator-global
- Module non-functional
- Does not block Phase 1-7 work

**Mitigation:**  
- Orchestrator will be refactored in Phase 8
- Missing dependencies documented
- Core API tests (38/38) passing

**Resolution Plan:**  
1. Install missing dependencies: `axios`, `uuid`
2. Review orchestrator architecture in Phase 8
3. Implement proper dependency management

**Owner:** TBD  
**Target:** Phase 8

---

### 🟡 RISK-004: Agent Table Empty After Seed
**Category:** Data Integrity  
**Severity:** High  
**Status:** Monitoring  
**Discovered:** Phase 0

**Description:**  
`agents` table has 0 rows after seed script completion.

**Impact:**  
- Agent-related features may not work
- Phase 8 (Agent Orchestration) may require additional setup
- Unclear if intentional or missing seed data

**Mitigation:**  
- Database connectivity confirmed working
- Other tables seeded successfully
- May be intentional (populated at runtime)

**Resolution Plan:**  
1. Review `prisma/seed.ts` for agent creation
2. Determine if agents should be pre-seeded
3. Add agent seed data or document runtime creation
4. Verify in Phase 8 implementation

**Owner:** TBD  
**Target:** Phase 1 (Investigation), Phase 8 (Resolution)

---

### ⚪ RISK-005: Prisma CLI Wrapper Script Issues
**Category:** Tooling  
**Severity:** Low  
**Status:** Workaround Available  
**Discovered:** Phase 0

**Description:**  
`scripts/run-cli.mjs` fails to resolve Prisma binary, falls back to offline generation.

**Impact:**  
- Slightly slower Prisma operations
- Confusing error messages in logs
- Functional (offline fallback works)

**Mitigation:**  
- Direct `npx prisma` commands work correctly
- Offline fallback mechanism functioning
- No impact on core functionality

**Resolution Plan:**  
1. Fix `run-cli.mjs` binary resolution logic
2. Or remove wrapper and use npx directly
3. Update package.json scripts accordingly

**Owner:** TBD  
**Target:** Phase 10

---

## Closed Risks

### ✅ CLOSED-001: Database Connectivity Issues
**Status:** Resolved  
**Closed:** Phase 0

**Description:**  
Initial concern about DATABASE_URL connectivity mentioned in READY_STATUS.md.

**Resolution:**  
- Confirmed Neon.tech connection works
- Applied 2 pending migrations successfully
- Seed data loaded correctly
- Connection stable across multiple operations

---

## Risk Mitigation Strategy

### Pre-Flight (Phase 0)
- ✅ Document all known issues
- ✅ Establish workarounds
- ✅ Confirm core apps functional

### Development (Phases 1-9)
- Monitor for new risks during implementation
- Update risk register weekly
- Escalate critical risks immediately

### Audit (Phase 10)
- Address all Medium+ severity risks
- Clean up code quality issues
- Fix build system problems
- Update CI/CD to handle known issues

### Launch (Phase 11)
- Zero Critical risks
- All High risks mitigated or accepted
- Runbooks for Medium risks

---

## Risk Assessment Matrix

| Phase | Critical | High | Medium | Low | Total |
|-------|----------|------|--------|-----|-------|
| 0     | 0        | 1    | 3      | 1   | 5     |
| 1     | TBD      | TBD  | TBD    | TBD | TBD   |

**Target for Launch:** 0 Critical, ≤2 High, ≤5 Medium

---

## Reporting

**Update Frequency:** After each phase completion  
**Review Cadence:** Weekly during development  
**Escalation:** Critical risks → Immediate, High risks → 48h

---

**Document Owner:** NeonHub Engineering  
**Last Review:** Phase 0 Completion  
**Next Review:** Phase 1 Completion

