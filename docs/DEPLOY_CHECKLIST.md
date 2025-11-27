# Deploy Checklist
- Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PLAID_CLIENT_ID/SECRET, SUMSUB_APP_TOKEN/SECRET, REDIS_URL, INTERNAL_SIGNING_SECRET
- DB: prisma migrate deploy; pgvector enabled; backups.
- Webhooks: Configure provider endpoints with secrets and test signed payloads.
- Monitoring: /api/metrics scraped by Prometheus; alerting (Sentry/Slack) optional.
