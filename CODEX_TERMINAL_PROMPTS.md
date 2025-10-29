# Codex Terminal Prompts - Phase 2

**Generated**: October 29, 2025  
**Coordination**: Multi-Agent Workflow  
**Purpose**: Parallel execution of test fixes and build improvements

---

## 🔴 CODEX TERMINAL B: Test Suite Fixes (HIGH PRIORITY)

### Context

You are fixing TypeScript test failures in the NeonHub backend test suite.

**Current State**:
- ✅ Dependencies installed (1,871 packages)
- ✅ Prisma Client generated
- ✅ TypeScript compiles with 0 errors
- ✅ Build succeeds
- ❌ ~7 test files have failures (type mismatches, assertion errors, timeouts)

**Your Goal**: Fix all test failures so the full test suite passes with 0 errors.

---

### Your Tasks (Execute in Order)

#### Task 1: Fix Type Mismatches in Route Tests

**File 1**: `apps/api/src/__tests__/routes/feedback.test.ts`
- **Line 227**: `result.byType` is typed `{}`
- **Issue**: Mock response doesn't match actual type
- **Fix**: 
  1. Check actual return type from the route
  2. Update mock to match OR add type assertion
  3. Verify test passes

**File 2**: `apps/api/src/__tests__/routes/messages.test.ts`
- **Lines 50, 71, 72, 159, 160**: Expecting fields that don't exist
- **Missing fields**: `isRead`, `replyToId`, `threadId`, `readAt`
- **Fix**:
  1. Check Message model in `@prisma/client`
  2. Either add fields to mock OR update test expectations
  3. Verify tests pass

**File 3**: `apps/api/src/__tests__/routes/documents.test.ts`
- **Lines 204, 205**: Expecting fields that don't exist
- **Missing fields**: `version`, `parentId`
- **Fix**:
  1. Check Document model in `@prisma/client`
  2. Either add fields to mock OR update test expectations
  3. Verify tests pass

---

#### Task 2: Fix Mock Type Errors

**File 4**: `apps/api/src/services/trends.service.test.ts`
- **Lines 18, 32**: Mock methods don't exist
- **Issue**: `socialApiClient.fetchRedditTrends` and `aggregateTrends` are not in the interface
- **Fix**:
  1. Find the actual `socialApiClient` interface
  2. Update mock to match interface
  3. Ensure return types are correct (not `never[]`)

**File 5**: `apps/api/src/events/tests/bus.test.ts`
- **Line 4**: Passing `undefined` to parameter typed `never`
- **Fix**:
  1. Find the actual parameter type expected
  2. Provide correct value or update mock
  3. Verify test passes

---

#### Task 3: Fix Assertion Failures

**File 6**: `apps/api/src/services/budgeting/__tests__/simulation-engine.test.ts`
- **Lines 161, 195**: Deterministic/variance/ROI assertions fail
- **Issues**:
  - Line 161: Boolean false assertion fails
  - Line 195: ROI value mismatch
- **Fix**:
  1. Run the actual simulation logic
  2. Determine correct expected values
  3. Update assertions OR fix calculation
  4. Verify tests pass

---

#### Task 4: Fix Connector Timeouts

**File 7**: `apps/api/src/connectors/__tests__/slack-connector.test.ts`
- **Lines 7, 16**: Tests timeout
- **Fix**:
  ```typescript
  // Option 1: Increase timeout
  jest.setTimeout(10000); // 10 seconds
  
  // Option 2: Mock the API call properly
  jest.mock('../services/SlackConnector', () => ({
    SlackConnector: jest.fn().mockImplementation(() => ({
      sendMessage: jest.fn().mockResolvedValue({ ok: true })
    }))
  }));
  ```

**File 8**: `apps/api/src/connectors/__tests__/gmail-connector.test.ts`
- **Lines 7, 16**: Tests timeout
- **Fix**: Same as slack-connector (increase timeout or improve mocks)

---

### Constraints & Rules

**CRITICAL - Follow These**:

1. **Use Actual Prisma Types**
   ```typescript
   import { User, Message, Document } from '@prisma/client';
   // Don't create fake types
   ```

2. **Don't Mock Types**
   - Use real schema types
   - Check `apps/api/prisma/schema.prisma` for field names
   - Import from `@prisma/client`

3. **Keep Tests Fast**
   - Each test should complete in <5 seconds
   - Use `jest.setTimeout(10000)` only if needed
   - Prefer mocking over real API calls

4. **Run Tests After Each Fix**
   ```bash
   # After fixing each file, run:
   pnpm --filter @neonhub/backend-v3.2 exec jest path/to/test.test.ts --maxWorkers=50%
   
   # Verify it passes before moving to next file
   ```

5. **Provide Evidence**
   - Show the file you edited
   - Show the specific lines changed
   - Show the test output (passed/failed)
   - Include actual error messages if still failing

