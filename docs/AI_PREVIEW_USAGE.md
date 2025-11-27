# AI Preview Usage

## REST (Next.js pages API)
`POST /api/ai/preview`
```json
{"objective": "Write a launch teaser", "channel": "social", "tone": "witty", "audience": "creators"}
```

## tRPC
- `ai.runPreview({ objective, channel, tone, audience })` → plan, draft, score, suggestions, verify.
- `ai.runTask({ orgId, agentName, objective, ... })` → persists AgentRun/RunStep when Prisma is available.

Keep `USE_MOCK_ADAPTERS=true` until preflight passes; the same endpoints will route to live LLMs once secrets are present and mocks are disabled.
