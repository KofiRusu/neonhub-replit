# Postman Web – NeonHub API Verification Guide

**Status**: Ready to Execute  
**Date**: November 22, 2024  
**API Endpoint**: http://localhost:3001/api  

---

## 🚀 QUICK START

This guide will walk you through verifying all NeonHub APIs using Postman Web.

---

## STEP 1: Login to Postman Web

**URL**: https://web.postman.co

1. **Sign in** with your Postman account
   - Email: [your email]
   - Password: [your password]
   - Click "Sign In"

2. You'll be redirected to the Postman dashboard

---

## STEP 2: Create New Workspace

1. **Click** "Workspaces" (top left menu or navigation)
2. **Click** "Create Workspace" button
3. **Name**: `NeonHub-Local-Validation`
4. **Visibility**: Personal (or Team if preferred)
5. **Click** "Create"
6. Wait for workspace to initialize

---

## STEP 3: Import Postman Collection

1. **In the workspace**, click **"Import"** button (usually in center or left panel)
2. **Select method**: "Upload Files"
3. **Choose file**: Navigate to `/Users/kofirusu/Desktop/NeonHub/postman/NeonHub-API.postman_collection.json`
4. **Click** "Open"
5. **Click** "Import" in the dialog
6. **Wait** for import to complete (~30 seconds)

**Expected Result**: Collection appears in left sidebar with 11 folders

---

## STEP 4: Import Environment Files

### Import NeonHub-Local

1. **Click settings icon** (gear) or environment selector
2. **Click** "Import"
3. **Select file**: `/Users/kofirusu/Desktop/NeonHub/postman/NeonHub-Local.postman_environment.json`
4. **Click** "Open" then "Import"

### Import NeonHub-Staging (optional)

1. Repeat above with: `/Users/kofirusu/Desktop/NeonHub/postman/NeonHub-Staging.postman_environment.json`

**Expected Result**: Both environments visible in environment selector

---

## STEP 5: Set Active Environment

1. **Top-right dropdown** (near search bar)
2. **Select**: "NeonHub-Local"
3. **Confirm**: Green checkmark appears next to environment name

---

## STEP 6: Update Base URL (if needed)

The collection uses `{{base_url}}` variable. Verify it's correct:

1. **Click environment name** "NeonHub-Local"
2. **Look for `base_url`** variable
3. **Verify value**: `http://localhost:3001/api`
4. If API runs on different port (e.g., 3000, 3002), **update here**
5. **Click Save**

---

## STEP 7: Start Your Backend

**IMPORTANT**: Before running tests, start the NeonHub API:

```bash
# In a terminal, from /Users/kofirusu/Desktop/NeonHub:
pnpm dev:api

# Wait for output: "Server running on http://localhost:3001"
```

**Alternative ports to check**:
- `http://localhost:3001` (primary)
- `http://localhost:3000` (secondary)
- `http://localhost:5000` (if redirected)

---

## STEP 8: Run Collection Tests

### Full Suite (All 24 Requests)

1. **Right-click collection** "NeonHub-API" in sidebar
2. **Click** "Run Collection"
3. **Configure Run**:
   - Environment: NeonHub-Local
   - Iterations: 1
   - Delay: 0ms
   - Click "Run NeonHub-API"
4. **Watch the runner**: Each request executes in sequence
5. **Wait for completion**: ~30-60 seconds

### Test Results

**Green checkmark (✓)**: Request passed all assertions  
**Red X (✗)**: Request failed one or more assertions  
**Yellow warning (!)**: Warning/skipped

---

## STEP 9: Review Results

After run completes:

1. **Summary panel** shows:
   - Total requests run
   - Passed / Failed count
   - Errors and failures list

2. **Failed requests**:
   - Click to see error details
   - Check response body
   - Note status code

3. **Response inspection**:
   - Click request name
   - View "Response" tab
   - Compare to expected structure

---

## STEP 10: Export Results

### Export Collection (Optional Update)

1. **Right-click collection**
2. **Export**
3. **Format**: "Collection v2.1"
4. **Save to**: `/Users/kofirusu/Desktop/NeonHub/postman/NeonHub-API-VALIDATED.postman_collection.json`

### Export Environment (Optional)

1. **Click environment settings**
2. **Export**
3. **Save to**: `/Users/kofirusu/Desktop/NeonHub/postman/NeonHub-Local-VALIDATED.postman_environment.json`

---

## VALIDATION CHECKLIST

Run each domain test and verify:

### ✅ Health & System
- [ ] GET `/health` → 200
- [ ] GET `/readyz` → 200

