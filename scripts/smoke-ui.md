# UI Manual Smoke Test Checklist

**Quick browser verification before deployment**

---

## Prerequisites

- [ ] Backend running on :3001
- [ ] Frontend running on :3000
- [ ] Database connected

---

## Critical Path (5 minutes)

### 1. Homepage & Navigation
- [ ] Visit http://127.0.0.1:3000
- [ ] Homepage loads without errors
- [ ] Navigation sidebar visible
- [ ] Logo and branding correct
- [ ] All menu items clickable

### 2. Dashboard
- [ ] Navigate to /dashboard
- [ ] KPI widgets render
- [ ] No console errors
- [ ] Glass effects visible
- [ ] Neon colors correct

### 3. Analytics
- [ ] Navigate to /analytics
- [ ] Metrics display
- [ ] Charts render (or placeholders)
- [ ] Data looks reasonable

### 4. Content Generation
- [ ] Navigate to /content
- [ ] Enter topic: "Test smoke"
- [ ] Select content type
- [ ] Click generate
- [ ] Draft created successfully
- [ ] Job status updates

### 5. Trends (Real-Time)
- [ ] Navigate to /trends
- [ ] Metrics cards show data
- [ ] AI signals display
- [ ] Switch time range: 30d → 7d → 24h
- [ ] Metrics update on range change
- [ ] WebSocket connected (check console)
- [ ] After content generation, metrics auto-update

### 6. Billing
- [ ] Navigate to /billing
- [ ] Badge shows: "Live" or "Sandbox"
- [ ] Current plan displays
- [ ] Usage metrics render
- [ ] Progress bars show percentages
- [ ] Plan cards display (3 tiers)
- [ ] Monthly/Yearly toggle works
- [ ] Invoice table renders

### 7. Team
- [ ] Navigate to /team
- [ ] Team members list shows
- [ ] Stats cards correct
- [ ] Click "Invite Member"
- [ ] Modal opens
- [ ] Enter email: test@example.com
- [ ] Select role: Member
- [ ] Click "Send Invitation"
- [ ] Success (email sent or preview shown)
- [ ] Invitation in pending list

### 8. Settings
- [ ] Navigate to /settings
- [ ] Settings page loads
- [ ] Forms render

---

## Quick Checks (All Routes)

- [ ] /agents - Loads
- [ ] /campaigns - Loads
- [ ] /email - Loads
- [ ] /social-media - Loads
- [ ] /brand-voice - Loads
- [ ] /support - Loads

---

## UI/UX Quality

- [ ] Neon colors (#00D9FF, #B14BFF, #FF006B, #00FF94)
- [ ] Glass effects (backdrop-blur)
- [ ] Smooth animations
- [ ] No layout shifts
- [ ] Responsive on mobile (resize browser)
- [ ] Dark theme applied
- [ ] No flickering

---

## Console Checks

- [ ] No critical errors (red)
- [ ] No uncaught exceptions
- [ ] WebSocket connected message
- [ ] API calls succeed (200s)
- [ ] No CORS errors

---

## Real-Time Verification

1. Open /trends in one tab
2. Open /content in another
3. Generate content
4. Switch to /trends tab
5. Should see metrics auto-update

---

## Integration Tests

**If Stripe Live:**
- [ ] Click "Upgrade" button
- [ ] Redirects to Stripe checkout
- [ ] Can cancel and return

**If Email Configured:**
- [ ] Invite sends real email
- [ ] Email arrives in inbox
- [ ] Accept link works

**If Sandbox Mode:**
- [ ] "Sandbox" badge shows
- [ ] Preview URL displayed
- [ ] Alert on CTA buttons

---

## ✅ Pass Criteria

- All critical routes load
- No console errors
- Real-time updates work
- Integrations functional (or sandbox)
- UI looks professional

---

## 🚨 Stop & Fix If:

- Console shows red errors
- Pages crash/white screen
- API calls fail (network errors)
- WebSocket won't connect
- Data not loading

---

**Time to complete:** 5-10 minutes  
**When:** Before every deployment  
**Result:** GO / NO-GO decision

---

**✅ All checks passed?** → Ready to deploy!  
**❌ Any failures?** → Fix before deploying

