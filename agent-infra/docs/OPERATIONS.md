# Operations

## Runtime Services

| Service | Command | Description |
|---------|---------|-------------|
| API     | `pnpm --filter @agent-infra/api dev` | Express orchestrator + REST surface |
| Worker  | `pnpm --filter @agent-infra/worker dev` | BullMQ consumer processing `steps.ready` |

`pnpm dev:all` uses `concurrently` to launch both.

## Observability

- **Metrics** — scrape `http://api-host:4000/metrics` and `http://worker-host:4100/metrics` (set `METRICS_ENABLED=false` to disable).
- **Counters** — `agent_runs_started_total`, `agent_runs_failed_total`, `agent_steps_enqueued_total`, `agent_steps_started_total`, `agent_steps_succeeded_total`, `agent_steps_failed_total`.
- **Dashboards** — import Prometheus queries into Grafana (Phase 4 will ship JSON dashboards under `ops/dashboards/`).

## Queue Management

- Ready queue: `steps.ready`
- Dead-letter queue: `steps.dlq`
- Replay helper (manual for now):

```bash
node -e 'import("bullmq").then(async ({ Queue }) => {
  const q = new Queue("steps.ready", { connection: { host: "localhost", port: 6380 } });
  const dlq = new Queue("steps.dlq", { connection: { host: "localhost", port: 6380 } });
  const jobs = await dlq.getJobs(["wait", "delayed", "failed"], 0, 50);
  for (const job of jobs) {
    await q.add(job.name, job.data);
    await job.remove();
  }
  process.exit(0);
});'
```

## Database

- `pnpm prisma:migrate` — applies migrations (creates `migrations/` folder on first run).
- `pnpm prisma:seed` — seeds workspace + workflow.
- `pnpm prisma:generate` — regenerates Prisma client if schema updated.

## Smoke Test

```bash
pnpm e2e:smoke
```

The script orchestrates the seeded “HTTP to Slack” workflow and polls `/runs/:id` until completion or timeout.
