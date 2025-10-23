# WEEK 1 VERIFICATION — NeonUI-3.4

**Date (UTC):** $(date -u +%Y-%m-%dT%H:%M:%SZ)

## Tooling
- Node: v20.17.0
- npm: 10.8.3

## Checks
- Lockfile: `package-lock.json` present, no Yarn/PNPM lockfiles detected.
- Turbopack root configured in `next.config.ts` via `turbopack.root = path.resolve(__dirname)` to silence multi-lockfile warning.
- Tailwind config uses ESM import for `tailwindcss-animate`, `darkMode: "class"`, and `content` globs include `./src/**/*.{ts,tsx}` and `./components/**/*.{ts,tsx}`.
- `src/app/globals.css` imports Tailwind v4 directives with `@import "tailwindcss";` and plugin directives.
- shadcn components installed (10 files):
  - badge.tsx
  - button.tsx
  - card.tsx
  - dialog.tsx
  - dropdown-menu.tsx
  - input.tsx
  - sheet.tsx
  - sonner.tsx
  - tabs.tsx
  - textarea.tsx
- README-dev.md includes "Week 1 Verification" section and documents Sonner fallback for missing v0 toast block.

## Commands
- `npm run lint` → ✅ (ESLint passes)
- `npm run build` → ✅ (Next.js 15.5.6 Turbopack build succeeds)
- Dev server command: `npm run dev -- --hostname 0.0.0.0 --port 3000`

## CI
- Latest workflow run: [success](https://github.com/KofiRusu/NeonUI-3.4/actions/runs/18667477189)

## Notes
- Attempting `npx shadcn@latest add "https://v0.app/chat/b/b_HYYmWvfTYYg" --overwrite` still fails because the registry item `styles/new-york-v4/toast.json` is missing. Continue using Sonner for toast notifications until the shadcn registry publishes the block.

✅ Week 1 baseline remains in a reproducible, lint/build clean state.
