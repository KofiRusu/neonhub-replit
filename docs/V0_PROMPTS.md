# v0.dev Prompts for NeonHub UI Completion

**Purpose:** Ready-to-use prompts for generating missing NeonHub pages in v0.dev  
**Design System:** Neon-glass aesthetic with dark background, glassmorphism, vibrant neon colors  
**Status:** 8 pages to complete (High → Medium → Low priority)

---

## 🎨 Design System Context (Include with Every Prompt)

```
Design Requirements:
- Dark background (#0E0F1A or similar)
- Glassmorphism effects (backdrop-blur, rgba backgrounds)
- Neon color palette: blue (#00D9FF), purple (#B14BFF), pink (#FF006B), green (#00FF94)
- Smooth animations with framer-motion
- Responsive design (mobile-first)
- Modern, futuristic UI with gradient accents
```

---

## 🚀 HIGH PRIORITY - Sprint 1

### 1️⃣ Trends Dashboard (`/trends`)

**v0.dev Prompt:**

```
Create a comprehensive trends and predictive analytics dashboard for an AI marketing platform with a dark, neon-glass aesthetic.

DESIGN STYLE:
- Dark background (#0E0F1A)
- Glassmorphism cards with backdrop-blur
- Neon colors: blue (#00D9FF), purple (#B14BFF), pink (#FF006B), green (#00FF94)
- Gradient borders and hover effects
- Smooth framer-motion animations

PAGE STRUCTURE:

1. KPI Overview Section (4 cards in grid):
   - Revenue Growth Trend: +18.2% with trend arrow
   - Prediction Accuracy: 94.3% with confidence indicator
   - Signals Detected: 23 active with severity badge
   - Data Points Analyzed: 1.2M with growth rate

2. Tab Navigation (4 tabs):
   - Predictions
   - Signals
   - Comparisons
   - Data

3. Predictions Tab Content:
   - Large time-series line chart showing historical data (last 30 days) and forecasted data (next 7 days)
   - Include confidence interval shading
   - Interactive tooltips with date, actual value, predicted value
   - Legend showing: Historical (solid line), Forecast (dashed line), Confidence Range (shaded area)
   - Below chart: 3 metric cards showing:
     * Next 7-day forecast
     * Confidence level percentage
     * Trend direction with arrow icon

4. Signals Tab Content:
   - Grid of alert cards (3-4 cards)
   - Each card shows:
     * Icon indicator (trending up/down)
     * Signal title (e.g., "Revenue Spike Detected")
     * Description of the signal
     * Severity badge (Critical/High/Medium/Low) with color coding
     * Timestamp
     * "View Details" button
   - Filter buttons at top: All, Critical, High, Medium, Low

5. Comparisons Tab Content:
   - Multi-line overlay chart comparing different metrics over time
   - Legend with colored lines for each metric
   - Period selector buttons: 7D, 30D, 90D, 1Y
   - Metrics comparison table below showing:
     * Metric name
     * Current value
     * Change percentage
     * Sparkline mini-chart

6. Data Tab Content:
   - Sortable data table with columns:
     * Date
     * Metric Name
     * Actual Value
     * Predicted Value
     * Deviation %
     * Status badge
   - Search bar and filters
   - Export to CSV button
   - Pagination

INTERACTIONS:
- Smooth tab transitions
- Hover effects on cards (slight elevation, glow)
- Chart tooltips on hover
- Animated number counters for KPIs
- Loading skeleton states

Use modern React components (shadcn/ui compatible), TypeScript, and Tailwind CSS with the neon-glass theme.
```

---

### 2️⃣ Billing & Subscription (`/billing`)

**v0.dev Prompt:**

