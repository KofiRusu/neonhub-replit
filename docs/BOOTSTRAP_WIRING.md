# Server Bootstrap Wiring

## Custom Node/Express server
Invoke the guard before registering routes:

```ts
import express from 'express'
import { runBootstrapGuards } from '@/server/bootstrap'

runBootstrapGuards()
const app = express()

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeHandler
)
```

## Next.js (Pages API)
The wrapper in `apps/api/src/pages/api/webhooks/stripe.ts` already calls `readRawBody` and delegates to the shared handler. Make sure you import and run `runBootstrapGuards()` inside your custom `next.config.js` server entry (if you have one) or in the bootstrap of the API server you host Next.js with.

```ts
// e.g. packages/next-server/index.ts
import next from 'next'
import { runBootstrapGuards } from '@/server/bootstrap'

runBootstrapGuards()
const app = next({ dev: process.env.NODE_ENV !== 'production' })
```

## TRPC / API Routers
When constructing your tRPC context or Express router, call `runBootstrapGuards()` once at startup. Combine with the middleware in `apps/api/src/trpc/middleware/safety.ts` to enforce idempotency and internal signatures for production callbacks.
