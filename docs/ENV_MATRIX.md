# Environment Variables Matrix

**Last Updated:** 2025-10-26  
**Version:** 3.2.0

This document provides a comprehensive matrix of all environment variables used across NeonHub environments.

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Required |
| ⚙️ | Optional |
| 🔄 | Rotation Required |
| 🔒 | Sensitive |

---

## Quick Reference Table

| Variable | Local | Staging | Production | Provider | Owner | Rotation |
|----------|-------|---------|------------|----------|-------|----------|
| **Database** | | | | | | |
| `DATABASE_URL` | ✅ | ✅ | ✅ | Neon/PostgreSQL | DevOps | Annual |
| `DIRECT_DATABASE_URL` | ⚙️ | ✅ | ✅ | Neon/PostgreSQL | DevOps | Annual |
| **Server** | | | | | | |
| `PORT` | ✅ | ✅ | ✅ | N/A | DevOps | Never |
| `NODE_ENV` | ✅ | ✅ | ✅ | N/A | DevOps | Never |
| `API_URL` | ✅ | ✅ | ✅ | N/A | DevOps | Never |
| `CORS_ORIGINS` | ✅ | ✅ | ✅ | N/A | DevOps | Never |
| **Authentication** | | | | | | |
| `NEXTAUTH_SECRET` 🔒 | ✅ | ✅ | ✅ | N/A | Security | Quarterly |
| `NEXTAUTH_URL` | ✅ | ✅ | ✅ | N/A | DevOps | Never |
| `JWT_SECRET` 🔒 | ✅ | ✅ | ✅ | N/A | Security | Quarterly |
| `ENCRYPTION_KEY` 🔒 | ✅ | ✅ | ✅ | N/A | Security | Annual |
| **OAuth** | | | | | | |
| `GITHUB_ID` 🔒 | ⚙️ | ✅ | ✅ | GitHub | DevOps | Annual |
| `GITHUB_SECRET` 🔒 | ⚙️ | ✅ | ✅ | GitHub | DevOps | Annual |
| `GOOGLE_CLIENT_ID` 🔒 | ⚙️ | ✅ | ✅ | Google Cloud | DevOps | Annual |
| `GOOGLE_CLIENT_SECRET` 🔒 | ⚙️ | ✅ | ✅ | Google Cloud | DevOps | Annual |
| **AI Services** | | | | | | |
| `OPENAI_API_KEY` 🔒 | ✅ | ✅ | ✅ | OpenAI | Engineering | Quarterly |
| `OPENAI_ORG_ID` | ⚙️ | ⚙️ | ⚙️ | OpenAI | Engineering | Annual |
| `ANTHROPIC_API_KEY` 🔒 | ⚙️ | ⚙️ | ⚙️ | Anthropic | Engineering | Quarterly |
| **Payment** | | | | | | |
| `STRIPE_SECRET_KEY` 🔒 | ✅ | ✅ | ✅ | Stripe | Finance | Annual |
| `STRIPE_PUBLISHABLE_KEY` | ✅ | ✅ | ✅ | Stripe | Finance | Annual |
| `STRIPE_WEBHOOK_SECRET` 🔒 | ✅ | ✅ | ✅ | Stripe | Finance | Annual |
| **Email** | | | | | | |
| `RESEND_API_KEY` 🔒 | ⚙️ | ✅ | ✅ | Resend | Engineering | Annual |
| `SENDGRID_API_KEY` 🔒 | ⚙️ | ⚙️ | ⚙️ | SendGrid | Engineering | Annual |
| `EMAIL_FROM` | ✅ | ✅ | ✅ | N/A | Marketing | Never |
| **SMS** | | | | | | |
| `TWILIO_ACCOUNT_SID` 🔒 | ⚙️ | ✅ | ✅ | Twilio | Engineering | Annual |
| `TWILIO_AUTH_TOKEN` 🔒 | ⚙️ | ✅ | ✅ | Twilio | Engineering | Annual |
| `TWILIO_PHONE_NUMBER` | ⚙️ | ✅ | ✅ | Twilio | Engineering | Never |
| **Social APIs** | | | | | | |
| `TWITTER_API_KEY` 🔒 | ⚙️ | ✅ | ✅ | Twitter/X | Marketing | Annual |
| `TWITTER_API_SECRET` 🔒 | ⚙️ | ✅ | ✅ | Twitter/X | Marketing | Annual |
| `TWITTER_BEARER_TOKEN` 🔒 | ⚙️ | ✅ | ✅ | Twitter/X | Marketing | Annual |
| `REDDIT_CLIENT_ID` 🔒 | ⚙️ | ⚙️ | ⚙️ | Reddit | Marketing | Annual |
| `REDDIT_CLIENT_SECRET` 🔒 | ⚙️ | ⚙️ | ⚙️ | Reddit | Marketing | Annual |
| **Cache & Queue** | | | | | | |
| `REDIS_URL` 🔒 | ⚙️ | ✅ | ✅ | Redis/Upstash | DevOps | Annual |
| **Monitoring** | | | | | | |
| `SENTRY_DSN` 🔒 | ⚙️ | ✅ | ✅ | Sentry | DevOps | Annual |
| `SENTRY_ENVIRONMENT` | ✅ | ✅ | ✅ | N/A | DevOps | Never |
| `LOG_LEVEL` | ✅ | ✅ | ✅ | N/A | DevOps | Never |
| **Storage** | | | | | | |
| `AWS_ACCESS_KEY_ID` 🔒 | ⚙️ | ⚙️ | ✅ | AWS | DevOps | Quarterly |
| `AWS_SECRET_ACCESS_KEY` 🔒 | ⚙️ | ⚙️ | ✅ | AWS | DevOps | Quarterly |
| `AWS_S3_BUCKET` | ⚙️ | ⚙️ | ✅ | AWS | DevOps | Never |

