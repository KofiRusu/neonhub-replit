# KT_CONNECTOR_SUMMARY

## Factory & Toggle
- Source: `apps/api/src/connectors/factory.ts`
  - `ConnectorFactory.create(type, credentials?)` switches between mock + real providers and now wraps every method in a telemetry proxy that calls `recordToolExecution()` using the ambient AgentRun context.
  - Toggle logic: `process.env.USE_MOCK_CONNECTORS === "true" || env.NODE_ENV === "test"` (we set this in all tests + CI to avoid live calls).
  - Logging clearly indicates mode (`🎭 Connector mock mode ENABLED...`).
  - Real connectors are stubs (throw errors) until production secrets are injected.
- Additional helper: `apps/api/src/connectors/mock/index.ts`
  - `useMockConnectors()` also references `env.USE_MOCK_CONNECTORS`; manifests a small type drift because env schema does not yet expose this flag (documented risk).
  - `getConnector(type, realConnectorFactory)` gracefully falls back to mocks even if real instantiation throws.
  - `validateConnectorCredentials(type, requiredEnvVars)` enforces missing secrets only when mock mode is disabled; otherwise a helpful error prompts operators to set `USE_MOCK_CONNECTORS=true`.

## Mock Provider Inventory
| Category | Mock class(es) | Notable functions |
| --- | --- | --- |
| Email | `GmailMockConnector`, `MockEmailConnector` | `send({to,subject,body})`, `getProfile()`, `listMessages`, `getMessage` return deterministic IDs/loggable payloads |
| Chat / Collaboration | `SlackMockConnector`, `MockSlackConnector`, `MockDiscordConnector` | Provide `postMessage`, `scheduleMessage`, `listChannels`, all with JSON echoes |
| SMS / Voice | `TwilioMockConnector`, `MockSMSConnector`, `MockWhatsAppConnector` | Enforce quiet hours metadata, simulate `SEND_SMS`, `SEND_TEMPLATE` actions |
| Ads & Social | `MockXConnector`, `MockInstagramConnector`, `MockFacebookConnector`, `MockTikTokConnector`, `MockYouTubeConnector`, `MockGoogleAdsConnector` | Support `PUBLISH_POST`, `CREATE_CAMPAIGN`, `ADJUST_BUDGET`, each returning canned analytics (spend, reach) for dashboards |
| Commerce / Billing | `MockShopifyConnector`, `MockStripeConnector` | Provide product sync + payment events with fake IDs |
| Analytics | `MockGA4Connector`, `MockGSCConnector` | Emit Search Console / GA4 metrics so SEO jobs can proceed offline |

Mocks emit deterministic timestamps + IDs, log via `logger.debug`, and never hit the network, satisfying the “no live secrets” constraint.

## Rate Limits, Retries, Backoff
- Orchestrator wraps handlers in `withRetry` (exponential backoff: 75ms → 150ms → 300ms) and `withCircuitBreaker` (failThreshold=3, cooldown=10s) before calling connectors.
- Additional front-door limiter: 60 requests/minute per `(agent,user)` pair inside `apps/api/src/services/orchestration/router.ts` with `recordRateLimitHit` metrics for Prometheus.
- Seeds encode connector-specific metadata (e.g., Gmail default send cap, Twilio quiet hours) that downstream policies can read when executing jobs.

## Redaction & Secrets Plan
1. **Env flag** – Always export `USE_MOCK_CONNECTORS=true` in CI/test shells. This prevents accidental credential lookups and ensures deterministic responses.
2. **Secrets mapping** – Real connectors require OAuth/API keys listed in `apps/api/ENV_STAGING_TEMPLATE.md`. Pair each key with role-specific secrets (`neonhub_app` vs `neonhub_migrate` once least-priv roles are created).
3. **Audit logging** – When real connectors arrive, persist request/response metadata to `ToolExecution` with sensitive fields masked (e.g., `input.to` hashed, `auth` removed). Current mock connectors already omit secrets; follow that pattern for production adapters.
4. **Fail-safe** – `validateConnectorCredentials()` should be called before job dispatch; if secrets are absent in production environments, short-circuit with actionable error instead of partial execution.

## Testing & Automation
- `apps/api/src/connectors/__tests__/factory.test.ts` exercises mock creation, ensuring each provider exposes expected methods.
- New orchestrator smoke (`tests/orchestrate.mock.spec.ts`) now asserts that Gmail mock calls produce `ToolExecution` rows + metrics. Queue smoke (`tests/queue.mock.spec.ts`) validates BullMQ telemetry with a virtual module.
- CI command to re-run:
  ```bash
  USE_MOCK_CONNECTORS=true pnpm --filter @neonhub/backend-v3.2 test -- tests/orchestrate.mock.spec.ts tests/queue.mock.spec.ts --runInBand --coverage=false
  ```
- Future work: add snapshot tests for `MockConnectorAdapter` definitions so any change in supported actions/triggers produces an intentional diff, and extend proxies to emit connector-specific metadata (rate limits, retries) once real adapters ship.
