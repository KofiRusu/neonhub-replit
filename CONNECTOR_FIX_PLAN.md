# Connector Remediation Plan

1. **Align metadata with Prisma enum**
   - Update all connector metadata to use `ConnectorKind` values (`EMAIL`, `SLACK`, etc.) and extend enum for existing SaaS connectors (Notion, Trello, Asana, HubSpot, GoogleSheets).
   - Adjust `apps/api/src/services/connector.service.ts` to map human-friendly categories to enum values safely.

2. **Provide mock-first implementations**
   - Introduce `USE_MOCK_CONNECTORS` flag (default `true` in CI) to route through `apps/api/src/connectors/mocks/*`.
   - Add mocks for Stripe, Discord, Twitter, and any newly created connectors; ensure tests cover deterministic flows.

3. **Close enum coverage gaps**
   - Implement service classes for SMS/WhatsApp (Twilio mock), Reddit, Instagram, Facebook, YouTube, TikTok, Google Ads, Shopify, LinkedIn, or remove them from the enum until ready.
   - Seed `connector` table entries with `{ mode: "mock" }` defaults to avoid live calls.

4. **Credential management**
   - Document required secrets in `ENV_TEMPLATE.example` (`SLACK_CLIENT_ID`, `TWILIO_ACCOUNT_SID`, etc.) and integrate with GitHub Actions using secret names already referenced (e.g., `DATABASE_URL`).

5. **Testing & CI**
   - Expand `apps/api/src/connectors/__tests__` to cover each connector in mock mode.
   - Ensure `pnpm --filter apps/api test:coverage` stubs fetch/HTTP requests to avoid hitting real APIs.
