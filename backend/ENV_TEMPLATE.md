# NeonHub Backend - Environment Variables Template

Create `.env` with these variables:

```env
# ==============================================
# Server
# ==============================================
PORT=3001
NODE_ENV=development
HOST=0.0.0.0

# ==============================================
# Database
# ==============================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/neonhub?schema=public"

# ==============================================
# Authentication
# ==============================================
JWT_SECRET="generate-with-openssl-rand-base64-32"
JWT_EXPIRES_IN="7d"
NEXTAUTH_URL="http://127.0.0.1:3000"

# ==============================================
# CORS
# ==============================================
CORS_ORIGIN="http://127.0.0.1:3000,http://localhost:3000,https://neonhubecosystem.com,https://*.vercel.app"

# ==============================================
# AI Services (REQUIRED)
# ==============================================
OPENAI_API_KEY="sk-your-api-key-here"
AI_MODEL="gpt-4-turbo-preview"

# ==============================================
# Stripe Billing (NEW)
# ==============================================
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Price IDs from Stripe dashboard
STRIPE_PRICE_ID_STARTER="price_..."
STRIPE_PRICE_ID_PRO="price_..."
STRIPE_PRICE_ID_ENTERPRISE="price_..."

# Webhook signing secret
STRIPE_WEBHOOK_SECRET="whsec_..."

# ==============================================
# Email Service (NEW)
# ==============================================
# Option 1: Resend (recommended)
RESEND_API_KEY="re_..."

# Option 2: Postmark
# POSTMARK_API_TOKEN="..."

# Option 3: SendGrid
# SENDGRID_API_KEY="..."

# ==============================================
# Application URLs
# ==============================================
APP_BASE_URL="http://127.0.0.1:3000"
API_BASE_URL="http://127.0.0.1:3001"

# ==============================================
# Monitoring
# ==============================================
SENTRY_DSN=""
LOG_LEVEL="info"

# ==============================================
# Rate Limiting
# ==============================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
```

## For Production:

1. Use live Stripe keys (sk_live_...)
2. Configure webhook endpoint in Stripe dashboard
3. Add production email provider API key
4. Update all URLs to production domains
5. Set NODE_ENV=production

