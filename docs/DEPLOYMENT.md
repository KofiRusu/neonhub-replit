# NeonHub - Deployment Guide

## Local Development

### Quick Start
```bash
# 1. Start database
docker-compose up -d db

# 2. Backend (Terminal 1)
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev

# 3. Frontend (Terminal 2)
cd Neon-v2.4.0/ui
npm install
npm run dev
```

Visit: http://127.0.0.1:3000

### Smoke Test
```bash
# With backend running on :3001
./scripts/smoke.sh
```

## Docker Deployment

### Full Stack with Docker Compose
```bash
# Build and start all services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
docker-compose logs -f ui

# Stop all services
docker-compose down

# Stop and remove volumes (deletes DB data)
docker-compose down -v
```

Services:
- **Database**: PostgreSQL 16 on :5432
- **Backend API**: Node.js Express on :3001
- **Frontend UI**: Next.js on :3000

### Production Build
```bash
# Build images
docker-compose build

# Start in production mode
docker-compose up -d

# Verify health
curl http://localhost:3001/health
curl http://localhost:3000
```

## Environment Variables

### Required for Production

**Backend (backend/.env)**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/neonhub
PORT=3001
NODE_ENV=production
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-domain.com
```

**Frontend (Neon-v2.4.0/ui/.env.local)**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/neonhub
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=same-as-backend
GITHUB_ID=your-github-oauth-client-id
GITHUB_SECRET=your-github-oauth-client-secret
```

### Optional (Recommended for Production)

```bash
# Sentry error tracking
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

# OpenAI (for real AI content)
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4

# Security
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
CORS_ORIGIN=https://your-domain.com
```

## Cloud Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

**Vercel (Frontend)**
```bash
cd Neon-v2.4.0/ui
vercel --prod

# Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_API_URL=https://your-api.railway.app
# - NEXTAUTH_URL=https://your-app.vercel.app
# - NEXTAUTH_SECRET=...
# - GITHUB_ID=...
# - GITHUB_SECRET=...
# - DATABASE_URL=postgres://...
```

**Railway (Backend + Database)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and init
railway login
railway init

# Deploy
railway up

# Add environment variables in Railway dashboard
```

### Option 2: AWS (Full Stack)

**Services:**
- ECS Fargate (containers for backend/frontend)
- RDS PostgreSQL (database)
- ALB (load balancer)
- Route 53 (DNS)
- CloudWatch (logging/monitoring)

### Option 3: DigitalOcean App Platform

```bash
# Deploy via GitHub integration
# Set environment variables in App Platform dashboard
# Auto-deploy on push to main
```

## Database Migration in Production

```bash
# Apply migrations (Railway/Render)
npx prisma migrate deploy

# Or with Docker
docker-compose exec api npx prisma migrate deploy
```

## Monitoring & Observability

### Sentry Setup
1. Create account at https://sentry.io
2. Create new project (Node.js for backend, Next.js for frontend)
3. Copy DSN
4. Set SENTRY_DSN environment variables
5. Deploy
6. Trigger test error to verify

### Health Checks
- Backend: `GET /health`
- Database: Included in /health response
- WebSocket: Included in /health response

### Logs
```bash
# Docker Compose
docker-compose logs -f api
docker-compose logs -f ui

# Production (depends on platform)
railway logs
vercel logs
aws logs tail /ecs/neonhub-api
```

## CI/CD Pipeline

### GitHub Actions
Workflow runs on every push/PR:
1. Checkout code
2. Setup Node 20
3. Install dependencies
4. Generate Prisma Client
5. Lint (optional)
6. Type check
7. Build
8. Run tests
9. Build Docker images (on main only)

### Manual Deployment
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd Neon-v2.4.0/ui
npm run build
npm start
```

## Security Checklist

### Before Production
- [ ] Set strong NEXTAUTH_SECRET (32+ chars)
- [ ] Configure OAuth providers (GitHub/Google)
- [ ] Set CORS_ORIGIN to exact domain
- [ ] Enable Sentry error tracking
- [ ] Set DATABASE_URL to managed PostgreSQL
- [ ] Use environment secrets (not committed to git)
- [ ] Enable HTTPS/SSL
- [ ] Configure rate limiting (adjust for traffic)
- [ ] Review Helmet security headers
- [ ] Set up database backups
- [ ] Configure log retention
- [ ] Add uptime monitoring

### Rate Limiting
Default: 120 requests per minute per IP

Adjust via environment:
```bash
RATE_LIMIT_WINDOW_MS=60000  # 1 minute window
RATE_LIMIT_MAX=120          # Max requests per window
```

## Troubleshooting

### Docker Build Fails
```bash
# Clear build cache
docker-compose build --no-cache

# Check logs
docker-compose logs api
```

### Database Connection Issues
```bash
# Check database is running
docker-compose ps db

# Check connection string
echo $DATABASE_URL

# Test connection
docker-compose exec db psql -U postgres -d neonhub -c "SELECT 1"
```

### Port Conflicts
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:5432 | xargs kill -9

# Or change ports in docker-compose.yml
```

## Performance Tuning

### Database
- Connection pooling (Prisma default: 10)
- Indexes on frequently queried columns
- Regular VACUUM and ANALYZE

### API
- Enable compression (gzip)
- Cache static responses
- Use Redis for sessions (future enhancement)

### Frontend
- Image optimization (Next.js automatic)
- Code splitting (automatic)
- CDN for static assets

## Backup & Recovery

### Database Backups
```bash
# Manual backup
docker-compose exec db pg_dump -U postgres neonhub > backup.sql

# Restore
docker-compose exec -T db psql -U postgres neonhub < backup.sql
```

### Automated Backups
- Use managed database service (Railway, Supabase, Neon)
- Configure daily automated backups
- Test restoration process

## Cost Estimates

### Minimal Production Setup
- **Vercel** (Frontend): $0-20/month (Hobby/Pro)
- **Railway** (Backend + DB): $5-20/month
- **Total**: ~$10-40/month

### Scaling Up
- Add Redis ($5-10/month)
- Larger database ($20-50/month)
- More backend replicas ($10/instance)

## Support & Resources

- Documentation: See README.md, SETUP.md
- Issues: GitHub Issues
- CI/CD Status: GitHub Actions tab
- API Health: /health endpoint

---

**Last Updated:** Phase 4 Complete
**Production Ready:** ✅ Yes (with proper env vars)
