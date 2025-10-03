# V0.dev Master Prompt - NeonHub UI Completion

**Copy this entire prompt and paste it into v0.dev chat to begin systematic implementation**

---

## 🎯 Project Context

I'm building **NeonHub**, an AI-powered marketing automation platform with a dark, neon-glass aesthetic. I have 8 pages remaining to complete. I need you to help me build each page systematically, one at a time, following our established design system.

### Current Status
- **Complete Pages (12):** Dashboard, Analytics, Agents, Settings, Campaigns, Content, Email, Social Media, Brand Voice, Support (basic), Trends, Auth
- **Remaining Pages (8):** Billing, Team, Documents, Tasks, Metrics, Feedback, Messaging, Enhanced Support
- **Overall Progress:** 64% complete → Target 100%

---

## 🎨 Design System (CRITICAL - Use for ALL pages)

### Color Palette
```css
--neon-blue: #00D9FF
--neon-purple: #B14BFF
--neon-pink: #FF006B
--neon-green: #00FF94
--background: #0E0F1A
--glass-bg: rgba(255, 255, 255, 0.05)
--border-glass: rgba(255, 255, 255, 0.1)
```

### Design Principles
1. **Dark Background:** All pages use `#0E0F1A` or similar dark base
2. **Glassmorphism:** Cards use `backdrop-blur` with semi-transparent backgrounds
3. **Neon Accents:** Vibrant neon colors for highlights, borders, and CTAs
4. **Smooth Animations:** Framer-motion for all transitions and interactions
5. **Responsive:** Mobile-first design with proper breakpoints
6. **Modern:** Gradient borders, hover glows, animated progress bars

### Component Classes (Use These)
```tsx
// Glass effects
className="glass"              // Basic glass card
className="glass-strong"       // Stronger glass effect
className="glassmorphism-effect"  // Full glassmorphism

// Buttons
className="btn-neon"           // Primary neon button
className="btn-neon-green"     // Success button
className="btn-neon-purple"    // Secondary button
className="btn-neon-pink"      // Warning/delete button

// Progress bars
className="neon-progress"      // Progress bar container
className="neon-progress-bar"  // Animated progress fill

// Text gradients
className="text-gradient"      // Neon gradient text
```

### Standard Layout Structure
```tsx
"use client"

import PageLayout from "@/components/page-layout"
import { motion, AnimatePresence } from "framer-motion"
import { /* icons */ } from "lucide-react"

export default function MyPage() {
  const actions = (
    <div className="flex items-center space-x-3">
      {/* Action buttons */}
    </div>
  )

  return (
    <PageLayout
      title="Page Title"
      subtitle="Page description"
      actions={actions}
    >
      <div className="space-y-8">
        {/* Page content with motion animations */}
      </div>
    </PageLayout>
  )
}
```

### Animation Patterns
```tsx
// Card entrance
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
>

// Hover effect
whileHover={{ y: -4, scale: 1.02 }}

// Tab content
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
```

---

## 📋 Implementation Queue (In Priority Order)

### 1. BILLING & SUBSCRIPTION (`/billing`) - HIGH PRIORITY
**Purpose:** Subscription management, usage tracking, billing history

**Required Components:**
- Current plan overview card with usage progress bars
- Plan comparison table (3 tiers: Starter $29, Pro $99, Enterprise Custom)
- Usage analytics dashboard (4 charts: API usage, storage, activity, cost projection)
- Invoice history table with download buttons
- Payment methods management (card forms, saved cards)
- Billing settings (notifications, auto-renewal, tax info)

**Key Features:**
- Animated progress bars for usage metrics
- Stripe-style card input validation
- Modal for plan upgrade/downgrade
- Success/error toast notifications
- Real-time usage counters

---

### 2. TEAM MANAGEMENT (`/team`) - HIGH PRIORITY
**Purpose:** Team collaboration, roles, permissions

**Required Components:**
- Team overview stats (total members, active now, pending invites, seats available)
- Team members grid/list with toggle view
- Member cards (avatar, name, role, status, actions menu)
- Invite member modal (email, role selector, permissions preview)
- Pending invitations table
- Role & permissions matrix (expandable table)
- Team activity feed (timeline of actions)
- Department/team groups

