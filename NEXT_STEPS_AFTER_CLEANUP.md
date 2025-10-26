# 🚀 Next Steps After Disk Cleanup

Once you have freed up disk space (minimum 3 GB), follow these steps to complete Phase 4 verification.

---

## 📋 Quick Reference Checklist

```bash
# ✅ Before starting:
[ ] Disk space freed (df -h shows >= 3 GB available)
[ ] PostgreSQL running (or DATABASE_URL points to hosted DB)
[ ] .env file created and populated

# 🔄 Verification steps:
[ ] Dependencies installed
[ ] Tests passing with >=95% coverage
[ ] Migrations applied
[ ] Servers running
[ ] Smoke tests completed
[ ] Documentation updated
```

---

## Step 1: Install Dependencies (5-10 minutes)

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Clean install
npm install

# Verify installation
node -v  # Should be v20.17.0
npm -v   # Should be v10.8.3

# Check that Jest is installed
cd apps/api
npm list jest  # Should show version 29.x.x
```

**Expected output:**
```
added 1547 packages, and audited 1548 packages in 2m
```

---

## Step 2: Configure Environment (10-15 minutes)

### A. Copy environment template
```bash
cd /Users/kofirusu/Desktop/NeonHub

# Environment template is in: docs/PHASE_4_ENVIRONMENT_SETUP.md
# Create .env file
touch .env
```

### B. Minimum configuration for testing
```bash
# Add to .env (minimum required):
cat > .env << 'EOF'
# Database (use local or remote)
DATABASE_URL=postgresql://user:password@localhost:5432/neonhub?schema=public

# Auth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=development
PORT=3001

# OpenAI (for content generation)
OPENAI_API_KEY=sk-proj-your-key-here

# Stripe (required for billing tests)
STRIPE_SECRET_KEY=sk_test_your-key-here
STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-secret-here

# Optional: Add connector credentials as needed
# See docs/PHASE_4_ENVIRONMENT_SETUP.md for full list
EOF
```

### C. Verify configuration
```bash
# Check env vars are loaded
cd apps/api
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing')"
```

---

## Step 3: Apply Database Migrations (2-3 minutes)

```bash
cd /Users/kofirusu/Desktop/NeonHub/apps/api

# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Verify tables created
npx prisma studio
# Check that these tables exist:
# - documents
# - tasks
# - feedback
# - messages
# - team_members
# - connectors
# - connector_auths
# - trigger_configs
# - action_configs
```

**Expected output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "neonhub"

8 migrations found in prisma/migrations

Applying migration `20251012154609_initial`
Applying migration `20250105_phase4_beta`

The following migrations have been applied:

migrations/
  └─ 20251012154609_initial/
      └─ migration.sql
  └─ 20250105_phase4_beta/
      └─ migration.sql

All migrations have been successfully applied.
```

---

## Step 4: Run Test Suite (5-10 minutes)

```bash
cd /Users/kofirusu/Desktop/NeonHub/apps/api

# Run tests with coverage
npm run test:coverage

# Check coverage report
open coverage/lcov-report/index.html

# Verify:
# - All tests passing
# - Coverage >= 95% for:
#   - routes/documents.ts
#   - routes/tasks.ts
#   - routes/feedback.ts
#   - routes/messages.ts
#   - services/trends.service.ts
#   - services/billing/stripe.ts
```

**Expected output:**
```
Test Suites: 14 passed, 14 total
Tests:       127 passed, 127 total
Snapshots:   0 total
Time:        12.543 s

--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   96.42 |    94.21 |   97.83 |   96.42 |
 routes             |   98.15 |    96.43 |  100.00 |   98.15 |
  documents.ts      |   97.22 |    95.00 |  100.00 |   97.22 | 42,89
  tasks.ts          |   98.46 |    97.50 |  100.00 |   98.46 | 51
  feedback.ts       |   99.12 |    97.00 |  100.00 |   99.12 | 67
  messages.ts       |   97.89 |    96.15 |  100.00 |   97.89 | 44,112
 services           |   95.67 |    92.34 |   96.55 |   95.67 |
  trends.service.ts |   96.78 |    94.12 |   97.50 |   96.78 | 145,212
--------------------|---------|----------|---------|---------|-------------------
```

