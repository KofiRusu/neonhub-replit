# NeonHub API Backend

**Backend API server for NeonHub - AI-powered marketing automation platform**

---

## Overview

This is the backend API server built with Express, tRPC, and Prisma. It provides:

- **100+ API endpoints** (tRPC + REST)
- **Seven AI agents** (Campaign, Content, SEO, Email, Social, Support, Trend)
- **Authentication & Authorization** (JWT, sessions)
- **Real-time updates** (WebSocket via Socket.io)
- **Job queues** (BullMQ for async processing)
- **Database access** (Prisma ORM + PostgreSQL)

---

## Quick Start

```bash
# From apps/api/

# 1. Install dependencies
pnpm install

# 2. Set up environment
cp ENV_TEMPLATE.example .env

# 3. Run migrations
pnpm prisma migrate dev

# 4. Seed database
pnpm seed

# 5. Start dev server
pnpm dev  # Runs on port 3001
```

---

## Structure

```
src/
├── agents/              # AI agent implementations
├── ai/                  # AI utilities & adapters
├── connectors/          # External service integrations
├── routes/              # REST API endpoints
├── services/            # Business logic services
├── trpc/                # tRPC routers & middleware
├── middleware/          # Express middleware
├── jobs/                # BullMQ job processors
├── db/                  # Database utilities
└── server.ts            # Main entry point
```

---

## Key Commands

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript check
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
pnpm seed             # Seed database

# Prisma
pnpm prisma studio    # Open Prisma Studio GUI
pnpm prisma migrate dev  # Create & apply migration
pnpm prisma generate  # Generate Prisma Client
```

---

## Documentation

**📚 For complete documentation, see:**

- **Backend Guide:** [`../../docs/BACKEND_API_AND_SERVICES.md`](../../docs/BACKEND_API_AND_SERVICES.md)
- **API Reference:** [`../../docs/API_SURFACE.md`](../../docs/API_SURFACE.md)
- **Agent Documentation:** [`../../docs/AGENT_INFRASTRUCTURE_AND_AI_LOGIC.md`](../../docs/AGENT_INFRASTRUCTURE_AND_AI_LOGIC.md)
- **Database Schema:** [`../../docs/DATABASE_AND_DATA_MODEL.md`](../../docs/DATABASE_AND_DATA_MODEL.md)
- **Development Setup:** [`../../docs/DEVELOPMENT_ENVIRONMENT_AND_SETUP.md`](../../docs/DEVELOPMENT_ENVIRONMENT_AND_SETUP.md)

---

## Endpoints

### Health Check
```bash
GET /health
# Returns: {"status":"ok","db":true,"ws":true,"version":"3.0.0"}
```

### tRPC API
```bash
# Base URL: http://localhost:3001/trpc
# Routers: agents, content, seo, campaigns, analytics, etc.
```

### REST API
```bash
# Base URL: http://localhost:3001/api
# Endpoints: /agents, /content, /seo, /campaigns, etc.
```

---

## Environment Variables

**Required:**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/neonhub
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=sk-proj-...
```

**Optional:**
```env
RESEND_API_KEY=re_...
STRIPE_SECRET_KEY=sk_test_...
USE_MOCK_CONNECTORS=true  # Use mocks in development
```

**See:** [`ENV_TEMPLATE.example`](./ENV_TEMPLATE.example) for complete list

---

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.2+ (strict mode)
- **Framework:** Express.js
- **API:** tRPC (type-safe RPC)
- **Database:** Prisma ORM + PostgreSQL 15+
- **Jobs:** BullMQ (Redis-backed queues)
- **WebSocket:** Socket.io
- **AI:** OpenAI GPT-4/5, Claude
- **Testing:** Jest

---

**For more information, see the [main documentation hub](../../docs/README.md).**

