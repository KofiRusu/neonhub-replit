# API Surface (tRPC & REST)

## tRPC Routers (planned/implemented)
- `agents` — list agents, details
- `agent-runs` — listRuns, getRun, listSteps, stats
- `analytics` — summary, trends, agents
- `fintech.payments` — createPaymentIntent, capturePayment, refund, listPaymentMethods, attachPaymentMethod
- `fintech.banking` — linkToken, exchangePublicToken, listAccounts, getBalances, fetchTransactions
- `fintech.exchange` — placeOrder, fetchBalance, transferInternal, getDepositAddress, getQuotes
- `fintech.kyc` — startCheck, getStatus, listChecks
- `fintech.ledger` — getAccount, listAccounts, getTxn, listTxns, snapshotsForAccount
- `fintech.risk` — scorePayment, velocityForKey, rules

## REST Endpoints
- `/api/metrics` — Prometheus exposition (text/plain)
- `/api/webhooks/stripe` — Stripe events (HMAC verify; mock accepted)
- `/api/webhooks/plaid` — Plaid events (mock accepted)
- `/api/webhooks/exchange/:provider` — Exchange/webhook bridge (mock accepted)
- `/api/webhooks/sumsub` — KYC events (mock accepted)
- `/api/dev/trigger-run` — **DEV ONLY** dummy AgentRun trigger (guarded by `DEV_TOOLS=true`)
