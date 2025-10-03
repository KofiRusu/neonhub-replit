# ⚡ NeonHub v2.5.0 - Quick Start Guide

**Get up and running in under 5 minutes!**

---

## 🚀 Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org))
- **Git** ([Download](https://git-scm.com))
- **PostgreSQL** 14+ or Docker

---

## 📦 Installation

### Option 1: Local Development (Fast)

```bash
# 1. Clone and navigate
cd Neon-v2.5.0

# 2. Start PostgreSQL via Docker
docker-compose up -d postgres

# 3. Install UI dependencies
cd ui
npm install

# 4. Install Backend dependencies
cd ../backend
npm install

# 5. Set up database
npx prisma generate
npx prisma migrate dev

# 6. Start backend (Terminal 1)
npm run dev

# 7. Start UI (Terminal 2)
cd ../ui
npm run dev

# 8. Open browser
open http://localhost:3000
```

**Done!** ✅

---

### Option 2: Docker (Easiest)

```bash
# 1. Navigate to project
cd Neon-v2.5.0

# 2. Start all services
docker-compose up -d

# 3. Wait for health checks (30s)
docker-compose ps

# 4. Open browser
open http://localhost:3000
```

**Done!** ✅

---

### Option 3: Vercel Deployment (Production)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Navigate to UI
cd Neon-v2.5.0/ui

# 3. Deploy
vercel --prod

# 4. Set environment variables in Vercel dashboard
# 5. Visit your deployment URL
```

**Done!** ✅

---

## 🔐 Environment Setup

### Minimal Configuration

Create `ui/.env.local`:

```env
# Required
DATABASE_URL="postgresql://neonhub:neonhub@localhost:5432/neonhub"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Backend API
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
```

Create `backend/.env`:

```env
# Required
DATABASE_URL="postgresql://neonhub:neonhub@localhost:5432/neonhub"
PORT=3001
NODE_ENV=development
JWT_SECRET="your-jwt-secret-here"
OPENAI_API_KEY="sk-your-key-here"
```

**Generate secrets:**
```bash
openssl rand -base64 32
```

---

## 📊 Project Structure

```
Neon-v2.5.0/
├── ui/                    # Next.js 15 Frontend
│   ├── src/app/          # App Router pages
│   ├── src/components/   # React components
│   ├── src/hooks/        # Custom hooks
│   └── package.json
├── backend/              # Node.js API
│   ├── src/             # TypeScript source
│   ├── prisma/          # Database schema
│   └── package.json
├── docker-compose.yml   # Full stack setup
├── vercel.json          # Vercel config
└── DEPLOYMENT.md        # Full deployment guide
```

---

## 🧪 Verify Installation

### Check Backend

```bash
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

### Check UI

Open: http://localhost:3000/dashboard

Should see:
- ✅ Dashboard loads
- ✅ No console errors
- ✅ Neon blue/purple theme
- ✅ Navigation works

---

## 📝 Next Steps

### 1. Explore the Application

Navigate to:
- **Dashboard**: http://localhost:3000/dashboard
- **Analytics**: http://localhost:3000/analytics
- **Agents**: http://localhost:3000/agents
- **Campaigns**: http://localhost:3000/campaigns
- **Content**: http://localhost:3000/content

### 2. Enable Authentication (Optional)

Set up GitHub OAuth:

1. Create GitHub OAuth App: https://github.com/settings/developers
2. Add to `ui/.env.local`:
   ```env
   GITHUB_ID="your-client-id"
   GITHUB_SECRET="your-client-secret"
   ```
3. Restart UI: `npm run dev`

### 3. Enhance UI with v0.dev

Follow: `V0_INTEGRATION_GUIDE.md`

Complete pending routes:
- Billing
- Team
- Documents
- Tasks
- Metrics
- Feedback
- Messaging

### 4. Deploy to Production

Follow: `DEPLOYMENT.md`

Options:
- **Vercel** (Frontend - Recommended)
- **Docker** (Full Stack)
- **Railway** (Backend)

---

## 🛠️ Common Commands

### Development

```bash
# Start UI
cd ui && npm run dev

# Start Backend
cd backend && npm run dev

# Build UI
cd ui && npm run build

# Build Backend
cd backend && npm run build

# Run tests
cd backend && npm test

# Lint
cd ui && npm run lint
```

### Docker

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose build --no-cache
```

### Database

```bash
# Run migrations
cd backend && npx prisma migrate dev

# Generate client
npx prisma generate

# View database
npx prisma studio

# Reset database
npx prisma migrate reset
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 or 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Database Connection Failed

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check status
docker-compose ps postgres
```

### Module Not Found

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

---

## 📚 Documentation

- **Full Deployment**: `DEPLOYMENT.md`
- **v0.dev Integration**: `V0_INTEGRATION_GUIDE.md`
- **Project README**: `README.md`
- **Changelog**: `CHANGELOG.md`

---

## 🆘 Need Help?

1. Check `DEPLOYMENT.md` for detailed instructions
2. Review `README.md` for project overview
3. See troubleshooting section above
4. Open an issue on GitHub

---

## ✅ Success Checklist

- [ ] PostgreSQL running
- [ ] Backend running on :3001
- [ ] UI running on :3000
- [ ] Dashboard loads successfully
- [ ] No console errors
- [ ] Navigation works
- [ ] Styles render correctly

---

**You're all set!** 🎉

Start building amazing features with NeonHub!

---

**Version:** 2.5.0  
**Last Updated:** October 2, 2025  
**Status:** Ready for Development

