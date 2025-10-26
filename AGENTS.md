# Repository Guidelines

## Project Structure & Module Organization
NeonHub is a pnpm workspace monorepo. `apps/api` hosts the Express + Prisma backend (`src/services`, `src/ws`, `src/agents`, tests in `src/__tests__`). `apps/web` is a Next.js App Router app with UI in `src/components` and assets in `public`. Shared AI and compliance packages sit under `core/*`; bundled artifacts such as the predictive engine live in `modules/`. Automation scripts are kept in `scripts/`, environment templates ship as `ENV_TEMPLATE.example`, and cross-suite helpers live in `tests/setup/env.ts`.

## Build, Test, and Development Commands
Install dependencies with `pnpm install --frozen-lockfile`. `pnpm dev` runs API and web together; use `pnpm start:api` or `pnpm start:web` for isolated targets. `pnpm build` performs Prisma generation before compiling all workspaces, and `pnpm db:migrate` pushes schema updates. CI parity checks: `pnpm test:all`, `pnpm --filter apps/api test:coverage`, and `pnpm --filter apps/web test:e2e`.

## Coding Style & Naming Conventions
Prettier enforces 2-space indents, 100-character lines, semicolons, and double quotes (`.prettierrc`). Linting flows through `@typescript-eslint`; resolve warnings with `pnpm lint -- --fix` before you stage changes. Favor kebab-case filenames for backend modules, PascalCase for React components, and `useFoo.ts` for hooks. Keep environment constants in SCREAMING_SNAKE_CASE and reuse definitions from `apps/api/src/types` or `apps/web/src/types` rather than duplicating them.

## Testing Guidelines
Jest drives backend tests with 95% global thresholds (see `apps/api/jest.config.js`); add specs in `apps/api/src/__tests__` or colocate `*.spec.ts` files and run `pnpm --filter apps/api test:coverage` before PRs. Seed fixtures extend `apps/api/prisma/seed.ts`. Frontend regression lives in `apps/web/tests/e2e` with Playwright—run `pnpm --filter apps/web test:e2e` and keep selectors resilient. Shared env bootstrap code is in `tests/setup/env.ts`.

## Commit & Pull Request Guidelines
History follows Conventional Commits (`type(scope): summary`), so keep summaries under 72 characters and scope changes when helpful (e.g., `feat(api-routing):`). Bundle related work into focused commits. Before pushing, run `pnpm lint`, `pnpm type-check`, and the applicable test suite. PRs should link issues, flag schema or env changes, include screenshots or cURL snippets for UI/API updates, and request CODEOWNER review once CI passes.

## Security & Configuration Notes
Never commit secrets; copy the relevant `ENV_TEMPLATE.example` (plus `apps/web/ENV_TEMPLATE.md` checklist) into local `.env` files. Sentry and external webhooks are active in production, so redact sensitive logs. Run `pnpm validate:api` whenever schemas shift, and lean on the Dockerfiles in `apps/api` and `apps/web` for reproducible builds.
