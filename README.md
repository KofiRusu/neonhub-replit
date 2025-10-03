# NeonHub - AI-Powered Marketing Automation Platform

[![CI](https://github.com/YOUR_ORG/neonhub/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/neonhub/actions/workflows/ci.yml)

**Multi-Version Repository**

---

## 📁 Repository Structure

This repository contains multiple versions and components of the NeonHub platform:

### 🚀 Production Versions

- **`/Neon-v2.5.0/`** - Latest stable version (v2.5.0) 
  - Full-stack application with enhanced UI/UX
  - Vercel deployment ready
  - Complete documentation
  - [Read more →](./Neon-v2.5.0/README.md)

- **`/Neon-v2.4.0/`** - Previous stable version (v2.4.0)
  - Production frontend
  - Proven stability
  
- **`/backend/`** - Shared backend API
  - Node.js + Express + TypeScript
  - Prisma ORM + PostgreSQL
  - AI-powered content generation

### 📂 Legacy/Archive

- **`/Neon0.2/`** - Early version (v0.2)
- **`/AutoOpt/`** - Auto-optimization tools
- **`/frontend/`** - Standalone frontend (deprecated)
- **`/_archive/`** - Archived build artifacts and old files

### 🛠️ Infrastructure

- **`/.github/`** - CI/CD workflows (GitHub Actions)
- **`/scripts/`** - Automation and deployment scripts
- **`/docs/`** - Comprehensive documentation
- **`docker-compose.yml`** - Full-stack Docker orchestration
- **`vercel.json`** - Vercel deployment configuration

---

## 🚀 Quick Start

### Option 1: Latest Version (v2.5.0)

```bash
cd Neon-v2.5.0
./scripts/setup.sh
```

See detailed guide: [Neon-v2.5.0/QUICKSTART.md](./Neon-v2.5.0/QUICKSTART.md)

### Option 2: Docker (Full Stack)

```bash
docker-compose up -d
```

Access at: http://localhost:3000

### Option 3: Backend Only

```bash
cd backend
npm install
npm run dev
```

---

## 🚢 How to Deploy

### Pre-Deployment Checks

Run the preflight script to validate your local build:

```bash
./scripts/preflight.sh
```

This script will:
- Build the backend (TypeScript compilation)
- Build the UI (Next.js production build)
- Run Prisma validation
- Check for TypeScript errors

### Vercel Deployment (UI)

The `vercel.json` at the repository root is configured to deploy **Neon-v2.5.0/ui**.

**Vercel Project Settings:**
- **Framework Preset:** Next.js
- **Node Version:** 20.x
- **Install Command:** `pnpm i --frozen-lockfile`
- **Build Command:** `pnpm build`
- **Root Directory:** `Neon-v2.5.0/ui`

**Required Environment Variables:**
- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., `https://api.neonhubecosystem.com`)
- `NEXTAUTH_URL` - Frontend URL (e.g., `https://neonhubecosystem.com`)
- `NEXTAUTH_SECRET` - NextAuth secret key (generate with `openssl rand -base64 32`)
- `SENTRY_DSN` - (Optional) Sentry error tracking

See: [Production Environment Guide](./docs/PRODUCTION_ENV_GUIDE.md)

### Backend Deployment

**Docker Deployment:**
```bash
# Build and push container
docker build -t neonhub-backend:latest ./backend
docker push your-registry.com/neonhub-backend:latest

# Deploy with your orchestrator (K8s, Docker Swarm, etc.)
```

**Database Migrations:**
```bash
# After deploying backend, run migrations
pnpm -C backend prisma migrate deploy
```

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `CORS_ORIGIN` - Allowed origins (e.g., `https://neonhubecosystem.com`)
- `OPENAI_API_KEY` - OpenAI API key for content generation
- `JWT_SECRET` - JWT signing secret

See: [Backend Environment Template](./backend/ENV_TEMPLATE.md)

### Post-Deployment Verification

**API Health Check:**
```bash
API_URL=https://api.neonhubecosystem.com ./scripts/smoke-api.sh
```

**Manual Verification:**
- UI loads: `/dashboard`, `/analytics`, `/trends`
- API `/health` endpoint returns 200
- Metrics summary is non-empty
- Team invite flow works

### Additional Resources

- [Deploy Escort Guide](./docs/DEPLOY_ESCORT.md) - Step-by-step deployment walkthrough
- [Production Environment Guide](./docs/PRODUCTION_ENV_GUIDE.md) - Environment variable reference
- [Release Notes v1.0.0](./release/RELEASE_NOTES_v1.0.0.md) - Latest release information

---

## 📚 Documentation

### Getting Started
- [Quick Start Guide](./docs/QUICKSTART.md)
- [Setup Instructions](./docs/SETUP.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

### Development
- [v0.dev Integration](./docs/V0_WORKFLOW_GUIDE.md)
- [Contributing Guidelines](./Neon-v2.5.0/CONTRIBUTING.md)
- [Security Policy](./Neon-v2.5.0/SECURITY.md)

### Project Status
- [Current Status](./STATUS.md)
- [Implementation Progress](./docs/IMPLEMENTATION_PROGRESS.md)
- [UI Audit](./docs/UI_AUDIT.md)
- [Release Notes](./docs/RELEASE_v2.5.0.md)

---

## 🎯 Current Focus: Neon v2.5.0

The **Neon-v2.5.0** directory contains the latest production-ready version with:

✅ 12/20 routes complete (60% UI coverage)  
✅ Vercel deployment configuration  
✅ Docker containerization  
✅ GitHub Actions CI/CD  
✅ Comprehensive documentation  
✅ v0.dev integration guide

**Next Steps:** Complete remaining 8 routes using v0.dev → [Guide](./docs/V0_WORKFLOW_GUIDE.md)

---

## 🏗️ Architecture

```
NeonHub/
├── Neon-v2.5.0/          # ⭐ Latest version
│   ├── ui/               # Next.js 15 frontend
│   ├── backend/          # Node.js API
│   └── [docs, config]
│
├── backend/              # Shared backend (can be used independently)
│   ├── src/             # TypeScript source
│   ├── prisma/          # Database schema
│   └── package.json
│
├── docs/                 # Central documentation
├── scripts/              # Automation scripts
├── .github/              # CI/CD workflows
└── docker-compose.yml    # Full-stack orchestration
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Glassmorphism
- **UI Library:** shadcn/ui
- **State:** React Query + Zustand
- **Auth:** NextAuth.js

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express
- **Language:** TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **AI:** OpenAI GPT-4
- **Real-time:** Socket.io

### Infrastructure
- **Deployment:** Vercel (frontend) + Docker
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (ready)
- **Analytics:** Vercel Analytics (ready)

---

## 📊 Project Status

**Version:** 2.5.0  
**Status:** Production Ready  
**UI Coverage:** 60% (12/20 routes)  
**Deployment:** Vercel + Docker Ready  
**Documentation:** ✅ Complete

See [STATUS.md](./STATUS.md) for detailed status.

---

## 🤝 Contributing

We welcome contributions! Please see:
- [Contributing Guide](./Neon-v2.5.0/CONTRIBUTING.md)
- [Development Setup](./docs/SETUP.md)
- [Code of Conduct](./Neon-v2.5.0/CONTRIBUTING.md#code-of-conduct)

---

## 📄 License

Private - NeonHub Technologies

---

## 🔗 Quick Links

- **Latest Version:** [Neon-v2.5.0/README.md](./Neon-v2.5.0/README.md)
- **API Documentation:** [backend/README.md](./backend/README.md)
- **Deployment Guide:** [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- **Status Dashboard:** [STATUS.md](./STATUS.md)

---

**Built with ❤️ using AI-powered development tools**

