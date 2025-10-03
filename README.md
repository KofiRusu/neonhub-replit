# NeonHub - AI-Powered Marketing Automation Platform

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