---

### Execution Sequence

```bash
# 1. Start in project root
cd /Users/kofirusu/Desktop/NeonHub

# 2. For each test file:
#    a. Read the file
#    b. Identify the issue
#    c. Make the fix
#    d. Run that specific test
#    e. Verify it passes
#    f. Move to next file

# 3. After all individual fixes:
pnpm --filter @neonhub/backend-v3.2 exec jest --ci --passWithNoTests --maxWorkers=50%

# 4. Report results
```

---

### Expected Output Format

For each file you fix, provide:

```markdown
### Fixed: apps/api/src/__tests__/routes/feedback.test.ts

**Issue**: result.byType was typed {}

**Fix Applied**:
Line 227:
- const byType = result.byType;
+ const byType = result.byType as Record<string, number>;

**Test Result**:
✅ PASS apps/api/src/__tests__/routes/feedback.test.ts
  ✓ should group feedback by type (45ms)
```

---

### Final Deliverable

After ALL fixes complete:

```markdown
## Phase 2B Complete ✅

**Files Fixed**: 8
**Test Failures**: 0
**Test Suite Status**: All passing

### Test Run Output:
[paste full output of final test run]

### Files Modified:
1. apps/api/src/__tests__/routes/feedback.test.ts
2. apps/api/src/__tests__/routes/messages.test.ts
3. apps/api/src/__tests__/routes/documents.test.ts
4. apps/api/src/services/trends.service.test.ts
5. apps/api/src/events/tests/bus.test.ts
6. apps/api/src/services/budgeting/__tests__/simulation-engine.test.ts
7. apps/api/src/connectors/__tests__/slack-connector.test.ts
8. apps/api/src/connectors/__tests__/gmail-connector.test.ts

### Coverage:
[if available, show coverage percentages]

**Ready for**: Phase 3 (Backend Implementation)
```

---

## 🟡 CODEX TERMINAL A: Build Script & Documentation (MEDIUM PRIORITY)

### Context

You are fixing the build tooling and improving documentation for NeonHub.

**Current State**:
- ✅ Dependencies installed
- ✅ TypeScript builds (with `npx tsc`)
- ⚠️ `npm run build` requires NODE_PATH workaround
- ⚠️ `scripts/run-cli.mjs` cannot resolve pnpm workspace binaries

**Your Goal**: Fix build scripts so they work without manual workarounds.

---

### Your Tasks (Execute in Order)

#### Task 1: Fix run-cli.mjs Module Resolution

**File**: `scripts/run-cli.mjs`

**Current Issue**:
```
Error: Cannot find module 'prisma/build/index.js'
Workaround: Set NODE_PATH=$(pwd)/apps/api/node_modules:$(pwd)/apps/web/node_modules
```

**Fix Required**:

```javascript
// scripts/run-cli.mjs
// Update the resolveBinary function around line 52

function resolveBinary(pkg) {
  const searchPaths = [
    path.join(process.cwd(), 'node_modules'),
    path.join(__dirname, '../node_modules'),
    path.join(__dirname, '../apps/api/node_modules'),
    path.join(__dirname, '../apps/web/node_modules')
  ];

  for (const searchPath of searchPaths) {
    try {
      // Try standard resolution
      return require.resolve(pkg, { paths: [searchPath] });
    } catch {
      try {
        // Try pnpm structure: .pnpm/package@version/node_modules/package
        const pnpmGlob = path.join(searchPath, '.pnpm', `${pkg}@*`, 'node_modules', pkg);
        const fs = require('fs');
        const pnpmDir = path.join(searchPath, '.pnpm');
        
        if (fs.existsSync(pnpmDir)) {
          const pkgDirs = fs.readdirSync(pnpmDir).filter(d => d.startsWith(pkg + '@'));
          if (pkgDirs.length > 0) {
            const pkgPath = path.join(pnpmDir, pkgDirs[0], 'node_modules', pkg);
            return require.resolve(pkg, { paths: [pkgPath] });
          }
        }
      } catch {}
    }
  }

  // Final fallback
  return require.resolve(pkg);
}
```

**Test After Fix**:
```bash
cd apps/api
npm run prisma:generate  # Should work without NODE_PATH
npm run build            # Should work without NODE_PATH
```

---

#### Task 2: Add .npmrc Configuration (Optional)

**File**: `.npmrc` (create in project root)

```
# Enable hoisting for better binary resolution
node-linker=hoisted

# Keep pnpm settings
shamefully-hoist=false
strict-peer-dependencies=false
```

**Test**:
```bash
pnpm install
ls -la node_modules/.bin/prisma  # Should exist
```

**Note**: This is optional - if run-cli.mjs fix works, you can skip this.

---

#### Task 3: Document the Migration Strategy

Update `DB_DEPLOYMENT_RUNBOOK.md` to include the migration consolidation strategy.

