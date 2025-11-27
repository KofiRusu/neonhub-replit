# 🚀 Quick Deployment Reference

## One-Command Deployment Check
```bash
# Verify everything is ready
node scripts/final-audit.mjs && echo "✅ Ready to deploy"
```

## Push to GitHub
```bash
git push origin main --tags
```

## Vercel Deployment (Web)
```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy
cd apps/web && vercel --prod
```

## Railway Deployment (API)
```bash
# Install Railway CLI (optional)
npm i -g @railway/cli

# Deploy
cd apps/api && railway up
```

## Database Migration
```bash
pnpm prisma migrate deploy
```

## Health Check
```bash
curl https://api.your-domain.com/api/health
curl -I https://your-domain.com
```

---

**Need more details?** See FINAL_READINESS_SNAPSHOT.md