```
Create a modern SaaS billing and subscription management page with a dark, neon-glass aesthetic for an AI marketing platform.

DESIGN STYLE:
- Dark background (#0E0F1A)
- Glassmorphism cards with backdrop-blur
- Neon colors: blue (#00D9FF), purple (#B14BFF), pink (#FF006B), green (#00FF94)
- Premium, professional look
- Smooth framer-motion animations

PAGE STRUCTURE:

1. Current Plan Overview Card (top section):
   - Large card showing:
     * Plan name (e.g., "Pro Plan") with badge
     * Monthly price ($99/month)
     * Billing cycle (Monthly/Annual toggle)
     * Next billing date
     * "Upgrade Plan" and "Manage" buttons
   - Usage progress bars:
     * API Calls: 1,247 / 50,000 (2.5%)
     * Storage: 4.2 GB / 100 GB (4.2%)
     * Team Members: 3 / 10 (30%)
     * Email Sends: 8,945 / 25,000 (35.8%)

2. Plan Comparison Table:
   - 3 columns: Starter ($29), Pro ($99, highlighted), Enterprise (Custom)
   - Feature rows with checkmarks/x marks:
     * AI Content Generation
     * Agent Slots
     * API Calls limit
     * Storage limit
     * Team members
     * Priority support
     * Custom integrations
     * White labeling
   - "Current Plan" badge on active plan
   - "Upgrade" buttons on higher tiers
   - Popular badge on recommended plan

3. Usage Analytics Dashboard:
   - Grid of 4 usage cards:
     * API Usage Chart (area chart showing daily usage over 30 days)
     * Storage Breakdown (donut chart: Content 45%, Media 30%, Data 25%)
     * Activity Heatmap (calendar-style showing active days)
     * Cost Projection (line chart showing estimated costs)

4. Invoice History Section:
   - Table with columns:
     * Invoice # (clickable)
     * Date
     * Description
     * Amount
     * Status badge (Paid/Pending/Failed)
     * Download PDF button
   - Pagination
   - Search/filter by date range

5. Payment Methods Section:
   - Cards showing saved payment methods:
     * Card brand icon (Visa/Mastercard)
     * Last 4 digits (•••• 4242)
     * Expiry date
     * Default badge
     * Edit/Remove buttons
   - "Add Payment Method" button with card form modal:
     * Card number input with brand detection
     * Expiry date and CVC
     * Billing address fields
     * Save as default checkbox

6. Billing Settings:
   - Email notifications toggle
   - Auto-renewal toggle
   - Billing email address input
   - Tax information fields
   - Save Changes button

INTERACTIONS:
- Smooth transitions between tabs
- Hover effects on cards (glow, elevation)
- Animated progress bars
- Number counter animations for usage stats
- Modal for plan upgrade with feature comparison
- Success/error toast notifications
- Stripe-style card input validation

Use modern React components (shadcn/ui compatible), TypeScript, and Tailwind CSS with the neon-glass theme.
```

---

### 3️⃣ Team Management (`/team`)

**v0.dev Prompt:**

```
Create a comprehensive team management and collaboration page with a dark, neon-glass aesthetic for an AI marketing platform.

DESIGN STYLE:
- Dark background (#0E0F1A)
- Glassmorphism cards with backdrop-blur
- Neon colors: blue (#00D9FF), purple (#B14BFF), pink (#FF006B), green (#00FF94)
- Professional, collaborative feel
- Smooth framer-motion animations

PAGE STRUCTURE:

1. Team Overview Section (top):
   - Stats cards in grid:
     * Total Members: 12 with growth indicator
     * Active Now: 5 with online status dots
     * Pending Invitations: 3 with warning badge
     * Team Seats Available: 7 / 10 with progress bar
   - "Invite Team Member" primary button

2. Team Members Grid/List (main section):
   - Toggle between Grid and List view
   - Each member card shows:
     * Avatar (with online/offline status indicator)
     * Full name
     * Email address
     * Role badge (Owner/Admin/Member/Guest) with color coding
     * Department/Team tag
     * Last active timestamp
     * Action menu (3-dot dropdown):
       - Edit Role
       - View Activity
       - Remove Member
       - Send Message
   - Search bar with filters:
     * By role
     * By department
     * By status (Active/Inactive)
     * By join date

3. Invite Member Modal:
   - Email input (supports multiple emails)
   - Role selector dropdown:
     * Owner (full access)
     * Admin (manage team, content)
     * Member (create content)
     * Guest (view only)
   - Permission preview showing what the role can do
   - Personal message field
   - "Send Invitation" button
   - Bulk invite option with CSV upload

4. Pending Invitations Section:
   - Table showing:
     * Email address
     * Role
     * Invited by (with avatar)
     * Sent date
     * Status badge (Pending/Expired)
     * Actions: Resend, Cancel
   - Expiry countdown for time-sensitive invites

5. Role & Permissions Matrix:
   - Expandable table showing:
     * Rows: Features (Dashboard, Analytics, Agents, Content, etc.)
     * Columns: Roles (Owner, Admin, Member, Guest)
     * Cells: Permission level icons (Full/Edit/View/None)
   - Toggle switches to customize permissions per role
   - "Save Permissions" button
   - Reset to defaults option

6. Team Activity Feed:
   - Timeline of recent team actions:
     * Member joined (with avatar and timestamp)
     * Role changed (from → to)
     * Content created/edited
     * Agent run executed
     * Settings modified
   - Filter by member or action type
   - Load more button

7. Department/Team Groups:
   - Create custom groups/departments
   - Assign members to groups
   - Group-based permissions
   - Group activity summaries

INTERACTIONS:
- Smooth grid/list toggle animation
- Hover effects on member cards (elevation, glow)
- Online status real-time updates (pulse animation)
- Role change confirmation modal
- Success/error toast notifications
- Animated activity feed entries
- Permission toggle feedback
- Drag-and-drop member organization (future)

Use modern React components (shadcn/ui compatible), TypeScript, and Tailwind CSS with the neon-glass theme.
```

