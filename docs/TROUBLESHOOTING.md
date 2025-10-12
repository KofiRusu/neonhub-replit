# 🔧 NeonHub v3.0 - Troubleshooting Guide

Common issues and their solutions.

---

## Local Development Issues

### Database Connection Errors

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL if stopped
brew services start postgresql@14

# Verify connection
psql -l
```

**Problem:** `database "neonhub" does not exist`

**Solution:**
```bash
# Create database
createdb neonhub

# Run migrations
cd apps/api
npx prisma migrate deploy
```

---

### Static Rendering Error (Next.js)

**Problem:** Page shows "Static Rendering Error" or "Dynamic server usage"

**Solution:** Add this to the TOP of the failing page file:
```typescript
export const dynamic = 'force-dynamic'
```

**Example:** In `apps/web/src/app/dashboard/page.tsx`:
```typescript
"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
// ... rest of imports
```

---

### Port Already in Use

**Problem:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or for port 3001
lsof -ti:3001 | xargs kill -9
```

---

### Prisma Client Out of Sync

**Problem:** `@prisma/client did not initialize yet`

**Solution:**
```bash
cd apps/api
npx prisma generate

cd ../web
npx prisma generate
```

---

### TypeScript Errors in Build

**Problem:** Build fails with type errors

**Solution:**
1. Check `tsconfig.json` excludes test files:
   ```json
   "exclude": ["node_modules", "**/__tests__/**", "**/*.test.ts"]
   ```

2. Remove unused legacy files:
   ```bash
   cd apps/web
   mkdir -p _legacy
   mv hooks/use-api.ts lib/api-client.ts _legacy/ 2>/dev/null || true
   ```

3. Run typecheck to see specific errors:
   ```bash
   npm run typecheck
   ```

---

## Authentication Issues

### NextAuth Callback URL Mismatch

**Problem:** OAuth redirect fails or infinite loop

**Solution:**
1. Ensure `NEXTAUTH_URL` matches exactly:
   ```env
   # Development
   NEXTAUTH_URL=http://localhost:3000
   
   # Production
   NEXTAUTH_URL=https://yourdomain.com
   ```

2. Update GitHub OAuth app settings:
   - Homepage URL: `http://localhost:3000` (dev) or `https://yourdomain.com` (prod)
   - Callback URL: `http://localhost:3000/api/auth/callback/github`

---

### Session Not Persisting

**Problem:** User gets logged out on page refresh

**Solution:**
1. Verify `NEXTAUTH_SECRET` is set and same in both API and Web:
   ```bash
   openssl rand -base64 32
   ```

2. Check database connection for session storage:
   ```bash
   cd apps/api
   npx prisma studio
   # Check if sessions table exists
   ```

---

## API Issues

### CORS Errors

**Problem:** Browser console shows CORS policy errors

**Solution:**
1. Add frontend URL to API CORS origins:
   ```env
   # apps/api/.env
   CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
   ```

2. Verify API code allows CORS:
   ```typescript
   // apps/api/src/server.ts
   app.use(cors({
     origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
     credentials: true
   }))
   ```

---

### API Keys Not Working

**Problem:** Features fail with "Invalid API key" or 401 errors

**Solution:**
1. Verify keys are set in `.env`:
   ```bash
   cd apps/api
   cat .env | grep API_KEY
   ```

2. Check keys are valid (not placeholders):
   - OpenAI: Starts with `sk-proj-` or `sk-`
   - Stripe: `sk_test_` or `sk_live_`
   - Resend: `re_`

3. Restart servers after updating `.env`:
   ```bash
   # Kill servers and restart
   ```

---

## Stripe Integration

### Webhook Signature Verification Failed

**Problem:** Stripe webhooks return 400 or signature errors

**Solution:**
1. Get webhook signing secret from Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   # Copy the whsec_... secret
   ```

2. Update env:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. For production, create webhook endpoint in Stripe Dashboard:
   - URL: `https://api.yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `invoice.*`, `customer.subscription.*`

---

### Test Card Not Working

