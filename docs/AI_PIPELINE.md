# AI Pipeline

Deterministic offline chain (Plan → Context → Generate → Score → Reflect → Verify → Ship).

## Steps
1. `plan` produces structured steps using heuristics.
2. Memory `docs.recent` and `sessions.get` provide lightweight context.
3. Draft generation uses deterministic templates while mocks are enabled.
4. `computeScorecard` applies readability/coverage/brand/seo weights.
5. `reflect` ranks improvement ideas by impact.
6. `verify` runs schema/policy checks (zod hook-in later).
7. Results include artifact, score, suggestions, and context traces.

Switch to live LLMs by setting `OPENAI_API_KEY`, choosing a model, and flipping `USE_MOCK_ADAPTERS=false` after preflight. The pipeline API stays the same.