---

## 📦 MEDIUM PRIORITY - Sprint 2

### 4️⃣ Enhanced Support Center (`/support`)

**v0.dev Prompt:**

```
Create an enhanced support and help center page with ticketing system for an AI marketing platform with dark, neon-glass aesthetic.

DESIGN STYLE:
- Dark background (#0E0F1A)
- Glassmorphism cards
- Neon colors: blue (#00D9FF), purple (#B14BFF), pink (#FF006B), green (#00FF94)

PAGE STRUCTURE:

1. Quick Action Cards (top grid - 4 cards):
   - Submit Ticket (with form icon)
   - Browse Documentation (with book icon)
   - Live Chat (with message icon, online status)
   - System Status (with uptime percentage)

2. My Tickets Section:
   - Tab navigation: Open, In Progress, Resolved, All
   - Ticket cards showing:
     * Ticket ID (#12345)
     * Subject line
     * Status badge (Open/In Progress/Waiting/Resolved)
     * Priority badge (Low/Medium/High/Urgent)
     * Created date and last updated
     * Agent avatar (if assigned)
     * Reply count
     * "View Details" button
   - "Create New Ticket" button
   - Search and filter options

3. Create Ticket Modal:
   - Subject input
   - Category dropdown (Bug Report, Feature Request, Technical Issue, Billing, Other)
   - Priority selector
   - Description textarea with markdown support
   - File attachment dropzone
   - Screenshot tool integration
   - "Submit Ticket" button

4. Knowledge Base Browser:
   - Search bar with autocomplete suggestions
   - Category cards:
     * Getting Started (with article count)
     * API Documentation
     * Best Practices
     * Troubleshooting
     * Video Tutorials
   - Popular articles list with view count
   - Recently updated articles
   - Related articles suggestions

5. FAQ Accordion:
   - Expandable questions organized by category
   - Search within FAQ
   - Helpful/Not helpful feedback buttons
   - "Contact Support" CTA at bottom

6. Live Chat Widget (floating):
   - Minimizable chat bubble
   - Chat interface with:
     * Message history
     * Typing indicators
     * AI assistant responses
     * Option to escalate to human agent
     * File sharing
     * Emoji picker

7. System Status Dashboard:
   - Overall status indicator (All Systems Operational)
   - Service status cards:
     * API (Operational - 99.9% uptime)
     * Dashboard (Operational)
     * AI Agents (Operational)
     * Database (Operational)
   - Incident history timeline
   - Subscribe to updates option

INTERACTIONS:
- Smooth tab transitions
- Ticket card hover effects
- Real-time chat updates
- Toast notifications for ticket updates
- Markdown preview in ticket creation
- Collapsible FAQ with smooth animations

Use modern React components, TypeScript, and Tailwind CSS with neon-glass theme.
```

---

### 5️⃣ Document Library (`/documents`)

**v0.dev Prompt:**

