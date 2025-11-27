# Backend Testing Guide

This document describes how to run the API test suite, extend the deterministic mocks, and add coverage for new modules.

## Running the suite locally

```bash
pnpm --filter @neonhub/backend-v3.2 exec jest --runInBand --coverage \
  --detectOpenHandles
```

Key environment defaults (applied in `src/__tests__/setup.ts`):

- `NODE_ENV=test`
- `USE_MOCK_CONNECTORS=true`
- `PORT=4100`
- In-memory Prisma mock (`apps/api/src/__mocks__/prisma.ts`) to avoid touching a real database.

To reproduce CI behavior, mirror the job settings:

```bash
USE_MOCK_CONNECTORS=true NODE_OPTIONS="--max-old-space-size=4096" \
  pnpm -w test -- --runInBand --coverage
```

## Deterministic mocks

| Module | Location | Notes |
| --- | --- | --- |
| Prisma | `apps/api/src/__mocks__/prisma.ts` | In-memory tables for agents, runs, tool executions, drafts, etc. Extend the map definitions when new models appear. |
| Puppeteer | `apps/api/src/__mocks__/puppeteer.ts` | Prevents Chromium downloads. Returns a stub browser with no-op `goto`, `content`, and `screenshot`. |
| TensorFlow | `apps/api/src/__mocks__/@tensorflow/tfjs*.ts` | Lightweight tensor mocks to keep memory usage <50 MB. |
| Connectors | `apps/api/src/connectors/mock` | Action-level adapters that return deterministic responses for Gmail, Slack, Twilio, Stripe, GA4, GSC, social networks, etc. |

All Jest tests automatically pick up these mocks thanks to `setupFiles` / `setupFilesAfterEnv` in `apps/api/jest.config.js`.

## Adding new tests

1. **Prefer unit-level coverage.** Place new specs under `apps/api/src/__tests__` or co-locate as `*.test.ts` near the module.
2. **Reuse shared helpers.** Import the Prisma mock via `import { mockPrismaClient } from "../__mocks__/prisma.js"` when you need to assert database writes.
3. **Agents and orchestrators.** Use `executeAgentRun` helpers and spy on `startRun`/`finishRun` as shown in `execute-agent-run.test.ts`.
4. **Connectors.** Instantiate adapters from `apps/api/src/connectors/mock` to validate payloads without touching external services.
5. **Routes.** Build an Express app with `express.json()` and mount the router under test; mock `getAuthenticatedUserId` and Prisma accessors to keep tests fast (`routes/__tests__/content.routes.test.ts`).

### Coverage thresholds

The API Jest config enforces 70 % global coverage. If you extend the surface area, add targeted specs instead of broad integration tests to keep execution time short.

### Memory guardrails

Long-running suites must respect the 4 GB heap cap used in CI (`NODE_OPTIONS=--max-old-space-size=4096`). When introducing libraries that allocate large buffers, add manual mocks to `src/__mocks__` and document their behavior here.
