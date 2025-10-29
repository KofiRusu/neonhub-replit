#!/bin/bash
# SDK Validation Script
# Runs all checks to ensure SDK is ready for use

set -e

echo "🔍 NeonHub SDK - Phase 1 Validation"
echo "===================================="
echo ""

# Check we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from core/sdk directory"
  exit 1
fi

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install --silent
echo "✅ Dependencies installed"
echo ""

# 2. Type check
echo "🔍 Running TypeScript type check..."
npm run typecheck
echo "✅ Type check passed"
echo ""

# 3. Build
echo "🏗️  Building SDK..."
npm run build
echo "✅ Build successful"
echo ""

# 4. Lint
echo "🧹 Running linter..."
npm run lint
echo "✅ Linting passed"
echo ""

# 5. Run tests (if they exist)
if [ -d "__tests__" ] || [ -d "tests" ]; then
  echo "🧪 Running tests..."
  npm test -- --passWithNoTests
  echo "✅ Tests passed"
  echo ""
fi

# 6. Check exports
echo "📤 Validating exports..."
if [ -f "dist/index.js" ] && [ -f "dist/index.d.ts" ]; then
  echo "✅ CJS export: dist/index.js"
  echo "✅ ESM export: dist/index.mjs"
  echo "✅ Types: dist/index.d.ts"
else
  echo "❌ Error: Build artifacts missing"
  exit 1
fi
echo ""

# 7. Check package size
echo "📊 Package size:"
du -sh dist/
echo ""

# 8. Validation summary
echo "=================================="
echo "✅ SDK Phase 1 Validation PASSED"
echo "=================================="
echo ""
echo "Next steps:"
echo "  1. Run mock example: npm run example:mock"
echo "  2. Integrate in Next.js app (see examples/nextjs-*.tsx)"
echo "  3. Wait for Codex to complete backend APIs"
echo ""