```
Create a modern document management and library page with dark, neon-glass aesthetic.

DESIGN STYLE:
- Dark background (#0E0F1A)
- Glassmorphism cards
- Neon colors: blue (#00D9FF), purple (#B14BFF), pink (#FF006B), green (#00FF94)

PAGE STRUCTURE:

1. Header with Actions:
   - Upload button (with drag-drop support)
   - Create new document dropdown (Doc, Sheet, Presentation)
   - View toggle (Grid/List)
   - Sort dropdown (Name, Date, Size, Type)

2. Storage Stats Card:
   - Progress bar: 42 GB / 100 GB used (42%)
   - Breakdown by type: PDFs (15GB), Images (12GB), Videos (10GB), Other (5GB)
   - Upgrade storage link

3. Document Grid/List:
   - Grid view shows:
     * Thumbnail preview
     * File type icon
     * Document name
     * File size
     * Modified date
     * Owner avatar
     * Star/favorite icon
     * Three-dot menu (Download, Share, Rename, Delete, Version History)
   - List view shows same info in table format
   - Hover effects with preview modal

4. Sidebar Filters:
   - All Documents
   - My Documents
   - Shared with Me
   - Recent
   - Starred
   - Trash
   - By Type (PDFs, Images, Videos, Spreadsheets)
   - By Owner
   - By Date Range

5. Upload Zone Modal:
   - Drag-and-drop area
   - File browser button
   - Upload progress bars for multiple files
   - Upload history
   - Auto-organize options

6. Document Detail Modal:
   - Preview pane (PDF viewer, image viewer)
   - Metadata panel:
     * File name (editable)
     * Size
     * Type
     * Created/Modified dates
     * Owner
     * Description field
     * Tags input
   - Version history timeline:
     * Version number
     * Changed by
     * Date
     * Download/Restore buttons
   - Sharing settings:
     * Link sharing toggle
     * Permission dropdown (View/Edit)
     * Share with specific users
     * Expiry date option
   - Activity log

7. Bulk Actions Bar:
   - Select all checkbox
   - Download selected
   - Move to folder
   - Share selected
   - Delete selected

INTERACTIONS:
- Smooth grid/list transitions
- Hover preview on thumbnails
- Drag-and-drop file upload
- Real-time upload progress
- Version comparison slider
- Share link copy with toast notification

Use modern React components, TypeScript, and Tailwind CSS with neon-glass theme.
```

---

### 6️⃣ Task Management (`/tasks`)

**v0.dev Prompt:**

```
Create a comprehensive task management and kanban board page with dark, neon-glass aesthetic.

DESIGN STYLE:
- Dark background (#0E0F1A)
- Glassmorphism cards
- Neon colors: blue (#00D9FF), purple (#B14BFF), pink (#FF006B), green (#00FF94)

PAGE STRUCTURE:

1. View Toggle (top):
   - Board View (kanban)
   - List View (table)
   - Calendar View
   - Timeline View (gantt-style)

2. Kanban Board (default view):
   - Columns: To Do, In Progress, Review, Done
   - Each column shows:
     * Column title with task count
     * Add task button
     * Tasks as draggable cards
   - Task cards show:
     * Priority badge (High/Medium/Low)
     * Task title
     * Description preview (truncated)
     * Assignee avatar(s)
     * Due date with countdown
     * Labels/tags
     * Checklist progress (2/5 items)
     * Comment count
     * Attachment count
   - Drag-and-drop between columns
   - Add new column option

3. Filters & Search Bar:
   - Search tasks by title/description
   - Filter by assignee
   - Filter by due date
   - Filter by priority
   - Filter by labels
   - Filter by project

4. Create/Edit Task Modal:
   - Task title input
   - Description textarea with markdown
   - Assignee selector (multi-select with avatars)
   - Due date picker with time
   - Priority dropdown
   - Label chips (multi-select with colors)
   - Checklist builder:
     * Add checklist items
     * Reorder items
     * Mark as complete
   - File attachment dropzone
   - Parent task selector (for subtasks)
   - Estimated time input
   - Status dropdown
   - "Create Task" / "Save Changes" button

5. List View (table):
   - Columns: Checkbox, Task Name, Assignee, Due Date, Priority, Status, Progress
   - Sort by any column
   - Bulk actions (checkbox select)
   - Expandable rows for subtasks

6. Calendar View:
   - Monthly calendar with task markers
   - Color-coded by priority
   - Click date to create task
   - Click task to view details
   - Drag tasks to reschedule

7. Timeline View:
   - Gantt-style horizontal timeline
   - Tasks as horizontal bars
   - Dependencies shown with arrows
   - Milestone markers
   - Zoom controls (week/month/quarter)

8. Task Detail Sidebar/Modal:
   - Full task information
   - Activity/comment feed:
     * Comments with avatars
     * Status changes
     * Assignee changes
     * File uploads
     * Time tracking entries
   - Related tasks section
   - Time tracking:
     * Start/stop timer
     * Manual time entry
     * Total time spent
   - Watchers list

9. Quick Stats Cards (top):
   - Total Tasks: 147
   - In Progress: 23
   - Completed This Week: 34
   - Overdue: 5 (with warning)

INTERACTIONS:
- Smooth drag-and-drop with visual feedback
- Real-time collaboration (show who's viewing)
- Toast notifications for task updates
- Animated transitions between views
- Keyboard shortcuts support
- Auto-save on changes

Use modern React components, TypeScript, and Tailwind CSS with neon-glass theme.
```

