# Marketing Dashboard Integration - Quick Start Guide
## NeonHub v3.2 - Rapid Implementation Reference

**📋 Full Plan**: See `V0_MARKETING_DASHBOARD_IMPLEMENTATION_PLAN.md`  
**⏱️ Timeline**: 6 weeks (200-240 hours development)  
**🎯 Goal**: Enterprise-grade marketing analytics platform

---

## 🚀 Immediate Next Steps (This Week)

### 1. Access V0 Design (CRITICAL - FIRST TASK)

```bash
# Navigate to v0.dev and access your chat
open "https://v0.dev/chat/fork-of-neon-marketing-dashboard-81nXf0ONQ8r"

# Export the v10 code:
# 1. Click on "Code" button (</>)
# 2. Download all components
# 3. Save to: NeonHub/v0-exports/marketing-dashboard/
```

**What to extract:**
- Component JSX/TSX files
- Styling patterns
- Layout structure
- Color schemes
- Interactive elements
- Chart configurations

### 2. Database Schema Setup

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Create feature branch
git checkout -b feature/marketing-dashboard

# Edit schema
code apps/api/prisma/schema.prisma
```

**Add these models** (copy from implementation plan):
- `MarketingCampaign`
- `MarketingLead`
- `MarketingTouchpoint`
- `MarketingMetric`
- Enums: `CampaignType`, `CampaignStatus`, `LeadStatus`, `TouchpointType`

```bash
# Generate migration
pnpm --filter apps/api prisma migrate dev --name add_marketing_tables

# Seed test data
pnpm --filter apps/api prisma db seed
```

### 3. Create Route Structure

```bash
# Create marketing route folders
mkdir -p apps/web/src/app/marketing/{campaigns,leads,funnel,attribution,roi,insights}

# Create component folders
mkdir -p apps/web/src/components/marketing
mkdir -p apps/web/src/hooks/marketing
```

**Create these files:**

```typescript
// apps/web/src/app/marketing/layout.tsx
"use client"

import { ReactNode } from 'react'
import PageLayout from '@/components/page-layout'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <PageLayout
      title="Marketing Analytics"
      subtitle="Comprehensive campaign performance and ROI tracking"
    >
      {children}
    </PageLayout>
  )
}
```

```typescript
// apps/web/src/app/marketing/page.tsx
"use client"

export default function MarketingOverviewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gradient">Marketing Dashboard</h1>
      <p className="text-gray-400">Overview coming soon...</p>
    </div>
  )
}
```

### 4. Backend API Routes

```bash
# Create marketing routes file
touch apps/api/src/routes/marketing.ts
```

```typescript
// apps/api/src/routes/marketing.ts
import { Router } from "express"
import type { AuthRequest } from "../middleware/auth.js"
import { prisma } from "../db/prisma.js"
import { AppError } from "../lib/errors.js"

const marketingRouter = Router()

async function resolveOrganizationId(userId: string) {
  const membership = await prisma.organizationMembership.findFirst({
    where: { userId },
    select: { organizationId: true },
  })

  return membership?.organizationId ?? null
}

marketingRouter.get("/overview", async (req, res, next) => {
  try {
    const { user } = req as AuthRequest
    if (!user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    }

    const organizationId = await resolveOrganizationId(user.id)
    if (!organizationId) {
      throw new AppError("Organization context missing", 400, "MISSING_ORGANIZATION")
    }

    const [campaigns, leads, metrics] = await Promise.all([
      prisma.marketingCampaign.count({ where: { organizationId } }),
      prisma.marketingLead.count({ where: { organizationId } }),
      prisma.marketingMetric.findMany({
        where: { organizationId },
        orderBy: { date: "desc" },
        take: 30,
      }),
    ])

    res.json({
      success: true,
      data: {
        totalCampaigns: campaigns,
        totalLeads: leads,
        recentMetrics: metrics,
      },
    })
  } catch (error) {
    next(error)
  }
})

marketingRouter.get("/campaigns", async (req, res, next) => {
  try {
    const { user } = req as AuthRequest
    if (!user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    }

    const organizationId = await resolveOrganizationId(user.id)
    if (!organizationId) {
      throw new AppError("Organization context missing", 400, "MISSING_ORGANIZATION")
    }

    const campaigns = await prisma.marketingCampaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    })

    res.json({ success: true, data: campaigns })
  } catch (error) {
    next(error)
  }
})

