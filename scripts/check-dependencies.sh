#!/bin/bash
# Health check for critical dependencies

set -euo pipefail

ERRORS=0

check_prisma_wasm() {
  local wasm_path
  wasm_path=$(find node_modules -path "*prisma/build/prisma_schema_build_bg.wasm" -print -quit 2>/dev/null || true)
  if [ -n "$wasm_path" ] && [ -f "$wasm_path" ]; then
    local size
    size=$(stat -f%z "$wasm_path" 2>/dev/null || stat -c%s "$wasm_path")
    if [ "$size" -gt 1000000 ]; then
      echo "✓ Prisma WASM OK ($size bytes)"
    else
      echo "✗ Prisma WASM corrupt (only $size bytes)"
      ERRORS=$((ERRORS + 1))
    fi
  else
    echo "✗ Prisma WASM missing"
    ERRORS=$((ERRORS + 1))
  fi
}

check_typescript_libs() {
  local count
  count=$(find node_modules/typescript/lib -name "lib.*.d.ts" 2>/dev/null | wc -l | tr -d ' ')
  if [ "${count:-0}" -gt 10 ]; then
    echo "✓ TypeScript libs OK ($count files)"
  else
    echo "✗ TypeScript libs incomplete (${count:-0} files)"
    ERRORS=$((ERRORS + 1))
  fi
}

check_eslint() {
  if [ -f "node_modules/eslint/package.json" ]; then
    echo "✓ ESLint OK"
  else
    echo "✗ ESLint corrupt"
    ERRORS=$((ERRORS + 1))
  fi
}

check_next() {
  if [ -f "node_modules/next/dist/bin/next" ]; then
    echo "✓ Next.js OK"
  else
    echo "✗ Next.js missing"
    ERRORS=$((ERRORS + 1))
  fi
}

echo "🔍 Checking dependency health..."
check_prisma_wasm
check_typescript_libs
check_eslint
check_next

if [ "$ERRORS" -eq 0 ]; then
  echo "✅ All dependencies healthy"
else
  echo "❌ $ERRORS critical dependency issues found"
  echo "Run: pnpm install --force"
fi

exit "$ERRORS"
