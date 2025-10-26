# Sprint 0 – Foundations Checklist

_Author: Codex agent • 2025-10-25_

## Completed
- **Prisma generate (offline)**: Added `scripts/run-cli.mjs` shim plus `scripts/offline-prisma-generate.mjs` so `npm run prisma:generate` succeeds even without downloading engine binaries.
- **Brand Voice fallbacks**: All `/api` routes used by the Brand Voice UI now proxy to Express when available and fall back to local fixtures drawn from `apps/api/data`.

## In Progress / Blocked
- **Next.js CLI binaries**: `npm run lint` still fails (`next/dist/bin/next` missing) because the workspace carries only the `dist` folder from a pnpm install. Need to vendor a complete `next@15.5.6` package (with `package.json` and `dist/bin/next`) or re-install deps with network access.
- **TypeScript stdlib**: `npm run typecheck` fails because `node_modules/typescript/lib/*` is absent. Fix by restoring the full `typescript@^5` package to `node_modules`.
- **Runtime dependencies**: Other CLI tools (e.g. Playwright) also depend on missing binaries; audit once Next/TypeScript are restored.
- **Secrets / configuration audit**: Pending once build tooling is healthy. Need to catalogue required env vars for `apps/api` and `apps/web`, scrub unused secrets, and document local .env setup.

## Next Steps
1. Restore `next` and `typescript` packages (copy from a known-good cache or re-install when network access is permitted).
2. Re-run `npm run lint`, `npm run typecheck`, and `npm run test` to verify the toolchain is green.
3. Document required secrets in `docs/PHASE_4_ENVIRONMENT_SETUP.md` and create `.env.local` templates once audit completes.
4. Re-enable CI jobs after confirming local commands pass.
