# NeonHub API Testing Guide

## Overview

This guide covers end-to-end API testing for NeonHub using **Postman** collections and **Newman** for automated test execution. The testing infrastructure validates the complete marketing platform API surface, from authentication through campaign orchestration and analytics.

---

## Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.12.2
- **NeonHub API** running locally on `http://localhost:3001`

### Running Tests Locally

1. **Start the API server** in one terminal:

```bash
pnpm dev:api
# or
cd apps/api && pnpm dev
```

The API will be available at `http://localhost:3001/api`.

2. **Run Newman tests** in another terminal from the project root:

```bash
pnpm test:api:newman
```

### Optional: Performance Smoke (k6)

```bash
k6 run tests/perf/smoke-api.js \
  -e API_BASE_URL=http://localhost:3001/api \
  -e AUTH_BASE_URL=http://localhost:3000 \
  -e API_EMAIL=test@neonhub.local \
  -e API_PASSWORD=TestPassword123!
```

> For stress scenarios and CI wiring, see `docs/api-testing/PERF_TESTING_WITH_K6.md`.

### What This Does

- Loads the Postman collection from `postman/NeonHub-API.postman_collection.json`
- Uses the local environment from `postman/NeonHub-Local.postman_environment.json`
- Executes all requests with built-in assertions
- Generates both CLI output and JUnit XML report
- Saves results to `reports/newman/newman-results.xml`

### Example Output

```
POST /auth/login
  Status code is 200 or 201 ✓
  Response contains access_token ✓

GET /campaigns
  Status code is 200 ✓
  Response is array ✓

...

Run complete
│ Requests     │ 100+
│ Failed       │ 0
│ Skipped      │ 0
│ Assertions   │ 200+
│ Total time   │ 23456 ms
└─────────────────────────────────────────
```

---

## Collection Structure

### Folders

The Postman collection (`postman/NeonHub-API.postman_collection.json`) is organized into logical domains:

| Folder | Purpose | Endpoints |
|--------|---------|-----------|
| **Health & System** | System health probes | `/health`, `/readyz` |
| **Auth & Users** | Authentication & user profile | `/auth/login`, `/auth/me`, `/auth/logout` |
| **Campaigns** | Campaign CRUD & operations | `/campaigns`, `/campaigns/:id/*` |
| **Billing & Finance** | Plan, usage, checkout, portal | `/billing/*` |
| **Tasks & Workflow** | Task lifecycle | `/tasks/*` |
| **Team & Access** | Invites, members, tokens | `/team/*` |
| **Email Agent** | Email content generation | `/campaigns/email/*` |
| **Social Agent** | Social media content | `/campaigns/social/*`, `/social/:platform/*` |
| **SEO Agent** | SEO tools & analysis | `/seo/*` |
| **Keywords & Personas** | Audience targeting | `/keywords`, `/personas` |
| **Connectors** | Third-party integrations | `/connectors/*` |
| **Data Trust & Governance** | Audit + ethics/risk checks | `/data-trust/*`, `/governance/*` |
| **Jobs & Queues** | Async job tracking | `/jobs` |
| **Settings** | User & app configuration | `/settings`, `/credentials` |
| **SMS & Social** | Messaging / webhook simulation | `/sms/*`, `/social/*` |
| **Metrics & Observability** | Metrics + event logging | `/metrics`, `/metrics/events` |
| **Sitemaps & Assets** | Sitemap/robots invalidation | `/sitemap*`, `/robots.txt` |
| **E2E – Golden Flows** | Legacy E2E scenarios | Flow 1–3 |
| **E2E – Multi-Agent Flow** | Trend → Content → Campaign → Metrics | Flow 4 (mermaid diagram) |

### Golden Flows (E2E Scenarios)

**Flow 1: Email Campaign Launch**
1. Authenticate
2. Create campaign
3. Generate email copy via AI agent
4. Fetch campaign analytics

**Flow 2: SEO Audit & Optimization**
1. Authenticate
2. Run SEO audit
3. Generate SEO meta tags
4. Analyze content performance

**Flow 3: Social Media Campaign**
1. Authenticate
2. Create social campaign
3. Generate social copy
4. Schedule posts
5. Track engagement

**Flow 4: Multi-Agent Trend → Content → Campaign**
1. TrendAgent brief
2. ContentAgent generate asset
3. CampaignAgent create + store `e2e_campaign_id`
4. EmailAgent generate sequence
5. Metrics check analytics (mermaid diagram in `api-testing.postman-plan.md`)

---

## Environment Variables

### Local Environment

File: `postman/NeonHub-Local.postman_environment.json`

