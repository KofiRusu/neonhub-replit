# NeonHub Frontend & UX Structure

**Version:** 3.0+  
**Last Updated:** November 17, 2025  
**Framework:** Next.js 15 (App Router)  
**Status:** 80% Complete → 100% Target

---

## Overview

NeonHub's frontend is a modern, responsive web application built with Next.js 15, featuring a custom "neon glass" design system, dark mode, and real-time updates.

### Technology Stack

- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (Radix UI primitives)
- **State:** React Query (@tanstack/react-query) + tRPC
- **Auth:** NextAuth.js
- **Real-time:** Socket.io client
- **Theme:** Dark mode with next-themes

### Design System

**Brand:** "Neon Glass" aesthetic
- Dark backgrounds with neon accents
- Frosted glass effects (backdrop-blur)
- Purple/blue gradient highlights
- Smooth animations and transitions

---

## Directory Structure

```
apps/web/src/
├── app/                         # Next.js 15 app directory
│   ├── (auth)/                  # Auth route group
│   │   ├── login/              
│   │   ├── register/
│   │   └── layout.tsx           # Auth layout
│   │
│   ├── dashboard/               # Main dashboard
│   │   ├── page.tsx             # Dashboard home
│   │   ├── layout.tsx           # Dashboard layout
│   │   └── loading.tsx          # Loading UI
│   │
│   ├── agents/                  # Agent management
│   │   ├── page.tsx             # Agent list
│   │   ├── [id]/                # Agent details
│   │   └── new/                 # Create agent
│   │
│   ├── campaigns/               # Campaign management
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   └── new/
│   │
│   ├── content/                 # Content hub
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   └── new/
│   │
│   ├── email/                   # Email campaigns
│   ├── social-media/            # Social media
│   ├── analytics/               # Analytics dashboard
│   ├── trends/                  # Trend monitoring
│   ├── brand-voice/             # Brand voice config
│   ├── settings/                # Settings
│   │
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── api/                     # API routes (NextAuth, etc.)
│
├── components/                  # React components
│   ├── ui/                      # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ... (50+ components)
│   │
│   ├── dashboard/               # Dashboard components
│   │   ├── stats-card.tsx
│   │   ├── recent-activity.tsx
│   │   └── metric-chart.tsx
│   │
│   ├── agents/                  # Agent UI
│   │   ├── agent-card.tsx
│   │   ├── agent-form.tsx
│   │   ├── agent-run-status.tsx
│   │   └── agent-metrics.tsx
│   │
│   ├── campaigns/               # Campaign UI
│   ├── content/                 # Content UI
│   ├── marketing/               # Marketing components
│   └── charts/                  # Charts (Recharts)
│
├── lib/                         # Utilities
│   ├── api.ts                   # API client
│   ├── trpc.ts                  # tRPC client setup
│   ├── utils.ts                 # Helper functions
│   └── socket.ts                # Socket.io client
│
├── hooks/                       # Custom React hooks
│   ├── use-toast.ts
│   ├── use-socket.ts
│   └── ...
│
├── providers/                   # Context providers
│   ├── trpc-provider.tsx
│   └── theme-provider.tsx
│
├── styles/                      # Global styles
│   └── globals.css
│
└── types/                       # TypeScript types
    ├── api.ts
    └── ...
```

---

## Main Pages & Routes

### 1. Landing Page (`/`)

**Purpose:** Marketing landing page

**Features:**
- Hero section with CTA
- Feature highlights
- Pricing tiers
- Testimonials
- Call-to-action

**Status:** ✅ Complete

### 2. Dashboard (`/dashboard`)

**Purpose:** Main application hub

**Features:**
- Overview statistics (campaigns, content, performance)
- Recent activity feed
- Quick actions (create campaign, generate content)
- Performance charts
- Agent status

**Key Components:**
- `stats-card.tsx` - Metric cards
- `recent-activity.tsx` - Activity feed
- `metric-chart.tsx` - Charts (Recharts)

**Status:** ⚠️ 85% complete (real-time updates pending)

### 3. Agents (`/agents`)

**Purpose:** Agent management and execution

**Features:**
- Agent list with status indicators
- Create/edit agent configuration
- Execute agents manually
- View agent runs and results
- Agent performance metrics

