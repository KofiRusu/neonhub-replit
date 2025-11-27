# Postman Web Workflow – NeonHub API Verification

**Current Status**: Ready to Execute via Browser  
**Access**: https://web.postman.co (requires manual login)  

---

## 📋 What You'll Do

You will:

1. **Log in** to Postman Web
2. **Create workspace** for local testing
3. **Import collection** with 24 requests
4. **Import environments** for local/staging
5. **Configure** API URL and auth
6. **Run full test suite** against your local backend
7. **Capture results** showing what passes/fails
8. **Generate validation report** with remediation steps

**Total Time**: ~15-30 minutes

---

## 📦 Files You'll Import

All files are in `/Users/kofirusu/Desktop/NeonHub/postman/`:

```
postman/
├── NeonHub-API.postman_collection.json         ← IMPORT THIS
├── NeonHub-Local.postman_environment.json      ← IMPORT THIS
└── NeonHub-Staging.postman_environment.json    ← IMPORT THIS (optional)
```

---

## 🚀 Quick Workflow

### Phase 1: Setup (5 minutes)
1. Go to https://web.postman.co
2. Login with your credentials
3. Create workspace "NeonHub-Local-Validation"
4. Import collection JSON file
5. Import environment JSON files
6. Set active environment: "NeonHub-Local"

### Phase 2: Configuration (2 minutes)
1. Verify `base_url` in NeonHub-Local environment
2. Confirm it matches your API port (likely `http://localhost:3001/api`)
3. Save changes

### Phase 3: Start Backend (1 minute)
1. Open terminal
2. Navigate to `/Users/kofirusu/Desktop/NeonHub`
3. Run: `pnpm dev:api`
4. Wait for: "Server running on http://localhost:3001"

### Phase 4: Run Tests (5-10 minutes)
1. In Postman, right-click collection
2. Select "Run Collection"
3. Click "Run NeonHub-API"
4. Watch all 24 requests execute
5. Note which pass and which fail

### Phase 5: Document Results (5-10 minutes)
1. Open: `API_VALIDATION_REPORT_TEMPLATE.md`
2. Fill in results from Postman run
3. Note any failures
4. Save report

---

## ✅ Expected Results

### Best Case (All Pass)
```
Collection Run Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Requests: 24
Passed:        24 ✓
Failed:        0
Skipped:       0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Success Rate:  100%
Status:        ✅ PASS
```

**Domains Status**:
- ✓ Health & System (2/2)
- ✓ Auth & Users (3/3)
- ✓ Campaigns (7/7)
- ✓ Email Agent (1/1)
- ✓ Social Agent (1/1)
- ✓ SEO Agent (3/3)
- ✓ Keywords & Personas (4/4)
- ✓ E2E Flows (2/2)

**Conclusion**: All endpoints operational, collection ready for CI integration

---

### Likely Case (Some Fail)
```
Collection Run Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Requests: 24
Passed:        18 ✓
Failed:        6 ✗
Skipped:       0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Success Rate:  75%
Status:        ⚠️ PARTIAL PASS
```

**Failing Endpoints** (example):
- ✗ POST `/campaigns/social/generate` → 404 (not implemented)
- ✗ POST `/personas` → 422 (invalid schema)
- ✗ GET `/connectors` → 401 (auth issue)
- ✗ POST `/seo/audit` → 500 (server error)
- ✗ POST `/seo/recommendations/weekly` → 404 (not found)
- ✗ GET `/trends` → 500 (database error)

**Conclusion**: Some endpoints need fixes; note failures and apply remediation

---

### Worst Case (Many Fail)
```
Collection Run Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Requests: 24
Passed:        5 ✓
Failed:        19 ✗
Skipped:       0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Success Rate:  21%
Status:        ❌ FAIL
```

**Common Causes**:
- API not running (404 on all routes)
- Database not connected (500 errors)
- Auth not configured (401 on all protected routes)
- Routes not implemented (404 on specific endpoints)

**Conclusion**: Check API logs, restart backend, verify database

---

## 🔍 How to Identify Failures in Postman

### Visual Indicators

**Passed Request** ✓ (green)
- Green checkmark
- "1 passed, 0 failed" in tests

**Failed Request** ✗ (red)
- Red X mark
- "0 passed, 1 failed" in tests
- Error shown in bottom panel

### Inspecting Failures

1. **Click on failed request** in results
2. **View "Response" tab** to see:
   - Status code (200, 404, 500, etc.)
   - Response body (JSON with error)
   - Headers
   - Response time

3. **Check "Tests" tab** to see which assertion failed:
   - Status code check
   - Schema validation
   - Variable capture
   - Other assertions

### Example Failure

**Request**: POST `/campaigns/social/generate`  
**Expected**: 200 OK  
**Actual**: 404 Not Found

**Response Body**:
```json
{
  "status": "error",
  "message": "POST /api/campaigns/social/generate not found"
}
```

