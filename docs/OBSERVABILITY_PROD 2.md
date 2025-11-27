# Production Observability

**Environment:** Production  
**Stack:** Prometheus + Grafana + Alertmanager

---

## 🎯 Overview

Production monitoring configured with 8 alert rules, 2 Grafana dashboards, and automated incident response.

### Alert Rules

| Alert | Threshold | Duration | Severity |
|-------|-----------|----------|----------|
| HighAgentFailureRate | > 10% | 5 min | Warning |
| SlowAgentExecution | P99 > 10s | 10 min | Warning |
| CircuitBreakerOpen | State = 1 | 2 min | Critical |
| HighHTTPErrorRate | > 5% | 5 min | Critical |
| SlowAPIResponses | P95 > 2s | 10 min | Warning |
| OAuthRefreshFailures | > 5/15min | 5 min | Warning |

---

## 📊 Dashboards

1. **Agent Overview** — 7 panels (execution rate, success rate, latency, circuit breaker, HTTP metrics)
2. **OAuth Health** — Token refresh rates, failure tracking (Week 3)

---

## 🚨 Runbook

See `docs/INCIDENT_RUNBOOK.md` for response procedures.

---

*Production Observability Guide - November 2, 2025*

