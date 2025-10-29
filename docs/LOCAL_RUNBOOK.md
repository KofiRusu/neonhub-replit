## NeonHub Local Runbook (Offline Mode)

This guide keeps the NeonHub workspace fully offline-friendly. The included `pnpm` shim in the repository handles the limited commands required for local validation.

### Prerequisites
- Node.js 20+ (ships with `corepack`, but we rely on the repo-provided shim).
- Bash-compatible shell.

Add the repository root to your `PATH` for the current session so that the shim is discovered:

```bash
export PATH="$PWD:$PATH"
```

### Install Dependencies
The workspace bundles a deterministic `node_modules` directory. If you need to reinstall, run:

```bash
pnpm install --frozen-lockfile  # uses shim; safe offline
```

> The shim warns when a real registry sync is needed; follow the message if you reconnect to the network.

### Build
```bash
pnpm -r run build
```

### Type Check
```bash
pnpm -r run typecheck
```

### Lint
```bash
pnpm -r run lint
```

### Test
```bash
pnpm -r run test
```

### Aggregate Verification
```bash
pnpm run verify
```

### Start Servers
- API only: `pnpm --filter apps/api run dev`
- Web only: `pnpm --filter apps/web run dev`
- Full stack: `pnpm run dev`

### Repository Map
Generate an up-to-date tree and descriptions:

```bash
pnpm run map
```

### Common Issues
- **`pnpm: command not found`** – ensure `export PATH="$PWD:$PATH"` (the shim lives at `./pnpm`).
- **Permission errors** – run commands from inside the repository root to leverage the bundled tooling.
- **Stale build artifacts** – use `pnpm run clean:apply` for a safe cleanup pass.

Keep logs and reports under `logs/` and `docs/` respectively to stay audit-friendly.
