#!/bin/bash

cd /Users/kofirusu/Desktop/NeonHub/apps/web

# Fix unused variables by prefixing with _
sed -i '' 's/({ agentId, agentName, schema/({ agentId: _agentId, agentName, schema/g' ./src/components/agent-runner.tsx
sed -i '' 's/({ agentId, agentName, schema/({ agentId: _agentId, agentName, schema/g' ./components/agent-runner.tsx

# Fix unused imports
sed -i '' 's/import { Tabs, TabsContent, TabsList, TabsTrigger }/\/\/ Unused: import { Tabs, TabsContent, TabsList, TabsTrigger }/g' ./src/components/brand-voice/BrandVoiceCopilot.tsx

sed -i '' 's/import { http }/\/\/ import { http } \/\/ Unused/g' ./components/brand-voice/HealthProbe.tsx
sed -i '' 's/import { useMemo }/\/\/ import { useMemo } \/\/ Unused/g' ./components/brand-voice/KnowledgeIndex.tsx

# Fix unused in hooks
sed -i '' 's/const actionTypes =/const _actionTypes =/g' ./hooks/use-toast.ts

# Fix unused in components
sed -i '' 's/displayValue =/\_displayValue =/g' ./components/kpi-widget.tsx
sed -i '' 's/({ idx }/({ idx: _idx }/g' ./src/components/policy-console/DataTrustViewer.tsx
sed -i '' 's/const formatPercent =/const _formatPercent =/g' ./src/components/policy-console/EthicalMonitor.tsx
sed -i '' 's/const getSeverityColor =/const _getSeverityColor =/g' ./src/components/policy-console/EthicalMonitor.tsx
sed -i '' 's/({ status }/({ status: _status }/g' ./src/components/policy-console/PolicyDashboard.tsx

# Fix unused in pages
sed -i '' 's/const \[isLoading, setIsLoading\]/const [_isLoading, setIsLoading]/g' ./src/app/team/page.tsx
sed -i '' 's/(index)/((_index))/g' ./src/app/email/page.tsx

# Fix QA monitor
sed -i '' 's/import { Clock }/\/\/ import { Clock } \/\/ Unused/g' ./src/components/qa-monitor/QAMonitorDashboard.tsx

# Fix test imports
sed -i '' 's/import { act }/\/\/ import { act } \/\/ Unused/g' ./src/hooks/__tests__/useCopilotRouter.test.ts

echo "All unused variable fixes applied"