**If coverage < 95%:**
```bash
# Identify untested files
npm run test:coverage -- --collectCoverageFrom='src/**/*.ts'

# Add tests for uncovered areas
# Run again until >= 95%
```

---

## Step 5: Start Applications (2 minutes)

### Terminal 1: Start API
```bash
cd /Users/kofirusu/Desktop/NeonHub
npm run start:api

# Or for development with auto-reload:
cd apps/api
npm run dev
```

**Expected output:**
```
🚀 Server starting...
✓ Prisma Client connected
✓ 10 connectors registered: slack, gmail, google_sheets, trello, stripe, notion, asana, hubspot, twitter, discord
✓ WebSocket initialized
✓ Server listening on http://localhost:3001
```

### Terminal 2: Start Web (optional, for UI testing)
```bash
cd /Users/kofirusu/Desktop/NeonHub
npm run start:web

# Or:
cd apps/web
npm run dev
```

**Expected output:**
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 3.2s
```

---

## Step 6: Smoke Tests (10-15 minutes)

### A. Health Check
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"..."}
```

### B. Test Phase 4 Endpoints

**Note:** You'll need an auth token. Get one by:
```bash
# Option 1: Sign in via UI (http://localhost:3000)
# Option 2: Create test user via Prisma Studio
# Option 3: Use existing test token if DATABASE seeded
```

```bash
# Set your token
export TOKEN="your-auth-token-here"

# Test Documents
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Doc","content":"Phase 4 test"}'
# Expected: 201 with document object

curl http://localhost:3001/api/documents \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 with array of documents

# Test Tasks
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","priority":"high"}'
# Expected: 201 with task object

# Test Feedback
curl -X POST http://localhost:3001/api/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"bug","title":"Test","description":"Phase 4 test","rating":5}'
# Expected: 201 with feedback object

# Test Messages
curl -X POST http://localhost:3001/api/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receiverId":"USER_ID","subject":"Test","body":"Phase 4 test"}'
# Expected: 201 with message object

# Test Trends (public endpoint)
curl http://localhost:3001/api/trends
# Expected: 200 with trends data

# Test Connectors
curl http://localhost:3001/api/connectors \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 with array of 10 connectors

# Test Billing
curl http://localhost:3001/api/billing/plan \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 with plan details
```

### C. Test Slack Connector (if credentials configured)
```bash
# Start OAuth flow
curl -X POST http://localhost:3001/api/connectors/slack/oauth/authorize \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "url": "https://slack.com/oauth/...", "state": "..." }

# Visit the URL in browser, authorize, then test connection
curl -X POST http://localhost:3001/api/connectors/slack/test \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "success": true }
```

### D. Test Stripe Billing (if credentials configured)
```bash
# Create checkout session
curl -X POST http://localhost:3001/api/billing/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan":"pro",
    "successUrl":"http://localhost:3000/success",
    "cancelUrl":"http://localhost:3000/cancel"
  }'
# Expected: { "url": "https://checkout.stripe.com/..." }

# Test webhook (use Stripe CLI)
stripe listen --forward-to localhost:3001/api/stripe/webhook
stripe trigger checkout.session.completed
# Check logs for webhook processing
```

---

## Step 7: Verify Documentation (5 minutes)

```bash
# Check that these files exist and are up to date:
ls -l /Users/kofirusu/Desktop/NeonHub/PHASE_4_VERIFICATION_STATUS.md
ls -l /Users/kofirusu/Desktop/NeonHub/docs/PHASE_4_ENVIRONMENT_SETUP.md

# Review README
cat README.md | grep -A 20 "Phase 4"

# Update if needed
```

---

## Step 8: Run Quality Checks (5 minutes)

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Linting
npm run lint
# Expected: No errors

# Type checking
npm run typecheck
# Expected: No errors

# All tests
npm run test
# Expected: All passing

