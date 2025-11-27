# Orchestration Guide
1) startRun(orgId, agentName, objective) → returns runId
2) step(runId, name, fn) records duration/result/error
3) finishRun(runId, status)
RiskEngine gates mutating ops; LedgerService enforces double-entry invariants for fintech.
