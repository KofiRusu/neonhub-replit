# NeonHub Development Guide

## Prerequisites
- Node.js ≥ 20.0.0, npm ≥ 10.0.0
- PostgreSQL instance for Prisma (`DATABASE_URL`)
- Redis instance for production rate limiting (`RATE_LIMIT_REDIS_URL`)

## Install Dependencies
```bash
# From repository root
npm ci

# Generate Prisma clients for the API
npm run prisma:generate
```

## Local Development
### API (`apps/api`)
```bash
cd apps/api
npm run dev
```

Environment template: `apps/api/ENV_TEMPLATE.example`

Important env vars:
- `DATABASE_URL` – Postgres connection string
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL` – session signing + origin
- `CORS_ORIGINS` – comma-separated origins, wildcard (`https://*.example.com`) and `regex:` patterns supported
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `OPENAI_API_KEY`

### Web (`apps/web`)
```bash
cd apps/web
npm run dev
```

Environment template: `apps/web/ENV_TEMPLATE.example`

- Ensure `NEXT_PUBLIC_API_URL` points at the running API (`http://127.0.0.1:3001` by default).
- Front-end currently contains mock data; replace with authenticated fetch calls before release.

## Testing & Quality
```bash
# TypeScript checks
npm run typecheck --workspace apps/api
npm run typecheck --workspace apps/web

# ESLint (API)
npm run lint --workspace apps/api

# Jest (API)
npm run test --workspace apps/api

# Playwright (UI) – pending TypeScript fixes
npm run test:e2e --workspace apps/web -- --workers=1 --reporter=list
```

## CORS Configuration
- `CORS_ORIGINS` is validated at startup (`apps/api/src/config/env.ts`).
- Supports:
  - Comma-separated origins: `https://app.example.com,https://admin.example.com`
  - Wildcards: `https://*.example.com`
  - Regex: `regex:^https://(dev|staging)\\.example\\.com$`
- Requests from non-matching origins receive `403` (preflight returns `403` as well).

## Stripe Webhook
- Endpoint: `POST /api/billing/webhook`
- Requires raw body; do **not** proxy through middleware that parses JSON.
- Configure Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:3001/api/billing/webhook
  ```

## Cookies & Sessions
- `cookie-parser` is registered before auth middleware; make sure session cookies are forwarded when calling the API.
- For local testing with NextAuth web app, run both API and UI on `127.0.0.1` to keep cookie domains aligned.

## Rate Limiting
- Production requires `RATE_LIMIT_REDIS_URL`; the API will return `503` if Redis is unavailable.
- Dev/test fall back to in-memory limiter with a warning.

## Middleware Benchmark
- Script: `node scripts/benchmark-middleware.js`
- Default target: `http://localhost:4000/api/health`; update `TARGET_URL` if using a different host/port.
- Goal: average latency < 5 ms.
