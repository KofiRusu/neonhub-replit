# Observability Guide

The NeonHub API now exposes Prometheus-friendly metrics for core agent and HTTP lifecycle telemetry. This guide explains what is collected, how to scrape the endpoint, and how to wire the data into Grafana dashboards.

## Metrics exposed at `/metrics`

The API publishes a plaintext Prometheus endpoint on `http://localhost:4100/metrics` (respecting `PORT`). Key series:

- `agent_runs_total{agent,status}` – terminal agent executions grouped by logical agent name and status (`success`, `failed`, `cancelled`).
- `agent_run_duration_seconds_bucket/sum/count{agent,status}` – histogram for agent execution latency.
- `api_request_duration_seconds_bucket/sum/count{route,method}` – request latency histogram labelled by normalized Express route and HTTP method.
- `circuit_breaker_failures_total{agent}` – monotonic counter for circuit breaker trips at the agent level.
- `circuit_breaker_state{agent}` – gauge reflecting live circuit breaker state (`0` closed, `1` open).

Default process metrics from `prom-client` (`process_cpu_user_seconds_total`, etc.) are also exported to help with capacity planning.

### Smoke test the endpoint

```bash
pnpm --filter @neonhub/backend-v3.2 run build
PORT=4100 USE_MOCK_CONNECTORS=true pnpm --filter @neonhub/backend-v3.2 run start &
curl -sf http://localhost:4100/metrics | head
kill %1
```

## Prometheus scrape configuration

Add the API job to your Prometheus server (replace host/port when deploying behind load balancers):

```yaml
scrape_configs:
  - job_name: neonhub-api
    metrics_path: /metrics
    scrape_interval: 15s
    static_configs:
      - targets:
          - localhost:4100
```

### Suggested Grafana panels

| Metric | Query | Notes |
| --- | --- | --- |
| Agent run success rate | `sum(rate(agent_runs_total{status="success"}[5m])) / sum(rate(agent_runs_total[5m]))` | Overall agent reliability |
| Agent latency | `histogram_quantile(0.95, sum(rate(agent_run_duration_seconds_bucket[5m])) by (le, agent))` | Track p95 execution time per agent |
| API latency | `histogram_quantile(0.95, sum(rate(api_request_duration_seconds_bucket[5m])) by (le, route))` | Identify slow routes |
| Circuit breaker alerts | `increase(circuit_breaker_failures_total[15m])` | Page on spikes |

## Metric helpers in code

Use the exported helpers from `apps/api/src/observability/metrics.ts`:

- `recordAgentRun(agent, status, durationSeconds)` – call after persistence completes.
- `recordHttpRequest(method, route, status, durationSeconds)` – Express middleware used in `server.ts` to track API latency.
- `recordCircuitBreakerFailure(agent)` and `setCircuitBreakerState(agent, isOpen)` – integrate with breaker logic to surface resiliency issues.
- `getMetrics()` – resolves the Prometheus payload for the `/metrics` handler.

Each helper accepts plain strings and coerces status labels to lowercase for consistent dashboards.

> Tip: populate `route` with the normalized Express route (`req.route?.path`) rather than raw URLs so Prometheus label cardinality stays bounded.