export { marketingRouter }
```

**Register route in server.ts:**

```typescript
// apps/api/src/server.ts
import { marketingRouter } from './routes/marketing.js'

// Add with other protected routes
app.use('/api/marketing', requireAuth, auditMiddleware('marketing'), marketingRouter)
```
// auditMiddleware is already imported in server.ts; reuse it with the new "marketing" audit channel.

Consider extracting `resolveOrganizationId` into a shared helper (similar to `team.service.ts`) once additional marketing endpoints are implemented.


### 5. Update Navigation

```typescript
// apps/web/src/components/navigation.tsx

import { 
  // ... existing imports
  LineChart, // Add this for Marketing icon
} from "lucide-react"

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Marketing", href: "/marketing", icon: LineChart }, // ADD THIS
  { name: "AI Agents", href: "/agents", icon: Bot },
  // ... rest of items
]
```

Line up the new `LineChart` import alongside the existing icon imports; keep the original `Campaigns` entry (which still uses `Target`) for continuity.

---

## 📦 Required Dependencies

The repository already ships with `recharts`, `date-fns`, `react-hook-form`, `zod`, and `@hookform/resolvers` inside `apps/web/package.json`, so no new packages are required for the initial scaffold. After pulling the latest code, just ensure your local modules are up to date:

```bash
cd /Users/kofirusu/Desktop/NeonHub
pnpm install --frozen-lockfile
```

---

## 🎨 Component Stubs (Build These First)

### 1. MarketingMetricCard

```bash
code apps/web/src/components/marketing/MetricCard.tsx
```

Copy the `MarketingMetricCard` component from the implementation plan.

### 2. ChartContainer

```typescript
// apps/web/src/components/marketing/ChartContainer.tsx
"use client"

import { ReactNode } from 'react'

interface ChartContainerProps {
  title: string
  children: ReactNode
  actions?: ReactNode
}

export function ChartContainer({ title, children, actions }: ChartContainerProps) {
  return (
    <div className="glass-strong p-6 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {actions}
      </div>
      <div className="w-full h-64">
        {children}
      </div>
    </div>
  )
}
```

### 3. DataTable

```typescript
// apps/web/src/components/marketing/DataTable.tsx
"use client"

import { useState } from "react"
import type { ReactNode } from "react"

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // TODO: Implement sorting logic

  return (
    <div className="glass p-4 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map(col => (
              <th key={String(col.key)} className="text-left p-3 text-gray-400 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr 
              key={idx}
              onClick={() => onRowClick?.(row)}
              className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
            >
              {columns.map(col => (
                <td key={String(col.key)} className="p-3 text-white">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## 🪝 Hooks to Create

### useMarketingMetrics

```typescript
// apps/web/src/hooks/marketing/useMarketingMetrics.ts
import { useQuery } from "@tanstack/react-query"

export function useMarketingMetrics(dateRange: string = "30d") {
  return useQuery({
    queryKey: ["marketing", "overview", dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/overview?range=${dateRange}`)
      if (!response.ok) {
        throw new Error("Failed to fetch marketing metrics")
      }
      const payload = await response.json()
      return payload.data
    },
    refetchInterval: 60000, // Refetch every minute
  })
}
```

### useCampaigns

```typescript
// apps/web/src/hooks/marketing/useCampaigns.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function useCampaigns() {
  return useQuery({
    queryKey: ["marketing", "campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/marketing/campaigns")
      if (!response.ok) {
        throw new Error("Failed to fetch campaigns")
      }
      const payload = await response.json()
      return payload.data
    },
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (campaignData: any) => {
      const response = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      })
      if (!response.ok) {
        throw new Error("Failed to create campaign")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing", "campaigns"] })
    },
  })
}
```

---

## ✅ Week 1 Checklist

- [ ] **Access v0 chat and export v10 code**
- [ ] **Review implementation plan with team**
- [ ] **Create feature branch: `feature/marketing-dashboard`**
- [ ] **Add database schema and run migrations**
- [ ] **Create seed script with test marketing data**
- [ ] **Set up `/marketing` route structure**
- [ ] **Create marketing layout and overview page**
- [ ] **Build 3 core components: MetricCard, ChartContainer, DataTable**
- [ ] **Create marketing API routes file**
- [ ] **Add `/api/marketing/overview` endpoint**
- [ ] **Update main navigation to include Marketing**
- [ ] **Create 2 hooks: useMarketingMetrics, useCampaigns**
- [ ] **Verify routes are accessible (even with placeholder content)**
- [ ] **Commit and push to feature branch**

---

## 🔧 Testing Your Setup

```bash
# 1. Start development servers
pnpm dev

