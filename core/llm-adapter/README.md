# @neonhub/llm-adapter

Unified LLM adapter with retry, timeout, circuit breaker, and cost tracking.

## Features

- 🔄 **Automatic Retry** with exponential backoff and jitter
- ⏱️ **Timeout Protection** for hanging requests
- 🚦 **Circuit Breaker** to prevent cascading failures
- 💰 **Cost Tracking** with per-model pricing
- 📊 **Usage Statistics** for monitoring and optimization
- 🔌 **Multiple Providers** (OpenAI, Zai/Custom, extensible)
- 🎯 **Type-Safe** with Zod validation

## Installation

```bash
pnpm add @neonhub/llm-adapter
```

## Usage

### OpenAI Adapter

```typescript
import { OpenAIAdapter } from '@neonhub/llm-adapter';

const adapter = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY!,
  enableCircuitBreaker: true,
  enableCostTracking: true,
});

// Chat completion
const response = await adapter.chat({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
  temperature: 0.7,
  maxTokens: 1000,
});

console.log(response.content);
console.log('Cost:', response.usage);

// Streaming
for await (const delta of adapter.stream!({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Tell me a story' }],
})) {
  process.stdout.write(delta.delta);
}

// Embeddings
const embeddings = await adapter.embed({
  texts: ['Hello world', 'How are you?'],
  model: 'text-embedding-ada-002',
});

// Get cost report
console.log(adapter.getCostReport());
```

### Zai/Custom Adapter

```typescript
import { ZaiAdapter } from '@neonhub/llm-adapter';

const adapter = new ZaiAdapter({
  apiKey: process.env.ZAI_API_KEY!,
  baseURL: 'https://api.zai.example.com',
});

const response = await adapter.chat({
  model: 'zai-model-v1',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

### Advanced Options

```typescript
const response = await adapter.chat(
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  {
    timeout: 30000, // 30s
    maxRetries: 5,
    retryDelay: 2000, // 2s base delay
    circuitBreakerThreshold: 10,
    metadata: { userId: '123', sessionId: 'abc' },
  }
);
```

### Circuit Breaker

The circuit breaker prevents cascading failures by temporarily blocking requests after repeated failures.

States:
- **CLOSED**: Normal operation
- **OPEN**: Too many failures, requests blocked
- **HALF_OPEN**: Testing if service recovered

```typescript
const status = adapter.getCircuitBreakerStatus();
console.log(status); // { state: 'CLOSED', failures: 0, successes: 3 }

// Reset if needed
adapter.resetCircuitBreaker();
```

### Cost Tracking

Automatic cost tracking based on token usage:

```typescript
const tracker = adapter.getCostTracker();
const stats = tracker?.getUsageStats();

console.log(stats);
// {
//   'gpt-4': { calls: 10, tokens: 15000, cost: 0.45 },
//   'gpt-3.5-turbo': { calls: 50, tokens: 25000, cost: 0.0625 }
// }

console.log('Total cost:', tracker?.getTotalCost());
```

## Testing

```bash
# Run tests
pnpm test

# Run with real API (requires OPENAI_API_KEY)
OPENAI_API_KEY=sk-... pnpm test
```

## Architecture

```
┌─────────────────────┐
│  ModelAdapter       │  ← Interface
└─────────────────────┘
         ▲
         │
┌────────┴────────┐
│ BaseModelAdapter│  ← Retry, Timeout
└────────┬────────┘
         ▲
         │
    ┌────┴─────┬──────────┐
    │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│OpenAI │ │  Zai  │ │Custom │
└───┬───┘ └───┬───┘ └───────┘
    │         │
    ▼         ▼
┌──────────────────┐
│ Circuit Breaker  │
│  Cost Tracker    │
└──────────────────┘
```

## Model Pricing

Current pricing (per 1K tokens):

| Model | Input | Output |
|-------|-------|--------|
| GPT-4 | $0.03 | $0.06 |
| GPT-4 Turbo | $0.01 | $0.03 |
| GPT-4o | $0.005 | $0.015 |
| GPT-3.5 Turbo | $0.0015 | $0.002 |
| Ada Embeddings | $0.0001 | - |

## License

MIT

