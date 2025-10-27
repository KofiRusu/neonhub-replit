# 🔐 Complete Environment Setup Guide - NeonHub

**Status**: Production-Ready Template  
**Date**: 2025-10-27  
**Based on**: `new_env_generated.env`

---

## 📋 Quick Summary

You need to populate **20 environment variables** for full functionality:
- **Required** (6): DATABASE_URL, NEXTAUTH_SECRET, OPENAI_API_KEY, STRIPE keys
- **Recommended** (4): GitHub OAuth, Resend, Sentry
- **Optional** (10): Twilio, Twitter, Reddit, SendGrid, etc.

---

## ✅ Already Configured

### 1. Database (Cloud - Production)

**Variable**: `DATABASE_URL`  
**Value**: `postgresql://neondb_owner:npg_r2D7UIdgPsVX@ep-polished-flower-aefsjkya-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`  
**Status**: ✅ Already in GitHub Secrets  
**Action**: None needed (already configured 16 hours ago)

**Variable**: `DIRECT_DATABASE_URL`  
**Value**: Same as DATABASE_URL  
**Status**: ⚙️ Optional (recommended for connection pooling)  
**Action**: Add to GitHub Secrets if using pooled connections

---

## 🔑 Variables You Need To Generate/Retrieve

### 2. Authentication Secrets (Required)

#### NEXTAUTH_SECRET
**Purpose**: NextAuth.js session encryption  
**How to generate**:
```bash
openssl rand -base64 32
```
**Example output**: `Xj9Km4Lp7Nq3Rt6Uv8Wx1Yz2Ab5Cd7Ef0Gh3Ij6Kl=`  
**Where to add**:
- Local: `.env` file
- Production: Railway environment variables
- CI/CD: GitHub Actions secrets

---

### 3. GitHub OAuth (Recommended)

**Where to get**: https://github.com/settings/developers

**Steps**:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: `NeonHub`
   - Homepage URL: `https://your-domain.com` (or `http://localhost:3000` for dev)
   - Authorization callback URL: `https://your-domain.com/api/auth/callback/github`
4. Click "Register application"
5. Copy **Client ID** → `GITHUB_ID`
6. Click "Generate a new client secret" → `GITHUB_SECRET`

**Variables**:
```bash
GITHUB_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_SECRET=1234567890abcdef1234567890abcdef12345678
```

---

### 4. OpenAI API Key (Required)

**Where to get**: https://platform.openai.com/api-keys

**Steps**:
1. Go to OpenAI Platform → API keys
2. Click "+ Create new secret key"
3. Name it "NeonHub Production" (or similar)
4. Copy the key (shown only once!)
5. Store securely

**Variable**:
```bash
OPENAI_API_KEY=sk-proj-abc123...xyz789
```

**Cost**: Pay-as-you-go (GPT-4: ~$0.03/1K tokens)

---

### 5. Stripe (Required for Billing)

**Where to get**: https://dashboard.stripe.com/apikeys

**Steps**:
1. Log in to Stripe Dashboard
2. For **Development**:
   - Toggle to "Test mode"
   - Copy "Publishable key" → `STRIPE_PUBLISHABLE_KEY`
   - Copy "Secret key" → `STRIPE_SECRET_KEY`
3. For **Webhooks**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-api.com/api/webhooks/stripe`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

**Variables**:
```bash
# Test mode (for development)
STRIPE_SECRET_KEY=sk_test_51Abc...
STRIPE_PUBLISHABLE_KEY=pk_test_51Abc...
STRIPE_WEBHOOK_SECRET=whsec_abc123...

# Live mode (for production - DO NOT use in development!)
STRIPE_SECRET_KEY=sk_live_51Abc...
STRIPE_PUBLISHABLE_KEY=pk_live_51Abc...
```

---

### 6. Resend (Email Service - Recommended)

**Where to get**: https://resend.com/api-keys

**Steps**:
1. Sign up at resend.com (free tier: 100 emails/day)
2. Go to API Keys
3. Click "Create API Key"
4. Name it "NeonHub Production"
5. Copy the key

**Variable**:
```bash
RESEND_API_KEY=re_abc123xyz789
```

**Alternative**: SendGrid (if you prefer)
```bash
SENDGRID_API_KEY=SG.abc123xyz789
```

---

### 7. Sentry (Monitoring - Recommended)

**Where to get**: https://sentry.io/settings/projects/

**Steps**:
1. Sign up at sentry.io
2. Create new project → Select "Node.js"
3. Copy the DSN from project settings

**Variable**:
```bash
SENTRY_DSN=https://abc123@o456789.ingest.sentry.io/123456
```

---

## ⚙️ Optional Variables

### 8. Twilio (SMS - Optional)

**Where to get**: https://console.twilio.com/

**Steps**:
1. Sign up for Twilio
2. Get free trial credits
3. Dashboard → Account SID & Auth Token
4. Buy a phone number

**Variables**:
```bash
TWILIO_ACCOUNT_SID=ACabc123xyz789
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

---

### 9. Twitter/X API (Optional)

**Where to get**: https://developer.twitter.com/en/portal/dashboard

**Steps**:
1. Apply for developer account
2. Create new app
3. Get Bearer Token

**Variables**:
```bash
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAbc123...
```

---

### 10. Reddit API (Optional)

