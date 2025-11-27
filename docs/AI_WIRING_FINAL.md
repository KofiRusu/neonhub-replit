# AI Wiring (Final)

- Root tRPC router imports `aiRouter` and mounts it under `appRouter.ai`.
- `/ai/preview` UI panel prefers a global tRPC client (`window.__ai_trpc__`) but falls back to REST `/api/ai/preview`.
- When live LLMs run, the pipeline emits cost via Prometheus gauge `ai_llm_last_cost_usd` (or appends to `logs/ai-metrics.jsonl`).
