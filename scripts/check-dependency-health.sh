#!/bin/bash
###############################################################################
# Dependency Health Check Script
# Purpose: Quick diagnostic for critical dependency issues
# Usage: ./scripts/check-dependency-health.sh
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  NeonHub Dependency Health Check          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# Check 1: Prisma WASM
###############################################################################

check_prisma_wasm() {
    echo -n "🔍 Prisma WASM Module: "
    WASM_PATH="node_modules/@prisma/prisma-schema-wasm/prisma_schema_build_bg.wasm"
    
    if [ ! -f "$WASM_PATH" ]; then
        echo -e "${RED}MISSING${NC}"
        echo "   └─ File not found: $WASM_PATH"
        ERRORS=$((ERRORS + 1))
        return
    fi
    
    # Get file size
    if [[ "$OSTYPE" == "darwin"* ]]; then
        SIZE=$(stat -f%z "$WASM_PATH")
    else
        SIZE=$(stat -c%s "$WASM_PATH")
    fi
    
    # WASM should be > 1MB
    if [ "$SIZE" -lt 1000000 ]; then
        echo -e "${RED}CORRUPTED${NC}"
        echo "   └─ File size: ${SIZE} bytes (expected > 1MB)"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}OK${NC} (${SIZE} bytes)"
    fi
}

###############################################################################
# Check 2: TypeScript Libraries
###############################################################################

check_typescript_libs() {
    echo -n "🔍 TypeScript Libraries: "
    
    if [ ! -d "node_modules/typescript/lib" ]; then
        echo -e "${RED}MISSING${NC}"
        echo "   └─ Directory not found: node_modules/typescript/lib"
        ERRORS=$((ERRORS + 1))
        return
    fi
    
    COUNT=$(find node_modules/typescript/lib -name "lib.*.d.ts" 2>/dev/null | wc -l | xargs)
    
    if [ "$COUNT" -lt 10 ]; then
        echo -e "${RED}INCOMPLETE${NC}"
        echo "   └─ Found ${COUNT} lib files (expected > 10)"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}OK${NC} (${COUNT} files)"
    fi
    
    # Check specific critical libs
    CRITICAL_LIBS=("lib.es2022.d.ts" "lib.dom.d.ts" "lib.esnext.d.ts")
    for lib in "${CRITICAL_LIBS[@]}"; do
        if [ ! -f "node_modules/typescript/lib/$lib" ]; then
            echo -e "   ${YELLOW}⚠${NC}  Missing: $lib"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
}

###############################################################################
# Check 3: ESLint
###############################################################################

check_eslint() {
    echo -n "🔍 ESLint: "
    
    if [ ! -f "node_modules/eslint/package.json" ]; then
        echo -e "${RED}CORRUPTED${NC}"
        echo "   └─ package.json not found in node_modules/eslint/"
        ERRORS=$((ERRORS + 1))
    else
        VERSION=$(node -p "require('./node_modules/eslint/package.json').version" 2>/dev/null)
        echo -e "${GREEN}OK${NC} (v${VERSION})"
    fi
}

###############################################################################
# Check 4: Next.js
###############################################################################

check_nextjs() {
    echo -n "🔍 Next.js: "
    
    if [ ! -f "node_modules/next/dist/bin/next" ]; then
        echo -e "${RED}MISSING${NC}"
        echo "   └─ Binary not found: node_modules/next/dist/bin/next"
        ERRORS=$((ERRORS + 1))
    else
        VERSION=$(node -p "require('./node_modules/next/package.json').version" 2>/dev/null)
        echo -e "${GREEN}OK${NC} (v${VERSION})"
    fi
}

###############################################################################
# Check 5: ts-jest
###############################################################################

check_tsjest() {
    echo -n "🔍 ts-jest: "
    
    if [ ! -d "node_modules/ts-jest" ]; then
        echo -e "${RED}MISSING${NC}"
        echo "   └─ Module not found: node_modules/ts-jest"
        ERRORS=$((ERRORS + 1))
    else
        VERSION=$(node -p "require('./node_modules/ts-jest/package.json').version" 2>/dev/null)
        echo -e "${GREEN}OK${NC} (v${VERSION})"
    fi
}

###############################################################################
# Check 6: Prisma Client
###############################################################################

check_prisma_client() {
    echo -n "🔍 Prisma Client: "
    
    if [ ! -d "node_modules/.prisma/client" ] && [ ! -d "apps/api/node_modules/.prisma/client" ]; then
        echo -e "${YELLOW}NOT GENERATED${NC}"
        echo "   └─ Run: pnpm --filter apps/api exec prisma generate"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}OK${NC}"
    fi
}

###############################################################################
# Check 7: pnpm lock file
###############################################################################

check_lockfile() {
    echo -n "🔍 pnpm lock file: "
    
    if [ ! -f "pnpm-lock.yaml" ]; then
        echo -e "${RED}MISSING${NC}"
        echo "   └─ Run: pnpm install"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}OK${NC}"
    fi
}

###############################################################################
# Check 8: Workspace integrity
###############################################################################

check_workspace() {
    echo -n "🔍 Workspace integrity: "
    
    WORKSPACES=("apps/api" "apps/web")
    MISSING=0
    
    for ws in "${WORKSPACES[@]}"; do
        if [ ! -f "$ws/package.json" ]; then
            echo -e "${RED}MISSING${NC}"
            echo "   └─ Workspace missing: $ws/package.json"
            ERRORS=$((ERRORS + 1))
            MISSING=1
            break
        fi
    done
    
    if [ $MISSING -eq 0 ]; then
        echo -e "${GREEN}OK${NC}"
    fi
}

###############################################################################
# Main execution
###############################################################################

main() {
    # Check if we're in the right directory
    if [ ! -f "pnpm-workspace.yaml" ]; then
        echo -e "${RED}Error: Must be run from NeonHub root directory${NC}"
        exit 1
    fi
    
    echo "Running dependency health checks..."
    echo ""
    
    # Run all checks
    check_prisma_wasm
    check_typescript_libs
    check_eslint
    check_nextjs
    check_tsjest
    check_prisma_client
    check_lockfile
    check_workspace
    
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
    
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        echo -e "${BLUE}║${GREEN}  ✅ All checks passed!                   ${BLUE}║${NC}"
        echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Your dependencies are healthy."
        exit 0
    elif [ $ERRORS -eq 0 ]; then
        echo -e "${BLUE}║${YELLOW}  ⚠️  ${WARNINGS} warnings found                   ${BLUE}║${NC}"
        echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Dependencies are functional but have minor issues."
        echo "Review warnings above for optimization opportunities."
        exit 0
    else
        echo -e "${BLUE}║${RED}  ❌ ${ERRORS} critical issues found           ${BLUE}║${NC}"
        if [ $WARNINGS -gt 0 ]; then
            echo -e "${BLUE}║${YELLOW}  ⚠️  ${WARNINGS} warnings found                   ${BLUE}║${NC}"
        fi
        echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${RED}Critical dependency issues detected!${NC}"
        echo ""
        echo "Recommended fix:"
        echo "  ./scripts/fix-dependencies.sh"
        echo ""
        exit 1
    fi
}

main "$@"

