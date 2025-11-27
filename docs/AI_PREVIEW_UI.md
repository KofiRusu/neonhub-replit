# AI Preview UI

- Path: `/ai/preview` (client-side form posting to `/api/ai/preview`).
- Works offline with deterministic responses; when secrets exist and mocks are disabled, the pipeline uses the live LLM adapter.
- Inputs: objective, channel, tone, audience. Displays plan score, draft, and JSON details for debugging.