**Key Components:**
- `agent-card.tsx` - Agent cards
- `agent-form.tsx` - Agent configuration form
- `agent-run-status.tsx` - Execution status
- `agent-metrics.tsx` - Performance charts

**Status:** ✅ Complete

### 4. Campaigns (`/campaigns`)

**Purpose:** Campaign creation and management

**Features:**
- Campaign list with status
- Create multi-channel campaigns
- Schedule campaigns
- Track campaign performance
- A/B test management

**Status:** ⚠️ 70% complete (scheduling UI pending)

### 5. Content (`/content`)

**Purpose:** Content generation and management

**Features:**
- Content library
- AI content generation
- SEO optimization interface
- Brand voice selection
- Quality scoring display
- Publish workflow

**Status:** ⚠️ 75% complete (publish workflow pending)

### 6. Email (`/email`)

**Purpose:** Email campaign management

**Features:**
- Email list with stats
- Email composer with templates
- Personalization tokens
- Send time optimization
- Analytics dashboard (opens, clicks, conversions)

**Status:** ⚠️ 65% complete (template library pending)

### 7. Social Media (`/social-media`)

**Purpose:** Social media management

**Features:**
- Post calendar
- Platform-specific composers
- Post scheduler
- Engagement tracking
- Trend suggestions

**Status:** ⚠️ 60% complete (scheduler UI pending)

### 8. Analytics (`/analytics`)

**Purpose:** Performance analytics and insights

**Features:**
- Cross-channel analytics
- Customizable dashboards
- KPI tracking
- Trend visualization
- Export reports (PDF, CSV)

**Status:** ⚠️ 70% complete (export functionality pending)

### 9. Trends (`/trends`)

**Purpose:** Trend monitoring and opportunities

**Features:**
- Trending topics list
- Trend analysis charts
- Content opportunity suggestions
- Competitor tracking

**Status:** ⚠️ 65% complete (competitor tracking pending)

### 10. Brand Voice (`/brand-voice`)

**Purpose:** Brand voice configuration

**Features:**
- Upload brand guidelines
- Brand voice analysis
- Test brand alignment
- View brand context retrieval (RAG)

**Status:** ✅ Complete

### 11. Settings (`/settings`)

**Purpose:** User and workspace settings

**Features:**
- Profile settings
- Workspace management
- Team member management
- Billing & subscription
- API keys
- Integrations (OAuth connections)

**Status:** ⚠️ 75% complete (team management UI pending)

---

## Component Library (shadcn/ui)

### Core UI Components

- **Button** - Variants: default, destructive, outline, secondary, ghost, link
- **Card** - Content cards with header, content, footer
- **Dialog** - Modal dialogs
- **Input** - Text inputs with validation
- **Label** - Form labels
- **Select** - Dropdown selects
- **Checkbox** - Checkboxes
- **Radio** - Radio buttons
- **Textarea** - Multi-line text inputs
- **Table** - Data tables
- **Tabs** - Tab navigation
- **Toast** - Notifications
- **Tooltip** - Hover tooltips
- **Dropdown Menu** - Context menus
- **Form** - Form components (react-hook-form)

### Custom Components

- **Agent Card** - Agent display cards
- **Campaign Card** - Campaign overview cards
- **Content Card** - Content preview cards
- **Stats Card** - Metric cards with icons
- **Chart** - Recharts wrappers
- **Loading Spinner** - Loading indicators
- **Empty State** - No data states
- **Error Boundary** - Error handling UI

---

## Design System

### Colors

```css
/* Primary Colors */
--neon-purple: #8b5cf6;
--neon-blue: #3b82f6;
--neon-pink: #ec4899;

/* Background Colors (Dark Mode) */
--background: #0a0a0a;
--foreground: #fafafa;
--card: #18181b;
--card-foreground: #fafafa;

/* Glass Effect */
--glass-background: rgba(24, 24, 27, 0.8);
--glass-border: rgba(139, 92, 246, 0.2);
backdrop-filter: blur(12px);
```

### Typography

- **Font:** Inter (system font fallback)
- **Headings:** font-bold, leading-tight
- **Body:** font-normal, leading-relaxed
- **Code:** font-mono

### Spacing