**Cause**: Route not implemented in backend  
**Fix**: Add endpoint to `/apps/api/src/routes/campaign.ts`

---

## 🛠️ Common Issues & Quick Fixes

### Issue 1: "Connection Refused"
**What it means**: API not running  
**How to fix**:
1. Open terminal
2. `cd /Users/kofirusu/Desktop/NeonHub`
3. `pnpm dev:api`
4. Wait for "Server running" message
5. Retry in Postman

---

### Issue 2: "401 Unauthorized"
**What it means**: Authentication failed  
**How to fix**:
1. Ensure login request completes first
2. Check `access_token` is captured in variable
3. Verify NeonHub-Local environment is selected
4. Check token is not expired
5. Seed database: `pnpm db:seed:test`

---

### Issue 3: "404 Not Found"
**What it means**: Endpoint doesn't exist  
**How to fix**:
1. Verify base_url is correct in environment
2. Check endpoint path in request URL
3. Verify HTTP method (GET vs POST, etc.)
4. Check if endpoint is implemented in backend

---

### Issue 4: "500 Internal Server Error"
**What it means**: Backend crashed or database issue  
**How to fix**:
1. Check API logs in terminal for error
2. Verify database is running
3. Restart API: Ctrl+C then `pnpm dev:api`
4. Check if migrations ran: `pnpm db:migrate`

---

## 📊 What to Document

After running tests, document:

### In the Report Template:
- [ ] Total passed/failed count
- [ ] Each failed endpoint with:
  - Endpoint URL
  - Expected vs actual status
  - Error message from response
  - Suspected cause
  - Recommended fix
- [ ] E2E flow results
- [ ] Overall success percentage

### File Locations for Fixes:
- Auth routes: `/apps/api/src/routes/auth.ts`
- Campaign routes: `/apps/api/src/routes/campaign.ts`
- Agent routes: `/apps/api/src/agents/*.ts`
- tRPC routes: `/apps/api/src/trpc/routers/*.router.ts`

---

## 📤 Export & Archive

After validation:

### Export Collection
1. Right-click collection in Postman
2. "Export"
3. Format: "Collection v2.1"
4. Save as: `/Users/kofirusu/Desktop/NeonHub/postman/NeonHub-API-RESULTS.postman_collection.json`

### Export Environment
1. Click settings gear
2. "Export"
3. Save as: `/Users/kofirusu/Desktop/NeonHub/postman/NeonHub-Local-RESULTS.postman_environment.json`

### Save Report
1. Fill in `API_VALIDATION_REPORT_TEMPLATE.md`
2. Save as: `/Users/kofirusu/Desktop/NeonHub/VALIDATION_RESULTS.md`

---

## 📋 Checklist

**Before Running Tests**:
- [ ] Read this guide
- [ ] Logged into Postman Web
- [ ] Workspace created
- [ ] Collection imported
- [ ] Environments imported
- [ ] Active environment set to NeonHub-Local
- [ ] API is running locally
- [ ] Test credentials configured

**During Tests**:
- [ ] All requests running
- [ ] Watching for pass/fail indicators
- [ ] Noting failed endpoints
- [ ] Checking error messages

**After Tests**:
- [ ] Results documented in template
- [ ] Failed endpoints identified
- [ ] Error messages captured
- [ ] Suggested fixes noted
- [ ] Collection exported
- [ ] Report saved

---

## 🎯 Next Steps After Validation

1. **If all pass (100%)**: ✅
   - API is production-ready
   - Run full CI/CD pipeline
   - Deploy to staging

2. **If mostly pass (80%+)**: ⚠️
   - Fix failing endpoints
   - Re-run collection
   - Document known issues

3. **If some fail (50-79%)**: ⚠️
   - Prioritize critical failures
   - Fix auth and health issues first
   - Fix other endpoints second
   - Re-test after each fix

4. **If few pass (<50%)**: ❌
   - Check API is running
   - Check database is running
   - Restart everything
   - Check API logs for errors
   - Consider full rebuild

---

## 📞 Resources

- **Postman Docs**: https://learning.postman.com
- **NeonHub Setup**: See `START_HERE_POSTMAN_TESTING.md`
- **Test Guide**: See `POSTMAN_WEB_VERIFICATION_GUIDE.md`
- **Report Template**: See `API_VALIDATION_REPORT_TEMPLATE.md`

---

## Ready?

1. **Log in** to https://web.postman.co
2. **Follow** `POSTMAN_WEB_VERIFICATION_GUIDE.md` steps 1-10
3. **Run** the collection
4. **Fill in** `API_VALIDATION_REPORT_TEMPLATE.md`
5. **Share** results

Good luck! 🚀

---

**Document**: POSTMAN_BROWSER_WORKFLOW.md  
**Created**: November 22, 2024  
**Status**: Ready for Execution