**Problem:** Checkout fails with test card

**Solution:**
Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future date, any CVC

Ensure using test mode keys (`sk_test_...`, `pk_test_...`)

---

## Email Issues

### Resend Not Sending

**Problem:** Emails not delivered, no errors

**Solution:**
1. Verify API key:
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer re_your_key" \
     -H "Content-Type: application/json" \
     -d '{"from":"onboarding@resend.dev","to":"test@example.com","subject":"Test","html":"Test"}'
   ```

2. Check Resend dashboard for logs

3. For production, verify sender domain:
   - Add domain in Resend
   - Add DNS records
   - Verify domain

---

## Build & Deploy Issues

### Next.js Build Warnings

**Problem:** Warnings about unused variables, missing types

**Solution:**
These are usually non-blocking. To clean up:
```bash
# Install missing dependencies
cd apps/web
npm install --save-dev @types/jest

# Remove unused imports
# Fix @typescript-eslint/no-unused-vars warnings
```

---

### Vercel Deployment Fails

**Problem:** Build fails on Vercel but works locally

**Solution:**
1. Check Vercel build logs for specific error

2. Ensure environment variables are set on Vercel:
   - Go to Project Settings > Environment Variables
   - Add all vars from `.env.example`

3. Check Node version matches:
   ```json
   // package.json
   "engines": {
     "node": ">=20.0.0"
   }
   ```

4. Verify build command:
   ```bash
   npm run build
   ```

---

### API Deploy Fails - Prisma Error

**Problem:** `@prisma/client` not found on deployment

**Solution:**
1. Ensure `postinstall` script runs:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```

2. Or add to build command:
   ```bash
   npm install && npx prisma generate && npm run build
   ```

3. Run migrations after deploy:
   ```bash
   npx prisma migrate deploy
   ```

---

## Performance Issues

### Slow API Responses

**Solution:**
1. Check database connection pooling
2. Add indexes to frequently queried fields
3. Enable query logging:
   ```typescript
   // apps/api/prisma/schema.prisma
   generator client {
     provider = "prisma-client-js"
     previewFeatures = ["tracing"]
   }
   ```

---

### High Memory Usage

**Solution:**
1. Increase Node memory limit:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run start
   ```

2. Check for memory leaks in long-running processes

---

## Environment Variables

### Missing Environment Variable

**Problem:** Feature fails, logs show undefined env var

**Solution:**
1. Check `.env.example` for required vars
2. Copy to `.env` (root, apps/api, apps/web/.env.local)
3. Fill in actual values (no placeholders)
4. Restart servers

---

### Environment Variables Not Loading

**Problem:** `.env` file present but vars not accessible

**Solution:**
1. Verify file name:
   - API: `apps/api/.env`
   - Web: `apps/web/.env.local` (NOT `.env`)

2. Check for syntax errors:
   ```env
   # Good
   API_KEY=value
   
   # Bad (spaces, quotes)
   API_KEY = "value"
   ```

3. For Next.js public vars, must start with `NEXT_PUBLIC_`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

---

## Getting Help

If your issue isn't listed:

1. **Check logs:**
   - API: Terminal output
   - Web: Browser console (F12)
   - Build: CI/CD logs

2. **Search issues:**
   - Check GitHub issues for similar problems

3. **Create issue:**
   - Include error message
   - Steps to reproduce
   - Environment (OS, Node version)
   - Relevant config files

---

## Quick Diagnostic Checklist

Run these to verify your setup:

```bash
# Node version
node -v  # Should be 20.x

# Database
psql -d neonhub -c "SELECT 1"  # Should return 1

# API health
curl http://localhost:3001/health  # Should return {"status":"ok"}

# Web
curl -I http://localhost:3000  # Should return 200

# Prisma
cd apps/api && npx prisma migrate status  # Should be "up to date"

# Build
cd apps/api && npm run build  # Should succeed
cd ../web && npm run build  # Should succeed

# Smoke tests
cd ../../ && bash scripts/smoke.sh  # All should pass
```

---

**Last Updated:** October 12, 2025

