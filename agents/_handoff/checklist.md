# Dual-Agent Checklist

- [x] Mocks enabled by flag and used in CI (`USE_MOCK_CONNECTORS=true`).
- [x] `/metrics` returns required series (`agent_runs_total`, `agent_run_duration_seconds`, `api_request_duration_seconds`, `circuit_breaker_failures_total`).
- [ ] Coverage ≥70 % backend (run `pnpm -w test -- --runInBand --coverage` and capture report).
- [ ] `executeAgentRun` signature frozen & used in at least one agent path (Cursor to confirm once orchestration wiring lands).
- [ ] One UI happy path calls live API + persists to DB (Cursor task).
- [x] New CI workflow (`CI P0 Hardening`) created; set the check to **required** once merged.
- [ ] Week-1 completion audit appended.
