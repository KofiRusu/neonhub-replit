# Post-Merge Deploy Checklist

This checklist covers the steps to deploy NeonHub to production **after** the `infra/autopilot-bootstrap` PR is merged.

---

## Prerequisites

- [ ] PR `infra/autopilot-bootstrap` merged to `main`
- [ ] Local checkout on `main` branch
- [ ] CI passing on `main`

---

## 1. Vercel Deployment (UI)

### Project Setup

Create a new Vercel project or configure existing:

**Framework & Build Settings:**
- **Framework Preset:** Next.js
- **Node Version:** `20`
- **Root Directory:** `Neon-v2.5.0/ui`
- **Install Command:** `pnpm i --frozen-lockfile`
- **Build Command:** `pnpm build`
- **Output Directory:** `.next` (default)

### Environment Variables

Add these in Vercel project settings:

**Required:**
```bash
NEXT_PUBLIC_API_URL=https://api.neonhubecosystem.com
NEXTAUTH_URL=https://neonhubecosystem.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

**Optional (Recommended):**
```bash
NEXT_PUBLIC_SITE_URL=https://neonhubecosystem.com
SENTRY_DSN=<your-sentry-dsn>
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>
NEXT_PUBLIC_SENTRY_DSN=<your-sentry-dsn>
```

### Generate Secrets

```bash
# Generate NextAuth secret
openssl rand -base64 32
```

### Deploy

- **Automatic:** Connect GitHub repo → Vercel will auto-deploy on push to `main`
- **Manual:** Push to `main` or trigger deploy from Vercel dashboard

---

## 2. Backend Deployment

### Option A: Docker Deployment

**Build & Push:**
```bash
cd backend
docker build -t neonhub-backend:latest .
docker tag neonhub-backend:latest your-registry.com/neonhub-backend:latest
docker push your-registry.com/neonhub-backend:latest
```

**Deploy:**
Deploy the container to your infrastructure (K8s, ECS, Cloud Run, etc.)

### Option B: Platform Deployment

Connect the `/backend` directory to your hosting platform:
- **Render**: Node.js service
- **Railway**: Node.js service
- **Fly.io**: Node.js app
- **Heroku**: Node.js app

**Build Command:**
```bash
pnpm install --frozen-lockfile && pnpm build
```

**Start Command:**
```bash
pnpm start
```

### Environment Variables

Set these in your backend hosting platform:

**Required:**
```bash
DATABASE_URL=postgresql://user:password@host:5432/neonhub
CORS_ORIGIN=https://neonhubecosystem.com
OPENAI_API_KEY=sk-...
JWT_SECRET=<generate-with-openssl-rand-base64-32>
NODE_ENV=production
PORT=8080
```

**Optional (Recommended):**
```bash
SENTRY_DSN=<your-sentry-dsn>
REDIS_URL=redis://...
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
```

### Database Setup

**Run Migrations:**
```bash
# On your backend host or locally with production DATABASE_URL
pnpm -C backend prisma migrate deploy
```

**Seed Data (Optional):**
```bash
pnpm -C backend prisma db seed
```

---

## 3. DNS Configuration

### Frontend (Apex Domain)

Point your apex domain to Vercel:

**DNS Records:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: AAAA  
Name: @
Value: 2606:4700:4700::1111
```

Or use Vercel's nameservers (recommended):
- Check Vercel project → Settings → Domains → Nameservers

**Custom Domain:**
Add `neonhubecosystem.com` in Vercel project → Settings → Domains

### Backend (API Subdomain)

Point `api.neonhubecosystem.com` to your backend host:

**DNS Records:**
```
Type: A or CNAME
Name: api
Value: <your-backend-ip-or-hostname>
```

