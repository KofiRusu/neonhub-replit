# NeonHub UI - Environment Variables Template

Create `.env.local` with these variables:

```env
# ==============================================
# Site Configuration
# ==============================================
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_NH_API_URL="http://localhost:3001"
NEXT_PUBLIC_NH_USE_MOCKS=false
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER="price_..."
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO="price_..."
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE="price_..."
NEXT_PUBLIC_STRIPE_LIVE=false
NEXT_PUBLIC_BILLING_SANDBOX=true

# ==============================================
# NextAuth.js
# ==============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
DEMO_LOGIN_EMAIL="demo@neonhub.ai"
DEMO_LOGIN_PASSWORD="demo-access"
DEMO_LOGIN_NAME="NeonHub Demo"
DEMO_LOGIN_USER_ID="demo-user"

# ==============================================
# Observability (Optional - for error tracking)
# ==============================================
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"

# ==============================================
# Feature Flags (Optional)
# ==============================================
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_REAL_TIME=true
```

## For Production (Vercel):

1. **NEXT_PUBLIC_SITE_URL** - Your production domain (e.g., `https://neonhubecosystem.com`)
2. **NEXT_PUBLIC_API_URL** - Your backend API URL (e.g., `https://api.neonhubecosystem.com`)
3. **NEXT_PUBLIC_NH_API_URL** - Base URL for the NeonHub SDK transport (default `http://localhost:3001`)
4. **NEXT_PUBLIC_NH_USE_MOCKS** - Set to `true` only when you want to force mock transport responses
5. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** - Production publishable key from Stripe Dashboard
6. **NEXT_PUBLIC_STRIPE_PRICE_ID_\*** - Price IDs for Starter/Pro/Enterprise plans
7. **NEXT_PUBLIC_STRIPE_LIVE** - Set to `true` once live keys are configured
8. **NEXTAUTH_URL** - Same as NEXT_PUBLIC_SITE_URL
9. **NEXTAUTH_SECRET** - Generate with: `openssl rand -base64 32`
10. **Sentry** - Add your production Sentry DSN for error tracking

## Generate Secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```
