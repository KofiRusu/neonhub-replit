# Production Promotion Checklist — Telemetry v1.0.0

**Status**: Ready for Production Promotion  
**Prerequisites**: Staging validation complete ✅  
**Target**: Production-grade observability deployment

---

## 📋 Pre-Production Validation

### Step 1: Run Staging Validation

```bash
./scripts/staging/validate-staging.sh
```

**Expected Results**:
- ✅ All 8 validation checks pass
- ✅ Smoke test: exit 0
- ✅ Load-lite: ≥90% success rate
- ✅ SLO metrics within thresholds:
  - P50 ≤ 1,500ms
  - P95 ≤ 4,500ms
  - Error rate ≤ 2%

**Verification**:
```bash
# Check final summary
# Should show: "Passed: 8, Failed: 0"
```

---

### Step 2: Snapshot Metrics & Traces

#### Capture 10-Minute Sample

```bash
# Start staging environment
pnpm stg:up

# Run continuous load for 10 minutes
for i in {1..20}; do
  LOAD_LITE_N=12 pnpm stg:loadlite
  sleep 30
done

# Capture OTel Collector logs
docker logs neonhub-otel-collector > telemetry-snapshot-$(date +%Y%m%d-%H%M%S).log
```

#### Verify Required Attributes

**LLM Adapter Spans**:
```bash
grep -A 10 "llm\.chat" telemetry-snapshot-*.log | grep -E "llm\.(provider|model|tokens|cost)"
```

**Expected**:
```
llm.provider: openai
llm.model: gpt-4
llm.tokens.prompt: 150
llm.tokens.completion: 500
llm.tokens.total: 650
llm.cost.total_usd: 0.0195
llm.response_time.ms: 1245
```

**RAG Spans**:
```bash
grep -A 10 "rag\." telemetry-snapshot-*.log | grep -E "rag\.(top_k|latency|min_score)"
```

**Expected**:
```
rag.top_k: 5
rag.latency.ms: 87
rag.min_score: 0.75
```

**Orchestrator Spans**:
```bash
grep -A 10 "plan\." telemetry-snapshot-*.log | grep -E "plan\.(id|steps)|step\.(agent|success)"
```

**Expected**:
```
plan.id: plan_abc123
plan.steps: 5
step.agent: content_generation
step.success: true
```

**Checklist**:
- [ ] 10-minute capture saved to `telemetry-snapshot-*.log`
- [ ] All `llm.*` attributes present
- [ ] All `rag.*` attributes present
- [ ] All `plan.*` and `step.*` attributes present
- [ ] No missing or malformed spans

---

## 🚀 Production Configuration

### Step 3: Promote Exporters

#### Option A: Jaeger

Edit `ops/otel/otel-config.yaml`:

```yaml
exporters:
  # Remove or comment out logging exporter
  # logging:
  #   loglevel: info

  # Add Jaeger exporter
  jaeger:
    endpoint: "https://jaeger.your-domain.com:14250"
    tls:
      insecure: false
      cert_file: /etc/ssl/certs/jaeger-cert.pem
      key_file: /etc/ssl/private/jaeger-key.pem

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [jaeger]  # Changed from [logging]
```

#### Option B: Tempo (Grafana)

```yaml
exporters:
  otlp:
    endpoint: "https://tempo.your-domain.com:4318"
    tls:
      insecure: false
    headers:
      authorization: "Bearer ${GRAFANA_CLOUD_API_KEY}"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [otlp]
```

#### Option C: Multiple Backends

```yaml
exporters:
  # Traces to Tempo
  otlp/tempo:
    endpoint: "https://tempo.your-domain.com:4318"
    headers:
      authorization: "Bearer ${TEMPO_API_KEY}"

  # Metrics to Prometheus
  prometheusremotewrite:
    endpoint: "https://prometheus.your-domain.com/api/v1/write"
    headers:
      authorization: "Bearer ${PROM_API_KEY}"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [otlp/tempo]
    
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [prometheusremotewrite]
```

**Environment Variables** (add to production `.env`):
```bash
GRAFANA_CLOUD_API_KEY=your_key_here
TEMPO_API_KEY=your_key_here
PROM_API_KEY=your_key_here
```

**Checklist**:
- [ ] Exporter endpoint configured
- [ ] TLS certificates in place (if using HTTPS)
- [ ] Authentication tokens/keys set
- [ ] Logging exporter removed or disabled
- [ ] Test connectivity: `curl -I https://your-endpoint:4318`

---

### Step 4: Wire Dashboards

#### Import Grafana Dashboards

**Dashboard 1: AI & Logic Overview**

Create `ops/grafana/ai-logic-overview.json`:

