# Staging Validation - Quick Start

## 🚀 Run Complete Validation (5 Minutes)

### One-Command Validation

```bash
./scripts/staging/validate-staging.sh
```

This will:
1. ✅ Check prerequisites
2. ✅ Build all packages
3. ✅ Start staging environment
4. ✅ Run health checks
5. ✅ Execute smoke test
6. ✅ Run load-lite with SLO validation
7. ✅ Verify telemetry data
8. ✅ Provide summary report

### Manual Step-by-Step

If you prefer manual control:

```bash
# 1. Build
pnpm stg:build

# 2. Start staging
pnpm stg:up

# 3. Run tests
pnpm stg:smoke
LOAD_LITE_N=16 pnpm stg:loadlite

# 4. View results
pnpm stg:report
docker logs neonhub-otel-collector

# 5. Teardown
pnpm stg:down
```

## 📋 Expected Output

### Smoke Test ✅
```
[otel] started for neonhub-orchestrator-stg
{"level":30,"msg":"staging smoke start"}
{"level":30,"msg":"Smoke test plan completed","steps":3}
✅ Smoke test passed
```

### Load-Lite Test ✅
```json
{
  "ok": 16,
  "fail": 0,
  "successRate": "100.00%",
  "slo": {
    "p50_ms": 127,
    "p95_ms": 245,
    "error_rate": "0.0000"
  }
}
✅ Load lite test passed with SLO validation
```

### OTel Collector Logs ✅
```
Trace {
  Resource: { service.name: "neonhub-orchestrator-stg" }
  Spans: [
    { name: "smoke.test.runPlan", attributes: {...} }
  ]
}
```

## 🔧 Configuration

Create `.env.staging`:
```bash
cp .env.staging.example .env.staging
# Edit with your values
```

Or use environment variables:
```bash
export TELEMETRY_ENABLED=true
export SLO_P50_MS=1500
```

## ✅ Acceptance Criteria

- [x] Smoke test: exit 0
- [x] Load-lite: ≥90% success
- [x] SLO: P50 ≤ 1.5s, P95 ≤ 4.5s
- [x] Traces visible in OTel Collector
- [x] Required attributes present

## 🆘 Troubleshooting

### Collector not starting
```bash
docker logs neonhub-otel-collector
# Check ops/otel/otel-config.yaml
```

### No traces
```bash
echo $TELEMETRY_ENABLED  # Should be "true"
```

### SLO failures
```bash
# Adjust thresholds
export SLO_P50_MS=3000
export SLO_P95_MS=6000
```

## 📚 Documentation

- Full docs: `STAGING_TELEMETRY_COMPLETE.md`
- Telemetry: `core/telemetry/README.md`
- AI Stack: `docs/AI_LOGIC_RUNBOOK.md`

---

**Ready to validate? Run**: `./scripts/staging/validate-staging.sh` 🚀

