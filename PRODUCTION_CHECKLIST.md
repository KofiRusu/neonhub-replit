# 🚀 NeonHub v3.0 - Production Deployment Checklist

**Target:** Deploy API and Web to production  
**Status:** Local dev complete, production pending

---

## 📋 Pre-Deployment Checklist

### 1. ✅ API Keys & Credentials

- [ ] **OpenAI API Key**
  - Get from: https://platform.openai.com/api-keys
  - Set in production env: `OPENAI_API_KEY`
  - Used for: AI content generation

- [ ] **Stripe Keys**
  - Get from: https://dashboard.stripe.com/apikeys
  - Required keys:
    - `STRIPE_SECRET_KEY` (API, starts with `sk_live_`)
    - `STRIPE_PUBLISHABLE_KEY` (Web, starts with `pk_live_`)
    - `STRIPE_WEBHOOK_SECRET` (API, starts with `whsec_`, from webhook setup)
  - Used for: Billing and subscription management

- [ ] **Resend API Key**
  - Get from: https://resend.com/api-keys
  - Set in production env: `RESEND_API_KEY`
  - Used for: Transactional emails (invites, notifications)

- [ ] **GitHub OAuth App**
  - Create at: https://github.com/settings/developers
  - Required:
    - `GITHUB_ID` (Client ID)
    - `GITHUB_SECRET` (Client Secret)
  - Authorization callback URL: `https://yourdomain.com/api/auth/callback/github`
  - Used for: User authentication

- [ ] **NextAuth Secret**
  - Generate with: `openssl rand -base64 32`
  - Set: `NEXTAUTH_SECRET`
  - Must be same value in both API and Web

- [ ] **Sentry DSN** (Optional but recommended)
  - Get from: https://sentry.io
  - Set: `SENTRY_DSN`
  - Used for: Error tracking and monitoring

---

### 2. 🗄️ Database Setup

