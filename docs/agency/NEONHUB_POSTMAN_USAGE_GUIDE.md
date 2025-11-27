# NeonHub API – Postman Usage Guide

**For**: Integration Teams, QA Engineers, Development Partners  
**Updated**: November 23, 2025  
**Version**: 3.2.0

---

## Overview

This guide explains how to:
1. Import NeonHub Postman collection and environment
2. Configure authentication
3. Run smoke tests
4. Execute the full test suite via Newman CLI
5. Debug failing requests

---

## Prerequisites

- **Postman Web** (postman.com) or **Desktop App** (postman.com/downloads)
- **NeonHub API running** locally or on staging
- **Test credentials**: email + password (see [Test User Credentials](#test-user-credentials))
- **Newman** (optional, for CLI automation): `npm install -g newman`

---

## Step 1: Import Postman Collection & Environment

### Via Postman Web

1. **Open Postman**: https://postman.postman.com (or launch Desktop App)
2. **Login** with your Postman account
3. **Click "Import"** (top left)
4. **Select Files**:
   - Collection: `postman/NeonHub-API.postman_collection.json`
   - Environment: `postman/NeonHub-Local.postman_environment.json`
5. **Click Import**

### Via File Drag & Drop

1. **Open Postman**
2. **Drag files** (`*.postman_collection.json`, `*.postman_environment.json`) into Postman window
3. **Confirm** import dialog

### Expected Result

- ✅ "NeonHub API" collection appears in left sidebar
- ✅ "NeonHub – Local" environment appears in environment dropdown (top right)

---

## Step 2: Select Environment & Configure Variables

### Select Environment

1. **Top right dropdown**: Click environment selector
2. **Choose**: "NeonHub – Local"

### Key Variables

The environment pre-configures:

| Variable | Value | Notes |
|----------|-------|-------|
| `base_url` | `http://localhost:3001/api` | API base path |
| `email` | `test@neonhub.local` | Test user email |
| `password` | `TestPassword123!` | Test password |
| `access_token` | *(empty)* | Auto-populated after login |
| `campaign_id` | *(empty)* | Populated by smoke tests |
| `task_id` | *(empty)* | Populated by smoke tests |

### View/Edit Variables

1. **Click environment name** (top right)
2. **Select "Edit"**
3. **Modify values** as needed (rarely required for local dev)
4. **Save** (Ctrl+S / Cmd+S)

---

## Step 3: Run Login Request (Smoke Test)

### Purpose

Obtain JWT `access_token` for subsequent requests.

### Steps

1. **Navigate** to: "Auth & Users" → "POST /auth/login"
2. **Verify request body**:
   ```json
   {
     "email": "{{email}}",
     "password": "{{password}}"
   }
   ```
3. **Click Send**
4. **Expected Response** (200):
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {...}
   }
   ```

### Auto-Populate Token

The request has a **Test script** that auto-extracts and stores the token:

```javascript
if (pm.response.code === 200) {
  const token = pm.response.json().token;
  pm.environment.set("access_token", token);
}
```

**Result**: `access_token` is now available for all subsequent requests.

---

## Step 4: Verify Health Endpoint

### Steps

1. **Navigate** to: "Health & System" → "GET /health"
2. **Click Send**
3. **Expected Response** (200 or 401, both OK):
   ```json
   {
     "status": "ok",
     "database": "connected"
   }
   ```

**Note**: If you see 401 Unauthorized, it's expected (health endpoint may require auth).

---

## Step 5: Run Smoke Test (Sequential)

### What is a Smoke Test?

Quick validation that core endpoints work:
1. ✅ Health check passes
2. ✅ Login succeeds
3. ✅ Can retrieve user profile
4. ✅ Can list campaigns

### Run via Postman UI

1. **Select folder**: "Health & System"
2. **Right-click** → "Run folder"
3. **Or click**: **Run** button (top left) → "Runner"
4. **Select collection**: "NeonHub API"
5. **Select environment**: "NeonHub – Local"
6. **Click Run** (blue button)

### Expected Results

All 4-5 requests should show **green checkmarks**:
- ✅ GET /health
- ✅ POST /auth/login
- ✅ GET /auth/me
- ✅ GET /campaigns (or similar list endpoint)

---

## Step 6: Run Full Collection Tests

### Via Postman Runner UI

1. **Click top "Run"** button
2. **Select**:
   - Collection: "NeonHub API"
   - Environment: "NeonHub – Local"
   - Iterations: 1
   - Delay: 100ms (between requests)
3. **Click Run**
4. **View Results**: Summary shows pass/fail per request

### Via Newman CLI

Newman allows automated testing in CI/CD pipelines.

#### Install Newman

```bash
npm install -g newman
# or locally:
npm install newman --save-dev
```

#### Run Collection

```bash
newman run postman/NeonHub-API.postman_collection.json \
  -e postman/NeonHub-Local.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export reports/postman-results.json
```

#### Run with Script (Recommended)

Use the npm script in `apps/api/package.json`:

```bash
cd /Users/kofirusu/Desktop/NeonHub/apps/api
npm run test:postman
```

#### Expected Output

```
┌─────────────────────────────────┐
│ NeonHub API                      │
├─────────────────────────────────┤
│ GET /health                ✓    │
│ POST /auth/login           ✓    │
│ GET /auth/me               ✓    │
│ GET /campaigns             ✓    │
│ POST /campaigns            ✓    │
│ ...                             │
├─────────────────────────────────┤
│ Tests: 42 passed, 0 failed      │
│ Duration: 12.3s                 │
└─────────────────────────────────┘
```

---

## Step 7: Debug Failing Requests

### Common Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| **401 Unauthorized** | Auth endpoints fail | Run login first, check `access_token` is set |
| **404 Not Found** | Endpoint doesn't exist | Verify path in request URL |
| **400 Bad Request** | Request body is invalid | Check JSON syntax, required fields |
| **Connection Refused** | API unreachable | Start API: `npm run dev` |
| **Rate Limited (429)** | Too many requests | Wait or reduce request frequency |

### Debug Steps

1. **Check Response Body**: Click "Body" tab to see error message
2. **Check Status Code**: Look for red/green status indicator
3. **Check Request Headers**: Verify `Authorization: Bearer {{access_token}}` is present
4. **Check Variables**: Click environment selector, verify all vars are populated
5. **Check Logs**: Run Newman with `--verbose` flag:
   ```bash
   newman run collection.json -e environment.json --verbose
   ```

### Example: Fixing 401 Unauthorized

```
❌ POST /api/campaigns - 401 Unauthorized

Problem: Authorization header missing or token expired

Solution:
1. Run "POST /auth/login" request
2. Verify access_token is set in environment (top right)
3. Re-run failing request
```

---

## Step 8: Customize Tests for Your Environment

### Modify Environment

1. **Click environment name** (top right)
2. **Click "Edit"**
3. **Update variables**:
   - `base_url`: If using staging, e.g., `https://staging.neonhub.io/api`
   - `email` / `password`: Your actual test credentials

### Add Custom Tests

1. **Select a request**
2. **Click "Tests" tab**
3. **Add Postman test script**:
   ```javascript
   pm.test("Response time is under 500ms", function() {
     pm.expect(pm.response.responseTime).to.be.below(500);
   });

   pm.test("Response has required fields", function() {
     const json = pm.response.json();
     pm.expect(json).to.have.property("id");
   });
   ```
4. **Save and re-run**

---

## Step 9: Export Test Results

### Via Postman Runner

1. **After test run**, click **Export Results**
2. **Choose format**: JSON, HTML, or CSV
3. **Save** to your workspace

### Via Newman CLI

```bash
# Export as JSON
newman run collection.json -e environment.json \
  --reporters json \
  --reporter-json-export results.json

# Export as HTML
newman run collection.json -e environment.json \
  --reporters html \
  --reporter-html-export results.html
```

---

## Step 10: CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/postman-tests.yml`:

```yaml
name: Postman API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Start API
        run: |
          cd apps/api
          npm install
          npm run dev &
          sleep 10
      
      - name: Run Postman Tests
        run: npm --prefix apps/api run test:postman
      
      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: postman-results
          path: reports/
```

---

## Test User Credentials

### For Local Development

```
Email:    test@neonhub.local
Password: TestPassword123!
```

### For Staging

Check your staging environment's test user credentials (typically provided separately).

### For Production

❌ **Never use Postman collection against production with test credentials**  
Use production OAuth/API keys only.

---

## Response Format Reference

### Successful Response (2xx)

```json
{
  "data": {
    "id": "campaign_123",
    "name": "Q4 Campaign",
    "status": "active"
  },
  "meta": {
    "timestamp": "2025-11-23T21:00:00Z"
  }
}
```

### Error Response (4xx/5xx)

```json
{
  "error": "Campaign not found",
  "code": "CAMPAIGN_NOT_FOUND",
  "details": {
    "campaignId": "invalid_id"
  }
}
```

---

## Advanced Features

### Global Scripts

Set up pre-request or test scripts that run for ALL requests:

1. **Click collection name** → **Edit**
2. **Go to "Pre-request Script" or "Tests" tab**
3. **Add scripts** (run before/after every request in collection)

Example pre-request script (auto-refresh token if expired):

```javascript
// Check if token exists and refresh if needed
if (!pm.environment.get("access_token")) {
  console.log("No token found, skipping");
} else if (pm.environment.get("token_expires") < Date.now()) {
  console.log("Token expired, refreshing...");
  // Could call refresh endpoint here
}
```

### Variables

Use nested variables for complex data:

```
{{base_url}}/campaigns/{{campaign_id}}
```

### Request Pre-requests

Auto-prepare data before each request:

1. Click request
2. **Pre-request Script** tab
3. Add: `pm.environment.set("today", new Date().toISOString())`
4. Use in body: `{ "date": "{{today}}" }`

---

## Troubleshooting

### "Collection fails after first request"

**Cause**: Likely auth issue  
**Fix**: Ensure login runs first, token is extracted

### "Newman command not found"

**Cause**: Newman not installed globally  
**Fix**: Use `npx newman` or `npm install -g newman`

### "Rate limit errors (429)"

**Cause**: Too many requests too fast  
**Fix**: Increase delay between requests in Runner settings

### "CORS errors in Postman"

**Cause**: Browser restrictions (shouldn't happen in Postman desktop)  
**Fix**: If using web version, enable Postman proxy or use desktop app

---

## Support & Documentation

- **API Endpoints**: See `NEONHUB_API_ENDPOINTS_PUBLIC.md`
- **API Overview**: See `NEONHUB_API_OVERVIEW.md`
- **Setup Issues**: See `docs/api-testing/QUICK_START_DEV.md`
- **Postman Help**: https://learning.postman.com/

---

## Quick Command Reference

```bash
# Start API
cd apps/api && npm run dev

# Run Postman tests via Newman
npm run test:postman

# Run with verbose logging
newman run collection.json -e environment.json --verbose

# Export results
newman run collection.json -e environment.json \
  --reporters html --reporter-html-export results.html

# Run specific folder only
newman run collection.json -e environment.json \
  --folder "Health & System"
```

---

**Version**: 3.2.0 | **Updated**: November 23, 2025 | **Status**: Production Ready

