# Known Issues - Phase 4 Beta

This document tracks known issues, limitations, and workarounds in the Phase 4 Beta release.

**Last Updated:** October 24, 2025

---

## Critical Issues 🔴

### None Currently

No critical issues identified in initial release.

---

## High Priority Issues 🟠

### Database Migration Pending
**Status:** In Progress  
**Affected Features:** All new features  
**Description:** Prisma migrations need to be run to create new database tables.

**Workaround:**
```bash
cd apps/api
npm run prisma:migrate
```

**Fix ETA:** Sprint 1, Week 2

---

## Medium Priority Issues 🟡

### 1. Test Coverage Below Target
**Status:** In Progress  
**Affected Areas:** Overall test coverage  
**Description:** Current coverage may not meet 95% threshold.

**Impact:** CI pipeline may fail until coverage improves.

**Workaround:** None required for beta testing.

**Fix ETA:** Sprint 1, Week 2

### 2. Billing Routes Still Use Mock Data
**Status:** Known  
**Affected Features:** Billing endpoints  
**Description:** Billing routes contain TODO comments for Stripe integration.

**Impact:** Billing information is not persisted or accurate.

**Workaround:** Avoid testing billing features during Sprint 1.

**Fix ETA:** Sprint 1, Week 2

### 3. Metrics Routes Need Real Implementation
**Status:** Known  
**Affected Features:** Metrics endpoints  
**Description:** Metrics collection is stubbed.

**Impact:** Analytics data may be incomplete.

**Workaround:** Use feedback system to report metrics issues.

**Fix ETA:** Sprint 1, Week 2

---

## Low Priority Issues 🟢

### 1. Social API Keys Optional
**Status:** By Design  
**Affected Features:** Trends analysis  
**Description:** Trends service falls back to mock data without API keys.

**Impact:** Trend data may be cached/sample data.

**Workaround:** Configure TWITTER_BEARER_TOKEN and REDDIT_CLIENT_ID in .env for real data.

**Fix ETA:** Not applicable (working as designed)

### 2. Team Invitations Use In-Memory Storage
**Status:** Temporary  
**Affected Features:** Team invitations  
**Description:** Invitation tokens stored in memory, not database.

**Impact:** Invitations lost on server restart.

**Workaround:** Complete invitation process before server restarts.

**Fix ETA:** Sprint 2

---

## Known Limitations

### Feature Availability

| Feature | Status | Notes |
|---------|--------|-------|
| Documents | ✅ Available | Full functionality |
| Tasks | ✅ Available | Full functionality |
| Feedback | ✅ Available | Full functionality |
| Messaging | ✅ Available | Full functionality |
| Team Management | ✅ Available | Database-backed |
| Trends | ✅ Available | Requires API keys for real data |
| Connectors | ⏳ Coming Soon | Sprint 2 implementation |
| Billing | ⚠️ Limited | Mock data only |
| Metrics | ⚠️ Limited | Stubbed implementation |

### API Rate Limits

- **Authenticated Requests:** 1,000 per hour per user
- **Unauthenticated Requests:** 100 per hour per IP
- **WebSocket Connections:** 5 concurrent per user

### Data Limits

- **Document Size:** 10 MB maximum
- **Message Attachments:** 5 MB per file
- **Tasks per User:** 1,000 maximum
- **Team Size:** 100 members maximum (beta)

### Browser Support

**Fully Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Limited Support:**
- Internet Explorer: Not supported
- Older browsers: May have UI issues

### Platform Support

**Supported:**
- macOS 10.15+
- Windows 10+
- Linux (Ubuntu 20.04+)

**Coming Soon:**
- iOS app
- Android app
- Desktop app

---

## Workarounds

### Issue: Cannot Create Document Version
**Error:** "Document not found"  
**Cause:** Parent document may be deleted or permissions insufficient.

**Workaround:**
1. Verify document exists: `GET /api/documents/:id`
2. Check you're the owner
3. Try creating a new document instead of versioning

### Issue: Tasks Not Showing for Assigned User
**Error:** Empty list returned  
**Cause:** Database query may not include assigned tasks.

**Workaround:**
1. Use status filter: `GET /api/tasks?status=in_progress`
2. Check with task creator
3. Report via feedback system

### Issue: Messages Marked as Read Automatically
**Expected:** Messages stay unread until manually marked  
**Actual:** Messages marked as read when viewed

**Cause:** `getMessageById` automatically marks as read.

**Workaround:** None - this is intended behavior. Use `GET /api/messages` to view without marking as read.

### Issue: Trend Data is Cached/Old
**Cause:** No API keys configured.

**Workaround:**
1. Set environment variables:
```bash
TWITTER_BEARER_TOKEN=your_token
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
```
2. Restart server
3. Trends will now pull real-time data

---

## Reporting New Issues

If you encounter an issue not listed here:

1. **Check GitHub Issues:** Search existing issues first
2. **Use Feedback System:** `POST /api/feedback`
3. **Use Issue Template:** `.github/ISSUE_TEMPLATE/beta-feedback.md`
4. **Email Beta Team:** beta@neonhub.com for urgent issues

### Required Information

When reporting issues, always include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots or error messages
- Your beta user ID

---

## Fixed Issues

### Sprint 1 Fixes

#### October 24, 2025
- ✅ Initial beta release
- ✅ All Phase 4 routes implemented
- ✅ Test suite created
- ✅ CI/CD configured

---

## Upcoming Fixes

### Sprint 1, Week 2
- [ ] Complete Prisma migration
- [ ] Achieve 95% test coverage
- [ ] Implement real billing integration
- [ ] Implement real metrics collection

### Sprint 2
- [ ] Connector framework
- [ ] Tier 1 connectors (Slack, Gmail, Sheets, Trello, Stripe)
- [ ] Database-backed team invitations

### Sprint 3
- [ ] Tier 2 connectors (Notion, Asana, HubSpot, Twitter, Discord)
- [ ] Frontend connector UI
- [ ] Enhanced smoke tests

---

## Contact

For questions about known issues:
- **GitHub:** [Open an issue](https://github.com/neonhub/neonhub/issues)
- **Email:** beta@neonhub.com
- **Slack:** #beta-known-issues

---

**Note:** This document is updated regularly. Check back for the latest information.

