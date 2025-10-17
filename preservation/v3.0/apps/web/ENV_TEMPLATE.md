# NeonHub UI - Environment Variables Template

Create `.env.local` with these variables:

```env
# ==============================================
# Site Configuration
# ==============================================
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"

# ==============================================
# NextAuth.js
# ==============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# ==============================================
# Sentry (Optional - for error tracking)
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
3. **NEXTAUTH_URL** - Same as NEXT_PUBLIC_SITE_URL
4. **NEXTAUTH_SECRET** - Generate with: `openssl rand -base64 32`
5. **Sentry** - Add your production Sentry DSN for error tracking

## Generate Secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

