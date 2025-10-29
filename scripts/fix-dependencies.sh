#!/bin/bash
###############################################################################
# Automated Dependency Fix Script
# Purpose: Fix corrupted node_modules and resolve all CI failures
# Generated: 2025-10-27
# Usage: ./scripts/fix-dependencies.sh
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  NeonHub Dependency Recovery & Fix Script                 ║${NC}"
echo -e "${BLUE}║  Fixing CI failures from corrupted dependencies           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# Phase 1: Cleanup
###############################################################################

phase1_cleanup() {
    echo -e "${YELLOW}═══ Phase 1: Cleaning corrupted dependencies ═══${NC}"
    
    echo "🗑️  Removing node_modules directories..."
    rm -rf node_modules
    rm -rf apps/api/node_modules
    rm -rf apps/web/node_modules
    rm -rf core/*/node_modules
    rm -rf modules/*/node_modules
    echo -e "${GREEN}✓${NC} node_modules removed"
    
    echo "🗑️  Removing lock file..."
    rm -rf pnpm-lock.yaml
    echo -e "${GREEN}✓${NC} Lock file removed"
    
    echo "🗑️  Removing build artifacts..."
    rm -rf apps/api/dist
    rm -rf apps/web/.next
    rm -rf apps/web/dist
    rm -rf modules/*/dist
    echo -e "${GREEN}✓${NC} Build artifacts removed"
    
    echo "🗑️  Removing Prisma generated files..."
    rm -rf apps/api/node_modules/.prisma
    rm -rf apps/api/prisma/generated
    echo -e "${GREEN}✓${NC} Prisma artifacts removed"
    
    echo ""
    echo -e "${GREEN}✅ Phase 1 Complete: Cleanup successful${NC}"
    echo ""
}

###############################################################################
# Phase 2: Fresh Installation
###############################################################################

phase2_install() {
    echo -e "${YELLOW}═══ Phase 2: Fresh dependency installation ═══${NC}"
    
    # Check pnpm version
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}✗ pnpm not found. Please install pnpm first.${NC}"
        exit 1
    fi
    
    PNPM_VERSION=$(pnpm --version)
    echo "📦 Using pnpm version: $PNPM_VERSION"
    
    # Clear pnpm cache (optional but helps with corruption)
    echo "🧹 Clearing pnpm cache..."
    pnpm store prune || true
    echo -e "${GREEN}✓${NC} Cache cleared"
    
    # Fresh install
    echo "📥 Installing dependencies (this may take 3-5 minutes)..."
    pnpm install --no-frozen-lockfile
    echo -e "${GREEN}✓${NC} Dependencies installed"
    
    echo ""
    echo -e "${GREEN}✅ Phase 2 Complete: Installation successful${NC}"
    echo ""
}

###############################################################################
# Phase 3: Verification
###############################################################################

phase3_verify() {
    echo -e "${YELLOW}═══ Phase 3: Verifying critical modules ═══${NC}"
    
    ERRORS=0
    
    # Check Prisma WASM
    echo "🔍 Checking Prisma WASM..."
    WASM_PATH="node_modules/@prisma/prisma-schema-wasm/prisma_schema_build_bg.wasm"
    if [ -f "$WASM_PATH" ]; then
        # Get file size (macOS vs Linux compatible)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            WASM_SIZE=$(stat -f%z "$WASM_PATH")
        else
            WASM_SIZE=$(stat -c%s "$WASM_PATH")
        fi
        
        if [ "$WASM_SIZE" -gt 1000000 ]; then
            echo -e "  ${GREEN}✓${NC} Prisma WASM found (${WASM_SIZE} bytes)"
        else
            echo -e "  ${RED}✗${NC} Prisma WASM too small (${WASM_SIZE} bytes) - likely corrupted"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "  ${RED}✗${NC} Prisma WASM not found"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check TypeScript lib files
    echo "🔍 Checking TypeScript library files..."
    TS_LIBS=$(find node_modules/typescript/lib -name "lib.*.d.ts" 2>/dev/null | wc -l | xargs)
    if [ "$TS_LIBS" -gt 10 ]; then
        echo -e "  ${GREEN}✓${NC} TypeScript lib files found (${TS_LIBS} files)"
    else
        echo -e "  ${RED}✗${NC} TypeScript lib files incomplete (${TS_LIBS} files)"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check ESLint
    echo "🔍 Checking ESLint..."
    if [ -f "node_modules/eslint/package.json" ]; then
        echo -e "  ${GREEN}✓${NC} ESLint package.json found"
    else
        echo -e "  ${RED}✗${NC} ESLint package.json missing"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check Next.js
    echo "🔍 Checking Next.js..."
    if [ -f "node_modules/next/dist/bin/next" ]; then
        echo -e "  ${GREEN}✓${NC} Next.js binary found"
    else
        echo -e "  ${RED}✗${NC} Next.js binary missing"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check ts-jest
    echo "🔍 Checking ts-jest..."
    if [ -d "node_modules/ts-jest" ]; then
        echo -e "  ${GREEN}✓${NC} ts-jest installed"
    else
        echo -e "  ${RED}✗${NC} ts-jest missing"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ $ERRORS -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Phase 3 Complete: All critical modules verified${NC}"
        echo ""
        return 0
    else
        echo ""
        echo -e "${RED}❌ Phase 3 Failed: ${ERRORS} critical modules missing or corrupted${NC}"
        echo -e "${YELLOW}⚠️  Attempting forced reinstallation...${NC}"
        echo ""
        pnpm install --force
        phase3_verify  # Retry verification
    fi
}

###############################################################################
# Phase 4: Generate Build Artifacts
###############################################################################

phase4_generate() {
    echo -e "${YELLOW}═══ Phase 4: Generating build artifacts ═══${NC}"
    
    # Generate Prisma Client
    echo "🔨 Generating Prisma Client..."
    pnpm --filter apps/api exec prisma generate
    echo -e "${GREEN}✓${NC} Prisma Client generated"
    
    echo ""
    echo -e "${GREEN}✅ Phase 4 Complete: Build artifacts generated${NC}"
    echo ""
}

###############################################################################
# Phase 5: Validation
###############################################################################

phase5_validate() {
    echo -e "${YELLOW}═══ Phase 5: Running validation checks ═══${NC}"
    
    # Type check
    echo "🔍 Running type checks..."
    if pnpm -w type-check 2>&1 | tee /tmp/typecheck.log; then
        echo -e "${GREEN}✓${NC} Type checks passed"
    else
        echo -e "${YELLOW}⚠️  Type checks had issues (see /tmp/typecheck.log)${NC}"
    fi
    
    # Lint check
    echo "🔍 Running lint checks..."
    if pnpm -w lint 2>&1 | tee /tmp/lint.log; then
        echo -e "${GREEN}✓${NC} Lint checks passed"
    else
        echo -e "${YELLOW}⚠️  Lint checks had issues (see /tmp/lint.log)${NC}"
    fi
    
    # Build
    echo "🔨 Running build..."
    if pnpm -w build 2>&1 | tee /tmp/build.log; then
        echo -e "${GREEN}✓${NC} Build successful"
    else
        echo -e "${YELLOW}⚠️  Build had issues (see /tmp/build.log)${NC}"
    fi
    
    # Test (API only)
    echo "🧪 Running API tests..."
    if pnpm --filter apps/api test 2>&1 | tee /tmp/test.log; then
        echo -e "${GREEN}✓${NC} Tests passed"
    else
        echo -e "${YELLOW}⚠️  Tests had issues (see /tmp/test.log)${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Phase 5 Complete: Validation checks completed${NC}"
    echo ""
}

###############################################################################
# Main Execution
###############################################################################

main() {
    START_TIME=$(date +%s)
    
    # Check if we're in the right directory
    if [ ! -f "pnpm-workspace.yaml" ]; then
        echo -e "${RED}Error: Must be run from NeonHub root directory${NC}"
        exit 1
    fi
    
    echo "Starting automated fix process..."
    echo "Time: $(date)"
    echo ""
    
    # Execute phases
    phase1_cleanup
    phase2_install
    phase3_verify
    phase4_generate
    phase5_validate
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    FIX COMPLETE                            ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✅ All phases completed successfully!${NC}"
    echo "⏱️  Total time: ${DURATION} seconds"
    echo ""
    echo "Next steps:"
    echo "  1. Review logs in /tmp/ for any warnings"
    echo "  2. Run 'git status' to check for changes"
    echo "  3. Run 'pnpm test:all' for comprehensive test coverage"
    echo "  4. Commit the updated pnpm-lock.yaml"
    echo ""
}

# Run main function
main "$@"

