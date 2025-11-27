# @neonhub/tools-framework

Schema-first tools framework with timeouts, retries, and budget controls for LLM function calling.

## Features

- 📋 **Zod Schemas** for type-safe input/output validation
- ⏱️ **Timeout Control** to prevent hanging operations
- 🔄 **Automatic Retries** with exponential backoff
- 💰 **Budget Tracking** for cost, tokens, and time
- 📦 **Tool Registry** for centralized management
- 🔌 **OpenAI Compatible** function definitions export
- 🏷️ **Metadata & Versioning** for governance

## Installation

```bash
pnpm add @neonhub/tools-framework
```

## Quick Start

### Define a Tool

```typescript
import { z } from 'zod';
import { ToolContract } from '@neonhub/tools-framework';

const webSearchTool: ToolContract<
  { query: string; maxResults?: number },
  { results: Array<{ title: string; url: string }> }
> = {
  metadata: {
    name: 'web_search',
    description: 'Search the web for information',
    version: '1.0.0',
    category: 'research',
    tags: ['search', 'web'],
  },
  inputSchema: z.object({
    query: z.string().min(1),
    maxResults: z.number().min(1).max(10).default(5),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string().url(),
      })
    ),
  }),
  async execute(input) {
    // Your implementation
    const results = await searchAPI(input.query, input.maxResults);
    return { results };
  },
};
```

### Execute a Tool

```typescript
import { ToolRunner } from '@neonhub/tools-framework';

const runner = new ToolRunner();

const result = await runner.execute(
  webSearchTool,
  { query: 'AI automation', maxResults: 5 },
  {
    timeout: 10000, // 10s
    maxRetries: 3,
    budget: {
      maxCost: 0.01, // $0.01
      maxTime: 30000, // 30s
    },
  }
);

if (result.success) {
  console.log('Results:', result.data);
  console.log('Duration:', result.metadata.duration, 'ms');
} else {
  console.error('Error:', result.error);
}
```

### Tool Registry

```typescript
import { ToolRegistry } from '@neonhub/tools-framework';

const registry = new ToolRegistry();

// Register tools
registry.register(webSearchTool);
registry.register(sendEmailTool);
registry.register(calculateTool);

// Get a tool
const tool = registry.get('web_search', '1.0.0');

// Search tools
const researchTools = registry.getByCategory('research');
const searchTools = registry.getByTag('search');

// List all enabled tools
const enabled = registry.listEnabled();

// Export for OpenAI
const functions = registry.exportOpenAIFunctions();
```

## Advanced Usage

### Budget Tracking

```typescript
import { BudgetTrackerImpl } from '@neonhub/tools-framework';

const budget = new BudgetTrackerImpl({
  maxCost: 1.0, // $1.00
  maxTokens: 10000,
  maxTime: 60000, // 60s
});

if (budget.canExecute()) {
  const result = await runner.execute(tool, input, { budget });
  
  // Track consumption
  budget.track(0.05, 500, 1200);
  
  console.log('Remaining:', budget.getRemaining());
  console.log('Usage %:', budget.getUsagePercent());
}
```

### Batch Execution

```typescript
// Execute multiple tools in parallel
const results = await runner.executeBatch(
  [tool1, tool2, tool3],
  [input1, input2, input3],
  { timeout: 30000 }
);

// Execute in sequence (one after another)
const results = await runner.executeSequence(
  [tool1, tool2, tool3],
  [input1, input2, input3],
  { context: { stopOnError: true } }
);
```

### Custom Tool Execution Options

```typescript
const result = await runner.execute(tool, input, {
  timeout: 30000,          // 30s timeout
  maxRetries: 5,           // Retry up to 5 times
  retryDelay: 2000,        // 2s base delay
  budget: {
    maxCost: 0.10,         // $0.10 max
    maxTokens: 5000,       // 5K tokens max
    maxTime: 60000,        // 60s max
  },
  context: {
    userId: '123',
    sessionId: 'abc',
  },
  abortSignal: signal,     // AbortController signal
});
```

## Sample Tools

The package includes sample tool contracts:

```typescript
import {
  webSearchTool,
  sendEmailTool,
  calculateTool,
  fetchUrlTool,
} from '@neonhub/tools-framework';
```

## Tool Metadata

```typescript
{
  name: 'tool_name',
  description: 'What the tool does',
  version: '1.0.0',
  category: 'research',      // Optional category
  tags: ['search', 'web'],   // Optional tags
  requiresAuth: true,        // Requires authentication
  rateLimit: {               // Optional rate limiting
    requests: 100,
    window: 3600,            // 1 hour
  },
}
```

## Integration with LLM Adapters

```typescript
import { OpenAIAdapter } from '@neonhub/llm-adapter';
import { ToolRegistry, ToolRunner } from '@neonhub/tools-framework';

const adapter = new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY! });
const registry = new ToolRegistry();
const runner = new ToolRunner();

// Register tools
registry.register(webSearchTool);
registry.register(sendEmailTool);

// Get OpenAI function definitions
const functions = registry.exportOpenAIFunctions();

// Chat with function calling
const response = await adapter.chat({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Search for AI trends' }],
  tools: functions,
  toolChoice: 'auto',
});

// Execute tool calls
if (response.toolCalls) {
  for (const toolCall of response.toolCalls) {
    const tool = registry.get(toolCall.function.name);
    if (tool) {
      const result = await runner.execute(tool, toolCall.function.arguments);
      console.log('Tool result:', result.data);
    }
  }
}
```

## Error Handling

```typescript
const result = await runner.execute(tool, input);

if (!result.success) {
  console.error('Error:', result.error);
  console.log('Retries:', result.metadata.retries);
  console.log('Duration:', result.metadata.duration);
  
  // Handle specific errors
  if (result.error.includes('Timeout')) {
    // Handle timeout
  } else if (result.error.includes('Budget exceeded')) {
    // Handle budget exceeded
  }
}
```

## Testing

```bash
pnpm test
```

## License

MIT