---

## Environment-Specific Configuration

### Local Development

```bash
# Database - Local Docker
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/neonhub
DIRECT_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/neonhub

# Server
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3000

# Auth (generated locally)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Services (test/sandbox keys)
OPENAI_API_KEY=sk-test-... # Test key
STRIPE_SECRET_KEY=sk_test_... # Test mode
RESEND_API_KEY=re_test_... # Test mode
```

### Staging Environment

**Platform:** Railway (API) + Vercel (Web)  
**Database:** Neon PostgreSQL (staging branch)

```bash
# Database - Neon Staging
DATABASE_URL=postgresql://user:****@staging.neon.tech:5432/neonhub?sslmode=require
DIRECT_DATABASE_URL=postgresql://user:****@staging.neon.tech:5432/neonhub?sslmode=require

# Server
PORT=3001
NODE_ENV=staging
API_URL=https://api-staging.neonhubecosystem.com
CORS_ORIGINS=https://staging.neonhubecosystem.com

# Auth (staging-specific)
NEXTAUTH_SECRET=<stored-in-railway>
NEXTAUTH_URL=https://staging.neonhubecosystem.com
JWT_SECRET=<stored-in-railway>
ENCRYPTION_KEY=<stored-in-railway>

# Services (test keys)
OPENAI_API_KEY=<test-key-in-railway>
STRIPE_SECRET_KEY=sk_test_<in-railway>
RESEND_API_KEY=<staging-key-in-railway>
SENTRY_DSN=<staging-project>
SENTRY_ENVIRONMENT=staging
```

### Production Environment

**Platform:** Railway (API) + Vercel (Web)  
**Database:** Neon PostgreSQL (production branch)

