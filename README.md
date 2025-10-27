# NeonHub v3.0 - AI-Powered Marketing Automation Platform

[![CI](https://github.com/KofiRusu/Neonhub-v3.0/actions/workflows/ci.yml/badge.svg)](https://github.com/KofiRusu/Neonhub-v3.0/actions/workflows/ci.yml)
[![Production Status](https://img.shields.io/badge/production-v3.0-green)](https://neonhubecosystem.com)
[![Test Coverage](https://img.shields.io/badge/tests-32%2F32%20passing-success)](./apps/api/src/__tests__)
[![System Audit](https://img.shields.io/badge/system%20audit-2025--10--27-%23ff6f61)](docs/AUDIT_REPORT_2025-10-27.md)
[![Checklist](https://img.shields.io/badge/checklist-xlsx-blue)](docs/CHECKLIST_STATUS_2025-10-27.xlsx)
[![Remediation Plan](https://img.shields.io/badge/remediation-plan-orange)](docs/REMEDIATION_PLAN_2025-10-27.md)
[![Roadmap](https://img.shields.io/badge/roadmap-gantt-purple)](docs/ROADMAP_GANTT_2025-10-27.md)

**NeonHub** is an AI-powered marketing automation platform built with Next.js 15, Express, Prisma, and OpenAI. This is a monorepo containing both the API backend and web frontend.

## 🌐 Production Deployment (v3.0 Hybrid)

**Status:** ✅ Production Ready | **Test Coverage:** 32/32 passing

### Production URLs
- **Web Application:** https://neonhubecosystem.com
- **API Endpoint:** https://api.neonhubecosystem.com
- **API Health:** https://api.neonhubecosystem.com/api/health
- **Status Page:** https://status.neonhubecosystem.com
- **Documentation:** https://docs.neonhubecosystem.com

### Deployment Architecture
- **Web Frontend:** Vercel (Next.js 15)
- **API Backend:** Railway (Node.js/Express)
- **Database:** Neon PostgreSQL
- **CDN:** Vercel Edge Network
- **Monitoring:** UptimeRobot + Railway Metrics

### Deployment Documentation
- **📘 [Hybrid Deployment Guide](./docs/HYBRID_DEPLOYMENT_v3.0.md)** - Complete production deployment steps
- **📋 [Release Notes v3.0](./release/RELEASE_NOTES_v3.0_HYBRID.md)** - Features and changes
- **🔧 [API Environment Checklist](./release/env-checklist-api.md)** - API configuration
- **🌐 [Web Environment Checklist](./release/env-checklist-web.md)** - Web configuration
- **🧪 [Smoke Test Script](./scripts/smoke-test-production.sh)** - Post-deployment validation

### Quick Deploy
```bash
# Run automated deployment preparation
chmod +x release/v3.0-hybrid-deployment.sh
./release/v3.0-hybrid-deployment.sh
```

---

## 📁 Project Structure

```
NeonHub/
├── apps/
│   ├── api/              # Backend API (Express + Prisma)
│   └── web/              # Frontend Web App (Next.js 15)
├── docs/                 # Documentation
├── scripts/              # Build and deployment scripts
├── _archive/             # Legacy versions (v2.4.0, v2.5.0)
└── package.json          # Workspace root
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** 20.x or higher
- **PostgreSQL** 14+ running locally
- **npm** 10+

### 1. Install Dependencies

```bash
npm install --ignore-scripts
```

### 2. Set Up Environment Variables

Create `.env` files from templates:

```bash
# Root (optional - for shared config)
cp ENV_TEMPLATE.example .env

# API
cp apps/api/ENV_TEMPLATE.example apps/api/.env

# Web
cp apps/web/ENV_TEMPLATE.example apps/web/.env.local
```

**Required Environment Variables:**

#### API (`apps/api/.env`)
```env
DATABASE_URL=postgresql://youruser@localhost:5432/neonhub?schema=public
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=sk-proj-your-key-here
STRIPE_SECRET_KEY=sk_test_your-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-secret-here
RESEND_API_KEY=re_your-key-here
CORS_ORIGINS=http://localhost:3000
```

#### Web (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=your-random-32-char-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here
DATABASE_URL=postgresql://youruser@localhost:5432/neonhub?schema=public
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret
```

> **Tip:** Generate NEXTAUTH_SECRET with: `openssl rand -base64 32`

### 3. Initialize Database

```bash
# Create the database (PostgreSQL must be running)
createdb neonhub

# Run migrations
cd apps/api
npx prisma migrate dev --name initial

# Seed with demo data
npm run seed
```

### 4. Start Development Servers

**Terminal 1 - API:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Web:**
```bash
cd apps/web
npm run dev
```

**Access the app:**
- Web UI: http://localhost:3000
- API: http://localhost:3001
- API Health: http://localhost:3001/health

### 5. Verify Setup

```bash
# Check API health
curl http://localhost:3001/health

# Should return:
# {"status":"ok","db":true,"ws":true,"version":"1.0.0"}
```

---

## 🧪 Development Commands

### Root (Workspace)
```bash
npm run build          # Build all apps
npm run dev            # Start all apps in dev mode
npm run lint           # Lint all apps
npm run typecheck      # Type-check all apps
npm run verify         # Run all quality checks
```

### 🤖 AI-Assisted Development with Cline

NeonHub integrates **Cline**, an AI coding assistant CLI that enhances your development workflow:

```bash
# Interactive mode - chat with AI about any task
npm run cline

# Quick task execution
npm run cline:task
cline "Add error handling to the campaign API"

# Common workflows
npm run cline:fix      # Fix TypeScript and linting errors
npm run cline:test     # Add missing tests
npm run cline:docs     # Update documentation

# Direct usage
npx cline "Refactor the InsightAgent to use async/await"
```

**Cline Features:**
- ✅ Context-aware code generation
- ✅ Automatic error fixing
- ✅ Test generation with high coverage
- ✅ Documentation updates
- ✅ Follows NeonHub's `.clinerules` guidelines

**Project-Specific Rules:**
Cline is configured via `.clinerules` to follow NeonHub standards:
- No mock data, always use real APIs
- Maintain TypeScript strict mode
- Follow TailwindCSS + shadcn/ui patterns
- Zero tolerance for lint/type errors
- Preserve multi-repo integrity

See [docs/CLINE_WORKFLOW.md](./docs/CLINE_WORKFLOW.md) for detailed usage examples.

### API (`apps/api/`)
```bash
npm run dev            # Start dev server (port 3001)
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
npm run typecheck      # Run TypeScript checks
npm run test           # Run Jest tests
npm run seed           # Seed database with demo data

# Prisma commands
npx prisma studio              # Open Prisma Studio GUI
npx prisma migrate dev         # Create & apply migration
npx prisma migrate deploy      # Apply migrations (production)
npx prisma generate            # Generate Prisma Client
```

### Web (`apps/web/`)
```bash
npm run dev            # Start dev server (port 3000)
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run Next.js linter
npm run typecheck      # Run TypeScript checks
```

---

## 🤖 AI Agents

NeonHub includes 5 powerful AI agents for marketing automation:

1. **AdAgent** - Campaign creation & optimization
2. **InsightAgent** - Data analysis & predictions  
3. **DesignAgent** - AI-powered design generation
4. **TrendAgent** - Social media trend monitoring
5. **OutreachAgent** - B2B lead generation & outreach

**📖 See [README_AGENTS.md](./README_AGENTS.md) for complete agent documentation, API endpoints, and usage examples.**

---

## 🏗️ Architecture

### Backend (API)

- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **AI:** OpenAI GPT-4 + DALL-E for content & design generation
- **Real-time:** Socket.io for live updates
- **Email:** Resend API
- **Payments:** Stripe
- **Web Scraping:** Puppeteer for lead generation
- **PDF Generation:** PDFKit for proposals
- **Social APIs:** Twitter & Reddit for trend monitoring
- **Monitoring:** Sentry (optional)

**Key Features:**
- RESTful API with Express
- Type-safe database queries with Prisma
- 5 AI Agents (Ad, Insight, Design, Trend, Outreach)
- WebSocket support for real-time updates
- Rate limiting and CORS protection
- Health checks and monitoring

### Frontend (Web)

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui + Radix UI
- **Auth:** NextAuth.js with GitHub OAuth
- **State:** React Query (@tanstack/react-query)
- **Real-time:** Socket.io client
- **Theme:** Dark mode with next-themes

**Key Pages:**
- `/dashboard` - Main dashboard with metrics
- `/agents` - AI agent management
- `/content` - Content generation and management
- `/campaigns` - Campaign tracking
- `/analytics` - Advanced analytics
- `/trends` - Social media trends
- `/billing` - Stripe integration
- `/team` - Team member management
- `/brand-voice` - Brand voice configuration

---

## 🚢 Production Deployment

**Current Version:** v3.0 (Hybrid Strategy)

For complete production deployment instructions, see:

### 📘 Primary Documentation
- **[Hybrid Deployment Guide](./docs/HYBRID_DEPLOYMENT_v3.0.md)** - Complete 10-phase deployment protocol
- **[Release Notes v3.0](./release/RELEASE_NOTES_v3.0_HYBRID.md)** - Features, limitations, and upgrade path

### 🔧 Configuration Templates
- **[Railway Config](./release/railway-config.json)** - API backend configuration
- **[Vercel Config](./release/vercel-config.json)** - Web frontend configuration
- **[API Environment Checklist](./release/env-checklist-api.md)** - Required environment variables
- **[Web Environment Checklist](./release/env-checklist-web.md)** - Required environment variables
- **[Monitoring Setup](./release/monitoring-config.yml)** - UptimeRobot/Pingdom templates

### 🧪 Testing & Validation
```bash
# Run smoke tests after deployment
chmod +x scripts/smoke-test-production.sh
./scripts/smoke-test-production.sh https://api.your-domain.com https://your-domain.com
```

### 🚀 Quick Deploy (Automated)
```bash
# Execute automated deployment preparation
chmod +x release/v3.0-hybrid-deployment.sh
./release/v3.0-hybrid-deployment.sh
```

### Alternative: Docker Compose (Local/Self-Hosted)
```bash
# Build and start all services
docker-compose up -d

# Run migrations
docker-compose exec api npx prisma migrate deploy

# View logs
docker-compose logs -f
```

---

## 🔐 Security

- **Authentication:** NextAuth.js with GitHub OAuth
- **Authorization:** Session-based with database
- **API Security:** Rate limiting, CORS, Helmet middleware
- **Environment:** All secrets in environment variables
- **Database:** Parameterized queries via Prisma

---

## 📊 Database Schema

The database uses Prisma ORM. Key models:

- **User** - User accounts and authentication
- **Account** - OAuth provider accounts
- **Session** - NextAuth sessions
- **ContentDraft** - AI-generated content
- **AgentJob** - AI agent execution logs
- **MetricEvent** - Analytics and metrics

**View schema:** `apps/api/prisma/schema.prisma`

---

## 🧪 Testing

### API Tests
```bash
cd apps/api
npm run test         # Run all tests
npm run test:watch   # Watch mode
```

### E2E Testing (Optional)
```bash
# Install Playwright
cd apps/web
npm install --save-dev @playwright/test

# Run E2E tests
npx playwright test
```

---

## 📚 Documentation

### Production Documentation (v3.0)
- **[Hybrid Deployment Guide](./docs/HYBRID_DEPLOYMENT_v3.0.md)** - Production deployment protocol
- **[Release Notes v3.0](./release/RELEASE_NOTES_v3.0_HYBRID.md)** - Features and changes
- **[Environment Checklists](./release/)** - API and Web configuration

### Development Documentation
- **[Setup Guide](./docs/SETUP.md)** - Local development setup
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - General deployment info
- **[API Documentation](./apps/api/docs/)** - API endpoints reference
- **[Environment Variables](./docs/PRODUCTION_ENV_GUIDE.md)** - Configuration guide
- **[Agent Guide](./README_AGENTS.md)** - AI agent documentation

### Additional Resources
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Security Checklist](./docs/SECURITY_CHECKLIST.md)** - Security best practices

---

## 🐛 Troubleshooting

### Database Connection Errors

```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Create database if missing
createdb neonhub

# Update DATABASE_URL in .env files
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Prisma Client Out of Sync

```bash
cd apps/api
npx prisma generate
cd ../web
npx prisma generate
```

### Build Errors

```bash
# Clean install
rm -rf node_modules package-lock.json apps/*/node_modules
npm install --ignore-scripts

# Generate Prisma clients
cd apps/api && npx prisma generate
cd ../web && npx prisma generate
```

---

## 🔄 Auto Sync Pipeline

This repository auto-ingests improvements from sibling `Neon-v*` repos with strict safety guards:

### Features
- **Conventional Commits Only**: `feat`, `fix`, `perf`, `refactor`
- **Path Filters**: No `.env`, `secrets/`, or production infrastructure files
- **CI Checks**: Type-check, lint, build, tests all required
- **Prisma Safety**: Validates schema changes and guards against destructive migrations
- **Runtime Smoke Tests**: API `/health` and Web homepage must respond
- **Risk Scoring**: Low-risk changes auto-merge; medium/high risk require manual review

### Configuration
- **Config**: `scripts/auto-sync/config.json`
- **State**: `.neon/auto-sync-state.json` (auto-generated)
- **Workflow**: `.github/workflows/auto-sync-from-siblings.yml`

### Source Repositories
- `KofiRusu/neon-v2.4.0`
- `KofiRusu/Neon-v2.5.0`
- `KofiRusu/NeonHub-v3.0`

### Manual Trigger
```bash
# Via GitHub Actions UI
Actions → Auto Sync from Sibling Repos → Run workflow
```

The pipeline runs automatically every hour and creates PRs with detailed diagnostics for review.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request
6. Review the repository guidelines in [AGENTS.md](./AGENTS.md) to confirm coding standards, test coverage expectations, and PR requirements.

---

## 📄 License

Private - NeonHub Technologies

---

## 🔗 Links

### Production
- **Web Application:** https://neonhubecosystem.com
- **API Endpoint:** https://api.neonhubecosystem.com
- **Status Page:** https://status.neonhubecosystem.com
- **Documentation:** https://docs.neonhubecosystem.com

### Development
- **Repository:** https://github.com/KofiRusu/Neonhub-v3.0
- **Issues:** https://github.com/KofiRusu/Neonhub-v3.0/issues
- **Project Docs:** [./docs](./docs)
- **Deployment Docs:** [./release](./release)

---

**Built with ❤️ using Next.js, Express, Prisma, and OpenAI**
