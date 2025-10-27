# Production Environment Configuration Guide

**For deployment to neonhubecosystem.com**

---

## Frontend (Vercel)

**Project Settings → Environment Variables → Production**

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://neonhubecosystem.com
NEXT_PUBLIC_API_URL=https://api.neonhubecosystem.com
NEXT_PUBLIC_WS_URL=wss://api.neonhubecosystem.com

# Database
DATABASE_URL=postgresql://[user]:[pass]@[host]:5432/neonhub?sslmode=require

# NextAuth
NEXTAUTH_URL=https://neonhubecosystem.com
NEXTAUTH_SECRET=[generate-with-openssl-rand-base64-32]

# OAuth (Optional)
GITHUB_ID=[your-github-oauth-client-id]
GITHUB_SECRET=[your-github-oauth-secret]

# Feature Flags
NEXT_PUBLIC_STRIPE_LIVE=true
NEXT_PUBLIC_BILLING_SANDBOX=false

# Monitoring (Optional)
SENTRY_DSN=[your-sentry-dsn]
NEXT_PUBLIC_SENTRY_DSN=[your-sentry-dsn]
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=[auto-provided-by-vercel]
```

---

## Backend (Railway/Render/Fly.io)

**Environment Variables**

```env
# Server
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Database (Production with SSL)
DATABASE_URL=postgresql://[user]:[pass]@[host]:5432/neonhub?sslmode=require

# Authentication
JWT_SECRET=[generate-with-openssl-rand-base64-32]
JWT_EXPIRES_IN=7d
NEXTAUTH_URL=https://neonhubecosystem.com
ENCRYPTION_KEY=[generate-with-openssl-rand-hex-32]

# CORS (Production Domains)
CORS_ORIGINS=https://neonhubecosystem.com,https://neonhub.vercel.app,https://*.vercel.app

# AI Services (Required for content generation)
OPENAI_API_KEY=sk-[your-openai-api-key]
OPENAI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7

# Stripe Billing (Optional - for live billing)
STRIPE_SECRET_KEY=sk_live_[your-stripe-secret-key]
STRIPE_PUBLISHABLE_KEY=pk_live_[your-publishable-key]
STRIPE_PRICE_ID_STARTER=price_[starter-price-id]
STRIPE_PRICE_ID_PRO=price_[pro-price-id]
STRIPE_PRICE_ID_ENTERPRISE=price_[enterprise-price-id]
STRIPE_WEBHOOK_SECRET=whsec_[webhook-signing-secret]

# Email Service (Optional - for team invites)
RESEND_API_KEY=re_[your-resend-api-key]

# Application URLs
APP_BASE_URL=https://neonhubecosystem.com
API_BASE_URL=https://api.neonhubecosystem.com
NEXT_PUBLIC_SITE_URL=https://neonhubecosystem.com
NEXT_PUBLIC_API_URL=https://api.neonhubecosystem.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your-publishable-key]
NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER=price_[starter-price-id]
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_[pro-price-id]
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_[enterprise-price-id]
NEXT_PUBLIC_STRIPE_LIVE=true
NEXT_PUBLIC_BILLING_SANDBOX=false

# Rate Limiting (Production Settings)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=300

# Monitoring (Recommended)
SENTRY_DSN=[your-sentry-backend-dsn]
LOG_LEVEL=info

# Feature Flags
ENABLE_AGENTS=true
ENABLE_WEBSOCKETS=true
ENABLE_EMAIL_NOTIFICATIONS=true

# Open Banking (Optional Connector)
OPEN_BANKING_PROVIDER=truelayer
OPEN_BANKING_CLIENT_ID=...
OPEN_BANKING_CLIENT_SECRET=...
OPEN_BANKING_API_URL=https://api.truelayer.com
OPEN_BANKING_REDIRECT_URI=https://neonhubecosystem.com/banking/oauth/callback
```

---

## Secret Generation

```bash
# Generate secure secrets
openssl rand -base64 32

# Example output:
# kX9mP2vL8nQ5rT7wY4zA1bC3dE6fG9hJ0

# Generate multiple:
for i in {1..3}; do openssl rand -base64 32; done
```

---

## Database Setup

### Option 1: Vercel Postgres (Recommended)

1. Go to Vercel Dashboard → Storage → Create Database → Postgres
2. Copy connection string
3. Add to both Frontend and Backend `DATABASE_URL`
4. Run migrations from local:
   ```bash
   DATABASE_URL="your-vercel-postgres-url" npx prisma migrate deploy
   ```

### Option 2: Supabase

1. Create project at supabase.com
2. Get connection string from Settings → Database
3. Format: `postgresql://postgres:[password]@[host]:5432/postgres?sslmode=require`
4. Run migrations

### Option 3: Railway/Neon/PlanetScale

Similar process - get connection string and run migrations.

---

## Verification Checklist

After setting all variables:

- [ ] All required variables set
- [ ] Secrets are strong (32+ characters)
- [ ] URLs use https://
- [ ] Database URL includes `?sslmode=require`
- [ ] CORS_ORIGIN includes production domain
- [ ] No trailing slashes in URLs
- [ ] Test deploy before going live

---

## Security Notes

- ✅ Never commit actual secrets to git
- ✅ Use environment-specific secrets
- ✅ Rotate secrets every 90 days
- ✅ Use Vercel Environment Groups
- ✅ Enable Vercel Authentication for preview deployments
- ✅ Set up Sentry for error tracking
- ✅ Monitor rate limit violations

---

**Last Updated:** October 3, 2025  
**Version:** 1.0.0-production