```bash
# Database - Neon Production
DATABASE_URL=postgresql://user:****@prod.neon.tech:5432/neonhub?sslmode=require
DIRECT_DATABASE_URL=postgresql://user:****@prod.neon.tech:5432/neonhub?sslmode=require

# Server
PORT=3001
NODE_ENV=production
API_URL=https://api.neonhubecosystem.com
CORS_ORIGINS=https://neonhubecosystem.com

# Auth (production)
NEXTAUTH_SECRET=<stored-in-railway>
NEXTAUTH_URL=https://neonhubecosystem.com
JWT_SECRET=<stored-in-railway>
ENCRYPTION_KEY=<stored-in-railway>

# Services (production keys)
OPENAI_API_KEY=<prod-key-in-railway>
STRIPE_SECRET_KEY=sk_live_<in-railway>
STRIPE_WEBHOOK_SECRET=whsec_<in-railway>
RESEND_API_KEY=<prod-key-in-railway>
SENTRY_DSN=<production-project>
SENTRY_ENVIRONMENT=production
```

---

## Secret Storage Locations

### GitHub Actions

**Purpose:** CI/CD workflows  
**Access:** Settings → Secrets and variables → Actions

| Secret | Status | Notes |
|--------|--------|-------|
| `DATABASE_URL` | ⏸️ Pending | For db-deploy workflow |
| `DIRECT_DATABASE_URL` | ⏸️ Pending | Optional for pooling |
| `NEXTAUTH_SECRET` | ⏸️ Pending | For auth tests |
| `STRIPE_SECRET_KEY` | ⏸️ Pending | Test key only |
| `OPENAI_API_KEY` | ⏸️ Pending | Test key only |

**Action Required:** Add these secrets via GitHub UI

### Vercel (Web App)

**Purpose:** Frontend deployment  
**Access:** Project Settings → Environment Variables

| Variable | Environment | Status |
|----------|-------------|--------|
| `NEXT_PUBLIC_API_URL` | All | ✅ Set |
| `NEXTAUTH_URL` | Production | ✅ Set |
| `NEXTAUTH_SECRET` | All | ⏸️ Pending |
| `GITHUB_ID` | All | ⏸️ Pending |
| `GITHUB_SECRET` | All | ⏸️ Pending |
| `GOOGLE_CLIENT_ID` | All | ⏸️ Pending |
| `GOOGLE_CLIENT_SECRET` | All | ⏸️ Pending |
| `STRIPE_PUBLISHABLE_KEY` | All | ⏸️ Pending |
| `SENTRY_DSN` | All | ⏸️ Pending |

### Railway (API Server)

**Purpose:** Backend API deployment  
**Access:** Project → Variables

| Variable | Status | Notes |
|----------|--------|-------|
| `DATABASE_URL` | ⏸️ Pending | Neon connection |
| `DIRECT_DATABASE_URL` | ⏸️ Pending | For migrations |
| `PORT` | ✅ Set | 3001 |
| `NODE_ENV` | ✅ Set | production |
| `NEXTAUTH_SECRET` | ⏸️ Pending | Generated secret |
| `JWT_SECRET` | ⏸️ Pending | Generated secret |
| `ENCRYPTION_KEY` | ⏸️ Pending | Generated secret |
| `OPENAI_API_KEY` | ⏸️ Pending | Production key |
| `STRIPE_SECRET_KEY` | ⏸️ Pending | Production key |
| `STRIPE_WEBHOOK_SECRET` | ⏸️ Pending | From Stripe dashboard |
| `RESEND_API_KEY` | ⏸️ Pending | Production key |
| `SENTRY_DSN` | ⏸️ Pending | Production project |

---

## Secret Generation Guide

### Generate Secrets Locally

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# JWT_SECRET  
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -hex 32

# Example outputs:
# NEXTAUTH_SECRET=Xj9Km4Lp7Nq3Rt6Uv8Wx1Yz2Ab5Cd7Ef0Gh3Ij6Kl=
# JWT_SECRET=Pq8Rs2Tu4Vw6Xy9Za1Bc4De7Fg0Hi3Jk6Lm9Nq2Rs5=
# ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Get API Keys

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and store securely (shown only once)

