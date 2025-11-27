## NeonHub Dev Workflow Guide (Guardian)

### Onboarding Quickstart
- Clone the repo and run `corepack enable && corepack prepare pnpm@9 --activate` to ensure the correct package manager version.
- Copy `ENV_TEMPLATE.example` plus app-specific templates (e.g., `apps/web/ENV_TEMPLATE.md`) into `.env` files before installing dependencies.
- Run `pnpm install --frozen-lockfile` once; all workspace scripts rely on generated Prisma + SDK artifacts that this step produces.
- Use `pnpm dev` for a combined API + web experience; for isolated debugging, run `pnpm start:api` or `pnpm start:web`.
- Keep an eye on `docs/CODEX_COORDINATION_LOG.md` to know which areas Codex-1 currently owns before making edits.

### Core Install & Bootstrap
- `pnpm install --frozen-lockfile` — install all workspaces with the pinned lockfile.
- `pnpm dev` — run API + web locally (Express on `3001`, Next.js on `3000`).
- Copy `.env` files from `ENV_TEMPLATE.example` plus app-specific templates before starting services.

### Global Validation Commands
- `pnpm lint` — runs ESLint across workspaces via `scripts/run-cli.mjs`.
- `pnpm typecheck` — executes `tsc --noEmit` for every workspace; expect current failures in predictive-engine stubs and orchestrator tests until the primary Codex finishes Phase 4/5.
- `pnpm --filter ./apps/api test` — executes the full Jest suite for the Express backend. (`--filter apps/api …` fails because pnpm requires a `./`-prefixed path filter.)
- `pnpm --filter @neonhub/backend-v3.2 test -- src/__tests__/config/env.test.ts src/__tests__/services/brand-voice-ingestion.spec.ts` — fast subset covering the Guardian-owned env + brand-voice services.

### Non-Agent Test Targets
- `apps/api/src/__tests__/config/env.test.ts` verifies Zod parsing and relaxed fallback behavior for `config/env.ts`, ensuring CI warnings fire exactly once and fallbacks stay deterministic in test/dev.
- `apps/api/src/__tests__/services/brand-voice-ingestion.spec.ts` exercises the brand-voice ingestion pipeline with mocked OpenAI + Prisma calls (parse fallback, embeddings, storage, search, ingest chaining).
- Keep mocks deterministic: `apps/api/src/__mocks__/prisma.ts` now avoids unused iterator vars, so Jest snapshots remain stable.

### CI & Script Alignment
- `.github/workflows/db-deploy.yml` now uses `pnpm --filter ./apps/api …` for Prisma commands so GitHub Actions stops erroring with “No projects matched the filters”.
- Scripts under `apps/api/package.json` already point at `node ../../scripts/run-cli.mjs` helpers; prefer running through those wrappers to inherit tsconfig + env defaults.
- If a workflow needs API coverage only, filter by workspace name (`@neonhub/backend-v3.2`) instead of the folder alias.

### Pre-Push Checklist
1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm --filter ./apps/api test` (or the focused suites above when coordinating with the primary Codex)
4. Update `docs/CODEX_COORDINATION_LOG.md` with any failures plus the guardian-safe remediation plan.

### How to Run Tests
- **Full API suite:** `pnpm --filter ./apps/api test` (fails today because orchestrator envelopes are changing; see `docs/AGENT_VALIDATION_CHECKLIST.md`).
- **Guardian-safe smoke:** `pnpm --filter @neonhub/backend-v3.2 test -- src/__tests__/config/env.test.ts src/__tests__/services/brand-voice-ingestion.spec.ts`.
- **Single file:** Append the relative path after `--` (e.g., `pnpm --filter @neonhub/backend-v3.2 test -- src/__tests__/metrics.test.ts`).
- **Watch mode:** `pnpm --filter @neonhub/backend-v3.2 test:watch -- src/__tests__/config/env.test.ts` for iterative work on helpers/mocks.
- Always seed Prisma via `pnpm --filter ./apps/api prisma generate` before running tests if `node_modules/.prisma` is stale.

### How to Debug
- **Env validation:** Temporarily set `NH_ENV_DEBUG=1` (see `apps/api/src/config/env.ts`) to log the fallback branch; pair with `pnpm --filter @neonhub/backend-v3.2 test -- src/__tests__/config/env.test.ts`.
- **Metrics/RAG helpers:** Use `pnpm --filter @neonhub/backend-v3.2 test -- src/__tests__/metrics.test.ts --runInBand` to inspect Prometheus snapshots without orchestrator noise.
- **CI workflow issues:** Re-run failing GitHub Actions steps locally via the commands listed in `.github/workflows/*.yml` (e.g., `pnpm --filter ./apps/api prisma validate`).
- **Logging:** Pass `LOG_LEVEL=debug` when running `pnpm dev` to watch RAG context assembly (`RagContextService.build`) without touching agent code.
- Capture all failures in `docs/CODEX_COORDINATION_LOG.md` so Codex-1 can correlate them with the ongoing Phase 4 contract work.
