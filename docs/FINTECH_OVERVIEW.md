# Fintech Overview (Mocks-First)
Providers (with mock fallbacks): Stripe (payments), Plaid (banking), CCXT (exchange), Sumsub (KYC).
Routers: fintech.payments/banking/exchange/kyc/ledger/risk.
Webhooks: /api/webhooks/{stripe,plaid,exchange,sumsub} with HMAC verify + dedupe (WebhookEvent.dedupeKey).
Middleware: idempotency, rate-limit, request-signing.
Ledger: Transaction + LedgerEntry double-entry invariants; BalanceSnapshot.
Feature flags: FINTECH_ENABLED, USE_MOCK_ADAPTERS, RISK_STRICT_MODE.
