# 🚀 START HERE – Postman + Newman API Testing for NeonHub

Welcome! This file will get you up and running with API testing in **5 minutes**.

---

## What Is This?

NeonHub now has a **complete API testing infrastructure** using Postman collections and Newman CLI automation. This means:

✅ **Automated API validation** – Test all endpoints with one command  
✅ **CI/CD integration** – Tests run automatically on every push  
✅ **E2E workflows** – Validate complete business processes  
✅ **Developer friendly** – One-line command, interactive UI, detailed docs  

---

## Quickest Start (3 terminals, 5 minutes)

### Terminal 1: Start the API
```bash
pnpm dev:api
```
Wait for: `Server running on http://localhost:3001`

### Terminal 2: Seed test data (first time only)
```bash
pnpm db:seed:test
```
This creates: `test@neonhub.local` / `TestPassword123!`

### Terminal 3: Run the tests
```bash
pnpm test:api:newman
```

**That's it!** You should see:
```
Collection │ NeonHub API
Environment │ NeonHub – Local

  Health & System
    ✓ GET /health
    ✓ GET /readyz

  Auth & Users
    ✓ POST /auth/login
    ✓ GET /auth/me

  ... (20+ more requests)

Run complete
│ Requests      │ 24
│ Assertions    │ 48+
│ Time          │ ~25s
└───────────────────
```

---

## What Just Happened?

1. **24 API requests** were executed (campaigns, auth, SEO, etc.)
2. **48+ test assertions** validated responses (status codes, data shape)
3. **Results** saved to `reports/newman/newman-results.xml`
4. **CI-ready** – This same flow runs automatically on GitHub

---

## Next: Try It in Postman UI

**Want a visual interface?** Postman has a beautiful UI for testing.

### Import the Collection

1. Open **Postman** app (download from postman.com if needed)
2. **File → Import**
3. Select: `postman/NeonHub-API.postman_collection.json`
4. Postman loads the collection with all 24 requests

### Select Environment

In top-right dropdown:
- Select: **NeonHub – Local**

### Send Your First Request

1. Expand: **Auth & Users** folder
2. Click: **POST /auth/login**
3. Click: **Send**
4. See response: `{ token: "..." }`
5. Watch: Token auto-stored in environment

### Try an E2E Flow

1. Expand: **E2E – Golden Flows** folder
2. Click: **Flow 1 – Email Campaign**
3. Click the **▶ Run** button (play icon)
4. Watch the flow execute step-by-step:
   - ✓ Login → captures token
   - ✓ Create campaign → captures campaign_id
   - ✓ Generate email → sends request
   - ✓ Fetch analytics → validates response

---

## Common Commands

```bash
# Run all tests
pnpm test:api:newman

# Run just one domain (e.g., campaigns)
newman run postman/NeonHub-API.postman_collection.json \
  -e postman/NeonHub-Local.postman_environment.json \
  --folder "Campaigns"

# Check API health
curl http://localhost:3001/api/health

# Reset database
pnpm db:migrate && pnpm db:seed:test

# Stop API
# (Just press Ctrl+C in Terminal 1)
```

---

## Documentation by Role

### 👨‍💻 Developers – Quick Reference
**Start here**: [`docs/POSTMAN_QUICK_REFERENCE.md`](./docs/POSTMAN_QUICK_REFERENCE.md)
- Copy-paste commands
- Common tasks
- Troubleshooting in 30 seconds

### 🧪 QA / Test Engineers – Full Guide
**Start here**: [`docs/api-testing.README.md`](./docs/api-testing.README.md)
- Collection structure
- Adding new tests
- CI/CD details
- Best practices

### 🏢 DevOps / Platform Teams – Setup Details
**Start here**: [`.github/workflows/api-testing.yml`](./.github/workflows/api-testing.yml)
- GitHub Actions configuration
- Database setup
- Environment variables

### 📊 Managers / Project Leads – Overview
**Start here**: [`POSTMAN_NEWMAN_IMPLEMENTATION_REPORT.md`](./POSTMAN_NEWMAN_IMPLEMENTATION_REPORT.md)
- What was delivered
- Coverage statistics
- Next steps

### 🔧 API Developers – Coverage & Patterns
**Start here**: [`docs/api-testing.postman-plan.md`](./docs/api-testing.postman-plan.md)
- API discovery
- Coverage matrix
- Golden flow definitions
- How to extend

