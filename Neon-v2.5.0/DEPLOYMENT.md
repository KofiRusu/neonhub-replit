# 🚀 NeonHub v2.5.0 - Complete Deployment Guide

**Status:** Production Ready  
**Last Updated:** October 2, 2025  
**Version:** 2.5.0

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Vercel Deployment](#vercel-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **PostgreSQL** 14+ or 16+
- **Git** for version control
- **Vercel CLI** (optional): `npm i -g vercel`
- **Docker** & **Docker Compose** (optional)

### Local Development Setup

```bash
# Clone the repository
cd Neon-v2.5.0

# Install UI dependencies
cd ui
npm install
npx prisma generate

# Install Backend dependencies
cd ../backend
npm install
npx prisma generate

# Start PostgreSQL (via Docker)
cd ..
docker-compose up -d postgres

# Run database migrations
cd backend
npx prisma migrate dev

# Start backend (Terminal 1)
npm run dev

# Start UI (Terminal 2)
cd ../ui
npm run dev
```

Access the application at: **http://localhost:3000**

---

## 🌐 Vercel Deployment

### Option 1: Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to [https://vercel.com/new](https://vercel.com/new)
   - Connect your GitHub/GitLab account
   - Import the `Neon-v2.5.0` repository

2. **Configure Project Settings**
   ```
   Framework Preset:    Next.js
   Root Directory:      ui
   Build Command:       npm run build
   Output Directory:    .next
   Install Command:     npm install
   Node.js Version:     20.x
   ```

3. **Set Environment Variables**
   
   Go to **Settings → Environment Variables** and add:
   
   ```env
   # Required
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=https://your-app.vercel.app
   
   # Optional (Backend API)
   NEXT_PUBLIC_API_URL=https://your-backend-api.com
   NEXT_PUBLIC_WS_URL=wss://your-backend-api.com
   
   # OAuth (if enabled)
   GITHUB_ID=your-github-client-id
   GITHUB_SECRET=your-github-client-secret
   ```
   
   > 🔑 **Generate Secret:** `openssl rand -base64 32`

4. **Deploy**
   - Click **Deploy**
   - Wait for build to complete (~2-3 minutes)
   - Visit your deployment URL

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to UI directory
cd Neon-v2.5.0/ui

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow the prompts:
# - Link to existing project or create new
# - Confirm settings
# - Deploy
```

### Option 3: GitHub Integration (Automated)

1. **Connect Repository**
   - Go to Vercel Dashboard
   - Click **Add New → Project**
   - Import from GitHub
   - Select `Neon-v2.5.0` repository

2. **Configure Auto-Deploy**
   - Production Branch: `main`
   - Preview Branches: All branches
   - Auto-deploy: Enabled

3. **Set Environment Variables**
   - Add all required environment variables
   - Apply to: Production, Preview, Development

4. **Push to Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

Vercel will automatically:
- ✅ Detect changes
- ✅ Build the application
- ✅ Run tests (if configured)
- ✅ Deploy to production

---

## 🐳 Docker Deployment

### Full Stack with Docker Compose

```bash
# Navigate to project root
cd Neon-v2.5.0

# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f ui
docker-compose logs -f backend

# Stop services
docker-compose down
```

**Services included:**
- ✅ PostgreSQL (port 5432)
- ✅ Backend API (port 3001)
- ✅ Frontend UI (port 3000)
- ✅ Redis (port 6379, optional)

### Individual Docker Builds

**Build UI:**
```bash
cd Neon-v2.5.0/ui
docker build -t neonhub-ui:2.5.0 .
docker run -p 3000:3000 \
  -e NEXTAUTH_SECRET=your-secret \
  -e DATABASE_URL=your-db-url \
  neonhub-ui:2.5.0
```

**Build Backend:**
```bash
cd Neon-v2.5.0/backend
docker build -t neonhub-backend:2.5.0 .
docker run -p 3001:3001 \
  -e DATABASE_URL=your-db-url \
  -e OPENAI_API_KEY=your-key \
  neonhub-backend:2.5.0
```

---

## 🔐 Environment Configuration

### UI Environment Variables

Create `ui/.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/neonhub"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (Optional)
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# Backend API
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"

# Monitoring (Optional)
SENTRY_DSN=""
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=""
```

### Backend Environment Variables

Create `backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/neonhub"

# JWT
JWT_SECRET="generate-with-openssl-rand-base64-32"
JWT_EXPIRES_IN="7d"

# CORS
CORS_ORIGINS="http://localhost:3000,https://your-app.vercel.app"

# AI Services
OPENAI_API_KEY="sk-your-openai-api-key"
AI_MODEL="gpt-4-turbo-preview"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Monitoring
SENTRY_DSN=""
LOG_LEVEL="info"
```

### Production Secrets Management

**Vercel:**
```bash
# Set production secret
vercel env add NEXTAUTH_SECRET production

# Set preview secret
vercel env add NEXTAUTH_SECRET preview

# Pull environment variables
vercel env pull .env.local
```

**Docker Compose:**
```bash
# Create .env file in project root
cp .env.example .env
nano .env

# Docker Compose will automatically load .env
docker-compose up -d
```

---

## 🗄️ Database Setup

### PostgreSQL via Docker

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait for health check
docker-compose ps

# Run migrations (Backend)
cd backend
npx prisma migrate deploy

# Run migrations (UI)
cd ../ui
npx prisma migrate deploy

# Seed database (optional)
cd ../backend
npm run seed
```

### External Database (Vercel Postgres, Supabase, etc.)

1. **Create Database**
   - Create a PostgreSQL database on your provider
   - Note the connection string

2. **Update Environment Variables**
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
   ```

3. **Run Migrations**
   ```bash
   # From your local machine
   cd backend
   DATABASE_URL="your-connection-string" npx prisma migrate deploy
   
   cd ../ui
   DATABASE_URL="your-connection-string" npx prisma migrate deploy
   ```

### Database Providers

- **Vercel Postgres**: Integrated, serverless
- **Supabase**: PostgreSQL + extras
- **Railway**: Simple, affordable
- **Neon**: Serverless PostgreSQL
- **AWS RDS**: Enterprise-grade

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Included)

The repository includes `.github/workflows/ci.yml` for automated:
- ✅ Linting
- ✅ Type checking
- ✅ Building
- ✅ Testing
- ✅ Docker builds
- ✅ Vercel deployment

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions**:

```env
# Vercel
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# Database (for tests)
DATABASE_URL=postgresql://...

# Optional
GITHUB_TOKEN=automatically-provided
```

### Workflow Triggers

- **Push to `main`**: Deploy to production
- **Pull Request**: Deploy preview + run tests
- **Push to `develop`**: Deploy to staging

### Manual Deployment

```bash
# Trigger workflow manually
gh workflow run ci.yml
```

---

## 🛠️ Troubleshooting

### Build Fails on Vercel

**Issue:** TypeScript or linting errors

**Solution:**
```bash
# Test locally first
cd ui
npm run build

# Fix errors, then redeploy
git add .
git commit -m "Fix build errors"
git push
```

**Issue:** Missing environment variables

**Solution:**
- Check Vercel Dashboard → Settings → Environment Variables
- Ensure all required vars are set
- Redeploy

### Database Connection Issues

**Issue:** Cannot connect to database

**Solution:**
```bash
# Test connection
psql "$DATABASE_URL"

# Check Prisma
cd backend
npx prisma db pull

# Regenerate client
npx prisma generate
```

### Docker Build Fails

**Issue:** Docker build errors

**Solution:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild
docker-compose build --no-cache

# Check logs
docker-compose logs backend
```

### Styles Not Loading

**Issue:** Tailwind styles missing

**Solution:**
- Verify `postcss.config.mjs` exists
- Check `tailwind.config.ts` content paths
- Clear `.next` folder: `rm -rf .next && npm run build`

### API Routes Not Working

**Issue:** API calls fail

**Solution:**
```javascript
// Check NEXT_PUBLIC_API_URL in .env.local
console.log(process.env.NEXT_PUBLIC_API_URL)

// Verify backend is running
curl http://localhost:3001/health

// Check CORS settings in backend
```

---

## ✅ Post-Deployment Checklist

After deploying, verify:

- [ ] Homepage loads successfully
- [ ] All routes accessible (dashboard, analytics, etc.)
- [ ] Authentication works (login/logout)
- [ ] API calls successful
- [ ] Database connections working
- [ ] Styles rendering correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable (Lighthouse)
- [ ] SSL certificate valid (https://)

---

## 📊 Monitoring

### Vercel Analytics

```javascript
// Already integrated in layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Sentry Error Tracking

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs

# Add DSN to environment
SENTRY_DSN=your-sentry-dsn
```

---

## 🎯 Next Steps

1. **Deploy Backend API**
   - Deploy to Vercel, Railway, or Docker
   - Update `NEXT_PUBLIC_API_URL`

2. **Set Up Custom Domain**
   - Go to Vercel → Settings → Domains
   - Add your domain
   - Configure DNS

3. **Enable v0.dev Integration**
   - Follow `V0_WORKFLOW_GUIDE.md`
   - Generate components
   - Enhance UI/UX

4. **Configure OAuth**
   - Set up GitHub/Google OAuth
   - Add credentials to environment

5. **Monitor & Optimize**
   - Set up Sentry
   - Enable Vercel Analytics
   - Monitor performance

---

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Docker Docs**: https://docs.docker.com

---

## 🆘 Support

For issues or questions:
- Check this deployment guide
- Review `README.md` for project overview
- See `V0_WORKFLOW_GUIDE.md` for UI enhancements
- Open an issue on GitHub

---

**Built with ❤️ by NeonHub Team**

**Version:** 2.5.0  
**Deployment Status:** ✅ Production Ready  
**Last Updated:** October 2, 2025

