# Policy Console - v6.0 Governance Control Center

The Policy Console is a comprehensive React-based dashboard for live global governance control and monitoring in NeonHub v6.0.

## Components

### 1. PolicyDashboard.tsx
**Main governance overview dashboard**

Provides real-time metrics and monitoring across all governance systems:
- System health status for all modules (Governance, Data Trust, Eco-Optimizer, Orchestration)
- Key performance indicators and compliance scores
- Active policies, provenance events, energy usage, and node health
- Auto-refresh capabilities with configurable intervals

**Props:**
- `refreshInterval?: number` - Auto-refresh interval in ms (default: 30000)

**Usage:**
```tsx
import { PolicyDashboard } from '@/components/policy-console';

<PolicyDashboard refreshInterval={30000} />
```

### 2. PolicyEditor.tsx
**Interactive policy creation and editing**

Features:
- Create new policies or edit existing ones
- Add/remove policy rules with conditions and actions
- Live validation of policy structure
- Support for allow/deny/review actions

**Props:**
- `policyId?: string` - Optional policy ID for editing
- `onSave?: (policy: GovernancePolicy) => void` - Callback on save
- `onCancel?: () => void` - Callback on cancel

**Usage:**
```tsx
import { PolicyEditor } from '@/components/policy-console';

<PolicyEditor 
  policyId="policy-123"
  onSave={(policy) => console.log('Saved:', policy)}
  onCancel={() => console.log('Cancelled')}
/>
```

### 3. EthicalMonitor.tsx
**Real-time ethical compliance monitoring**

Features:
- Ethical assessment scores (0-100)
- Real-time ethical concerns detection
- Actionable recommendations for improvement
- Auto-refresh for continuous monitoring

**Props:**
- `refreshInterval?: number` - Auto-refresh interval in ms (default: 30000)

**Usage:**
```tsx
import { EthicalMonitor } from '@/components/policy-console';

<EthicalMonitor refreshInterval={30000} />
```

### 4. DataTrustViewer.tsx
**Data provenance and integrity verification visualization**

Features:
- Visual provenance chain timeline
- Event-by-event tracking of data lifecycle
- Hash verification display
- Actor and action logging

**Props:**
- `dataId?: string` - Optional data ID to track (default: 'sample-data-001')

**Usage:**
```tsx
import { DataTrustViewer } from '@/components/policy-console';

<DataTrustViewer dataId="my-data-id" />
```

### 5. SustainabilityMetrics.tsx
**Energy and carbon footprint metrics**

Features:
- Real-time energy usage tracking (kWh)
- Carbon emissions monitoring (kg CO₂)
- Efficiency score visualization
- Optimization recommendations

**Usage:**
```tsx
import { SustainabilityMetrics } from '@/components/policy-console';

<SustainabilityMetrics />
```

### 6. OrchestrationControl.tsx
**Global node orchestration management**

Features:
- System health overview (healthy/degraded/critical)
- Node topology visualization
- Real-time performance metrics (latency, requests)
- Individual node status monitoring

**Usage:**
```tsx
import { OrchestrationControl } from '@/components/policy-console';

<OrchestrationControl />
```

### 7. AuditLogViewer.tsx
**Comprehensive audit log exploration**

Features:
- Searchable and filterable audit logs
- Level and category filtering
- Export to JSON and CSV formats
- Real-time log streaming

**Usage:**
```tsx
import { AuditLogViewer } from '@/components/policy-console';

<AuditLogViewer />
```

## Shared Utilities

### utils.ts
Provides common utility functions:
- `fetchAPI<T>()` - Type-safe API fetching with error handling
- `formatBytes()`, `formatNumber()`, `formatPercent()` - Number formatting
- `formatRelativeTime()`, `formatDate()`, `formatDateTime()` - Date formatting
- `getStatusColor()`, `getSeverityColor()` - Tailwind color helpers
- `exportAsJSON()`, `exportAsCSV()` - Data export utilities
- `debounce()` - Function debouncing
- `calculateComplianceScore()`, `getHealthStatus()` - Score calculations

### types.ts
Comprehensive TypeScript type definitions:
- Re-exports from `@/types/governance`
- Console-specific types (UnifiedGovernanceStatus, ConsoleAlert, etc.)
- Form data types for policy editing
- Provenance graph types
- Export options

## API Integration

All components integrate with the following API endpoints:

### Governance APIs
- `GET /api/governance/health` - System health status
- `GET /api/governance/policies` - List all policies
- `POST /api/governance/policies` - Create/update policy
- `POST /api/governance/ethics/assess` - Ethical assessment
- `GET /api/governance/audit-logs` - Retrieve audit logs

### Data Trust APIs
- `GET /api/data-trust/status` - System status
- `GET /api/data-trust/provenance/:dataId` - Provenance history
- `GET /api/data-trust/provenance/:dataId/verify` - Verify chain
- `GET /api/data-trust/audit/logs` - Audit logs

### Eco-Optimizer APIs
- `GET /api/eco-metrics/energy` - Current energy metrics
- `POST /api/eco-metrics/carbon` - Carbon footprint
- `GET /api/eco-metrics/efficiency` - Efficiency analysis
- `GET /api/eco-metrics/status` - System status

### Orchestration APIs
- `GET /api/orchestration/health` - System health
- `GET /api/orchestration/nodes` - Discover nodes
- `GET /api/orchestration/metrics` - Metrics overview
- `POST /api/orchestration/failover/:nodeId` - Execute failover

## Technical Stack

- **React** - Component framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library (Card, Badge, Button, Input, etc.)
- **React Hooks** - State management (useState, useEffect)

## Features

### Real-time Monitoring
- Auto-refresh at configurable intervals
- Live metrics and status updates
- WebSocket support (future enhancement)

### Data Visualization
- Status indicators and badges
- Metric cards with trends
- Timeline views for provenance
- Health status grids

### Error Handling
- Graceful error states with user-friendly messages
- Loading states with skeleton loaders
- Network error recovery

### Export Capabilities
- JSON export for programmatic processing
- CSV export for spreadsheet analysis
- Configurable date ranges and filters

## Responsive Design

All components are fully responsive with Tailwind CSS:
- Mobile-first approach
- Grid layouts adapt from 1 to 4 columns
- Touch-friendly interactive elements
- Optimized for tablets and desktop

## Best Practices

1. **Type Safety**: Full TypeScript coverage with strict typing
2. **Error Boundaries**: Comprehensive error handling
3. **Loading States**: Skeleton loaders for better UX
4. **Accessibility**: Semantic HTML and ARIA attributes
5. **Performance**: Efficient re-renders with proper dependency arrays
6. **Maintainability**: Well-documented, modular code

## Environment Variables

Configure the API endpoint:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Future Enhancements

- [ ] WebSocket integration for real-time updates
- [ ] Advanced data visualization with charts (recharts/visx)
- [ ] PDF export for sustainability reports
- [ ] Role-based access control (RBAC)
- [ ] Multi-language support (i18n)
- [ ] Dark mode support
- [ ] Advanced filtering and search
- [ ] Customizable dashboards
- [ ] Alert notification system
- [ ] Historical trend analysis

## License

Part of NeonHub v6.0 - Proprietary