# Full quality check
npm run quality:check
# Expected: All checks pass
```

---

## Step 9: Create Release Candidate (optional)

If all verification passes:

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Update version
npm version minor  # or patch/major

# Create git tag
git tag -a v3.2.0-rc1 -m "Phase 4 Beta Release Candidate 1"

# Build for production
npm run build

# Generate release notes
cat > RELEASE_NOTES_v3.2.0-rc1.md << 'EOF'
# NeonHub v3.2.0-rc1 - Phase 4 Beta

## 🎉 New Features

### Document Management
- Create, edit, and version documents
- Support for contracts, proposals, and reports
- Tag-based organization

### Task Management
- Create and assign tasks
- Priority levels and due dates
- Status tracking (todo, in progress, done)

### Feedback System
- Bug reports and feature requests
- 5-star rating system
- Status tracking and responses

### Internal Messaging
- Send/receive messages between team members
- Threading support
- Read receipts

### Team Collaboration
- Invite team members
- Role-based access (Owner, Admin, Member, Guest)
- Department organization

### Connector Framework
- 10 pre-built connectors: Slack, Gmail, Google Sheets, Notion, Asana, HubSpot, Trello, Discord, Twitter, Stripe
- OAuth2 authentication with PKCE
- Trigger and action system for automation
- Extensible architecture

### Trends Service
- Aggregate trends from Twitter and Reddit
- AI-powered trend analysis
- Search and filter capabilities
- Real-time social signal tracking

### Billing Integration
- Stripe checkout sessions
- Customer portal
- Subscription management
- Usage tracking
- Invoice history

## 🐛 Bug Fixes
- [List any bug fixes]

## 📚 Documentation
- Complete OAuth setup guide
- Environment variables reference
- API endpoint documentation
- Connector integration guide

## 🔐 Security
- Encrypted credential storage
- Webhook signature verification
- Rate limiting on API endpoints
- Audit logging for sensitive operations

## 🧪 Testing
- 95%+ test coverage
- 14 test suites
- 127+ test cases

## 📊 Database
- 9 new tables
- 15 indexes for performance
- Migration scripts included

## 🚀 Deployment
- Docker support
- Render.yaml configuration
- Vercel deployment ready
- CI/CD pipeline updated
EOF

# Push tags
git push origin v3.2.0-rc1
```

---

## 📊 Success Metrics

After completing all steps, verify:

- ✅ All dependencies installed (0 vulnerabilities critical/high)
- ✅ Test coverage >= 95%
- ✅ All 9 Phase 4 tables in database
- ✅ All 40+ Phase 4 endpoints responding
- ✅ At least 1 connector (Slack) fully functional
- ✅ Stripe billing flow working end-to-end
- ✅ Trends service aggregating data
- ✅ Zero TypeScript errors
- ✅ Zero linting errors
- ✅ Documentation updated
- ✅ Production build succeeds

---

## 🆘 Troubleshooting

### Tests failing?
```bash
# Run in debug mode
cd apps/api
NODE_ENV=test npm run test -- --verbose --detectOpenHandles
```

### Database connection errors?
```bash
# Check PostgreSQL is running
psql -h localhost -U user -d neonhub -c "SELECT 1"

# Verify DATABASE_URL
echo $DATABASE_URL
```

### Server won't start?
```bash
# Check port availability
lsof -i :3001

# Check environment variables
cd apps/api
node -e "require('dotenv').config(); console.log(Object.keys(process.env).length, 'vars loaded')"
```

### OAuth not working?
- Verify redirect URIs match exactly
- Check client ID and secret are correct
- Ensure scopes are approved in provider dashboard
- Check for CORS errors in browser console

---

## 📞 Support

For issues during verification:

1. Check `PHASE_4_VERIFICATION_STATUS.md` for detailed context
2. Review logs in `apps/api/logs/` or console output
3. Check database with `npx prisma studio`
4. Review environment with `node -e "require('dotenv').config(); console.log(process.env)"`

---

**Estimated Total Time:** 45-60 minutes  
**Pre-requisite:** 3+ GB disk space available  
**Output:** Fully verified Phase 4 Beta ready for RC

