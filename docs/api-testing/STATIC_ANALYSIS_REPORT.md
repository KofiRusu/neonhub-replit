# Static Analysis Report – 2025-11-22

| Command | Status | Notes |
| --- | --- | --- |
| `pnpm lint` | ✅ Pass (warnings only) | ESLint completed for backend/ui/sdk packages. Numerous `@typescript-eslint/no-explicit-any` warnings remain in legacy agents, but no blocking errors. |
| `pnpm typecheck` | ❌ Failed | `apps/api` ContentAgent tests and `apps/web` SEO page produce TS2345/TS2322 errors (see CLI output). Cannot proceed without refactors; documented for follow-up. |
| `pnpm prettier --check .` | ❌ Failed | Repository contains thousands of Markdown/YAML/JSON files outside formatting guidelines; Prettier reported “Error occurred when checking code style in 3 files” plus warnings for many tracked assets. |

## Details
- **TypeScript errors**:
  - `apps/api/src/__tests__/agents/ContentAgent.spec.ts`: invalid fixture types.
  - `apps/web/src/app/seo/page.tsx`: `PageLayout` props missing `description` field.
- **Prettier**: Failing files include `.corepack` artifacts and numerous docs/workflow files. Lint/format cleanup deferred per instructions (no broad rewrites).

## Next Actions
1. Address the noted TypeScript errors in ContentAgent spec + SEO page when feasible.
2. Establish a narrower Prettier scope or incremental cleanup to avoid repo-wide failures. |