**Where to get**: https://www.reddit.com/prefs/apps

**Steps**:
1. Go to Reddit → Preferences → Apps
2. Create app (type: script)
3. Copy client ID and secret

**Variables**:
```bash
REDDIT_CLIENT_ID=abc123xyz
REDDIT_CLIENT_SECRET=def456uvw
REDDIT_USER_AGENT=NeonHub/3.0
```

---

## 🎯 Deployment Checklist

### Local Development (.env file)

```bash
# Copy new_env_generated.env to .env
cp new_env_generated.env .env

# Update these required values:
# 1. Keep DATABASE_URL as localhost for local dev
# 2. Generate NEXTAUTH_SECRET: openssl rand -base64 32
# 3. Add your OPENAI_API_KEY
# 4. Add Stripe TEST keys
# 5. Add Resend API key (or use console.log for dev)
```

### Production (Railway/Render)

**Required Variables**:
```bash
DATABASE_URL=postgresql://neondb_owner:npg_r2D7UIdgPsVX@ep-polished-flower-aefsjkya-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]
NEXTAUTH_URL=https://your-production-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
OPENAI_API_KEY=[from OpenAI dashboard]
STRIPE_SECRET_KEY=[LIVE key from Stripe]
STRIPE_PUBLISHABLE_KEY=[LIVE key from Stripe]
STRIPE_WEBHOOK_SECRET=[from Stripe webhooks]
RESEND_API_KEY=[from Resend dashboard]
NODE_ENV=production
```

### CI/CD (GitHub Secrets)

**Already Configured**:
- ✅ `DATABASE_URL` (added 16 hours ago)
- ✅ `AUTO_SYNC_PAT`
- ✅ `SOURCE_PAT`

**Need to Add**:
```bash
# For testing in CI
NEXTAUTH_SECRET=[test secret]
OPENAI_API_KEY=[test key with rate limits]
STRIPE_SECRET_KEY=[test mode key]
```

---

## 🔒 Security Best Practices

### ✅ DO
- ✅ Use different secrets per environment (dev/staging/prod)
- ✅ Generate strong random secrets (32+ characters)
- ✅ Use Stripe TEST keys in development
- ✅ Rotate secrets quarterly
- ✅ Store in password manager (1Password, LastPass)
- ✅ Add to `.gitignore` (never commit `.env`)

### ❌ DON'T
- ❌ Use production keys in development
- ❌ Commit secrets to git
- ❌ Share secrets via Slack/email
- ❌ Use weak/predictable secrets
- ❌ Reuse secrets across services

---

## 🚀 Quick Start Commands

### Generate All Required Secrets

```bash
# NEXTAUTH_SECRET
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"

# JWT_SECRET (if needed)
echo "JWT_SECRET=$(openssl rand -base64 32)"

# ENCRYPTION_KEY
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
```

### Update Local .env

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Backup existing .env
cp .env .env.backup

# Start with template
cp new_env_generated.env .env

# Update cloud DATABASE_URL for production testing
# (keep localhost for local dev)

# Add your API keys (copy from dashboards above)
```

---

## 📊 Environment Matrix Reference

| Environment | DATABASE_URL | API Keys | Secrets |
|-------------|--------------|----------|---------|
| **Local** | localhost:5433 | Test keys | Generated locally |
| **Staging** | Neon staging branch | Test keys | Stored in Railway |
| **Production** | Neon production (current) | Live keys | Stored in Railway + GitHub |

---

## 🆘 Where to Get Help

### Service Dashboards

- **Neon Database**: https://console.neon.tech
- **GitHub OAuth**: https://github.com/settings/developers
- **OpenAI**: https://platform.openai.com/api-keys
- **Stripe**: https://dashboard.stripe.com/apikeys
- **Resend**: https://resend.com/api-keys
- **Sentry**: https://sentry.io/settings/
- **Twilio**: https://console.twilio.com/
- **Twitter/X**: https://developer.twitter.com/
- **Reddit**: https://www.reddit.com/prefs/apps

### Documentation References

- `docs/ENV_MATRIX.md` - Complete variable reference
- `ENV_TEMPLATE.example` - Template with all variables
- `DB_DEPLOYMENT_RUNBOOK.md` - Ops manual
- `GITHUB_SECRET_SETUP.md` - GitHub secrets guide

---

## ✅ Verification Checklist

- [ ] Generated NEXTAUTH_SECRET locally
- [ ] Created GitHub OAuth app and got credentials
- [ ] Obtained OpenAI API key
- [ ] Setup Stripe account and got test keys
- [ ] Created Resend account and got API key
- [ ] Updated local `.env` file
- [ ] Added production secrets to Railway
- [ ] Added CI/CD secrets to GitHub Actions
- [ ] Tested local stack startup
- [ ] Ran smoke tests successfully

---

## 🎉 Next Steps

1. **Generate secrets** (run commands above)
2. **Visit service dashboards** (links above)
3. **Update `.env` file** locally
4. **Add to Railway** for production
5. **Test locally** with `./scripts/start-local-stack.sh`
6. **Run smoke tests** with `./scripts/post-deploy-smoke.sh`

---

**Created**: 2025-10-27  
**Database**: ✅ Deployed and running  
**Workflows**: ✅ All active on main  
**Next**: Populate environment variables

