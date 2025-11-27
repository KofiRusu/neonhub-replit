# Webhook Guide
Signature verify → dedupe → enqueue/process → mark processed.
Stripe: `Stripe-Signature` HMAC; Plaid: RSA (mock in air-gap).
Replay protection: store event id in WebhookEvent; reject duplicates.
Local mock test: POST /api/webhooks/stripe with header X-Mock-Event: payment_intent.succeeded.
