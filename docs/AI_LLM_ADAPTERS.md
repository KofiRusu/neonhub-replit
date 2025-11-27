# LLM Adapters

- Live mode enabled only when `OPENAI_API_KEY` is set **and** `USE_MOCK_ADAPTERS=false` (checked by `useLiveLLM()`).
- Model + temperature: `OPENAI_MODEL`, `OPENAI_TEMPERATURE` (defaults `gpt-4o-mini`, `0.3`).
- Cost estimation: `estimateCostUSD(model, inputTokens, outputTokens)` (stored on `globalThis.__LLM_COST__` for debugging).
- Adapter lives in `apps/api/src/ai/adapters/openai.ts`; swap with the official SDK call when dependencies return. Keep the same function signature.