```json
{
  "dashboard": {
    "title": "NeonHub AI & Logic - Overview",
    "panels": [
      {
        "title": "LLM Call Rate",
        "targets": [{
          "expr": "rate(llm_calls_total[5m])",
          "legendFormat": "{{llm_provider}} - {{llm_model}}"
        }]
      },
      {
        "title": "LLM Cost (USD/hour)",
        "targets": [{
          "expr": "sum(rate(llm_cost_usd_total[1h])) by (llm_model)"
        }]
      },
      {
        "title": "LLM P95 Latency",
        "targets": [{
          "expr": "histogram_quantile(0.95, llm_response_time_ms_bucket)"
        }]
      },
      {
        "title": "Tool Execution Rate",
        "targets": [{
          "expr": "rate(tool_executions_total[5m])"
        }]
      },
      {
        "title": "RAG Query Latency",
        "targets": [{
          "expr": "histogram_quantile(0.95, rag_latency_ms_bucket)"
        }]
      },
      {
        "title": "Orchestrator Success Rate",
        "targets": [{
          "expr": "sum(rate(plan_success_total[5m])) / sum(rate(plan_executions_total[5m]))"
        }]
      }
    ]
  }
}
```

**Dashboard 2: SLO Monitoring**

Create `ops/grafana/slo-monitoring.json`:

```json
{
  "dashboard": {
    "title": "NeonHub AI & Logic - SLO Monitoring",
    "panels": [
      {
        "title": "P50 Latency (Target: ≤1.5s)",
        "targets": [{
          "expr": "histogram_quantile(0.50, rate(operation_duration_ms_bucket[5m]))"
        }],
        "thresholds": [
          {"value": 1500, "color": "red"}
        ]
      },
      {
        "title": "P95 Latency (Target: ≤4.5s)",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(operation_duration_ms_bucket[5m]))"
        }],
        "thresholds": [
          {"value": 4500, "color": "red"}
        ]
      },
      {
        "title": "Error Rate (Target: ≤2%)",
        "targets": [{
          "expr": "sum(rate(operation_errors_total[5m])) / sum(rate(operation_total[5m])) * 100"
        }],
        "thresholds": [
          {"value": 2, "color": "red"}
        ]
      },
      {
        "title": "Median Cost (Target: ≤$0.03)",
        "targets": [{
          "expr": "histogram_quantile(0.50, rate(operation_cost_usd_bucket[5m]))"
        }],
        "thresholds": [
          {"value": 0.03, "color": "red"}
        ]
      }
    ]
  }
}
```

**Import to Grafana**:
```bash
# Via API
curl -X POST \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @ops/grafana/ai-logic-overview.json \
  https://grafana.your-domain.com/api/dashboards/db

curl -X POST \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @ops/grafana/slo-monitoring.json \
  https://grafana.your-domain.com/api/dashboards/db
```

#### Configure Alerts

**Alert 1: P95 Latency SLO Breach**

Create `ops/grafana/alerts/p95-latency.yaml`:

```yaml
groups:
  - name: ai_logic_slo
    interval: 1m
    rules:
      - alert: HighP95Latency
        expr: histogram_quantile(0.95, rate(operation_duration_ms_bucket[5m])) > 4500
        for: 5m
        labels:
          severity: warning
          team: ai-infrastructure
        annotations:
          summary: "P95 latency exceeds SLO threshold"
          description: "P95 latency is {{ $value }}ms (threshold: 4500ms)"
          runbook: "https://docs.neonhub.ai/runbooks/high-latency"
```

**Alert 2: Error Rate SLO Breach**

```yaml
      - alert: HighErrorRate
        expr: (sum(rate(operation_errors_total[5m])) / sum(rate(operation_total[5m]))) > 0.02
        for: 5m
        labels:
          severity: critical
          team: ai-infrastructure
        annotations:
          summary: "Error rate exceeds SLO threshold"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 2%)"
```

**Alert 3: High Cost**

```yaml
      - alert: HighAICost
        expr: histogram_quantile(0.50, rate(operation_cost_usd_bucket[5m])) > 0.03
        for: 10m
        labels:
          severity: warning
          team: ai-infrastructure
        annotations:
          summary: "Median operation cost exceeds budget"
          description: "Median cost is ${{ $value }} (threshold: $0.03)"
```

**Checklist**:
- [ ] AI & Logic Overview dashboard imported
- [ ] SLO Monitoring dashboard imported
- [ ] Alerts configured in Prometheus/Grafana
- [ ] Alert routing to Slack/PagerDuty configured
- [ ] Test alert: `curl -X POST http://prometheus:9090/-/reload`

---

### Step 5: CI Validation Gate

#### Add Nightly Telemetry Check

Create `.github/workflows/telemetry-health-check.yml`:

```yaml
name: Telemetry Health Check

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
  workflow_dispatch:

jobs:
  telemetry-health:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9.12.0
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Start staging environment
        run: pnpm stg:up
      
      - name: Wait for services
        run: sleep 30
      
      - name: Run smoke test
        run: pnpm stg:smoke
      
      - name: Verify telemetry
        run: |
          docker logs neonhub-otel-collector > telemetry.log
          
          # Check for required attributes
          grep -q "llm.provider" telemetry.log || exit 1
          grep -q "llm.model" telemetry.log || exit 1
          grep -q "llm.cost.total_usd" telemetry.log || exit 1
          
          echo "✅ Telemetry instrumentation healthy"
      
      - name: Teardown
        if: always()
        run: pnpm stg:down
      
      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "⚠️ Telemetry health check failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Telemetry Health Check Failed*\n\nInstrumentation may be degraded."
                  }
                }
              ]
            }
```