### ✅ Auth & Users
- [ ] POST `/auth/login` → 200 (captures token)
- [ ] GET `/auth/me` → 200 (returns user)
- [ ] POST `/auth/logout` → 200/204

### ✅ Campaigns
- [ ] POST `/campaigns` → 201 (creates campaign)
- [ ] GET `/campaigns` → 200 (list)
- [ ] GET `/campaigns/:id` → 200 (fetch one)
- [ ] GET `/campaigns/:id/analytics` → 200 (metrics)

### ✅ Email Agent
- [ ] POST `/campaigns/email/optimize-subject` → 200

### ✅ Social Agent
- [ ] POST `/campaigns/social/generate` → 200

### ✅ SEO Agent
- [ ] GET `/seo` → 200
- [ ] POST `/seo/audit` → 200/202
- [ ] POST `/seo/meta/generate-title` → 200

### ✅ Keywords & Personas
- [ ] POST `/keywords` → 201
- [ ] GET `/keywords` → 200
- [ ] POST `/personas` → 201
- [ ] GET `/personas` → 200

### ✅ E2E Golden Flow 1: Email Campaign
1. [ ] Login → token captured
2. [ ] Create campaign → campaign_id captured
3. [ ] Generate email → copy generated
4. [ ] Fetch analytics → metrics returned

### ✅ E2E Golden Flow 2: SEO Audit
1. [ ] Login → token captured
2. [ ] Run audit → audit completes
3. [ ] Generate meta → title/description generated

---

## 🔧 Troubleshooting

### Issue: "Unable to connect to localhost:3001"
**Solution**:
1. Verify API is running: `curl http://localhost:3001/api/health`
2. Check terminal output for port number
3. Update `base_url` in environment if different port

### Issue: "401 Unauthorized"
**Solution**:
1. Ensure `access_token` is being captured from login
2. Check that Bearer auth is applied (collection-level)
3. Seed database: `pnpm db:seed:test`

### Issue: "Response body empty"
**Solution**:
1. Check API logs for errors
2. Verify request body JSON is valid
3. Check API is actually running

### Issue: "Timeout"
**Solution**:
1. Increase timeout in request settings
2. Check API performance
3. Reduce network delay

---

## 📊 Expected Results Summary

### If All Pass ✅
```
Collection: NeonHub API
Environment: NeonHub-Local

Results:
  Health & System: 2/2 ✓
  Auth & Users: 3/3 ✓
  Campaigns: 7/7 ✓
  Email Agent: 1/1 ✓
  Social Agent: 1/1 ✓
  SEO Agent: 3/3 ✓
  Keywords & Personas: 4/4 ✓
  E2E Flows: 2/2 ✓

TOTAL: 24/24 PASSED ✓
```

### If Some Fail ⚠️
1. Note which specific requests failed
2. Check response status code
3. Review error message in response body
4. Refer to "API Error Reference" section below

---

## 🐛 API Error Reference

### Common Errors & Fixes

#### 404 Not Found
- **Cause**: Endpoint doesn't exist or URL is wrong
- **Fix**: Check base_url is correct in environment
- **Fix**: Verify endpoint path in request

#### 401 Unauthorized
- **Cause**: Token missing or expired
- **Fix**: Re-run login request
- **Fix**: Check token is stored in `access_token` variable

#### 422 Unprocessable Entity
- **Cause**: Invalid request body or missing required fields
- **Fix**: Check request body JSON structure
- **Fix**: Verify all required fields are present

#### 500 Internal Server Error
- **Cause**: API server error
- **Fix**: Check API logs for detailed error
- **Fix**: Restart API: Ctrl+C then `pnpm dev:api`

#### 503 Service Unavailable
- **Cause**: API is not running or database not accessible
- **Fix**: Start API: `pnpm dev:api`
- **Fix**: Ensure database is running

---

## 📝 After Validation

1. **Document results** in validation report
2. **Fix any failing endpoints** in codebase
3. **Re-test** after fixes
4. **Export final collection** for archival
5. **Commit** updated collection to git

---

## 🎯 Next Steps

1. **If all tests pass**: ✅ API is production-ready
2. **If tests fail**: 
   - Note failing endpoint
   - Check response body for error details
   - Fix in codebase (`/apps/api/src/...`)
   - Re-run collection

3. **Generate report**: Use results to create validation matrix

---

## 📞 Support

- **Postman Docs**: https://learning.postman.com
- **NeonHub API Docs**: See `docs/api-testing.README.md`
- **Local Testing**: See `START_HERE_POSTMAN_TESTING.md`

---

**Ready to verify?** Follow steps 1-10 above in order.

Good luck! 🚀