# 2. Check database
pnpm --filter apps/api prisma studio
# Navigate to MarketingCampaign table - should see test data

# 3. Test API endpoint
curl http://localhost:3001/api/marketing/overview \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Visit frontend
open http://localhost:3000/marketing
# Should see "Marketing Dashboard" page

# 5. Check navigation
# Click "Marketing" in sidebar - should navigate to /marketing
```

---

## 📊 Success Criteria (Week 1)

By end of Week 1, you should have:

1. ✅ Marketing route accessible in navigation
2. ✅ Database tables created and seeded
3. ✅ Basic API endpoint returning data
4. ✅ Marketing layout rendering correctly
5. ✅ 3 reusable components built
6. ✅ 2 hooks working with React Query
7. ✅ No TypeScript errors
8. ✅ All tests passing

---

## 🚨 Common Issues & Solutions

### Issue: Prisma migration fails
```bash
# Reset database (dev only!)
pnpm --filter apps/api prisma migrate reset
pnpm --filter apps/api prisma migrate dev
pnpm --filter apps/api prisma db seed
```

### Issue: Route not found (404)
- Check `apps/web/src/app/marketing/page.tsx` exists
- Verify no typos in folder names (must be lowercase)
- Restart Next.js dev server

### Issue: API returns 401 Unauthorized
- Ensure you're logged in (check session)
- Verify `requireAuth` middleware is working
- Confirm the helper to resolve `organizationId` finds a membership for `req.user.id`

### Issue: Components not rendering
- Check imports are correct
- Verify component is exported
- Look for console errors in browser DevTools

---

## 📞 Need Help?

- **Implementation Plan**: `V0_MARKETING_DASHBOARD_IMPLEMENTATION_PLAN.md`
- **Documentation**: `apps/web/README.md`, `apps/api/README.md`
- **Database Schema**: `apps/api/prisma/schema.prisma`
- **Existing Components**: `apps/web/src/components/`
- **Existing Hooks**: `apps/web/src/hooks/`

---

## 🎯 Phase Overview

| Phase | Duration | Focus | Key Deliverable |
|-------|----------|-------|-----------------|
| **Phase 1** | Week 1 | Foundation | Routes, DB, Core Components |
| **Phase 2** | Week 2 | Campaigns | Full campaign CRUD + analytics |
| **Phase 3** | Week 3 | Leads & Funnel | Lead tracking + funnel viz |
| **Phase 4** | Week 4 | Attribution & ROI | Multi-touch attribution + ROI |
| **Phase 5** | Week 5 | AI Insights | AI recommendations + predictions |
| **Phase 6** | Week 6 | Polish & Launch | Testing, docs, deployment |

---

## 🚢 Deployment Checklist (Week 6)

- [ ] All unit tests passing (>80% coverage)
- [ ] E2E tests passing (Playwright)
- [ ] Load tests completed (k6)
- [ ] API documentation generated (Swagger)
- [ ] User documentation written
- [ ] Video tutorials recorded
- [ ] Staging environment tested
- [ ] Beta feedback incorporated
- [ ] Production database migrations ready
- [ ] Monitoring and alerts configured
- [ ] Feature flags set up
- [ ] Rollback plan documented

---

**Ready to build? Start with accessing the v0 dashboard code!**

```bash
# Open v0.dev and export v10 code
open "https://v0.dev/chat/fork-of-neon-marketing-dashboard-81nXf0ONQ8r"
```

Then follow the Week 1 checklist above. Good luck! 🚀
