# Phase 4 Environment Variables Setup Guide

This document provides a complete reference for all environment variables required for NeonHub Phase 4 Beta features.

## 📋 Quick Start

1. Copy the template below to your `.env` file in the project root
2. Fill in your actual credentials
3. For production, set these as repository secrets

## 🔐 Complete Environment Template

```bash
# ============================================
# NeonHub Phase 4 Environment Variables
# Complete OAuth & API Configuration Template
# ============================================

# ----------------------------------------
# Database Configuration
# ----------------------------------------
DATABASE_URL=postgresql://user:pass@localhost:5432/neonhub?schema=public

# ----------------------------------------
# Core API Configuration
# ----------------------------------------
NODE_ENV=development
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001

# ----------------------------------------
# Authentication
# ----------------------------------------
NEXTAUTH_SECRET=your-32-character-random-string-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ----------------------------------------
# OpenAI (Content Generation)
# ----------------------------------------
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# ----------------------------------------
# STRIPE BILLING (Phase 4 - Required)
# ----------------------------------------
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRO_PRICE_ID=price_your_pro_plan_price_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_plan_price_id

# ----------------------------------------
# SLACK CONNECTOR (Phase 4 - OAuth2)
# ----------------------------------------
# Create app at: https://api.slack.com/apps
# Required scopes: chat:write, channels:history, channels:read, groups:history, groups:read
SLACK_CLIENT_ID=your-slack-client-id.apps.slack.com
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_REDIRECT_URI=http://localhost:3001/api/connectors/slack/oauth/callback

# ----------------------------------------
# GOOGLE SERVICES (Phase 4 - OAuth2)
# ----------------------------------------
# Create credentials at: https://console.cloud.google.com/apis/credentials
# Enable: Gmail API, Google Sheets API, Google Drive API
# Required scopes:
#   - Gmail: https://www.googleapis.com/auth/gmail.send
#   - Sheets: https://www.googleapis.com/auth/spreadsheets, https://www.googleapis.com/auth/drive.metadata.readonly
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/connectors/gmail/oauth/callback

# ----------------------------------------
# NOTION CONNECTOR (Phase 4 - OAuth2)
# ----------------------------------------
# Create integration at: https://www.notion.so/my-integrations
# Required capabilities: Read content, Update content
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion-client-secret
NOTION_REDIRECT_URI=http://localhost:3001/api/connectors/notion/oauth/callback

# Alternative: Use internal integration token for testing
# NOTION_API_TOKEN=secret_your_notion_integration_token

# ----------------------------------------
# ASANA CONNECTOR (Phase 4 - OAuth2)
# ----------------------------------------
# Create app at: https://app.asana.com/0/developer-console
# Required scope: default
ASANA_CLIENT_ID=your-asana-client-id
ASANA_CLIENT_SECRET=your-asana-client-secret
ASANA_REDIRECT_URI=http://localhost:3001/api/connectors/asana/oauth/callback

# Alternative: Use Personal Access Token for testing
# ASANA_ACCESS_TOKEN=your-asana-personal-access-token

# ----------------------------------------
# HUBSPOT CONNECTOR (Phase 4 - OAuth2)
# ----------------------------------------
# Create app at: https://app.hubspot.com/signup-hubspot/developers
# Required scopes: contacts, crm.objects.contacts.read, crm.objects.contacts.write
HUBSPOT_CLIENT_ID=your-hubspot-client-id
HUBSPOT_CLIENT_SECRET=your-hubspot-client-secret
HUBSPOT_REDIRECT_URI=http://localhost:3001/api/connectors/hubspot/oauth/callback

# Alternative: Use API Key for testing
# HUBSPOT_API_KEY=your-hubspot-api-key

# ----------------------------------------
# TRELLO CONNECTOR (Optional)
# ----------------------------------------
# Get from: https://trello.com/app-key
TRELLO_API_KEY=your-trello-api-key
TRELLO_API_TOKEN=your-trello-api-token

# ----------------------------------------
# DISCORD CONNECTOR (Optional)
# ----------------------------------------
# Create app at: https://discord.com/developers/applications
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# ----------------------------------------
# Social Media APIs (for Trends Service)
# ----------------------------------------
# Twitter API v2 (from: https://developer.twitter.com/en/portal/dashboard)
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
TWITTER_ACCESS_TOKEN=your-twitter-access-token
TWITTER_ACCESS_TOKEN_SECRET=your-twitter-access-token-secret

# Reddit API (from: https://www.reddit.com/prefs/apps)
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
REDDIT_USER_AGENT=NeonHub/3.2

# ----------------------------------------
# Email Services
# ----------------------------------------
# Resend (from: https://resend.com/api-keys)
RESEND_API_KEY=re_your_resend_api_key

# SendGrid (from: https://app.sendgrid.com/settings/api_keys)
SENDGRID_API_KEY=SG.your_sendgrid_api_key

# ----------------------------------------
# SMS/Communication
# ----------------------------------------
# Twilio (from: https://console.twilio.com/)
TWILIO_ACCOUNT_SID=ACyour_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# ----------------------------------------
# Monitoring & Observability
# ----------------------------------------
# Sentry (from: https://sentry.io/settings/)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Redis (for caching and queues)
REDIS_URL=redis://localhost:6379

# ----------------------------------------
# Rate Limiting & Security
# ----------------------------------------
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ----------------------------------------
# PHASE 4 FEATURE FLAGS (Optional)
# ----------------------------------------
ENABLE_DOCUMENTS=true
ENABLE_TASKS=true
ENABLE_FEEDBACK=true
ENABLE_MESSAGES=true
ENABLE_TEAM=true
ENABLE_CONNECTORS=true
ENABLE_TRENDS=true

# ----------------------------------------
# Development & Testing
# ----------------------------------------
LOG_LEVEL=info
ENABLE_DEBUG=false
MOCK_EXTERNAL_APIS=false
```