- Consistent 4px grid system
- Tailwind spacing scale (0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, ...)

### Animations

- Smooth transitions (transition-all duration-200)
- Hover effects (hover:scale-105, hover:shadow-neon)
- Loading animations (animate-spin, animate-pulse)

---

## State Management

### tRPC + React Query

```typescript
// hooks/use-agents.ts
export function useAgents(workspaceId: string) {
  return trpc.agents.list.useQuery({ workspaceId });
}

export function useCreateAgent() {
  const utils = trpc.useContext();
  
  return trpc.agents.create.useMutation({
    onSuccess: () => {
      utils.agents.list.invalidate();
    }
  });
}
```

### Local State

- React hooks (`useState`, `useReducer`)
- Form state (react-hook-form)
- UI state (dialog open/closed, tabs, etc.)

---

## Real-Time Updates

### Socket.io Integration

```typescript
// lib/socket.ts
import io from 'socket.io-client';

export const socket = io(process.env.NEXT_PUBLIC_API_URL);

// Subscribe to workspace updates
socket.emit('subscribe:workspace', workspaceId);

// Listen for agent run updates
socket.on('agent:run:start', (data) => {
  // Update UI
});

socket.on('agent:run:complete', (data) => {
  // Show toast, refresh data
});
```

---

## Authentication Flow

1. User visits `/login`
2. NextAuth.js handles authentication
3. JWT stored in HTTP-only cookie
4. Middleware protects routes
5. User redirected to `/dashboard`

### Protected Routes

All routes under `/dashboard/*`, `/agents/*`, `/campaigns/*`, etc. require authentication.

**Middleware:** `src/middleware.ts` checks auth status

---

## Loading & Error States

### Loading States

- Skeleton loaders for tables and cards
- Spinners for actions (buttons)
- Progress bars for long operations

### Error States

- Error boundaries catch component errors
- Toast notifications for action errors
- Empty states for no data
- Retry buttons for failed requests

---

## Responsive Design

### Breakpoints

- **sm:** 640px
- **md:** 768px
- **lg:** 1024px
- **xl:** 1280px
- **2xl:** 1536px

### Mobile-First

- Mobile layouts first
- Progressive enhancement for larger screens
- Touch-friendly tap targets
- Responsive navigation (hamburger menu on mobile)

---

## Performance Optimization

### Next.js Features

- **Static Generation:** Marketing pages
- **Server Components:** Default for app directory
- **Client Components:** Interactive UI (`'use client'`)
- **Image Optimization:** `next/image` component
- **Code Splitting:** Dynamic imports

### React Query Caching

- 5-minute stale time for most queries
- Background refetching
- Optimistic updates for mutations

---

## Related Documentation

### UI Documentation
- [`docs/UI_AUDIT.md`](./UI_AUDIT.md) - Component audit
- [`docs/LOCALHOST_COMPREHENSIVE_UI_ANALYSIS_REPORT.md`](./LOCALHOST_COMPREHENSIVE_UI_ANALYSIS_REPORT.md) - Comprehensive analysis
- [`docs/COMPLETE_FRONTEND_VALIDATION_EXECUTIVE_SUMMARY.md`](./COMPLETE_FRONTEND_VALIDATION_EXECUTIVE_SUMMARY.md) - Validation summary
- [`docs/FRONTEND_COMPLETION_BRIEF.md`](./FRONTEND_COMPLETION_BRIEF.md) - Completion status

### Design & v0.dev
- [`docs/V0_WORKFLOW_GUIDE.md`](./V0_WORKFLOW_GUIDE.md) - v0.dev workflow
- [`docs/V0_MASTER_PROMPT.md`](./V0_MASTER_PROMPT.md) - Design prompts
- [`docs/V0_PROMPTS.md`](./V0_PROMPTS.md) - Component prompts

### Testing
- [`docs/BROWSER_TESTING_GUIDE.md`](./BROWSER_TESTING_GUIDE.md) - Browser testing
- [`docs/LOCAL_UI_UX_TEST_CHECKLIST.md`](./LOCAL_UI_UX_TEST_CHECKLIST.md) - Test checklist

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2025  
**Maintained By:** NeonHub Frontend Team  
**Next Review:** December 1, 2025

