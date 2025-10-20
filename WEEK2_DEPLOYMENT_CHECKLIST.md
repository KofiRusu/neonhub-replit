# Week 2 Deployment Checklist — NeonHub v3.2.0

## Pre-Deployment

- [ ] Review [`reports/WEEK2_COMPLETION_SUMMARY.md`](reports/WEEK2_COMPLETION_SUMMARY.md)
- [ ] Review [`release/RELEASE_NOTES_v3.2.0.md`](release/RELEASE_NOTES_v3.2.0.md)
- [ ] Confirm all team members reviewed changes

## Environment Setup

- [ ] Generate ENCRYPTION_KEY: `openssl rand -hex 32`
- [ ] Set all environment variables from `.env.example`
- [ ] Configure Stripe test/prod products and prices
- [ ] Set up OAuth apps (GitHub, Google)
- [ ] Configure NEXTAUTH_SECRET (min 32 chars)

## Database

- [ ] Backup existing database
- [ ] Run: `cd apps/api && npx prisma migrate deploy`
- [ ] Verify all 7 new models created
- [ ] Check data integrity

## Application

- [ ] Deploy API: Follow [`docs/RUNBOOK.md`](docs/RUNBOOK.md)
- [ ] Deploy Web: Vercel or Railway
- [ ] Verify health endpoint: `GET /health`
- [ ] Test authentication flow
- [ ] Test campaign creation
- [ ] Test billing checkout (Stripe test mode)

## Testing

- [ ] Run smoke tests: `pnpm exec smoke-test-production.sh`
- [ ] Verify protected routes return 401 without auth
- [ ] Test Stripe webhook with Stripe CLI
- [ ] Create test campaign end-to-end
- [ ] Verify WebSocket real-time updates

## Monitoring

- [ ] Configure Sentry (if using)
- [ ] Set up uptime monitoring
- [ ] Configure alerting for failed health checks
- [ ] Monitor webhook delivery in Stripe dashboard

## Post-Deployment

- [ ] Tag commit: `git tag v3.2.0`
- [ ] Push tag: `git push origin v3.2.0`
- [ ] Notify stakeholders
- [ ] Update status page
- [ ] Schedule Week 3 planning

## Rollback Plan

If issues arise:
1. Check [`docs/RUNBOOK.md`](docs/RUNBOOK.md) § Rollback Procedures
2. Revert to previous git tag
3. Restore database backup
4. Redeploy previous version