```json
{
  "base_url": "http://localhost:3001/api",
  "auth_base_url": "http://localhost:3000",
  "email": "test@neonhub.local",
  "password": "TestPassword123!",
  "access_token": "",
  "campaign_id": "",
  "e2e_campaign_id": "",
  "job_id": "",
  "task_id": "",
  "team_invitation_id": "",
  "keyword_id": "",
  "persona_id": "",
  "connector_id": "",
  "connector_slug": "hubspot",
  "connector_auth_id": "",
  "campaign_start_date": "2025-01-10T09:00:00.000Z",
  "campaign_end_date": "2025-01-17T09:00:00.000Z",
  "campaign_social_date": "2025-01-11T15:00:00.000Z",
  "billing_success_url": "https://neonhub.local/billing/success",
  "billing_cancel_url": "https://neonhub.local/billing/cancel",
  "billing_return_url": "https://neonhub.local/billing",
  "sms_person_id": "person_seed_1",
  "sms_brand_id": "brand_seed_1",
  "latest_trend_topic": "retention playbook"
}
```

**Note**: The `access_token`, `campaign_id`, and other IDs are automatically populated by test scripts during execution.

### Staging Environment

File: `postman/NeonHub-Staging.postman_environment.json`

Configure with staging API URL and credentials before running tests against staging.

---

## Test Credentials

### Local Testing

For local development, tests use a seed user. Ensure your database is seeded before running tests:

```bash
pnpm db:seed:test
```

**Default Test User**:
- Email: `test@neonhub.local`
- Password: `TestPassword123!`

If these don't match your seed data, update `postman/NeonHub-Local.postman_environment.json`.

### Connector Credentials

For testing third-party integrations (Gmail, Slack, Stripe, etc.), set environment variables:

```bash
export GMAIL_TEST_TOKEN="..."
export SLACK_TEST_TOKEN="..."
export STRIPE_TEST_KEY="sk_test_..."
```

---

## Running Specific Requests

You can run individual requests or folders using Postman CLI or the Postman app directly.

### Via Newman CLI

```bash
# Run only Health checks
newman run postman/NeonHub-API.postman_collection.json \
  -e postman/NeonHub-Local.postman_environment.json \
  --folder "Health & System"

# Run only Auth flow
newman run postman/NeonHub-API.postman_collection.json \
  -e postman/NeonHub-Local.postman_environment.json \
  --folder "Auth & Users"

# Run only E2E flows
newman run postman/NeonHub-API.postman_collection.json \
  -e postman/NeonHub-Local.postman_environment.json \
  --folder "E2E – Golden Flows"
```

### Via Postman Desktop App

1. Import `postman/NeonHub-API.postman_collection.json`
2. Select environment: `postman/NeonHub-Local.postman_environment.json`
3. Click folder → **Run** (play icon)
4. Click individual request → Send

---

## CI/CD Integration

### GitHub Actions

NeonHub includes a GitHub Actions workflow for API testing. See `.github/workflows/api-testing.yml` for details.

**Workflow**:
1. Starts API server in background
2. Waits for API to be ready (with retries)
3. Runs Newman tests
4. Reports results
5. Uploads JUnit XML artifact

**Manual Trigger** *(if implemented)*:

```bash
gh workflow run api-testing.yml --ref main
```

### Local CI Simulation

To test the CI workflow locally:

```bash
# Start API in background
pnpm dev:api &
API_PID=$!

# Wait for API to be ready
sleep 5

# Run tests
pnpm test:api:newman

# Cleanup
kill $API_PID
```

---

## Test Assertions & Validation

Each request includes built-in assertions:

### Status Code Checks

```javascript
pm.test('Status code is 200', function() {
  pm.response.to.have.status(200);
});
```

### Response Schema Validation

```javascript
pm.test('Response contains campaign id', function() {
  const response = pm.response.json();
  pm.expect(response).to.have.property('id');
});
```

### Environment Variable Population

```javascript
pm.test('Store campaign ID for later requests', function() {
  const campaignId = pm.response.json().id;
  pm.environment.set('campaign_id', campaignId);
});
```

### Error Handling

```javascript
pm.test('Handle errors gracefully', function() {
  if (pm.response.code === 404) {
    pm.expect(pm.response.json()).to.have.property('error');
  }
});
```

---

## Adding New Tests

### Adding a Request

1. Open `postman/NeonHub-API.postman_collection.json` in a text editor or Postman UI
2. Navigate to the appropriate folder (or create a new one)
3. Create a new request:
   - **Name**: Descriptive endpoint name
   - **Method**: GET, POST, PUT, DELETE, PATCH, etc.
   - **URL**: Template with `{{base_url}}/path`
   - **Headers**: Content-Type, Authorization (auto-inherited from collection)
   - **Body**: JSON payload (if needed)

4. Add Tests:
   - Click **Tests** tab
   - Write assertions using Postman's test scripting syntax
   - Example:
     ```javascript
     pm.test('Status code is 200', function() {
       pm.response.to.have.status(200);
     });
     ```

5. Save and export the collection back to the JSON file

### Example: Add a "Create Keyword" Request

```json
{
  "name": "POST /keywords (Create)",
  "request": {
    "method": "POST",
    "url": "{{base_url}}/keywords",
    "body": {
      "mode": "raw",
      "raw": "{\"name\": \"test keyword\", \"volume\": 100}"
    }
  },
  "event": [
    {
      "listen": "test",
      "script": {
        "exec": [
          "pm.test('Status code is 201', function() {",
          "  pm.response.to.have.status(201);",
          "});",
          "pm.environment.set('keyword_id', pm.response.json().id);"
        ]
      }
    }
  ]
}
```

