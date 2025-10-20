# API Environment Variables Checklist

**Platform:** Railway / Render  
**Application:** NeonHub API v3.0  
**Last Updated:** 2025-10-18

## Required Environment Variables

### Core Configuration

- [ ] `NODE_ENV`
  - **Value:** `production`
  - **Description:** Application environment
  - **Required:** Yes

- [ ] `PORT`
  - **Value:** `3001` (or platform default)
  - **Description:** Server port
  - **Required:** Yes (Railway auto-assigns if not set)

### Database

- [ ] `DATABASE_URL`
  - **Format:** `postgresql://user:password@host:port/database?sslmode=require`
  - **Description:** PostgreSQL connection string
  - **Required:** Yes
  - **Example:** `postgresql://user:pass@db.neon.tech:5432/neonhub?sslmode=require`
  - **Note:** Use connection pooling URL for production

### Authentication & Security

- [ ] `NEXTAUTH_URL`
  - **Value:** Your production web URL
  - **Description:** Frontend application URL
  - **Required:** Yes
  - **Example:** `https://your-domain.com`

- [ ] `NEXTAUTH_SECRET`
  - **Value:** Generated from `scripts/generate-production-secrets.sh`
  - **Description:** NextAuth encryption key (min 32 characters)
  - **Required:** Yes
  - **Security:** Store in platform secret manager

- [ ] `JWT_SECRET`
  - **Value:** Generated from `scripts/generate-production-secrets.sh`
  - **Description:** JWT token signing key
  - **Required:** Yes
  - **Security:** Store in platform secret manager

- [ ] `SESSION_SECRET`
  - **Value:** Generated from `scripts/generate-production-secrets.sh`
  - **Description:** Session encryption key
  - **Required:** Yes
  - **Security:** Store in platform secret manager

### CORS Configuration

- [ ] `CORS_ORIGIN`
  - **Value:** Comma-separated list of allowed origins
  - **Description:** Allowed frontend domains
  - **Required:** Yes
  - **Example:** `https://your-domain.com,https://www.your-domain.com`

### AI Services

- [ ] `OPENAI_API_KEY`
  - **Value:** Your OpenAI API key
  - **Description:** OpenAI API authentication
  - **Required:** Yes (for AI features)
  - **Format:** `sk-...`
  - **Security:** Store in platform secret manager

- [ ] `OPENAI_ORG_ID`
  - **Value:** Your OpenAI organization ID (optional)
  - **Description:** OpenAI organization identifier
  - **Required:** No

### Email Service (Optional)

- [ ] `SMTP_HOST`
  - **Value:** SMTP server hostname
  - **Description:** Email delivery server
  - **Required:** No (if email features needed)
  - **Example:** `smtp.sendgrid.net`

- [ ] `SMTP_PORT`
  - **Value:** SMTP port number
  - **Description:** Email server port
  - **Required:** No
  - **Default:** `587`

- [ ] `SMTP_USER`
  - **Value:** SMTP username
  - **Description:** Email authentication username
  - **Required:** No

- [ ] `SMTP_PASSWORD`
  - **Value:** SMTP password
  - **Description:** Email authentication password
  - **Required:** No
  - **Security:** Store in platform secret manager

- [ ] `SMTP_FROM`
  - **Value:** From email address
  - **Description:** Default sender email
  - **Required:** No
  - **Example:** `noreply@your-domain.com`

### Monitoring & Error Tracking (Optional)

- [ ] `SENTRY_DSN`
  - **Value:** Sentry project DSN
  - **Description:** Error tracking endpoint
  - **Required:** No (recommended for production)
  - **Example:** `https://...@sentry.io/...`

- [ ] `SENTRY_ENVIRONMENT`
  - **Value:** `production`
  - **Description:** Sentry environment name
  - **Required:** No

### Stripe Payment Integration (Optional)

- [ ] `STRIPE_SECRET_KEY`
  - **Value:** Stripe secret key
  - **Description:** Stripe API authentication
  - **Required:** No (if billing features needed)
  - **Format:** `sk_live_...`
  - **Security:** Store in platform secret manager

- [ ] `STRIPE_WEBHOOK_SECRET`
  - **Value:** Stripe webhook signing secret
  - **Description:** Webhook signature verification
  - **Required:** No (if using Stripe webhooks)
  - **Format:** `whsec_...`
  - **Security:** Store in platform secret manager

- [ ] `STRIPE_PUBLISHABLE_KEY`
  - **Value:** Stripe publishable key
  - **Description:** Client-side Stripe key
  - **Required:** No
  - **Format:** `pk_live_...`

### Rate Limiting & Redis (Optional)

- [ ] `REDIS_URL`
  - **Value:** Redis connection string
  - **Description:** Cache and rate limiting
  - **Required:** No (recommended for production)
  - **Example:** `redis://default:password@redis.railway.internal:6379`

### Logging

- [ ] `LOG_LEVEL`
  - **Value:** `info` | `warn` | `error` | `debug`
  - **Description:** Application log level
  - **Required:** No
  - **Default:** `info`

## Verification Commands

### Check All Variables Set
```bash
# In Railway/Render dashboard, verify all required variables are present
# or use CLI:
railway variables
```

### Test Database Connection
```bash
# From local machine with production DATABASE_URL
psql $DATABASE_URL -c "SELECT version();"
```

### Validate Secrets
```bash
# Ensure all secrets are at least 32 characters
echo $NEXTAUTH_SECRET | wc -c  # Should be > 32
echo $JWT_SECRET | wc -c        # Should be > 32
echo $SESSION_SECRET | wc -c    # Should be > 32
```

## Security Checklist

- [ ] All secrets stored in platform's secret manager (not in code)
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] No development/test credentials in production
- [ ] CORS_ORIGIN set to specific domains (not `*`)
- [ ] All API keys rotated after initial setup
- [ ] Sensitive variables marked as "secret" in platform
- [ ] No `.env` file committed to repository

## Platform-Specific Notes

### Railway
- Variables set in: Project Settings > Variables
- Secrets automatically encrypted
- Can reference between services: `${{SERVICE_NAME.VARIABLE}}`
- Restart required after variable changes

### Render
- Variables set in: Dashboard > Environment
- Mark sensitive vars with 🔒 icon
- Automatic restart on variable change
- Can set different values per branch

## Post-Deployment Validation

After setting all variables:

1. **Trigger Deployment**
   ```bash
   # Railway
   railway up
   
   # Render
   # Automatic on git push
   ```

2. **Check Health Endpoint**
   ```bash
   curl https://your-api-url.railway.app/api/health
   ```

3. **Verify Database Connection**
   ```bash
   # Check logs for successful Prisma connection
   railway logs
   ```

4. **Test Authentication**
   ```bash
   curl https://your-api-url.railway.app/api/auth/providers
   ```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format includes `?sslmode=require`
- Check database IP allowlist (if applicable)
- Test connection with `psql` command

### CORS Errors
- Ensure `CORS_ORIGIN` matches exact frontend URL
- Include both `www` and non-`www` versions
- Check for trailing slashes

### Authentication Failures
- Verify `NEXTAUTH_URL` matches frontend domain
- Confirm `NEXTAUTH_SECRET` length > 32 chars
- Check JWT_SECRET is set and matches between deployments

## Migration Notes

When updating from development to production:

1. Generate new production secrets (never reuse dev secrets)
2. Update database to production instance
3. Update all URLs to production domains
4. Enable SSL enforcement
5. Set appropriate CORS origins
6. Configure monitoring/error tracking

---

**Last Verified:** 2025-10-18  
**Version:** 3.0.0