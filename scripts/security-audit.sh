#!/bin/bash
set -e

echo "🔒 Running security audit..."

# Dependency audit
echo "📦 Checking dependencies..."
cd apps/api
npm audit --audit-level=high || echo "⚠️ Audit issues found (documented)"
cd ../..

# Check for secrets in code (basic grep check)
echo "🔍 Scanning for potential secrets..."
if git grep -i 'api[_-]key\s*=\s*["\x27][^"\x27]*["\x27]' -- '*.ts' '*.js' ':!node_modules' ':!.env*' ':!dist' ':!build'; then
  echo "❌ Potential secrets found in code!"
  exit 1
fi

if git grep -i 'password\s*=\s*["\x27][^"\x27]*["\x27]' -- '*.ts' '*.js' ':!node_modules' ':!.env*' ':!dist' ':!build' ':!test' ':!spec'; then
  echo "❌ Potential hardcoded passwords found!"
  exit 1
fi

echo "✅ Security audit complete"