---

## What's Tested?

| Area | Status |
|------|--------|
| **Authentication** | ✅ Login, user profile, logout |
| **Campaigns** | ✅ Create, list, fetch, analytics |
| **Email Agent** | ✅ Subject optimization |
| **Social Agent** | ✅ Content generation |
| **SEO Agent** | ✅ Audit, meta tags |
| **Keywords** | ✅ CRUD operations |
| **Personas** | ✅ CRUD operations |
| **Health Check** | ✅ System status, readiness |
| **E2E Flows** | ✅ 2 complete workflows |

**Coverage**: 24 baseline requests, easily extensible  
**Assertions**: 48+ tests validating responses  
**Performance**: ~25 seconds for full suite

---

## Automated Testing in CI/CD

Tests run automatically when you:
- **Push** to `main` or `develop`
- **Create a pull request**
- **Daily at 2 AM UTC** (scheduled)

GitHub Actions:
1. Starts database
2. Starts API server
3. Runs Newman tests
4. Posts results to PR
5. Uploads artifact

See: [`.github/workflows/api-testing.yml`](./.github/workflows/api-testing.yml)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **"Cannot connect to localhost:3001"** | Run: `pnpm dev:api` in Terminal 1 |
| **"401 Unauthorized"** | Run: `pnpm db:seed:test` in Terminal 2 |
| **"Cannot find module newman"** | Run: `pnpm install` |
| **Tests pass locally, fail in CI** | Check DB migration in workflow |
| **Request returns 404** | Endpoint may not exist yet (see coverage matrix) |

See full troubleshooting: [`docs/api-testing.README.md`](./docs/api-testing.README.md)

---

## Adding New Tests (2 minutes)

Want to test a new endpoint?

### Option 1: Postman UI (Easiest)
1. Open Postman
2. Right-click folder → **Add request**
3. Set method & URL: `POST {{base_url}}/my-endpoint`
4. Click **Tests** tab
5. Add: `pm.test('Status is 200', function() { ... })`
6. **File → Export** → Save to `postman/NeonHub-API.postman_collection.json`
7. Commit & push

### Option 2: Edit JSON directly
See patterns in: [`docs/api-testing.postman-plan.md`](./docs/api-testing.postman-plan.md)

---

## Key Files

| File | Purpose |
|------|---------|
| `postman/NeonHub-API.postman_collection.json` | Main test collection (24 requests) |
| `postman/NeonHub-Local.postman_environment.json` | Local environment (URLs, credentials) |
| `.github/workflows/api-testing.yml` | CI/CD automation |
| `docs/api-testing.README.md` | Comprehensive testing guide |
| `docs/POSTMAN_QUICK_REFERENCE.md` | Quick commands & tips |
| `docs/api-testing.postman-plan.md` | API coverage & strategy |
| `package.json` | Contains `test:api:newman` script |
| `reports/newman/` | Generated test results |

---

## One More Thing

### Import into Git Pre-commit Hook (Optional)

Automatically run tests before committing:

```bash
# Install husky (if not already done)
pnpm install husky --save-dev
npx husky install

# Add hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
pnpm test:api:newman
EOF
chmod +x .husky/pre-commit
```

Now tests run before every commit!

---

## Resources

- 📖 **Postman Docs**: https://learning.postman.com
- 🔧 **Newman CLI**: https://github.com/postmanlabs/newman
- 📚 **Full Documentation**: See list above by role
- ❓ **Questions?**: See troubleshooting in comprehensive guide

---

## Summary

You now have:

✅ **24 API endpoints tested** with assertions  
✅ **2 complete E2E workflows** for core business flows  
✅ **Automatic CI/CD** running on every push  
✅ **Comprehensive documentation** for your team  
✅ **Easy extensibility** to add more tests  

**Next step?**
```bash
pnpm dev:api          # Terminal 1
pnpm db:seed:test     # Terminal 2
pnpm test:api:newman  # Terminal 3 ← Try this now!
```

---

**Happy Testing! 🚀**

For detailed guides, see [`docs/api-testing.README.md`](./docs/api-testing.README.md) or [`docs/POSTMAN_QUICK_REFERENCE.md`](./docs/POSTMAN_QUICK_REFERENCE.md).