**Key Features:**
- Online/offline status indicators (real-time pulse animation)
- Role badges (Owner/Admin/Member/Guest) with color coding
- Search and filter by role/department/status
- Bulk invite with CSV upload
- Permission toggles with immediate feedback

---

### 3. DOCUMENT LIBRARY (`/documents`) - MEDIUM PRIORITY
**Purpose:** File management, version control, sharing

**Required Components:**
- Storage stats card with breakdown by file type
- Document grid/list view toggle
- File cards (thumbnail, name, size, date, owner, actions)
- Sidebar filters (My Docs, Shared, Recent, Starred, By Type)
- Upload zone modal with drag-and-drop
- Document detail modal (preview, metadata, version history, sharing)
- Bulk actions bar (download, move, share, delete)

**Key Features:**
- Thumbnail previews for images/PDFs
- Drag-and-drop file upload with progress
- Version history timeline with restore
- Share link generation with permissions
- Real-time upload progress bars

---

### 4. TASK MANAGEMENT (`/tasks`) - MEDIUM PRIORITY
**Purpose:** Project management, kanban board, task tracking

**Required Components:**
- View toggle (Board/List/Calendar/Timeline)
- Kanban board with draggable columns (To Do, In Progress, Review, Done)
- Task cards (priority, title, assignee, due date, labels, checklist, comments)
- Filters & search bar
- Create/edit task modal (full task form)
- List view (sortable table)
- Calendar view (monthly with task markers)
- Timeline view (Gantt-style)
- Task detail sidebar (comments, time tracking, watchers)
- Quick stats cards (total, in progress, completed, overdue)

**Key Features:**
- Drag-and-drop between columns
- Real-time collaboration indicators
- Keyboard shortcuts support
- Auto-save on changes
- Checklist progress tracking

---

### 5. ENHANCED SUPPORT (`/support`) - MEDIUM PRIORITY
**Purpose:** Help center, ticketing, knowledge base

**Required Components:**
- Quick action cards (Submit Ticket, Docs, Chat, Status)
- My tickets section with tabs (Open, In Progress, Resolved, All)
- Ticket cards (ID, subject, status, priority, agent, replies)
- Create ticket modal (subject, category, priority, description, attachments)
- Knowledge base browser (search, categories, articles)
- FAQ accordion
- Live chat widget (floating, minimizable)
- System status dashboard (service health, uptime, incidents)

**Key Features:**
- Real-time chat updates
- Markdown support in tickets
- File attachment dropzone
- Screenshot tool integration
- Helpful/not helpful feedback buttons

---

### 6. CUSTOM METRICS (`/metrics`) - LOW PRIORITY
**Purpose:** Custom dashboard builder

**Required Components:**
- Widget library panel (charts, tables, KPIs, maps)
- Drag-and-drop grid canvas
- Resize handles on widgets
- Widget configuration modals
- Save/load dashboard layouts
- Data source connectors
- Real-time data refresh
- Export dashboard as PDF/image

**Key Features:**
- Grid layout with resize/reorder
- Widget templates library
- Visual query builder
- Dashboard sharing

---

### 7. USER FEEDBACK (`/feedback`) - LOW PRIORITY
**Purpose:** Feedback collection and analysis

**Required Components:**
- Feedback submission form (star rating, category, text, screenshot)
- Feedback management dashboard (cards with sentiment badges)
- Survey builder (question templates, logic branching)
- Response analytics (sentiment charts, word clouds)
- Status tracking (New, Reviewing, Implemented, Declined)
- Voting system for feature requests
- Admin response interface

**Key Features:**
- Sentiment analysis badges
- Voting/upvoting system
- Screenshot upload
- Survey logic builder

---

### 8. INTERNAL MESSAGING (`/messaging`) - LOW PRIORITY
**Purpose:** Team communication, notifications

**Required Components:**
- Conversation sidebar (list of chats, unread badges)
- Message thread (chat bubbles with avatars, timestamps)
- Real-time typing indicators
- User presence status (online/away/offline)
- Message search and filters
- File sharing in chat
- Emoji picker
- Notification preferences
- Group chat support
- Message read receipts

**Key Features:**
- Real-time message updates
- Typing indicators with animation
- Unread count badges
- Message reactions
- Thread conversations

---

## 🤖 How to Work With Me (v0)