**Add new section** (after existing content):

```markdown
## Handling Existing Schema (Migration Consolidation)

### Background

The NeonHub migration history had inconsistent draft migrations that prevented 
proper `prisma migrate deploy`. We resolved this by using `prisma db push` 
and manually tracking migrations.

### When to Use This Approach

- Migration files are inconsistent or broken
- Need to deploy quickly
- Schema is already correct (via db push)

### Steps

1. Deploy schema: `npx prisma db push`
2. Mark migrations as applied (see MIGRATION_STRATEGY.md)
3. Verify: `npx prisma migrate status`
4. Enable extensions: vector, uuid-ossp, citext

### Verification

Run: `./scripts/verify-migrations.sh`

Expected: All checks pass ✅

### For Production

Use same approach - see docs/MIGRATION_STRATEGY.md for details.
```

---

### Constraints & Rules

**CRITICAL - Follow These**:

1. **Don't Modify Database**
   - Migrations already handled
   - Don't run SQL commands
   - Only fix code and documentation

2. **Test Your Changes**
   ```bash
   # After fixing run-cli.mjs
   cd apps/api
   npm run build
   npm run prisma:generate
   
   # Should work without setting NODE_PATH
   ```

3. **Preserve Existing Functionality**
   - Don't break working code
   - Keep fallback logic
   - Test both success and error paths

4. **Document Clearly**
   - Use markdown
   - Include code examples
   - Add troubleshooting tips

---

### Expected Output Format

```markdown
## Phase 2C Complete ✅

### Task 1: run-cli.mjs Fixed

**Changes Made**:
- Updated resolveBinary() function (lines 52-85)
- Added pnpm workspace path resolution
- Added fallback logic

**Code Diff**:
[show the specific changes]

**Test Results**:
✅ npm run build works (no NODE_PATH needed)
✅ npm run prisma:generate works
✅ No MODULE_NOT_FOUND errors

### Task 2: .npmrc Configuration

**Status**: [Completed / Skipped - explain why]

### Task 3: Documentation Updated

**Files Modified**:
- DB_DEPLOYMENT_RUNBOOK.md (added migration consolidation section)

**Content Added**:
- Background on migration strategy
- When to use db push vs migrate deploy
- Verification steps
- Production deployment notes

**Ready for**: Phase 3 (Backend Implementation)
```

---

## 📊 Coordination Matrix

### Task Dependencies

```
Main Agent (Neon) ✅
├── Migration history fixed
├── Verification script created
├── Documentation written
└── State tracking established
    │
    ├── Codex Terminal B (PARALLEL) ⏳
    │   └── Fix 8 test files
    │       └── Verify 0 failures
    │
    └── Codex Terminal A (PARALLEL) ⏳
        └── Fix run-cli.mjs
            └── Update documentation
```

**No dependencies between A and B** - can run in parallel!

---

### Success Criteria (Both Terminals)

**Terminal B Success**:
```bash
pnpm --filter @neonhub/backend-v3.2 exec jest --ci --passWithNoTests --maxWorkers=50%
# Output: Tests: X passed, X total (0 failed)
```

**Terminal A Success**:
```bash
cd apps/api && npm run build
# Output: Clean build, no errors, no NODE_PATH needed
```

**Combined Success**:
- All tests passing
- Build scripts work without workarounds
- Documentation updated
- Ready for Phase 3

---

## 🚨 Critical Warnings

### For Both Terminals

1. **DO NOT**:
   - Modify database directly
   - Change migration files
   - Edit `apps/api/prisma/schema.prisma`
   - Remove tests (fix them instead)
   - Commit changes (report back first)

2. **DO**:
   - Read actual files before editing
   - Check actual types from `@prisma/client`
   - Run tests after each fix
   - Provide evidence (diffs, output logs)
   - Update PHASE2_STATE.md when complete

3. **If You Get Stuck**:
   - Report the issue clearly
   - Show what you tried
   - Include error messages
   - Ask for guidance
   - Don't guess or hallucinate

---

## 📝 Reporting Back

### When Both Terminals Complete

Provide this information:

**Terminal A**:
- Files modified (with line numbers)
- Test commands run and results
- Any issues encountered
- Final verification output

**Terminal B**:
- Files modified (with line numbers)
- Build commands run and results
- Any issues encountered
- Final verification output

**Format**:
```
CODEX TERMINAL A COMPLETE

Tasks: 3/3 ✅
Files Modified: 2
Issues: 0

[detailed output here]

---

CODEX TERMINAL B COMPLETE

Tasks: 4/4 ✅
Files Modified: 8
Test Failures: 0

[detailed output here]
```

---

**Ready to Execute**: Copy prompts above to respective terminals  
**Estimated Time**: 1-2 hours total (parallel execution)  
**Next Phase**: Phase 3 (Backend Completion) after verification