- [ ] **Provision Managed Postgres**
  - Recommended providers:
    - [Neon](https://neon.tech) - Serverless, generous free tier
    - [Supabase](https://supabase.com) - Includes auth/storage
    - [Railway](https://railway.app) - Easy deployment
    - [Render](https://render.com) - Simple setup
  - Get `DATABASE_URL` connection string

- [ ] **Configure Database**
  - Minimum specs: 1GB RAM, 10GB storage
  - Enable SSL connections
  - Set connection pooling (recommended for serverless)

- [ ] **Run Migrations**
  ```bash
  # Set DATABASE_URL environment variable
  export DATABASE_URL="your-production-db-url"
  
  # Apply migrations
  cd apps/api
  npx prisma migrate deploy
  
  # Optional: Seed with demo data
  npm run seed
  ```

- [ ] **Verify Database Connection**
  ```bash
  npx prisma studio
  # Opens GUI to verify tables and data
  ```

---

### 3. 🖥️ API Deployment

#### Option A: Railway

- [ ] **Create New Project** on [Railway](https://railway.app)
- [ ] **Connect GitHub Repo**
- [ ] **Configure Service**
  - Root directory: `apps/api`
  - Build command: `npm install && npm run build`
  - Start command: `npm run start`
  - Port: `3001` (Railway auto-detects)

- [ ] **Add Environment Variables** in Railway dashboard:
  ```env
  DATABASE_URL=<your-managed-postgres-url>
  PORT=3001
  NODE_ENV=production
  OPENAI_API_KEY=sk-...
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  RESEND_API_KEY=re_...
  SENDGRID_API_KEY=SG... (optional)
  TWILIO_ACCOUNT_SID=AC... (optional)
  TWILIO_AUTH_TOKEN=... (optional)
  TWITTER_BEARER_TOKEN=... (optional)
  REDDIT_CLIENT_ID=... (optional)
  REDDIT_CLIENT_SECRET=... (optional)
  CORS_ORIGINS=https://your-domain.vercel.app
  SENTRY_DSN=https://... (optional)
  ```

- [ ] **Deploy** and wait for build
- [ ] **Get API URL** (e.g., `https://neonhub-api-production.up.railway.app`)

#### Option B: Render

- [ ] **Create New Web Service** on [Render](https://render.com)
- [ ] **Connect GitHub Repo**
- [ ] **Configure**
  - Root directory: `apps/api`
  - Build command: `npm install && npm run build && npx prisma generate`
  - Start command: `npm run start`
  - Plan: At least Starter ($7/mo for production)

- [ ] **Add Environment Variables** (same as Railway list above)
- [ ] **Deploy**

#### Option C: Fly.io

- [ ] Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
- [ ] Login: `fly auth login`
- [ ] Create app:
  ```bash
  cd apps/api
  fly launch --name neonhub-api --region <your-region>
  ```
- [ ] Set secrets:
  ```bash
  fly secrets set DATABASE_URL="..." OPENAI_API_KEY="..." # etc.
  ```
- [ ] Deploy: `fly deploy`

---

### 4. 🌐 Web Deployment (Vercel)

- [ ] **Login to Vercel**
  - Visit: https://vercel.com
  - Sign in with GitHub

- [ ] **Import Project**
  - Click "Add New Project"
  - Select `KofiRusu/Neonhub-v3.0` repo

- [ ] **Configure Project**
  - Framework Preset: **Next.js**
  - Root Directory: `apps/web`
  - Build Command: `npm run build` (auto-detected)
  - Install Command: `npm install` (auto-detected)
  - Output Directory: `.next` (auto-detected)
  - Node Version: **20.x**

- [ ] **Add Environment Variables** in Vercel dashboard:
  ```env
  # API Connection
  NEXT_PUBLIC_API_URL=https://your-api-domain.com
  
  # Auth
  NEXTAUTH_SECRET=<same-secret-as-api>
  NEXTAUTH_URL=https://your-domain.vercel.app
  GITHUB_ID=<github-oauth-client-id>
  GITHUB_SECRET=<github-oauth-client-secret>
  
  # Site
  NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
  
  # Stripe (Public Key)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
  
  # Database (for NextAuth)
  DATABASE_URL=<your-managed-postgres-url>
  
  # Monitoring (optional)
  SENTRY_DSN=https://...
  NEXT_PUBLIC_SENTRY_DSN=https://...
  ```

- [ ] **Deploy**
  - Click "Deploy"
  - Wait for build (~3-5 minutes)

- [ ] **Get Production URL**
  - Vercel provides: `https://<project-name>.vercel.app`
  - Or use custom domain (see DNS section)

---

### 5. 🔗 DNS Configuration

#### Option A: Use Vercel Domain
- [ ] No DNS needed
- [ ] Use provided URL: `https://your-project.vercel.app`

#### Option B: Custom Domain

- [ ] **Add Domain to Vercel**
  - Go to: Project Settings > Domains
  - Add domain: `yourdomain.com`
  - Follow Vercel instructions for DNS records

- [ ] **Add DNS Records** (at your domain provider):
  
  **For Vercel (Web):**
  ```
  Type: A
  Name: @ (or root)
  Value: 76.76.21.21
  
  Type: CNAME
  Name: www
  Value: cname.vercel-dns.com
  ```
  
  **For API:**
  ```
  Type: CNAME
  Name: api
  Value: <your-api-provider-url>
  
  Example:
  api.yourdomain.com → neonhub-api.up.railway.app
  ```

- [ ] **Update Environment Variables**
  - Update `NEXTAUTH_URL` to `https://yourdomain.com`
  - Update `NEXT_PUBLIC_SITE_URL` to `https://yourdomain.com`
  - Update `NEXT_PUBLIC_API_URL` to `https://api.yourdomain.com`
  - Update `CORS_ORIGINS` in API to `https://yourdomain.com`

- [ ] **Redeploy Both Services** after env changes

- [ ] **Verify SSL**
  - Both Vercel and Railway/Render auto-provision SSL
  - Check: `https://yourdomain.com` and `https://api.yourdomain.com`

---

### 6. 🔌 Third-Party Integrations

#### Stripe Webhooks

- [ ] **Create Webhook Endpoint** in Stripe Dashboard
  - URL: `https://api.yourdomain.com/api/stripe/webhook`
  - Events to listen:
    - `checkout.session.completed`
    - `invoice.paid`
    - `invoice.payment_failed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`

- [ ] **Get Webhook Signing Secret**
  - Copy `whsec_...` from Stripe
  - Add to API env: `STRIPE_WEBHOOK_SECRET`

- [ ] **Test Webhook**
  - Use Stripe CLI: `stripe listen --forward-to https://api.yourdomain.com/api/stripe/webhook`
  - Or trigger test event in Stripe dashboard

#### GitHub OAuth

- [ ] **Update OAuth App Settings**
  - Homepage URL: `https://yourdomain.com`
  - Authorization callback URL: `https://yourdomain.com/api/auth/callback/github`

- [ ] **Test Sign In**
  - Visit: `https://yourdomain.com/auth/signin`
  - Click "Sign in with GitHub"
  - Verify redirect and session creation

---

### 7. ✅ Production Smoke Tests

#### API Tests

- [ ] **Health Check**
  ```bash
  curl https://api.yourdomain.com/health
  # Expected: {"status":"ok","db":true,"ws":true,...}
  ```

- [ ] **Database Connection**
  - Health check shows `"db": true`

- [ ] **WebSocket Connection**
  - Health check shows `"ws": true`

- [ ] **CORS Headers**
  ```bash
  curl -I -X OPTIONS https://api.yourdomain.com/api/content \
    -H "Origin: https://yourdomain.com" \
    -H "Access-Control-Request-Method: GET"
  # Check for Access-Control-Allow-Origin header
  ```

#### Web Tests

- [ ] **Homepage Loads**
  ```bash
  curl -I https://yourdomain.com
  # Expected: HTTP/2 200
  ```

- [ ] **Dashboard Access** (requires auth)
  - Visit: `https://yourdomain.com/dashboard`
  - Should redirect to sign-in if not authenticated

- [ ] **Authentication Flow**
  1. Visit `/auth/signin`
  2. Click "Sign in with GitHub"
  3. Authorize app
  4. Redirected to dashboard
  5. User session created

- [ ] **API Communication**
  - Dashboard loads metrics from API
  - Check browser console for errors
  - Verify no CORS issues

- [ ] **Create Content**
  - Go to `/content`
  - Try to generate AI content
  - Verify OpenAI integration works

- [ ] **Billing Page**
  - Go to `/billing`
  - Verify Stripe elements load
  - Test checkout flow (use test card: 4242 4242 4242 4242)

- [ ] **Email Sending**
  - Go to `/team`
  - Send invite to test email
  - Verify email received via Resend

---

### 8. 📊 Monitoring & Logging

- [ ] **Set Up Sentry** (optional but recommended)
  - Create project at sentry.io
  - Add DSN to both API and Web
  - Test by triggering an error
  - Verify error appears in Sentry dashboard

- [ ] **Enable Vercel Analytics**
  - Already included in Vercel deployments
  - View at: Project > Analytics tab

- [ ] **Check Logs**
  - **Vercel:** Project > Deployments > View Function Logs
  - **Railway:** Project > Service > Logs tab
  - **Render:** Dashboard > Logs

- [ ] **Set Up Uptime Monitoring** (optional)
  - [UptimeRobot](https://uptimerobot.com) - Free tier available
  - Monitor: `https://yourdomain.com` and `https://api.yourdomain.com/health`

---

### 9. 🔒 Security Review

- [ ] **Environment Variables**
  - ✓ All secrets in environment (not in code)
  - ✓ No `.env` files committed to git
  - ✓ Production secrets different from dev

- [ ] **HTTPS Enabled**
  - ✓ Both Web and API use SSL
  - ✓ HTTP redirects to HTTPS

- [ ] **CORS Configured**
  - ✓ Only production domain in `CORS_ORIGINS`
  - ✓ No wildcard (`*`) allowed

- [ ] **Rate Limiting**
  - ✓ Enabled in API (Express rate-limit middleware)
  - Default: 120 requests per minute

- [ ] **Database Security**
  - ✓ SSL connections enabled
  - ✓ Connection pooling configured
  - ✓ No public access (only from API)

---

### 10. 📝 Final Steps

- [ ] **Update GitHub README Badge**
  - Edit `README.md`
  - Update CI badge URL
  - Update any placeholder URLs

- [ ] **Create Production Branch** (optional)
  ```bash
  git checkout -b production
  git push origin production
  ```

- [ ] **Tag Release**
  ```bash
  git tag -a v3.0.0 -m "NeonHub v3.0.0 Production Release"
  git push origin v3.0.0
  ```

- [ ] **Document Deployment**
  - Add production URLs to team docs
  - Share credentials securely (use 1Password, LastPass, etc.)

- [ ] **Schedule Backups**
  - Database: Daily automated backups (usually provided by host)
  - Verify backup restoration process

---

## ✅ Go-Live Checklist

When everything above is complete:

- [ ] **Final Smoke Test**
  - Test all major features end-to-end
  - Verify API and Web communicate correctly
  - Confirm auth, billing, emails work

- [ ] **Monitor Initial Traffic**
  - Watch Sentry for errors
  - Check logs for anomalies
  - Monitor API response times

- [ ] **Announce Launch** 🎉
  - Share production URL with stakeholders
  - Update marketing materials
  - Post on social media

---

## 🆘 Rollback Plan

If something goes wrong:

1. **Vercel:** Revert to previous deployment
   - Project > Deployments > Click older deployment > "Promote to Production"

2. **Railway/Render:** Roll back via dashboard or redeploy previous commit

3. **Database:** Restore from latest backup
   ```bash
   # Example for Postgres
   pg_restore --dbname=$DATABASE_URL backup_file.dump
   ```

4. **Notify users** if downtime expected

---

## 📞 Support Contacts

- **Vercel Support:** https://vercel.com/support
- **Railway Support:** https://railway.app/help
- **Render Support:** https://render.com/docs
- **Stripe Support:** https://support.stripe.com

---

## 📌 Post-Launch

After successful deployment:

- [ ] Monitor performance for 24-48 hours
- [ ] Address any issues that arise
- [ ] Gather user feedback
- [ ] Plan next iteration

---

**Status:** Ready for production deployment  
**Last Updated:** October 12, 2025

**Good luck with your launch! 🚀**