---

## Troubleshooting

### Issue: "Cannot find module newman"

**Solution**: Install Newman first:

```bash
pnpm install
# or
npm install -g newman
```

### Issue: "Connection refused: localhost:3001"

**Solution**: Ensure the API is running:

```bash
pnpm dev:api
# Check it's available:
curl http://localhost:3001/api/health
```

### Issue: "401 Unauthorized" on protected endpoints

**Solution**: Login flow may have failed. Check:

1. Test credentials are correct in environment file
2. Database is seeded: `pnpm db:seed:test`
3. Seed user exists with matching email/password

### Issue: "Tests fail with different errors each run"

**Solution**: Database state inconsistency. Try:

```bash
# Reset database
pnpm db:migrate
pnpm db:seed:test

# Run tests again
pnpm test:api:newman
```

### Issue: "Some requests return 404"

**Solution**: Endpoint may not exist or route is registered differently. Check:

1. Review actual routes in `apps/api/src/routes/`
2. Compare with `docs/api-testing.postman-plan.md`
3. Update collection URLs as needed

---

## Interpreting Results

### CLI Output

```
Request    │ Status │ Assertions
───────────┼────────┼────────────
GET /health│ 200    │ 2 ✓
POST /auth │ 200    │ 3 ✓
GET /camp  │ 200    │ 2 ✓
───────────┼────────┼────────────
Total      │        │ 7 ✓
```

### JUnit Report

The JUnit XML (`reports/newman/newman-results.xml`) can be imported into CI systems:

- **Jenkins**: Publish via "Publish JUnit test results"
- **GitLab**: Via `artifacts` and `junit` report
- **GitHub Actions**: Via `dorny/test-reporter`

---

## Best Practices

1. **Keep tests isolated**: Each request should stand alone if possible
2. **Use environment variables**: Avoid hardcoding URLs/credentials
3. **Test happy paths first**: Ensure basic flows work before edge cases
4. **Document assumptions**: Add comments for non-obvious setup steps
5. **Monitor performance**: Track request times; flag slow endpoints
6. **Version the collection**: Commit to version control with API changes
7. **Regular maintenance**: Update tests when endpoints change
8. **No secrets in collection**: Never commit real API keys or passwords

---

## API Domains Reference

### Campaign Lifecycle

```
POST   /campaigns              Create
GET    /campaigns              List all
GET    /campaigns/:id          Get one
PUT    /campaigns/:id          Update
DELETE /campaigns/:id          Delete
PATCH  /campaigns/:id/status   Update status
POST   /campaigns/:id/schedule Schedule publish
```

### Email Campaigns

```
POST /campaigns/email/optimize-subject   AI subject optimization
POST /campaigns/:id/email/sequence       Set up email sequence
```

### SEO Analysis

```
GET  /seo                              Dashboard
POST /seo/audit                        Full site audit
GET  /seo/recommendations/weekly       Weekly recommendations
POST /seo/meta/generate-title          Generate title tag
POST /seo/content/analyze              Analyze content
```

### Analytics & Reporting

```
GET /campaigns/:id/analytics   Campaign metrics
GET /metrics                   Dashboard overview
GET /trends                    Trending topics
```

### User Management

```
POST /auth/login      Authenticate
GET  /auth/me         Current user
POST /auth/logout     Logout
```

---

## Known Limitations

| Issue | Workaround | Status |
|-------|-----------|--------|
| NextAuth session-based auth may conflict with direct token testing | Use test token endpoint if available, or mock sessions | ⚠️ |
| Email sending requires test SMTP or mock | Use Mailtrap or mock provider in local env | ⚠️ |
| External webhooks (Stripe, etc.) cannot be tested in isolation | Mock or use test credentials | ⚠️ |
| WebSocket connections not supported in Postman | Use separate tooling (WebSocket test client) | ⚠️ |
| Rate limiting on auth endpoints | Space out requests, use realistic wait times | ✅ |

---

## Support & Contribution

### Reporting Issues

Found a failing test? Help us improve:

1. Note the failing request name and error message
2. Check `.github/workflows/api-testing.yml` logs
3. Open an issue with:
   - Expected vs. actual response
   - Environment details
   - Reproduction steps

### Extending Tests

To add coverage for new endpoints:

1. Identify the route in `apps/api/src/routes/`
2. Add request to appropriate folder in collection
3. Include happy and sad path tests
4. Update `docs/api-testing.postman-plan.md` coverage matrix
5. Test locally: `pnpm test:api:newman`
6. Commit with message: `test(api): add {endpoint} tests`

---

## Related Documentation

- [API Testing Strategy](docs/api-testing.postman-plan.md) – Detailed coverage matrix & design
- [API Surface](docs/API_SURFACE.md) – High-level API reference
- [Backend Services](docs/BACKEND_API_AND_SERVICES.md) – Service architecture
- [CI/CD Setup](docs/CI_CD_SETUP.md) – GitHub Actions configuration

---

**Last Updated**: November 2024  
**Maintainer**: AI Agent  
**Status**: Active
