# Connector SDK

The connector SDK (`@agent-infra/connector-sdk`) standardises connector registration, rate limiting, logging, and execution.

## API

```ts
import { createConnector, executeConnectorAction } from "@agent-infra/connector-sdk";

type MyInput = { name: string };

createConnector({
  key: "example",
  name: "Example",
  auth: { kind: "none" },
  actions: {
    greet: {
      schema: z.object({ name: z.string() }),
      async handler(ctx, input: MyInput) {
        ctx.logger("example_greet", { name: input.name });
        return { message: `Hello ${input.name}` };
      }
    }
  }
});
```

Key concepts:

- **Connector registry** — single in-memory catalog ensuring unique connector keys. Used by worker to look up handlers.
- **Action schema** — Zod schema guarantees input validation before execution.
- **Rate limit/backoff** — optional `rateLimit` metadata drives `p-retry` exponential backoff on transient failures.
- **Logging** — connector contexts expose a structured logger; sensitive values are redacted with `redactSecrets`.

Built-in connectors:

- `http.get` — generic HTTP action supporting method, headers, query/body serialization.
- `slack.postMessage` — webhook-based Slack posting (compatible with tests + smoke flows).

## Execution Path

1. Worker calls `executeConnectorAction(connectorKey, actionKey, ctx, payload)`.
2. Payload is parsed with the action schema; validation errors surface as orchestration failures.
3. Handler executes and returns typed data; the worker stores the request/response in `ToolExecution` rows for observability.