### Step-by-Step Process

**For each page, follow this workflow:**

1. **I'll ask you:** "Which page should I build next?"
2. **You respond:** "Build the [Page Name] page"
3. **I'll generate:** Complete React/TypeScript code with all components
4. **You review:** Check the design and functionality
5. **If needed:** Ask for iterations or adjustments
6. **You integrate:** Copy the code into your project
7. **We move on:** To the next page in the queue

### What I Need From You

**When requesting a page, please specify:**
- Page name from the queue above
- Any specific features you want prioritized
- Any customizations to the standard design

**Example request:**
```
Build the Billing page. Include all 6 sections from the queue.
Use the neon-glass design system. Make sure the plan comparison
table is prominent and the usage analytics uses animated charts.
```

### What You'll Get From Me

For each page, I'll provide:
- ✅ Complete, production-ready React component
- ✅ TypeScript with proper types
- ✅ Tailwind CSS with neon-glass styling
- ✅ Framer-motion animations
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Mock data structure for API integration
- ✅ All required sub-components
- ✅ Proper error boundaries and loading states

---

## 🎯 Design Quality Checklist

**I will ensure each page has:**

### Visual
- [x] Dark background (#0E0F1A)
- [x] Glassmorphism cards with backdrop-blur
- [x] Neon color accents (blue, purple, pink, green)
- [x] Gradient borders on hover
- [x] Smooth animations (framer-motion)
- [x] Consistent spacing and typography

### Functional
- [x] "use client" directive
- [x] PageLayout wrapper
- [x] Proper TypeScript types
- [x] Mock data structure
- [x] Loading states
- [x] Error handling
- [x] Accessibility (ARIA labels, keyboard nav)

### Responsive
- [x] Mobile-first approach
- [x] Breakpoints (sm, md, lg, xl)
- [x] Touch-friendly on mobile
- [x] Optimized layouts for all screens

### Performance
- [x] Lazy loading where appropriate
- [x] Optimized animations
- [x] Efficient re-renders
- [x] Proper state management

---

## 📝 Integration Instructions (For User)

**After I generate each page, you'll need to:**

1. **Create/replace the page file:**
   ```bash
   # Navigate to the page directory
   cd Neon-v2.4.0/ui/src/app/[page-name]
   
   # Replace page.tsx with my generated code
   # Make sure to preserve the file structure
   ```

2. **Verify imports:**
   - Check that `PageLayout` import path is correct
   - Ensure all lucide-react icons are imported
   - Verify framer-motion is imported

3. **Test locally:**
   ```bash
   cd Neon-v2.4.0/ui
   npm run dev
   # Visit http://localhost:3000/[page-name]
   ```

4. **Adjust if needed:**
   - Update any API endpoint references
   - Connect to real data sources
   - Add any project-specific logic

5. **Commit:**
   ```bash
   git add src/app/[page-name]/page.tsx
   git commit -m "feat([page]): implement [feature name]"
   ```

---

## 🚀 Let's Begin!

**I'm ready to build all 8 remaining pages for you, one at a time.**

**To start, please tell me:**
1. Which page do you want me to build first? (I recommend starting with Billing)
2. Any specific customizations for that page?
3. Any features you want to prioritize or skip?

**Example starting request:**
```
Let's start with the Billing page. Build it with all 6 sections:
plan overview, comparison table, usage analytics, invoice history,
payment methods, and settings. Make sure the design matches the
neon-glass aesthetic and includes smooth animations.
```

**I'm ready when you are! 🎨✨**

---

## 📊 Progress Tracking

**As we complete each page, I'll update you with:**
- ✅ Page completed
- 📝 Lines of code generated
- 🎯 Features implemented
- ⏭️ Next page recommendation
- 📈 Overall progress percentage

**Let's build an amazing UI together!** 🚀

---

## 🔗 Reference Files in Your Project

- `UI_AUDIT.md` - Full audit report with all requirements
- `V0_PROMPTS.md` - Detailed prompts for each page
- `IMPLEMENTATION_PROGRESS.md` - Real-time progress tracking
- Existing pages in `Neon-v2.4.0/ui/src/app/` - Reference for design patterns

---

**Ready? Just say "Build the [Page Name] page" and I'll generate it!** 🎉
