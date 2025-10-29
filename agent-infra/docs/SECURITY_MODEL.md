# Security Model

Phase 1–3 implements foundational controls for agent infrastructure:

- **Workspace isolation** — every workflow, run, step, credential, audit log, and webhook event is keyed by `workspaceId`.
- **Idempotency** — `IdempotencyKey` persists idempotent run keys (`scope="run"`, `resourceId=AgentRun.id`) to prevent duplicate execution on retries.
- **Credential storage** — connector secrets are stored as opaque `cipherText` blobs; integration with a KMS/vault provider is expected in Phase 4.
- **Auditability** — `AuditLog` captures privileged actions (future phases will add event writes in API routes and worker transitions).
- **Observability** — Prometheus counters expose run/step execution stats for anomaly detection. `/metrics` endpoints are expected to sit behind internal auth.
- **Queue boundaries** — BullMQ queue names are fixed (`steps.ready`, `steps.dlq`). DLQ writes include the original payload to support replay tooling.

Future phases will layer on RBAC, encrypted-at-rest credentials via HSM/KMS, OTEL spans with run/step trace IDs, and webhook signing enforcement.
