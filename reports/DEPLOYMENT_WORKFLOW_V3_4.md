# NeonHub Deployment Workflow (v3.4)

## 1. Build All Workspaces
```bash
npm run build --workspace apps/api
npm run build --workspace apps/web
```
- Ensure `npm run prisma:generate` executes automatically for `apps/api`.

## 2. Database Prep
```bash
cd apps/api
export DATABASE_URL="postgresql://<user>:<pass>@<host>:5432/<db>"
npm run prisma:migrate:deploy
```
- Confirm Prisma client (`node_modules/.prisma`) is present after migration.

## 3. Configure Environment Variables
Set in hosting platform or Docker secrets:
- `NODE_ENV=production`
- `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `CORS_ORIGINS` (comma list, wildcard or regex allowed)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `OPENAI_API_KEY`
- `RATE_LIMIT_REDIS_URL` (production only)
- UI-specific: `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`

## 4. Start Services
### Docker Compose (example)
```bash
docker compose up --build -d
```
### Manual
```bash
# API
cd apps/api
NODE_ENV=production npm run start

# UI
cd apps/web
NODE_ENV=production npm run start
```
- Ensure both services listen on TLS-terminated endpoints or sit behind a reverse proxy (NGINX/Envoy).

## 5. Health & Smoke Tests
- API: `curl -i https://<api>/api/health`
- Run backend Jest suite in CI (`npm run test --workspace apps/api`).
- Once UI is wired to live data, execute Playwright smoke: `npm run test:e2e -- --workers=1 --reporter=list`.

## 6. Stripe Webhook Registration
```bash
stripe webhook endpoints create \
  --url https://<api>/api/billing/webhook \
  --enabled-events checkout.session.completed customer.subscription.updated customer.subscription.deleted invoice.paid invoice.payment_failed
```
- Confirm raw-body passthrough via Stripe CLI (`stripe listen --forward-to ...`).

## 7. Release Management
1. Tag staging release once tests are green (`git tag v3.4.0-rc.X`).
2. Deploy to staging, monitor rate-limiter logs and Stripe webhook responses.
3. Promote to production after 24h soak test; update tag to final (`git tag v3.4.0`).
4. Publish release notes and attach performance benchmark (<5 ms middleware average).