---

## 🔧 LOW PRIORITY - Sprint 3

### 7️⃣ Custom Metrics Dashboard (`/metrics`)

**v0.dev Prompt:**

```
Create a customizable metrics dashboard builder with drag-and-drop widgets, dark neon-glass aesthetic.

KEY FEATURES:
- Widget library panel (charts, tables, KPIs, maps)
- Drag-and-drop grid canvas
- Resize handles on widgets
- Widget configuration modals
- Save/load dashboard layouts
- Data source connectors
- Real-time data refresh
- Export dashboard as PDF/image

Use modern React components, TypeScript, Tailwind CSS with neon-glass theme.
```

---

### 8️⃣ User Feedback System (`/feedback`)

**v0.dev Prompt:**

```
Create a user feedback collection and analysis page with dark neon-glass aesthetic.

KEY FEATURES:
- Feedback submission form (star rating, category, text, screenshot)
- Feedback management dashboard (cards with sentiment badges)
- Survey builder (question templates, logic branching)
- Response analytics (sentiment charts, word clouds)
- Status tracking (New/Reviewing/Implemented/Declined)
- Voting system for feature requests
- Admin response interface

Use modern React components, TypeScript, Tailwind CSS with neon-glass theme.
```

---

### 9️⃣ Internal Messaging (`/messaging`)

**v0.dev Prompt:**

```
Create an internal messaging and chat interface with dark neon-glass aesthetic.

KEY FEATURES:
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

Use modern React components, TypeScript, Tailwind CSS with neon-glass theme.
```

---

## 🎯 Implementation Workflow

### Step-by-Step Process:

1. **Copy prompt** from above
2. **Paste into v0.dev** (https://v0.dev)
3. **Generate and preview** the component
4. **Iterate if needed** (refine prompt)
5. **Export the code** (Copy React code)
6. **Integrate into NeonHub:**

```bash
# Navigate to UI directory
cd Neon-v2.4.0/ui/src/app

# Replace stub file
# For example, for trends:
# Replace contents of trends/page.tsx with v0.dev generated code

# Customize for NeonHub:
# 1. Wrap with PageLayout component
# 2. Add "use client" if needed
# 3. Adjust imports to match project structure
# 4. Test locally
```

7. **Test and refine** the implementation
8. **Commit changes** with descriptive message

---

## 📝 Post-Integration Checklist

For each page, ensure:
- [ ] "use client" directive added (if using hooks/state)
- [ ] PageLayout wrapper applied
- [ ] Colors match neon palette
- [ ] Responsive on mobile/tablet/desktop
- [ ] Error boundaries in place
- [ ] Loading states implemented
- [ ] Real data integration (if applicable)
- [ ] No console errors
- [ ] Accessibility (keyboard nav, ARIA labels)

---

## 🚀 Recommended Order

**Week 1:**
1. Trends (2-3 days)
2. Billing (3-4 days)

**Week 2:**
3. Team (2-3 days)
4. Support enhancement (2-3 days)

**Week 3:**
5. Documents (3-4 days)
6. Tasks (4-5 days)

**Week 4:**
7. Metrics (3-4 days)
8. Feedback (2-3 days)
9. Messaging (3-4 days)

---

## 💡 Pro Tips

1. **Start with Trends** - easiest integration, high impact
2. **Use v0.dev iterations** - refine prompts until perfect
3. **Save generated code** - keep v0.dev versions for reference
4. **Test incrementally** - don't build all at once
5. **Reuse patterns** - copy working code structure from completed pages
6. **Mobile-first** - ensure responsive design works

---

**Ready to generate!** Copy the prompt for **Trends Dashboard** and paste it into v0.dev to get started! 🎨
