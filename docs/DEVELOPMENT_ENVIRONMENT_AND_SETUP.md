# NeonHub Development Environment & Setup

**Version:** 3.0+  
**Last Updated:** November 17, 2025  
**Package Manager:** pnpm

---

## Quick Start (5 Minutes)

```bash
# 1. Clone repository
git clone https://github.com/KofiRusu/NeonHub.git
cd NeonHub

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp apps/api/ENV_TEMPLATE.example apps/api/.env
cp apps/web/ENV_TEMPLATE.example apps/web/.env.local

# 4. Start database (choose one):
# Option A: Docker Compose
docker-compose up -d postgres

# Option B: Use Neon.tech (update DATABASE_URL)

# 5. Run migrations & seed
cd apps/api
pnpm prisma migrate dev
pnpm seed

# 6. Start development servers
# Terminal 1 - API
cd apps/api
pnpm dev   # Port 3001

# Terminal 2 - Web
cd apps/web  
pnpm dev   # Port 3000

# 7. Open browser
open http://localhost:3000
```

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 20.x+ | Runtime |
| **pnpm** | 8.x+ | Package manager |
| **Git** | 2.x+ | Version control |
| **PostgreSQL** | 15+ | Database (local or Neon.tech) |

### Recommended Software

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Prisma
  - Tailwind CSS IntelliSense
- **Docker Desktop** (for local database)
- **Postman** or **Insomnia** (for API testing)

---

## Installation Steps

### 1. Install Node.js & pnpm

```bash
# Install Node.js 20 (via nvm)
nvm install 20
nvm use 20

# Install pnpm globally
npm install -g pnpm
```

### 2. Clone Repository

```bash
git clone https://github.com/KofiRusu/NeonHub.git
cd NeonHub
```

### 3. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Installs dependencies for:
# - apps/api
# - apps/web  
# - core/* packages
# - modules/*
```

---

## Environment Configuration

### apps/api/.env

```env
# Database
DATABASE_URL=postgresql://neonhub:neonhub@localhost:5432/neonhub?schema=public
DIRECT_DATABASE_URL=postgresql://neonhub:neonhub@localhost:5432/neonhub?schema=public

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000

# AI / LLM
OPENAI_API_KEY=sk-proj-your-key-here

# Email
RESEND_API_KEY=re_your-key-here

# Payments
STRIPE_SECRET_KEY=sk_test_your-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-secret-here

# Optional: External connectors
USE_MOCK_CONNECTORS=true  # Use mocks for development
```

### apps/web/.env.local

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-32-char-secret  # Generate with: openssl rand -base64 32

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here

# Database (for NextAuth)
DATABASE_URL=postgresql://neonhub:neonhub@localhost:5432/neonhub?schema=public

# OAuth Providers (optional)
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret
```

---

## Database Setup

### Option A: Local PostgreSQL (Docker)

```bash
# Start PostgreSQL with pgvector
docker-compose up -d postgres

# Verify it's running
docker ps | grep postgres

# Connect to database
docker exec -it neonhub-postgres psql -U neonhub
```

**Docker Compose Configuration:**

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: neonhub
      POSTGRES_PASSWORD: neonhub
      POSTGRES_DB: neonhub
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

### Option B: Neon.tech (Cloud)

1. Sign up at https://neon.tech
2. Create a new project
3. Get connection string
4. Update `DATABASE_URL` in `.env` files

---

## Run Migrations & Seed Data

```bash
cd apps/api

# Generate Prisma client
pnpm prisma generate

# Run migrations (creates schema)
pnpm prisma migrate dev --name initial

# Seed database with demo data
pnpm seed

# Optional: Open Prisma Studio GUI
pnpm prisma studio  # Opens at http://localhost:5555
```

---

## Start Development Servers

### Terminal 1: API Server

```bash
cd apps/api
pnpm dev

# Output:
# [Nest] INFO [Bootstrap] NeonHub API started on http://localhost:3001
# [Nest] INFO [Bootstrap] Health check: http://localhost:3001/health
```

### Terminal 2: Web Server

```bash
cd apps/web
pnpm dev

# Output:
# - ready started server on 0.0.0.0:3000, url: http://localhost:3000
# - event compiled client and server successfully
```

### Verify Setup

```bash
# Check API health
curl http://localhost:3001/health
# Expected: {"status":"ok","db":true,"ws":true,"version":"3.0.0"}

# Open web browser
open http://localhost:3000
```

---

## Development Commands

### Root (Workspace)

```bash
pnpm dev           # Start all apps
pnpm build         # Build all apps
pnpm lint          # Lint all apps
pnpm typecheck     # Type-check all apps
pnpm test          # Run all tests
```

### API (`apps/api/`)

