# Postman + Newman – Quick Reference Card

## One-Line Summaries

| What | Command | Time |
|------|---------|------|
| **Run all tests** | `pnpm test:api:newman` | ~25s |
| **Start API** | `pnpm dev:api` | N/A |
| **Seed DB** | `pnpm db:seed:test` | ~5s |
| **Open Postman** | `postman` *(binary)* | N/A |
| **Specific folder** | `newman run postman/... --folder "Auth"` | ~5s |
| **Check health** | `curl http://localhost:3001/api/health` | ~1s |

---

## Quick Start (Copy-Paste)

### Terminal 1: API Server
```bash
cd /path/to/NeonHub
pnpm dev:api
# Wait for: "Server running on http://localhost:3001"
```

### Terminal 2: Seed Data (first time only)
```bash
pnpm db:seed:test
# Creates test@neonhub.local / TestPassword123!
```

### Terminal 3: Run Tests
```bash
pnpm test:api:newman
# Results: CLI output + reports/newman/newman-results.xml
```

### Optional: k6 Smoke
```bash
k6 run tests/perf/smoke-api.js \
  -e API_BASE_URL=http://localhost:3001/api \
  -e AUTH_BASE_URL=http://localhost:3000 \
  -e API_EMAIL=test@neonhub.local \
  -e API_PASSWORD=TestPassword123!
```

---

## Collection Structure

```
NeonHub API
├── Health & System           [2 requests]
├── Auth & Users              [3 requests]  ← Start here
├── Campaigns                 [15 requests]
├── Billing & Finance         [5 requests]
├── Tasks & Workflow          [5 requests]
├── Team & Access             [5 requests]
├── Email Agent               [2 requests]
├── Social Agent + SMS        [4 requests]
├── SEO Agent                 [3 requests]
├── Keywords & Personas       [4 requests]
├── Connectors                [3 requests]
├── Governance & Data Trust   [5 requests]
├── Jobs & Queues             [2 requests]
├── Settings                  [3 requests]
├── Metrics & Observability   [2 requests]
├── Sitemaps & Assets         [2 requests]
├── E2E – Golden Flows        [3 scenarios]
└── E2E – Multi-Agent Flow    [1 scenario]
```

---

## Key Environment Variables

```
base_url         = http://localhost:3001/api
auth_base_url    = http://localhost:3000
email            = test@neonhub.local
password         = TestPassword123!
access_token     = [auto-filled by login]
campaign_id      = [auto-filled by campaign creation]
e2e_campaign_id  = [multi-agent flow]
job_id           = [set by flows]
task_id          = [tasks suite]
team_invitation_id = [team tests]
connector_slug   = hubspot
connector_auth_id = [set before delete]
campaign_start_date / campaign_end_date / campaign_social_date = ISO timestamps
billing_success_url / billing_cancel_url / billing_return_url = Callback URLs
sms_person_id / sms_brand_id = seed IDs
```

---

## Postman UI Shortcuts

| Goal | Action |
|------|--------|
| Import collection | File → Import → Select `postman/NeonHub-API.postman_collection.json` |
| Select environment | Top-right dropdown → `NeonHub – Local` |
| Send a request | Click request → Press **Send** |
| View test results | After sending → **Tests** tab |
| Run entire folder | Click folder → Click **Run** (play icon) |
| Debug a request | Click request → **Params** / **Body** / **Headers** tabs |
| View environment vars | Click eye icon (top-right) → **Globals** tab |

---

## Common Tasks

### Test One Endpoint
```bash
# In Postman UI:
1. Click "Campaigns" folder
2. Click "POST /campaigns (Create)"
3. Press Send

# Or via CLI:
newman run postman/NeonHub-API.postman_collection.json \
  -e postman/NeonHub-Local.postman_environment.json \
  --folder "Campaigns"
```

### Run E2E Flow
```bash
# In Postman UI:
1. Click "E2E – Golden Flows" folder
2. Click "Flow 1 – Email Campaign"
3. Click **Run** (play icon)
4. Watch steps execute in sequence

# Or via CLI:
newman run postman/NeonHub-API.postman_collection.json \
  -e postman/NeonHub-Local.postman_environment.json \
  --folder "E2E – Golden Flows"
```

### Add a New Test
```bash
# In Postman UI:
1. Right-click folder → Add request
2. Set: Method, URL (use {{base_url}})
3. Click **Tests** tab
4. Add: pm.test('...', function() { ... })
5. Click **Send** to test
6. Click **Export** to save collection → Commit
```

### Check Test Results
```bash
# CLI output: Shown immediately
# View XML report:
cat reports/newman/newman-results.xml | grep -A5 "test"

# Or import into CI dashboard
```

