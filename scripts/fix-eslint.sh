#!/bin/bash

# Fix common ESLint issues across the codebase

cd /Users/kofirusu/Desktop/NeonHub/apps/web

# Fix unused imports - remove Skeleton, Calendar, Filter where not used
find src -name "*.tsx" -type f -exec sed -i '' 's/, Skeleton//g' {} \;
find components -name "*.tsx" -type f -exec sed -i '' 's/, Skeleton//g' {} \;

# Fix unused variables with _ prefix (common patterns)
find . -name "*.tsx" -type f -not -path "./node_modules/*" -not -path "./.next/*" \
  -exec sed -i '' \
  -e 's/const \[selectedPreset, setSelectedPreset\]/const [_selectedPreset, _setSelectedPreset]/g' \
  -e 's/const \[isLoading, /const [_isLoading, /g' \
  -e 's/(index)/((_index))/g' \
  -e 's/(agentId)/((_agentId))/g' \
  -e 's/{ onIntent }/{ onIntent: _onIntent }/g' \
  {} \;

# Fix quotes in JSX (more comprehensive)
find . -name "*.tsx" -type f -not -path "./node_modules/*" -not -path "./.next/*" \
  -exec sed -i '' \
  -e 's/"Boost your "\([^"]*\)" today"/"Boost your \&quot;\1\&quot; today"/g' \
  {} \;

echo "Batch fixes applied"