## 🔗 OAuth Application Setup Links

### Priority 1: Core Billing
- **Stripe:** https://dashboard.stripe.com/apikeys

### Priority 2: Connector Framework
- **Slack:** https://api.slack.com/apps
- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials
- **Notion:** https://www.notion.so/my-integrations
- **Asana:** https://app.asana.com/0/developer-console
- **HubSpot:** https://app.hubspot.com/signup-hubspot/developers

### Additional Services
- **Twitter:** https://developer.twitter.com/en/portal/dashboard
- **Reddit:** https://www.reddit.com/prefs/apps
- **Trello:** https://trello.com/app-key
- **Discord:** https://discord.com/developers/applications
- **Resend:** https://resend.com/api-keys
- **SendGrid:** https://app.sendgrid.com/settings/api_keys
- **Twilio:** https://console.twilio.com/
- **Sentry:** https://sentry.io/settings/

## 📝 Detailed Setup Instructions

### Stripe (Billing)

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. For webhook secret:
   - Go to https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
   - Copy the webhook signing secret (starts with `whsec_`)

5. Create Products and Prices:
   - Go to https://dashboard.stripe.com/products
   - Create "Pro Plan" product with recurring monthly price
   - Create "Enterprise Plan" product with recurring monthly price
   - Copy the Price IDs (start with `price_`)

### Slack

1. Go to https://api.slack.com/apps
2. Click **Create New App** → **From scratch**
3. Name your app (e.g., "NeonHub Connector") and select a workspace
4. Go to **OAuth & Permissions**
5. Add **Redirect URLs**: `http://localhost:3001/api/connectors/slack/oauth/callback`
6. Add **Bot Token Scopes**:
   - `chat:write`
   - `channels:history`
   - `channels:read`
   - `groups:history`
   - `groups:read`
7. Go to **Basic Information**
8. Copy **Client ID** and **Client Secret**

### Google (Gmail & Sheets)

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project or select existing
3. Enable APIs:
   - Gmail API: https://console.cloud.google.com/apis/library/gmail.googleapis.com
   - Google Sheets API: https://console.cloud.google.com/apis/library/sheets.googleapis.com
   - Google Drive API: https://console.cloud.google.com/apis/library/drive.googleapis.com
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Add **Authorized redirect URI**: `http://localhost:3001/api/connectors/gmail/oauth/callback`
7. Copy **Client ID** and **Client Secret**

### Notion

1. Go to https://www.notion.so/my-integrations
2. Click **New integration**
3. Name: "NeonHub Connector"
4. Associated workspace: Select your workspace
5. Capabilities: Check **Read content** and **Update content**
6. Submit and copy the **Internal Integration Token** (for `NOTION_API_TOKEN`)

