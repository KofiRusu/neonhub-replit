# Staging Monitoring Setup

**Stack:** Prometheus + Grafana  
**Environment:** Staging  
**Status:** Ready to deploy

---

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
cd ops/monitoring
docker compose -f docker-compose.staging.yml up -d
```

### 2. Access Dashboards

- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001
  - Username: `admin`
  - Password: `neonhub-staging-2025`

### 3. Import Dashboard

1. Open Grafana: http://localhost:3001
2. Login with admin credentials
3. Navigate to: Dashboards → Import
4. Upload: `dashboards/agent-overview.json`
5. Select Prometheus datasource
6. Click Import

---

## 📊 Dashboard Panels

### Agent Overview Dashboard

**Panels Include:**
1. **Agent Execution Rate** - Requests/sec by agent
2. **Agent Success Rate** - Success % with 90% threshold alert
3. **Agent Latency (P95)** - 95th percentile execution time
4. **Circuit Breaker Status** - Open/Closed state per agent
5. **HTTP Request Rate** - Total API requests/sec
6. **HTTP Error Rate (5xx)** - Server error percentage
7. **API Response Time (P95)** - 95th percentile API latency

**Auto-refresh:** 30 seconds

---

## 🔍 Key Metrics

### Agent Performance

```promql
# Agent success rate
sum(rate(agent_runs_total{status="success"}[5m])) by (agent) 
  / sum(rate(agent_runs_total[5m])) by (agent)

# P95 agent latency
histogram_quantile(0.95, 
  sum(rate(agent_run_duration_seconds_bucket[5m])) by (le, agent))

# Agent failure rate
sum(rate(agent_runs_total{status="failed"}[5m])) by (agent)
```

### API Health

```promql
# Request rate
sum(rate(neonhub_http_requests_total[5m]))

# Error rate
sum(rate(neonhub_http_requests_total{status=~"5.."}[5m])) 
  / sum(rate(neonhub_http_requests_total[5m]))

# P95 response time
histogram_quantile(0.95, 
  sum(rate(api_request_duration_seconds_bucket[5m])) by (le))
```

---

## 🚨 Alert Rules

### Configured Alerts

Located in: `prometheus/alerts/neonhub-staging.yml`

1. **HighAgentFailureRate** - Triggers if agent failure rate > 10% for 5 minutes
2. **SlowAgentExecution** - Triggers if P99 latency > 10 seconds for 10 minutes
3. **CircuitBreakerOpen** - Triggers if any circuit breaker is open for 2 minutes
4. **HighHTTPErrorRate** - Triggers if 5xx error rate > 5% for 5 minutes

**Alert Destination:** Configure in `alertmanager/config.yml`

---

## 🔧 Configuration

### Prometheus Targets

**Current:** `host.docker.internal:4100` (local API)

**For deployed API:**
Edit `prometheus/prometheus.staging.yml`:

```yaml
scrape_configs:
  - job_name: 'neonhub-api-staging'
    static_configs:
      - targets:
          - 'api.staging.neonhubecosystem.com:443'
    scheme: https
```

### Grafana Datasource

Auto-provisioned at: `grafana/provisioning/datasources/prometheus.yml`

Points to: `http://prometheus:9090`

---

## 🧪 Validation

### Test Prometheus

```bash
# Check Prometheus is scraping
curl http://localhost:9090/api/v1/targets

# Query a metric
curl 'http://localhost:9090/api/v1/query?query=agent_runs_total'
```

### Test Grafana

```bash
# Check Grafana is running
curl http://localhost:3001/api/health

# Login and access dashboards
open http://localhost:3001
```

---

## 📦 Files Structure

```
ops/monitoring/
├── docker-compose.staging.yml      # Main compose file
├── prometheus/
│   ├── prometheus.staging.yml      # Prometheus config
│   └── alerts/
│       └── neonhub-staging.yml     # Alert rules
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── prometheus.yml      # Auto-provision Prometheus
│   │   └── dashboards/
│   │       └── default.yml         # Dashboard provider
│   └── dashboards/                 # Not auto-provisioned (manual import)
└── dashboards/
    └── agent-overview.json         # Agent performance dashboard
```

---

## 🛠️ Troubleshooting

### Prometheus Not Scraping

```bash
# Check if API is accessible from container
docker exec neonhub-prometheus-staging curl http://host.docker.internal:4100/health

# Check Prometheus logs
docker logs neonhub-prometheus-staging
```

### Grafana Dashboard Not Loading

```bash
# Check Grafana logs
docker logs neonhub-grafana-staging

# Verify datasource
curl http://localhost:3001/api/datasources
```

### No Metrics Showing

1. Ensure API is running: `curl http://localhost:4100/metrics`
2. Check Prometheus targets: http://localhost:9090/targets
3. Verify metrics in Prometheus: http://localhost:9090/graph

---

## 🚀 Production Deployment

For production monitoring:

1. Update `prometheus.staging.yml` with production API URL
2. Change Grafana password in docker-compose
3. Configure Alertmanager with Slack/PagerDuty
4. Enable HTTPS for Prometheus/Grafana (nginx proxy)
5. Set up persistent volumes for data retention

---

**Last Updated:** November 2, 2025  
**Environment:** Staging  
**Stack Version:** Prometheus 2.x, Grafana 10.x