```bash
pnpm dev           # Start dev server (port 3001)
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run ESLint
pnpm typecheck     # Run TypeScript checks
pnpm test          # Run Jest tests
pnpm test:watch    # Run tests in watch mode
pnpm seed          # Seed database

# Prisma commands
pnpm prisma studio         # Open Prisma Studio GUI
pnpm prisma migrate dev    # Create & apply migration
pnpm prisma migrate deploy # Apply migrations (production)
pnpm prisma generate       # Generate Prisma Client
pnpm prisma db push        # Push schema to database (dev only)
```

### Web (`apps/web/`)

```bash
pnpm dev           # Start dev server (port 3000)
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run Next.js linter
pnpm typecheck     # Run TypeScript checks
```

---

## Common Issues & Solutions

### Issue: "Can't connect to database"

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker-compose up -d postgres

# Check DATABASE_URL is correct in .env files
cat apps/api/.env | grep DATABASE_URL
```

### Issue: "Prisma Client not generated"

**Solution:**
```bash
cd apps/api
pnpm prisma generate
cd ../web
pnpm prisma generate
```

### Issue: "Port 3000/3001 already in use"

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in .env:
# apps/api/.env: PORT=3002
# apps/web/.env.local: NEXT_PUBLIC_API_URL=http://localhost:3002
```

### Issue: "pnpm install fails"

**Solution:**
```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules
rm -rf node_modules apps/*/node_modules core/*/node_modules

# Reinstall
pnpm install --shamefully-hoist
```

### Issue: "Out of disk space"

**Solution:**
```bash
# Clean up Docker volumes
docker system prune -a --volumes

# Remove old builds
rm -rf apps/*/dist apps/*/.next

# Clean pnpm store
pnpm store prune
```

**See:** [`DISK_SPACE_CLEANUP_GUIDE.md`](../DISK_SPACE_CLEANUP_GUIDE.md)

### Issue: "TypeScript errors"

**Solution:**
```bash
# Regenerate types
pnpm prisma generate --schema=apps/api/prisma/schema.prisma

# Clear TypeScript cache
rm -rf apps/*/.tsbuildinfo

# Rebuild
pnpm build
```

---

## IDE Setup (VS Code)

### Recommended Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "yoavbls.pretty-ts-errors",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

---

## Testing Setup

### Run Tests

```bash
# All tests
pnpm test

# API tests only
pnpm --filter apps/api test

# Watch mode
pnpm --filter apps/api test:watch

# Coverage
pnpm --filter apps/api test:coverage
```

### Browser Testing (Playwright)

```bash
cd apps/web

# Install Playwright
pnpm playwright install

# Run tests
pnpm playwright test

# Run with UI
pnpm playwright test --ui
```

---

## Next Steps

Once your environment is set up:

1. **Read Documentation**
   - [`SYSTEM_ARCHITECTURE.md`](./SYSTEM_ARCHITECTURE.md) - System overview
   - [`BACKEND_API_AND_SERVICES.md`](./BACKEND_API_AND_SERVICES.md) - Backend details
   - [`FRONTEND_AND_UX_STRUCTURE.md`](./FRONTEND_AND_UX_STRUCTURE.md) - Frontend details

2. **Explore Code**
   - Check out `apps/api/src/agents/` for agent implementations
   - Browse `apps/web/src/app/` for page routes
   - Review `core/` packages for shared logic

3. **Make Changes**
   - Create a feature branch
   - Make your changes
   - Run tests and lint
   - Submit a pull request

4. **Deploy**
   - See [`DEPLOYMENT_AND_OPERATIONS_GUIDE.md`](./DEPLOYMENT_AND_OPERATIONS_GUIDE.md)

---

## Related Documentation

- **Setup Guides:**
  - [`docs/SETUP.md`](./SETUP.md) - Detailed setup guide
  - [`docs/QUICKSTART.md`](./QUICKSTART.md) - Quick start (legacy)
  - [`QUICK_START.md`](../QUICK_START.md) - Quick start (root)
  - [`LOCAL_STACK_QUICK_START.md`](../LOCAL_STACK_QUICK_START.md) - Local stack
  - [`docs/LOCAL_RUNBOOK.md`](./LOCAL_RUNBOOK.md) - Local operations

- **Database:**
  - [`docs/DATABASE_AND_DATA_MODEL.md`](./DATABASE_AND_DATA_MODEL.md) - Database docs
  - [`docs/DATABASE_PROVISIONING.md`](./DATABASE_PROVISIONING.md) - Neon.tech setup

- **Python (Optional):**
  - [`PYTHON_SETUP.md`](../PYTHON_SETUP.md) - Python environment
  - [`docs/PYTHON_ENVIRONMENTS.md`](./PYTHON_ENVIRONMENTS.md) - Python config

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2025  
**Maintained By:** NeonHub DevOps Team  
**Next Review:** December 1, 2025

