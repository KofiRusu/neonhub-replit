# Environment Variables Configuration

This document outlines the environment variables required for NeonHub v3.x production deployment.

## API Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string for managed database | `postgresql://user:pass@db.neon.tech:5432/neonhub` |
| `NEXTAUTH_SECRET` | ✅ | Random 32+ character string for NextAuth.js session encryption | `abc123def456ghi789jkl012mno345pqr678` |
| `NEXTAUTH_URL` | ✅ | Full URL of the web application for auth callbacks | `https://app.neonhub.com` |
| `CORS_ORIGINS` | ✅ | Comma-separated list of allowed origins for CORS | `https://app.neonhub.com,https://www.neonhub.com` |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key for payment processing | `sk_live_...` (prod) or `sk_test_...` (test) |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook endpoint secret for signature verification | `whsec_...` |
| `RESEND_API_KEY` | ✅ | Resend API key for transactional emails | `re_...` |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for AI-powered features | `sk-proj-...` |
| `NODE_ENV` | ✅ | Environment mode (must be `production`) | `production` |
| `PORT` | ❌ | Server port (default: 3001) | `3001` |
| `SENTRY_DSN` | ❌ | Sentry DSN for error monitoring | `https://...@sentry.io/...` |
| `TWILIO_ACCOUNT_SID` | ❌ | Twilio Account SID for SMS features | `AC...` |
| `TWILIO_AUTH_TOKEN` | ❌ | Twilio Auth Token | `...` |
| `TWILIO_PHONE_NUMBER` | ❌ | Twilio phone number | `+1...` |

## WEB Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public URL of the web application | `https://app.neonhub.com` |
| `NEXT_PUBLIC_API_URL` | ✅ | Public URL of the API service | `https://api.neonhub.com` |
| `NEXTAUTH_URL` | ✅ | Full URL for NextAuth.js (same as web domain) | `https://app.neonhub.com` |
| `NEXTAUTH_SECRET` | ✅ | Same secret as API for session consistency | `abc123def456ghi789jkl012mno345pqr678` |
| `DATABASE_URL` | ❌ | Only needed if NextAuth uses Prisma adapter on web side | `postgresql://user:pass@db.neon.tech:5432/neonhub` |
| `NODE_ENV` | ✅ | Environment mode (must be `production`) | `production` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key for client-side payment forms | `pk_live_...` (prod) or `pk_test_...` (test) |
| `SENTRY_DSN` | ❌ | Sentry DSN for client-side error monitoring | `https://...@sentry.io/...` |

## Domain Configuration Examples

### Production Domain Setup
- **Web App**: `https://app.neonhub.com`
- **API Service**: `https://api.neonhub.com`
- **CORS Origins**: `https://app.neonhub.com`

### Staging Domain Setup  
- **Web App**: `https://staging.neonhub.com`
- **API Service**: `https://api-staging.neonhub.com`
- **CORS Origins**: `https://staging.neonhub.com`

## Security Notes

1. **Never commit secrets**: All sensitive values should be stored in deployment platform environment variables
2. **CORS whitelist**: Only include actual domains in `CORS_ORIGINS`, never use `*` in production
3. **HTTPS only**: All production URLs must use HTTPS protocol
4. **Secret rotation**: Regularly rotate `NEXTAUTH_SECRET`, `STRIPE_WEBHOOK_SECRET`, and API keys
5. **Environment validation**: Runtime validation ensures all required variables are present

## Runtime Validation

Environment variables are validated at startup using Zod schemas. Missing required variables will prevent application startup with clear error messages.

## Deployment Platform Configuration

### Railway/Render (API)
```bash
# Set environment variables in dashboard
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
# ... etc
```

### Vercel (Web)
```bash
# Set environment variables in dashboard
NEXT_PUBLIC_SITE_URL=https://app.neonhub.com
NEXT_PUBLIC_API_URL=https://api.neonhub.com
# ... etc
```

## Troubleshooting

### Common Issues
- **CORS errors**: Check `CORS_ORIGINS` matches exact web domain
- **Auth redirect errors**: Verify `NEXTAUTH_URL` is correct full URL
- **Stripe webhook fails**: Confirm `STRIPE_WEBHOOK_SECRET` matches endpoint
- **Build failures**: Ensure all required variables are set before deployment