For OAuth2 (production):
1. Request OAuth2 access from Notion
2. Configure OAuth redirect URL: `http://localhost:3001/api/connectors/notion/oauth/callback`
3. Copy **OAuth client ID** and **OAuth client secret**

### Asana

1. Go to https://app.asana.com/0/developer-console
2. Click **Create new app**
3. Name: "NeonHub Connector"
4. OAuth redirect URI: `http://localhost:3001/api/connectors/asana/oauth/callback`
5. Copy **Client ID** and **Client Secret**

Alternatively, use a Personal Access Token:
1. Go to https://app.asana.com/0/my-apps
2. Click **Create PAT**
3. Copy the token for `ASANA_ACCESS_TOKEN`

### HubSpot

1. Go to https://app.hubspot.com/signup-hubspot/developers
2. Create an app or select existing
3. Go to **Auth** tab
4. Add redirect URL: `http://localhost:3001/api/connectors/hubspot/oauth/callback`
5. Required scopes: `contacts`, `crm.objects.contacts.read`, `crm.objects.contacts.write`
6. Copy **Client ID** and **Client Secret**

### Twitter (for Trends)

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a project and app
3. Go to **Keys and tokens**
4. Copy:
   - API Key (`TWITTER_API_KEY`)
   - API Secret Key (`TWITTER_API_SECRET`)
   - Bearer Token (`TWITTER_BEARER_TOKEN`)
   - Access Token (`TWITTER_ACCESS_TOKEN`)
   - Access Token Secret (`TWITTER_ACCESS_TOKEN_SECRET`)

### Reddit (for Trends)

1. Go to https://www.reddit.com/prefs/apps
2. Click **create another app** at the bottom
3. Type: **script**
4. Name: "NeonHub Trends"
5. Redirect URI: `http://localhost:8080` (not used for client credentials flow)
6. Copy:
   - Client ID (under app name)
   - Client Secret

## 🧪 Testing Configuration

To verify your environment variables are set correctly:

```bash
# Check if required vars are set
cd apps/api
npm run test:config  # (if this script exists)

# Or manually check
node -e "require('dotenv').config(); console.log(process.env.SLACK_CLIENT_ID ? '✓ Slack configured' : '✗ Slack missing')"
```

## 🔒 Security Best Practices

1. **Never commit** `.env` files to version control
2. Use **repository secrets** for CI/CD pipelines
3. Rotate credentials regularly (every 90 days)
4. Use **test/sandbox** credentials for development
5. Enable **IP whitelisting** where possible
6. Monitor API usage for anomalies

## 📦 Deployment

### Render.com
Set environment variables in **Environment** tab of your service

### Vercel
```bash
vercel env add STRIPE_SECRET_KEY production
# Repeat for each variable
```

### Docker
```bash
docker run -d \
  --env-file .env \
  -p 3001:3001 \
  neonhub:latest
```

### GitHub Actions Secrets
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each variable with name and value

## ✅ Verification Checklist

Before running the application, ensure:

- [ ] `DATABASE_URL` points to valid PostgreSQL database
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are set
- [ ] At least one connector is configured (recommend Slack)
- [ ] `NEXTAUTH_SECRET` is a secure random string
- [ ] All URLs use correct protocol (`http` for local, `https` for production)
- [ ] Redirect URIs match exactly in OAuth provider settings
- [ ] No quotes around values in `.env` file
- [ ] `.env` file is in project root (not in `apps/api`)

## 🆘 Troubleshooting

### OAuth Flow Fails
- Verify redirect URI matches exactly (including trailing slash)
- Check client ID and secret are correct
- Ensure scopes are granted in provider dashboard

### Stripe Webhooks Not Working
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3001/api/stripe/webhook`
- Verify webhook secret matches
- Check signature verification logic

### Database Connection Fails
- Verify PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Ensure database exists

### Twitter/Reddit Trends Not Loading
- Verify API keys are valid
- Check rate limits haven't been exceeded
- Ensure bearer token has read permissions

---

**Last Updated:** October 25, 2025  
**NeonHub Version:** v3.2.0 Phase 4 Beta

