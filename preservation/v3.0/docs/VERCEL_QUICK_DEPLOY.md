# NeonHub Web App - Vercel Quick Deploy with v0 Integration

## Overview

This guide gets your web app live on Vercel FAST with v0 integration for rapid UI iteration, while keeping your existing API unchanged.

## Prerequisites (Once)
- [x] GitHub repo pushed and accessible
- [x] API reachable (local, Render, or Railway)
- [ ] If API still local: tunnel ready (ngrok/Cloudflared) for preview builds

---

## 1. Create Vercel Project (apps/web)

### Vercel Dashboard Setup
1. **Import Git Repo** → Select your repository
2. **Framework**: Next.js (auto-detected)
3. **Root Directory**: `apps/web`
4. **Build Command**: `npm run build`
5. **Output Directory**: `.next`
6. **Install Command**: `npm ci` (auto OK)

### Environment Variables (Preview & Production)

#### Preview Environment
```bash
NEXT_PUBLIC_SITE_URL = https://<preview>.vercel.app
NEXT_PUBLIC_API_URL = https://<ngrok-or-staging-api>  # tunnel URL if local
NEXTAUTH_URL = https://<preview>.vercel.app
NEXTAUTH_SECRET = <random-32-chars>
DATABASE_URL = <only-if-web-uses-prisma>
NODE_ENV = production
```

#### Production Environment  
```bash
NEXT_PUBLIC_SITE_URL = https://<yourdomain.com>
NEXT_PUBLIC_API_URL = https://api.<yourdomain.com>
NEXTAUTH_URL = https://<yourdomain.com>  
NEXTAUTH_SECRET = <rotate-once>
DATABASE_URL = <only-if-web-uses-prisma>
NODE_ENV = production
```

### For Local API + Previews
```bash
# Start tunnel
ngrok http 3001
# or
cloudflared tunnel --url http://localhost:3001

# Set NEXT_PUBLIC_API_URL in Vercel Preview environment:
NEXT_PUBLIC_API_URL = https://<tunnel-subdomain>.ngrok.io
```

**Deploy** → Get *.vercel.app preview immediately

---

## 2. Update API CORS for Vercel

### Express CORS Configuration
```typescript
// apps/api/src/server.ts
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      'http://localhost:3000',           // local dev
      /\.vercel\.app$/,                  // any Vercel preview URL
      'https://yourdomain.com',          // production domain
      'https://www.yourdomain.com',      // www subdomain
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return cb(null, true);
    
    const isAllowed = allowed.some(rule =>
      typeof rule === 'string' ? origin === rule : rule.test(origin)
    );
    
    cb(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  credentials: true,
}));
```

**Restart/Redeploy API** after CORS update

---

## 3. Enhanced Vercel Configuration

### Security Headers (apps/web/vercel.json)
```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci && npx prisma generate",
  "regions": ["iad1", "sfo1"],
  "functions": {
    "apps/web/src/app/api/**": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-DNS-Prefetch-Control", "value": "on" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/health",
      "destination": "/api/health"
    },
    {
      "source": "/api/backend/:path*",
      "destination": "https://api.yourdomain.com/:path*"
    }
  ]
}
```

### API Proxy in Next.js Config (Optional but Recommended)
```typescript
// apps/web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... existing config ...
  
  // API rewrites for same-origin requests (better for previews)
  async rewrites() {
    const isDev = process.env.NODE_ENV !== "production";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
    
    return [
      {
        source: "/api/backend/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
  
  // ... rest of config
};

export default nextConfig;
```

---

## 4. CLI Quality of Life (Optional but Nice)

```bash
# Install Vercel CLI
npm i -g vercel

# Link local project to Vercel
cd apps/web
vercel link

# Pull Vercel environment variables for local development
vercel env pull .env.local

# Now local development mirrors Vercel environment
npm run dev
```

---

## 5. v0 Integration Workflows

### Option A: v0 → GitHub PRs → Vercel Previews (Recommended)
1. **Connect v0 to GitHub**: In v0.dev, connect same repo and enable "Create PRs"
2. **Generate/Modify in v0**: Ask v0 to create/update components/pages
3. **Auto PR Creation**: v0 opens a PR with changes
4. **Auto Preview**: Vercel builds preview deployment with URL
5. **Review & Merge**: Test preview → tweak if needed → merge PR

