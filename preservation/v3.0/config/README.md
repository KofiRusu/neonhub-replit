# NeonHub v3.0 - AI-Powered Marketing Automation Platform

[![CI](https://github.com/KofiRusu/Neonhub-v3.0/actions/workflows/ci.yml/badge.svg)](https://github.com/KofiRusu/Neonhub-v3.0/actions/workflows/ci.yml)

**NeonHub** is an AI-powered marketing automation platform built with Next.js 15, Express, Prisma, and OpenAI. This is a monorepo containing both the API backend and web frontend.

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

### Option 1: Vercel (Web) + Railway/Render (API)

#### Deploy Web to Vercel

1. **Connect GitHub repo** to Vercel
2. **Project Settings:**
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Node Version: 20.x

3. **Environment Variables** (on Vercel dashboard):
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   NEXTAUTH_SECRET=<generated-secret>
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   DATABASE_URL=<your-production-postgres-url>
   GITHUB_ID=<github-oauth-client-id>
   GITHUB_SECRET=<github-oauth-client-secret>
   ```

4. **Deploy**: Vercel will auto-deploy on push to main

#### Deploy API to Railway/Render

1. **Create new service** linked to GitHub
2. **Configure Build:**
   - Root Directory: `apps/api`
   - Build Command: `npm install && npm run build && npx prisma migrate deploy`
   - Start Command: `npm run start`
   - Port: 3001

3. **Environment Variables:**
   ```
   DATABASE_URL=<managed-postgres-url>
   PORT=3001
   NODE_ENV=production
   OPENAI_API_KEY=sk-...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   RESEND_API_KEY=re_...
   CORS_ORIGINS=https://your-domain.vercel.app
   SENTRY_DSN=https://... (optional)
   ```

4. **Post-deployment:**
   ```bash
   # SSH into your service and run
   npx prisma migrate deploy
   npm run seed  # Optional: add demo data
   ```

### Option 2: Docker Compose

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

- [Setup Guide](./docs/SETUP.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [API Documentation](./apps/api/docs/)
- [Environment Variables](./docs/PRODUCTION_ENV_GUIDE.md)
- [Contributing](./CONTRIBUTING.md)

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

---

## 📄 License

Private - NeonHub Technologies

---

## 🔗 Links

- **Repository:** https://github.com/KofiRusu/Neonhub-v3.0
- **Issues:** https://github.com/KofiRusu/Neonhub-v3.0/issues
- **Documentation:** [./docs](./docs)

---

**Built with ❤️ using Next.js, Express, Prisma, and OpenAI**
