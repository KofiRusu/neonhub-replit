# NeonHub API Testing - Complete Browser Verification Setup

## ✅ Status: READY FOR EXECUTION

All files have been prepared and are ready for verification through Postman Web. This document guides you through running a complete API verification against your localhost NeonHub backend.

---

## 📊 What's Being Tested

### Test Coverage Summary
- **Total Requests**: 100+ API endpoints
- **Domains Covered**: 17 different API domains
- **Test Cases**: 200+ individual test assertions
- **Authentication**: Bearer token (JWT)
- **E2E Flows**: 3 golden workflow scenarios

### Domains Under Test
1. ✅ Health & System Endpoints
2. ✅ Auth & User Management  
3. ✅ Campaigns (Create, Read, Update, Optimization)
4. ✅ Email Agent (Sequences, Optimization)
5. ✅ Social Media Agent (Generation, Optimization, Scheduling)
6. ✅ SEO Agent (Audits, Meta Tags, Content)
7. ✅ Keywords & Personas (CRUD operations)
8. ✅ Connectors (HubSpot, Salesforce, etc.)
9. ✅ Jobs & Queues (Async task management)
10. ✅ Settings & Configuration
11. ✅ Analytics & Metrics
12. ✅ Governance & Data Trust
13. ✅ Sitemaps & Assets
14. ✅ Team & Collaboration
15. ✅ Billing & Subscriptions
16. ✅ SMS & Messaging
17. ✅ Editorial Calendar

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Ensure API is Running (1 min)
```bash
# In a terminal, from the NeonHub root directory
pnpm dev
# Wait for: "Server running on http://localhost:3001"
```

