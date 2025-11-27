# Ops: Health & Toggles
- Health: GET `/api/health` → `{ ok:true, ts, mocks, fintech_enabled }`
- Toggle mocks:
  - `node scripts/toggle-mocks.mjs on`  → `USE_MOCK_ADAPTERS=true`
  - `node scripts/toggle-mocks.mjs off` → `USE_MOCK_ADAPTERS=false` (only after preflight passes)
- Internal callbacks must be signed: see `/api/internal/settlement` wrapper.
- Idempotency for writes: see `/api/ops/create-draft` wrapper example.
