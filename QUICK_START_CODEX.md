# NeonHub Codex Quick Start — Two-Terminal Setup

**Created:** Oct 28, 2025  
**Goal:** Coordinated two-terminal execution to reach production MVP in 14 weeks

---

## 🚀 Quick Start

### Step 1: Open Two Codex Windows

1. **Terminal A** — Infrastructure & Backend Lead
2. **Terminal B** — Frontend & SEO Lead

### Step 2: Copy Prompts

**Open file:** `CODEX_TERMINAL_PROMPTS.md`

- **Copy TERMINAL A PROMPT** (lines 8-507) into Codex Window 1
- **Copy TERMINAL B PROMPT** (lines 509-1005) into Codex Window 2

### Step 3: Begin Execution

Both terminals will:
1. Read coordination status from `CODEX_COORDINATION_STATUS.md`
2. Update their progress in `logs/terminal-{a,b}-progress.md`
3. Follow their respective phase plans
4. Coordinate when shared files need changes

---

## 📋 Terminal Responsibilities

### Terminal A (Backend)
- ✅ Restore node_modules + Prisma client
- ✅ Connect database and run migrations
- ✅ Fix 20 TypeScript errors
- ✅ Implement agent orchestrator pattern
- ✅ Fix Jest configuration
- ✅ Add connector mocks
- ✅ Achieve 95% test coverage

### Terminal B (Frontend)
- ✅ Audit existing UI components
- ✅ Build agent dashboard with tRPC
- ✅ Design SEO system architecture
- ✅ Create keyword research UI
- ✅ Implement content generator interface
- ✅ Ensure accessibility compliance
- ✅ Wire all features to backend API

---

## 🔄 Coordination Protocol

### Daily Sync
1. **Morning:** Each terminal updates their progress file
2. **Midday:** Check `CODEX_COORDINATION_STATUS.md` for blockers
3. **Evening:** Commit changes, update coordination doc

### File Ownership
- **Terminal A:** `apps/api/`, database, tests
- **Terminal B:** `apps/web/`, docs/seo/, docs/ui/
- **Shared:** `core/sdk/`, `prisma/schema.prisma` (coordinate first)

### Blocker Handling
If Terminal B is blocked by Terminal A (or vice versa):
1. Add blocker to `CODEX_COORDINATION_STATUS.md` under "🚨 NEW BLOCKERS"
2. Continue with parallel work if possible
3. Partner terminal addresses blocker ASAP

---

## 📊 Progress Tracking

### Live Status Files
- `CODEX_COORDINATION_STATUS.md` — Overall project status
- `logs/terminal-a-progress.md` — Backend work log
- `logs/terminal-b-progress.md` — Frontend work log

### Success Metrics (Week 2)
- [ ] node_modules restored
- [ ] Database seeded
- [ ] 0 TypeScript errors
- [ ] Jest tests passing
- [ ] 3+ agents with orchestrator
- [ ] Agent dashboard UI complete
- [ ] SEO architecture documented

---

## 🎯 Critical Path (Week 1-2)

**Terminal A:**
1. Day 1: Restore dependencies + database
2. Day 2: Fix TypeScript + Jest
3. Day 3-4: Implement agent orchestrator
4. Day 5: Add connector mocks

**Terminal B:**
1. Day 1: UI audit (while A restores deps)
2. Day 2-3: Build agent dashboard
3. Day 3-4: Design SEO architecture
4. Day 5: Accessibility audit

---

## 📚 Key Documents

- **Full Prompts:** `CODEX_TERMINAL_PROMPTS.md`
- **Status:** `CODEX_COORDINATION_STATUS.md`
- **Executive Summary:** `EXECUTIVE_SUMMARY_OCT28.md`
- **Development Map:** `devmap.md`
- **DB Plan:** `.cursor/plans/db-infrastructure-audit-86568550.plan.md`

---

## ⚡ Emergency Commands

**Terminal A:**
```bash
# Check dependency status
ls -la apps/api/node_modules/@prisma/client

# Test database connection
pnpm --filter apps/api prisma migrate status

# Run type check
pnpm --filter apps/api run typecheck
```

**Terminal B:**
```bash
# Check Terminal A progress
cat logs/terminal-a-progress.md

# Start dev server (when deps ready)
pnpm --filter apps/web dev
```

---

**Ready?** Open `CODEX_TERMINAL_PROMPTS.md` and copy the prompts to your Codex windows! 🚀
