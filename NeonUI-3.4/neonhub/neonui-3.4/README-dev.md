# NeonUI 3.4 — Development Guide

This is the Next.js 15.5.6 app for NeonUI with shadcn/ui components and Tailwind CSS v4.

## Quick Start

### 1. Install Dependencies

```bash
npm ci
```

### 2. Run Development Server (Codespaces)

For GitHub Codespaces, bind to `0.0.0.0` so the forwarded port works:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

**Codespaces Port Forwarding:**
1. Open the **Ports** panel (View → Ports or `Ctrl+Shift+P` → "Forward a Port")
2. Port `3000` should auto-forward; ensure it's set to **Public** visibility
3. Click the globe icon to open the forwarded URL: `https://3000-<workspace>.github.dev/`

**Fallback Port:**  
If port 3000 is busy, use:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3001
```

Then expose port 3001 in the Ports panel.

### 3. Build for Production

```bash
npm run build
```

### 4. Lint

```bash
npm run lint
```

## shadcn/ui Components

This project uses [shadcn/ui](https://ui.shadcn.com/) components with the **new-york** style.

### Installed Components

All core components are in `src/components/ui/`:

- `button.tsx`
- `card.tsx`
- `input.tsx`
- `textarea.tsx`
- `badge.tsx`
- `tabs.tsx`
- `dropdown-menu.tsx`
- `dialog.tsx`
- `sheet.tsx`
- `sonner.tsx` (toast notifications)

### Adding New Components

```bash
npx shadcn@latest add <component-name>
```

Example:

```bash
npx shadcn@latest add alert select switch
```

Browse available components: https://ui.shadcn.com/docs/components

## Configuration Files

### `components.json`

shadcn configuration:
- **Style:** `new-york`
- **Registry:** `https://ui.shadcn.com`
- **Tailwind CSS:** `src/app/globals.css`
- **Component directory:** `src/components/ui`

### `tailwind.config.ts`

Tailwind v4 configuration with:
- Dark mode: `class` strategy
- Content paths: `./src/**/*.{ts,tsx}`, `./components/**/*.{ts,tsx}`
- Plugin: `tailwindcss-animate`

Uses ES6 imports (no `require()`) for ESLint compliance.

### `src/app/globals.css`

Tailwind v4 uses new `@import` syntax:

```css
@import "tailwindcss";
@plugin "tailwindcss-animate";
```

## v0 Block Import (Known Issue)

**Status:** ⚠️ Currently blocked by upstream registry issue.

Attempting to import the v0 block from `https://v0.app/chat/b/b_HYYmWvfTYYg` fails with:

```
Message:
The item at https://ui.shadcn.com/r/styles/new-york-v4/toast.json was not found.
```

**Workaround:**  
All core shadcn components are installed. For toasts, use the **Sonner** component (`sonner.tsx`) which is a modern, accessible toast library that works seamlessly with shadcn.

**Manual Fallback:**  
If you have the v0 block code, manually add it to `src/components/` and update imports.

## CI/CD

GitHub Actions CI runs on every push and PR to `main`:

1. `npm ci` — Install dependencies
2. `npm run lint` — ESLint check
3. `npm run build` — Production build

See `.github/workflows/ci.yml` for workflow details.

Latest passing run: [#18657126172](https://github.com/KofiRusu/NeonUI-3.4/actions/runs/18657126172)

## Tech Stack

- **Framework:** Next.js 15.5.6 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Library:** shadcn/ui (new-york style)
- **Icons:** Lucide React
- **Animations:** tailwindcss-animate

## Troubleshooting

### Port Already in Use

If port 3000 is busy:

```bash
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
# OR use an alternative port:
npm run dev -- --hostname 0.0.0.0 --port 3001
```

### Path Alias Errors

Ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Tailwind Not Working

Verify `src/app/globals.css` contains:

```css
@import "tailwindcss";
@plugin "tailwindcss-animate";
```

And `tailwind.config.ts` exists with correct `content` paths.

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)

---

**Project:** NeonUI-3.4  
**Issue Tracker:** [GitHub Issues](https://github.com/KofiRusu/NeonUI-3.4/issues)  
**CI Status:** [![NeonUI CI](https://github.com/KofiRusu/NeonUI-3.4/actions/workflows/ci.yml/badge.svg)](https://github.com/KofiRusu/NeonUI-3.4/actions/workflows/ci.yml)

## Week 1 Verification

- Verified on 2025-10-20: npm ci, npm run lint, npm run build
- Dev server: npm run dev -- --hostname 0.0.0.0 --port 3000 (local/0.0.0.0)
- v0 fallback: shadcn registry still missing new-york-v4/toast.json; continue using Sonner components
