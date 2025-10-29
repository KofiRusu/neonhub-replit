# Agent Infrastructure Overview

This document captures the Phase 1–3 scope delivered in the fresh agent-infra workspace. The system is split into three services/packages:

- **@agent-infra/api** — Express + Prisma service exposing `/orchestrate`, `/runs/:id`, `/metrics`, and orchestrator persistence with BullMQ step dispatch.
- **@agent-infra/worker** — BullMQ worker pulling `steps.ready`, executing connector actions, fanning out DAG nodes, and publishing Prometheus metrics.
- **@agent-infra/connector-sdk** — Shared connector registry with built-in HTTP + Slack connectors, retry/backoff helpers, and log redaction utilities.

Supporting packages include `@agent-infra/job-types` (StepJob payload contract) and `@agent-infra/workflow-dag` (DAG validation/graph helpers).

## Data Model

Prisma schema defines workspace-scoped automation artefacts:

- `Workspace`, `Workflow`, `WorkflowVersion` — workflow authoring and versioning.
- `AgentRun`, `RunStep`, `ToolExecution`, `AgentRunMetric` — persisted orchestration state + telemetry.
- `Credential`, `Connector`, `AuditLog`, `WebhookEvent`, `IdempotencyKey` — connector registry, secure secrets, auditability, and idempotency.

## Runtime Flow

1. `POST /orchestrate` validates the workflow DAG, checks idempotency, creates an `AgentRun`, seeds `RunStep` records for root nodes, and enqueues `StepJob`s onto `steps.ready`.
2. Worker processes each `StepJob`, updates step/run status, executes connector actions via the SDK, records `ToolExecution` rows, and enqueues any unblocked successors. Failed steps are pushed to `steps.dlq` with run + step metadata persisted for replay.
3. Prometheus metrics are emitted by both services; `/metrics` endpoints expose counters and default runtime stats for scraping.

## Local Development

```bash
docker compose up -d              # postgres + redis
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
pnpm install
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev:all                      # starts API + worker with live reload
```

Seed data provisions a `neonhub-default` workspace with an “HTTP to Slack” workflow demonstrating the HTTP→Slack path.