**Checklist**:
- [ ] Workflow file created
- [ ] Slack webhook configured (optional)
- [ ] Test workflow: `gh workflow run telemetry-health-check.yml`
- [ ] Verify notification on failure

---

## 🎯 Production Rollout Checklist

### Pre-Deployment Verification

**Infrastructure**:
- [ ] OTel Collector reachable from backend pods
  ```bash
  kubectl run -it --rm debug --image=curlimages/curl --restart=Never \
    -- curl -v http://otel-collector:4318/v1/traces
  ```

- [ ] TLS certificates valid (if using HTTPS)
  ```bash
  openssl s_client -connect otel-collector:4318 -showcerts
  ```

- [ ] Authentication working
  ```bash
  curl -H "Authorization: Bearer $API_KEY" https://otel-collector:4318/v1/traces
  ```

**Observability Backend**:
- [ ] Traces visible in Grafana/Tempo
  - Navigate to Explore → Tempo → Search
  - Filter by `service.name = "neonhub-orchestrator-stg"`
  
- [ ] Dashboards displaying data
  - Open AI & Logic Overview dashboard
  - Verify last 15 minutes show data
  
- [ ] Alerts functioning
  - Test alert: Trigger high latency manually
  - Verify Slack/PagerDuty notification

**SLO Metrics**:
- [ ] P50 latency ≤ 1,500ms
  ```bash
  # Query Prometheus
  curl "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.50, rate(operation_duration_ms_bucket[5m]))"
  ```

- [ ] P95 latency ≤ 4,500ms
  ```bash
  curl "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95, rate(operation_duration_ms_bucket[5m]))"
  ```

- [ ] Error rate < 2% over 1h window
  ```bash
  curl "http://prometheus:9090/api/v1/query?query=sum(rate(operation_errors_total[1h])) / sum(rate(operation_total[1h]))"
  ```

- [ ] Cost metrics tracking
  ```bash
  curl "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.50, rate(operation_cost_usd_bucket[5m]))"
  ```

---

## 🏷️ Tag for Production

When all checks pass:

```bash
# Create annotated tag
git tag -a telemetry-v1.0.0 -m "Production-grade OTel instrumentation for AI & Logic

✅ Features:
  - Full OpenTelemetry SDK integration
  - LLM cost and latency tracking
  - RAG performance monitoring
  - Orchestrator execution traces
  - SLO validation and alerting

✅ Validated:
  - Staging: 100% success rate
  - SLO compliance: P50 < 1.5s, P95 < 4.5s
  - Error rate: < 2%
  - Telemetry attributes: Complete

✅ Production Ready:
  - Exporter: Tempo/Jaeger
  - Dashboards: Grafana
  - Alerts: Configured
  - CI gates: Enabled"

# Push tag
git push origin telemetry-v1.0.0

# Create GitHub release
gh release create telemetry-v1.0.0 \
  --title "Telemetry v1.0.0 - Production Release" \
  --notes-file PRODUCTION_PROMOTION_CHECKLIST.md
```

---

## 📊 Post-Deployment Monitoring

### First 24 Hours

**Hour 1**:
- [ ] Verify traces flowing to backend
- [ ] Check dashboard data population
- [ ] Monitor error rates closely

**Hour 6**:
- [ ] Review SLO metrics
- [ ] Check for any alert triggers
- [ ] Validate cost tracking accuracy

**Hour 24**:
- [ ] Generate 24h summary report
- [ ] Compare staging vs production metrics
- [ ] Document any anomalies

### Week 1

- [ ] Review weekly SLO compliance
- [ ] Analyze cost trends
- [ ] Optimize alert thresholds if needed
- [ ] Team retrospective on observability

---

## 🚨 Rollback Plan

If critical issues arise:

```bash
# 1. Disable telemetry
kubectl set env deployment/api TELEMETRY_ENABLED=false
kubectl set env deployment/orchestrator TELEMETRY_ENABLED=false

# 2. Revert OTel Collector config
git revert <commit-hash>
kubectl apply -f ops/otel/otel-config.yaml

# 3. Monitor recovery
# Verify services stable without telemetry

# 4. Investigation
# Review logs, identify root cause
# Fix and re-deploy when ready
```

---

## ✅ Success Criteria

Production deployment is successful when:

1. ✅ All services reporting telemetry
2. ✅ Dashboards showing real-time data
3. ✅ SLO metrics within thresholds for 24h
4. ✅ No telemetry-related errors
5. ✅ Cost tracking accurate to ±5%
6. ✅ Alert system functional
7. ✅ Team trained on dashboards/alerts

---

## 📚 Reference Documentation

- **Implementation**: `STAGING_TELEMETRY_COMPLETE.md`
- **Quick Start**: `STAGING_QUICK_START.md`
- **Runbook**: `docs/AI_LOGIC_RUNBOOK.md`
- **Telemetry Package**: `core/telemetry/README.md`

---

**Status**: Ready for Production Promotion  
**Version**: telemetry-v1.0.0  
**Date**: November 2, 2025

---

**End of Checklist** ✨