---

## Troubleshooting in 30 Seconds

| Error | Fix |
|-------|-----|
| `Cannot connect to localhost:3001` | Run: `pnpm dev:api` |
| `401 Unauthorized` | Run: `pnpm db:seed:test` |
| `Cannot find module newman` | Run: `pnpm install` |
| `Request timeout` | Start API, wait 10s, retry |
| `Assertion failed` | Click request → View response body/status |
| `Variable undefined` | Check environment (eye icon) or login request |

---

## Files to Know

| File | Purpose |
|------|---------|
| `postman/NeonHub-API.postman_collection.json` | Main test collection |
| `postman/NeonHub-Local/Staging.env.json` | Environments & variables |
| `docs/api-testing.README.md` | Full testing guide |
| `docs/api-testing.postman-plan.md` | API discovery, mermaid flows |
| `docs/api-testing/ROUTE_INDEX.{json,md}` | Source of truth for endpoints |
| `docs/api-testing/COVERAGE_MATRIX.{json,md}` | Live coverage stats |
| `docs/api-testing/COVERAGE_EXPANSION_PLAN.md` | Roadmap to ~90% coverage |
| `docs/api-testing/PERF_TESTING_WITH_K6.md` | k6 smoke/stress instructions |
| `.github/workflows/api-testing.yml` | Newman + k6 smoke CI job |
| `.github/workflows/perf-stress.yml` | Manual stress workflow |
| `tests/perf/*.js` | k6 scripts |
| `package.json` | Newman / helper scripts |
| `reports/newman/newman-results.xml` | Test results (generated) |

---

## Common Patterns

### Pattern 1: Create Resource → Use ID in Next Request

```javascript
// Request 1: Create campaign
pm.environment.set('campaign_id', pm.response.json().id);

// Request 2: Use campaign_id in URL
GET {{base_url}}/campaigns/{{campaign_id}}/analytics
```

### Pattern 2: Extract Token → Use in Headers

```javascript
// Request 1: Login
const token = pm.response.json().token;
pm.environment.set('access_token', token);

// Request 2: Auto-inherited via collection Bearer auth
Authorization: Bearer {{access_token}}
```

### Pattern 3: Validate Response Shape

```javascript
pm.test('Response has required fields', function() {
  const response = pm.response.json();
  pm.expect(response).to.have.property('id');
  pm.expect(response).to.have.property('name');
  pm.expect(response).to.have.property('createdAt');
});
```

---

## CI/CD Integration

**Automatic Tests Run On**:
- Push to `main` or `develop`
- Pull request creation
- Daily at 2 AM UTC

**View Results**:
- GitHub Actions: `.github/workflows/` → Click workflow run
- Artifacts: Download `newman-results.xml` from run
- PR Comments: Posted automatically (if configured)

---

## Performance Notes

| Operation | Time |
|-----------|------|
| Single request | ~1-2s |
| Auth flow | ~2-3s |
| Full Newman suite (100+ requests) | ~30-40s |
| k6 smoke run | ~2m |
| DB seed | ~5s |
| API startup | ~3-5s |

---

## Tips & Tricks

✅ **DO**:
- Use environment variables instead of hardcoding values
- Test happy path first, then edge cases
- Keep tests independent (can run in any order)
- Document assumptions in request descriptions
- Run tests before committing API changes

❌ **DON'T**:
- Commit real credentials to Postman files
- Use production credentials in local env
- Leave test requests in "draft" state
- Ignore failing tests
- Modify collection structure frequently without docs

---

## Getting Help

1. **Collection not working?** → Check `docs/api-testing.README.md` troubleshooting
2. **Don't know how to add a test?** → See patterns above; copy existing request
3. **Tests pass locally but fail in CI?** → Check `.github/workflows/api-testing.yml` for DB setup
4. **Need to test new endpoint?** → Follow "Add a New Test" pattern above
5. **Want to understand coverage?** → Check `docs/api-testing.postman-plan.md` matrix

---

## One-Sheet Commands

```bash
# Full workflow
pnpm dev:api                    # Terminal 1: API
pnpm db:seed:test              # Terminal 2: DB (once)
pnpm test:api:newman           # Terminal 3: Tests

# Individual commands
pnpm test:api:newman                                    # All tests
newman run postman/... --folder "Auth & Users"          # One folder
curl http://localhost:3001/api/health                   # Health check
pnpm db:migrate && pnpm db:seed:test                     # Reset DB

# CI/CD
gh workflow run api-testing.yml --ref main              # Manual trigger
gh run list                                              # View runs
gh run view <RUN_ID> --log                              # View logs
```

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Status**: Ready to Use ✓