**Stripe:**
1. Go to https://dashboard.stripe.com/apikeys
2. Use "Test mode" for staging
3. Use "Live mode" for production
4. Copy Secret Key and Publishable Key

**Resend:**
1. Go to https://resend.com/api-keys
2. Create new API key
3. Copy and store securely

**GitHub OAuth:**
1. Go to https://github.com/settings/developers
2. New OAuth App
3. Copy Client ID and Client Secret

**Google OAuth:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URIs
4. Copy Client ID and Client Secret

---

## Rotation Schedule

| Frequency | Variables |
|-----------|-----------|
| **Never** | `NODE_ENV`, `PORT`, `EMAIL_FROM`, Domain URLs |
| **Quarterly** | `NEXTAUTH_SECRET`, `JWT_SECRET`, AI API keys, AWS keys |
| **Annual** | All other API keys, OAuth secrets, `ENCRYPTION_KEY`, `DATABASE_URL` credentials |
| **Immediately** | Any key suspected of compromise |

### Rotation Procedure

1. **Generate new key** in provider dashboard
2. **Test in staging** environment first
3. **Update production** secrets
4. **Verify application** still works
5. **Revoke old key** after 24-48 hours
6. **Update documentation** (this file)
7. **Notify team** via Slack

---

## Security Best Practices

### ✅ DO

- Use strong, randomly generated secrets
- Rotate keys on schedule
- Use test keys in development/staging
- Store secrets in platform-specific secret managers
- Use different secrets per environment
- Monitor secret access logs
- Enable 2FA on all provider accounts

### ❌ DON'T

- Commit secrets to git (ever!)
- Share secrets via Slack/email
- Use production keys in development
- Store secrets in code or config files
- Reuse secrets across environments
- Use weak or predictable secrets
- Share API keys publicly

---

## Troubleshooting

### Missing Environment Variable

```bash
# Check what's set
printenv | grep -i neon

# Verify in application
node -e "console.log(process.env.DATABASE_URL)"

# Check .env file
cat apps/api/.env | grep DATABASE_URL
```

### Invalid Secret Format

| Variable | Format | Example |
|----------|--------|---------|
| `DATABASE_URL` | `postgresql://user:pass@host:port/db` | `postgresql://postgres:****@localhost:5433/neonhub` |
| `NEXTAUTH_SECRET` | Base64 string, 32+ chars | `Xj9Km4Lp7Nq3Rt6Uv8Wx1Yz2Ab5Cd7Ef0Gh3Ij6Kl=` |
| `OPENAI_API_KEY` | Starts with `sk-proj-` or `sk-` | `sk-proj-Abc123...` |
| `STRIPE_SECRET_KEY` | Starts with `sk_test_` or `sk_live_` | `sk_test_51Ab...` |
| `STRIPE_WEBHOOK_SECRET` | Starts with `whsec_` | `whsec_Abc123...` |

### Secret Not Working

1. **Verify format** matches expected pattern
2. **Check environment** (test vs live keys)
3. **Test key** using provider's CLI/dashboard
4. **Check permissions** on the key
5. **Verify key is active** (not revoked)
6. **Check rate limits** or quotas
7. **Review provider's status** page

---

## Compliance Notes

- **GDPR:** `ENCRYPTION_KEY` used for PII encryption
- **PCI DSS:** Stripe handles card data, no card data stored
- **SOC 2:** Annual key rotation required
- **ISO 27001:** Access logs monitored, keys encrypted at rest

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2025-10-26 | Initial ENV_MATRIX.md created | DevOps |
| 2025-10-26 | Added GitHub Actions secrets section | DevOps |
| 2025-10-26 | Added rotation schedule | Security |

---

## Contact

For questions about environment variables:
- **DevOps:** devops@neonhubecosystem.com
- **Security:** security@neonhubecosystem.com
- **Slack:** #infrastructure

---

**Last Reviewed:** 2025-10-26  
**Next Review:** 2025-11-26  
**Owner:** DevOps Team