### Step 2: Open Postman Web (1 min)
- Go to: https://web.postman.co
- Click your Postman account (you're already logged in)
- Wait for workspace to load

### Step 3: Import Collection (1 min)
1. Click **"Import"** button (top left, next to "New")
2. Click **"files"** in the import dialog
3. Select file: `/Users/kofirusu/Desktop/NeonHub/postman/NeonHub-API.postman_collection.json`
4. Click **"Import"**
5. Wait for import to complete

### Step 4: Import Environment (1 min)
1. Click **"Import"** again
2. Click **"files"**
3. Select file: `/Users/kofirusu/Desktop/NeonHub/postman/NeonHub-Local.postman_environment.json`
4. Click **"Import"**
5. Wait for import to complete

### Step 5: Set Environment & Run Tests (1 min)
1. Top right corner: Click **"No environment"** dropdown
2. Select **"NeonHub-Local"** from the list
3. On the left panel, right-click **"NeonHub API"** collection
4. Click **"Run collection"**
5. Watch tests execute (3-5 minutes)

---

## 📋 Files Prepared

### Postman Files (Ready to Import)
```
/Users/kofirusu/Desktop/NeonHub/postman/
├── NeonHub-API.postman_collection.json         ← Main test suite
├── NeonHub-Local.postman_environment.json      ← Local vars & credentials
└── NeonHub-Staging.postman_environment.json    ← Staging (optional)
```

### Test Coverage
```
postman/NeonHub-API.postman_collection.json
├── Health & System                    [2 requests]
├── Auth & Users                       [3 requests]
├── Campaigns                          [12 requests]
├── Agents - Content (tRPC)            [4 requests]
├── Agents - Email                     [5 requests]
├── Agents - Social                    [6 requests]
├── Agents - SEO                       [8 requests]
├── Agents - Predictive                [3 requests]
├── Keywords & Personas                [6 requests]
├── Connectors                         [3 requests]
├── Jobs & Queues                      [2 requests]
├── Settings & Configuration           [3 requests]
├── Analytics & Metrics                [2 requests]
├── Governance & Data Trust            [5 requests]
├── Sitemaps & Assets                  [2 requests]
├── Team & Collaboration               [3 requests]
├── Billing & Subscriptions            [3 requests]
├── Email/SMS/Social Messaging         [7 requests]
└── E2E – Golden Flows                 [3 scenarios]
```

---

## 🎯 Expected Results

### Best Case (All Pass)
```
Results: ✅ 100+ tests passed
Status: All endpoints operational
Time: ~3-5 minutes
Action: API ready for deployment
```

### Typical Case (Most Pass)
```
Results: ✅ 85-95 passed | ⚠️ 5-15 failed
Status: Core functionality working, minor fixes needed
Time: ~3-5 minutes
Action: Review failures, fix reported endpoints
```

### Needs Work
```
Results: ⚠️ <50% passing
Status: Multiple failures detected
Likely Cause:
  - API not started
  - Database not seeded
  - Missing environment variables
  - Port conflict (3001 busy)
Action: 
  1. Kill any process on :3001
  2. Restart API: pnpm dev
  3. Seed database: pnpm db:seed:test
  4. Re-run collection
```

---

## 🔍 What Gets Tested

### Authentication Flow
```javascript
1. POST /auth/login
   ↓ (Extracts & stores access_token)
2. All subsequent requests use token in header
   → Authorization: Bearer {{access_token}}
```

### Sample Test Assertions
- ✅ Status codes (200, 201, 400, 401, 404, 500)
- ✅ Response headers present
- ✅ JSON schema validation
- ✅ Required fields in response body
- ✅ Data type validation
- ✅ Timestamp format validation
- ✅ UUID/ID format validation
- ✅ Pagination structure (if applicable)
- ✅ Error message structure
- ✅ Permission/authorization checks

### E2E Flows Tested
1. **Marketing Campaign Flow**
   - Create campaign → Generate content → Schedule → Check metrics
   
2. **Multi-Agent Orchestration**
   - Single request triggers multiple AI agents (Email, Social, SEO)
   - Validates coordinated responses

3. **Connector Integration**
   - Connect to external platform → Sync data → Verify sync

---

## 💾 Environment Variables

The `NeonHub-Local.postman_environment.json` includes:

```json
{
  "base_url": "http://localhost:3001/api",
  "email": "test@neonhub.local",
  "password": "TestPassword123!",
  "access_token": "[auto-filled after login]",
  "campaign_id": "[auto-filled by creation]",
  "connector_id": "[auto-filled by creation]",
  // ... additional variables for chaining
}
```

### Auto-Populated Variables
After running the collection:
- `access_token` - Set by Login request
- `campaign_id` - Set by Create Campaign request
- `connector_id` - Set by Connector tests
- `job_id` - Set by Job creation
- `team_id` - Set by Team tests
- `keyword_id` - Set by Keyword creation

---

## ⚠️ Troubleshooting

### Issue: "Cannot connect to localhost:3001"
**Solution:**
```bash
# 1. Kill any process on port 3001
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9

# 2. Restart the API
pnpm dev
```

### Issue: "401 Unauthorized" on all requests
**Solution:**
1. Check NeonHub-Local environment is selected (top right)
2. Verify login request runs first and succeeds
3. Check access_token is visible in Tests output

### Issue: "Database connection failed"
**Solution:**
```bash
# Seed the database first
pnpm db:seed:test

# Then restart API
pnpm dev
```

### Issue: "Schema validation failed"
**Action:**
1. Click the failing request
2. Check the response body in the Response panel
3. Compare against test assertions (Tests tab)
4. This may indicate an API change - note the difference

---

## 📊 Analyzing Results

### In Postman Runner
After running the collection:

1. **Summary View**
   - Total requests
   - Passed/Failed count
   - Total assertions passed/failed

2. **Failed Requests**
   - Click any failed test
   - See error message and assertion that failed
   - Response body shows actual vs expected

3. **Export Results**
   - Click "Export Results" (bottom right)
   - Save as JSON/CSV for reporting

### Key Metrics
```
Collection Run Statistics:
├── Total Requests: [count]
├── Passed: [count] ✅
├── Failed: [count] ⚠️
├── Skipped: [count] ⏭️
├── Total Tests: [count]
├── Tests Passed: [count] ✅
├── Tests Failed: [count] ⚠️
└── Duration: [time] (typically 3-5 min)
```

---

## 📝 Documenting Results

After running the collection, document your results:

```markdown
# API Verification Run - [Date]

## Summary
- Environment: NeonHub-Local (localhost:3001)
- Duration: [time]
- Total Requests: [count]
- Passed: [count]
- Failed: [count]

## Failed Endpoints
[List any failures]

## Sample Response
[Screenshot of Postman runner results]

## Remediation Plan
[If failures, list fixes needed]
```

---

## 🎓 Learning More

### Postman Documentation
- [Running Collections](https://learning.postman.com/docs/collections/running-collections/running-collections-overview/)
- [Test Scripts](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [Variables](https://learning.postman.com/docs/sending-requests/variables/)

### NeonHub API Docs
- See: `docs/api-testing/postman-plan.md` for full API surface
- See: `docs/api-testing/ROUTE_INDEX.md` for all endpoints
- See: `docs/api-testing/COVERAGE_MATRIX.md` for test coverage stats

---

## ✅ Verification Checklist

Before running tests:
- [ ] API is running (`pnpm dev` shows "Server running on http://localhost:3001")
- [ ] Postman Web is open (https://web.postman.co)
- [ ] Collection imported (NeonHub API visible in left panel)
- [ ] Environment imported (NeonHub-Local selectable in dropdown)
- [ ] Environment selected (shows "NeonHub-Local" in top right)

After running tests:
- [ ] Collection completed execution
- [ ] Test summary visible
- [ ] Screenshots/results captured
- [ ] Failed tests (if any) documented
- [ ] Results exported (optional but recommended)
- [ ] Log file saved for reference

---

## 🚀 Next Steps After Verification

1. **If All Pass** ✅
   - Review test coverage (aim for 80%+)
   - Commit changes to git
   - Prepare for CI/CD deployment

2. **If Some Fail** ⚠️
   - Note the endpoint and error
   - Check API logs: `tail -50 terminal_output.txt`
   - Fix the reported issues
   - Re-run specific endpoint test
   - Once fixed, re-run full collection

3. **If Many Fail** ❌
   - Verify API is actually running
   - Check database is seeded
   - Review environment variables
   - Check for port conflicts
   - Restart from scratch

---

## 📞 Support

If you encounter issues:

1. **Check the API logs**
   - Terminal running `pnpm dev` shows real-time API logs

2. **Review Postman response**
   - Click any request after execution
   - Check Response tab for actual error message
   - Check Headers tab for response metadata

3. **Validate environment**
   - Ensure all required env vars are set
   - Check `.env` file exists in root
   - Verify `PORT=3001` is set

4. **Run diagnostic**
   - Test health: `curl http://localhost:3001/health`
   - Test auth: Manual login in Postman
   - Check logs: `pnpm dev` terminal output

---

## 📈 Success Criteria

✅ **API Testing Complete When:**
- All 100+ requests in collection have been executed
- Test assertions validated
- Results documented
- Failed tests (if any) have remediation plan
- Team aware of API status

---

**Generated**: November 22, 2024  
**Status**: ✅ Ready for Execution  
**Next Action**: Follow the 5-minute quick start above →