### Option B: v0 → Local Files → Push
1. **Export from v0**: Copy generated code from v0.dev
2. **Paste Locally**: Add to `apps/web/src/components/` or pages
3. **Push Branch**: Vercel builds preview for branch
4. **Iterate**: Repeat until ready → merge to main → auto-deploy to production

---

## 6. Custom Domain Setup (Production)

### Add Domain in Vercel
```bash
# Vercel Dashboard → Settings → Domains → Add:
yourdomain.com
www.yourdomain.com
```

### DNS Configuration Options

#### Option 1: Delegate to Vercel (Easiest)
- Change nameservers at registrar to Vercel's
- Vercel handles all DNS + SSL automatically

#### Option 2: Keep DNS at Registrar
Add these records (Vercel provides exact values):
```bash
# A Records
yourdomain.com → 76.76.19.61
www.yourdomain.com → cname.vercel-dns.com (CNAME)

# Or use CNAME for both (if registrar allows)
yourdomain.com → cname.vercel-dns.com
www.yourdomain.com → cname.vercel-dns.com
```

SSL certificates are automatic via Vercel (Let's Encrypt)

---

## 7. Quick Validation & Smoke Testing

### Health Check
```bash
# Web health endpoint (if implemented)
curl -fsS https://yourdomain.com/health || echo "No web /health route (normal if not present)"

# API connectivity through web proxy
curl -fsS https://yourdomain.com/api/backend/health
```

### UI Smoke Test (Open Key Pages)
```bash
# Main application pages
open https://yourdomain.com/dashboard
open https://yourdomain.com/analytics  
open https://yourdomain.com/trends
open https://yourdomain.com/billing
open https://yourdomain.com/team
open https://yourdomain.com/brand-voice
open https://yourdomain.com/agents
open https://yourdomain.com/content
```

### Fix Static Rendering Errors (If Any)
If pages show "Static Rendering Error", add to top of problematic pages:
```typescript
export const dynamic = 'force-dynamic'
```

Commit → Vercel redeploys automatically

---

## 8. Optional: CI/CD via GitHub Actions

### Auto-Deploy on Main Branch
```yaml
# .github/workflows/deploy-web.yml
name: Deploy Web (Vercel)

on:
  push:
    branches: [ main ]
    paths: [ 'apps/web/**' ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_WEB }}
          working-directory: apps/web
          prod: true
```

### Required GitHub Secrets
```bash
VERCEL_TOKEN          # From Vercel Account Settings → Tokens
VERCEL_ORG_ID         # From Vercel Team Settings  
VERCEL_PROJECT_ID_WEB # From Vercel Project Settings
```

---

## 9. Environment-Specific API URLs

### Multiple API Environments
```bash
# Preview branches can point to different API instances
# Set per-branch in Vercel → Settings → Environment Variables

# Feature branches → staging API
NEXT_PUBLIC_API_URL = https://api-staging.yourdomain.com

# Main branch → production API  
NEXT_PUBLIC_API_URL = https://api.yourdomain.com

# PR previews → tunnel or staging
NEXT_PUBLIC_API_URL = https://feature-xyz-api.yourdomain.com
```

---

## TL;DR - Your Next Moves

1. ✅ **Import apps/web to Vercel** → Set environment variables → Deploy
2. ✅ **Update API CORS** → Allow `*.vercel.app` and your domain
3. ✅ **Start tunnel** (if API local) → Set `NEXT_PUBLIC_API_URL` in Preview
4. ✅ **Connect v0 to repo** → Enable PR creation → Iterate with automatic previews
5. ✅ **Add custom domain** → Configure DNS → SSL auto-provisioned
6. ✅ **Test all pages** → Fix any `force-dynamic` issues → Go live!

## Pro Tips

- **Same-Origin API Calls**: Use `/api/backend/*` proxy for better preview experience
- **Environment Parity**: Use `vercel env pull` to match production locally  
- **Branch Previews**: Each PR gets its own URL for testing
- **Instant Rollback**: Vercel → Deployments → Promote previous version
- **Performance**: Monitor Core Web Vitals in Vercel Analytics

Your web app is now live with v0 superpowers! 🚀