**Verify:**
```bash
curl https://api.neonhubecosystem.com/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

## 4. Post-Deploy Smoke Tests

### Automated API Tests

```bash
cd /path/to/NeonHub
API_URL=https://api.neonhubecosystem.com ./scripts/smoke-api.sh
```

### Manual UI Tests

Open and verify these pages load without errors:

- [ ] **Home:** https://neonhubecosystem.com/
- [ ] **Dashboard:** https://neonhubecosystem.com/dashboard
- [ ] **Analytics:** https://neonhubecosystem.com/analytics
- [ ] **Trends:** https://neonhubecosystem.com/trends
- [ ] **Brand Voice:** https://neonhubecosystem.com/brand-voice
- [ ] **Team:** https://neonhubecosystem.com/team
- [ ] **Billing:** https://neonhubecosystem.com/billing

### Feature Tests

- [ ] **Authentication:** Sign in flow works
- [ ] **Team Invite:** Can send team invitation
- [ ] **Content Generation:** AI content generation works
- [ ] **Brand Voice:** Copilot responds to queries
- [ ] **Metrics:** Dashboard shows data
- [ ] **Real-time:** WebSocket connection established (check browser console)

### API Endpoint Tests

```bash
# Health check
curl https://api.neonhubecosystem.com/health

# Metrics summary
curl https://api.neonhubecosystem.com/api/metrics/summary

# Trends (requires auth)
curl -H "Authorization: Bearer <token>" \
  https://api.neonhubecosystem.com/api/trends/signals
```

---

## 5. Monitoring & Observability

### Sentry (Optional)

- [ ] Verify Sentry project created
- [ ] Check for deployment event in Sentry
- [ ] Confirm no critical errors

### Vercel Analytics

- [ ] Enable Analytics in Vercel project settings
- [ ] Verify events are being tracked

### Backend Logs

- [ ] Access logs from your backend host
- [ ] Verify no 500 errors
- [ ] Check for startup errors

---

## 6. Tag Release (Optional)

Once everything is verified in production:

```bash
git checkout main
git pull origin main
git tag v1.0.0
git push origin --tags
```

Create GitHub release:
```bash
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Production Release" \
  --notes-file release/RELEASE_NOTES_v1.0.0.md
```

---

## 7. Post-Deploy Documentation

- [ ] Update `STATUS.md` with production URLs
- [ ] Update `README.md` if needed (replace YOUR_ORG with actual org)
- [ ] Create production runbook in `docs/RUNBOOK.md` (optional)
- [ ] Document any production-specific configurations

---

## Rollback Plan

If issues are discovered post-deploy:

### Frontend (Vercel)
1. Go to Vercel project → Deployments
2. Find previous working deployment
3. Click "Promote to Production"

### Backend
1. Revert to previous container tag/deployment
2. If migrations were run, use Prisma migration rollback:
   ```bash
   # Identify migration to rollback to
   pnpm -C backend prisma migrate resolve --rolled-back <migration-name>
   ```

### Database
- Restore from backup if data corruption occurred
- Contact DBA for assistance

---

## Support & Troubleshooting

### Common Issues

**Issue: Vercel build fails**
- Check Node version is 20.x
- Verify `pnpm i --frozen-lockfile` works locally
- Check build logs for TypeScript errors

**Issue: API returns 500 errors**
- Check `DATABASE_URL` is correct
- Verify migrations ran: `pnpm -C backend prisma migrate status`
- Check backend logs for error details

**Issue: CORS errors in browser**
- Verify `CORS_ORIGIN` in backend matches frontend URL exactly
- Check for trailing slashes (should not have them)

**Issue: Auth not working**
- Verify `NEXTAUTH_URL` matches exact domain
- Check `NEXTAUTH_SECRET` is set and matches between deployments
- Ensure cookies are not blocked (check browser privacy settings)

### Additional Resources

- [Deploy Escort Guide](./DEPLOY_ESCORT.md)
- [Production Environment Guide](./PRODUCTION_ENV_GUIDE.md)
- [Release Notes](../release/RELEASE_NOTES_v1.0.0.md)
- [Release Checklist Template](../.github/ISSUE_TEMPLATE/release_checklist.md)

---

**Deployment complete!** 🚀 Your NeonHub instance should now be live in production.

