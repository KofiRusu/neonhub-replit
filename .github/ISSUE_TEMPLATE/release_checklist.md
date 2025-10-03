---
name: Release Checklist
about: Steps to verify before/after a release
title: "Release vX.Y.Z Checklist"
labels: release
assignees: ""
---

## Pre-Release

- [ ] CI green on main
- [ ] `./scripts/preflight.sh` passes locally
- [ ] Vercel environment variables set:
  - [ ] `NEXT_PUBLIC_API_URL`
  - [ ] `NEXTAUTH_URL`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `SENTRY_DSN` (optional)
- [ ] Backend environment variables set:
  - [ ] `DATABASE_URL`
  - [ ] `CORS_ORIGIN`
  - [ ] `OPENAI_API_KEY`
  - [ ] `JWT_SECRET`
- [ ] DNS verified:
  - [ ] Apex domain → Vercel
  - [ ] `api.` subdomain → Backend

## Deploy

- [ ] Backend deployed
- [ ] Database migrations run: `pnpm -C backend prisma migrate deploy`
- [ ] UI deployed (Vercel)
- [ ] Deployment successful (no errors in logs)

## Post-Release Smoke Tests

### Backend API
- [ ] API `/health` endpoint returns 200
- [ ] Metrics summary endpoint returns non-empty data
- [ ] Error responses are JSON formatted
- [ ] CORS headers present

### Frontend UI
- [ ] Home page loads (`/`)
- [ ] Dashboard loads (`/dashboard`)
- [ ] Analytics page loads (`/analytics`)
- [ ] Trends page loads (`/trends`)
- [ ] Team page loads (`/team`)
- [ ] Authentication flow works

### Features
- [ ] Team invite works (email or preview)
- [ ] Billing integration working (Stripe test mode)
- [ ] Brand voice copilot responds
- [ ] Content generation works
- [ ] Real-time updates functional (if applicable)

### Monitoring
- [ ] Sentry (optional) shows no critical errors
- [ ] Vercel Analytics tracking (optional)
- [ ] Backend logs accessible
- [ ] No 500 errors in production logs

## Post-Release Documentation

- [ ] Release notes updated in `/release/RELEASE_NOTES_vX.Y.Z.md`
- [ ] CHANGELOG.md updated
- [ ] Version bumped in relevant `package.json` files
- [ ] Git tag created: `git tag vX.Y.Z && git push origin vX.Y.Z`

## Rollback Plan (if needed)

- [ ] Previous version deployment URL saved
- [ ] Database migration rollback plan documented
- [ ] Team notified of rollback procedure

---

**Additional Notes:**

(Add any release-specific notes here)

