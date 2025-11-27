# AI & Logic Stack - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

```bash
# Ensure you have:
- Node.js >= 20.0.0
- pnpm >= 9.12.0
- PostgreSQL with pgvector extension
- OpenAI API key
```

### Step 1: Install Dependencies

```bash
cd /Users/kofirusu/Desktop/NeonHub
pnpm install
```

### Step 2: Build Core Packages

```bash
# Build all AI & Logic packages
cd core/llm-adapter && pnpm build && cd ../..
cd core/prompt-registry && pnpm build && cd ../..
cd core/tools-framework && pnpm build && cd ../..
cd core/memory-rag && pnpm build && cd ../..
cd core/orchestrator-ai && pnpm build && cd ../..
```

Or use a one-liner:
```bash
for pkg in llm-adapter prompt-registry tools-framework memory-rag orchestrator-ai; do
  cd core/$pkg && pnpm build && cd ../..
done
```

### Step 3: Set Environment Variables

```bash
# Add to your .env file
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:pass@localhost:5432/neonhub
```

### Step 4: Enable pgvector (if not already enabled)

```sql
-- Connect to your database
psql $DATABASE_URL

-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create indexes for better performance
CREATE INDEX ON "ConversationMessage" USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON "KBChunk" USING ivfflat (embedding vector_cosine_ops);
```

### Step 5: Run Your First AI Workflow

Create a file `examples/ai-workflow-demo.ts`:

```typescript
import { OpenAIAdapter } from '../core/llm-adapter/src/index.js';
import { PromptRegistry, PromptCompiler } from '../core/prompt-registry/src/index.js';
import { ToolRunner, ToolRegistry } from '../core/tools-framework/src/index.js';
import { 
  Planner, 
  Executor, 
  CapabilityRegistry,
  PlanReplay 
} from '../core/orchestrator-ai/src/index.js';

async function main() {
  console.log('🚀 AI & Logic Stack Demo\n');

  // 1. Setup LLM Adapter
  console.log('1️⃣ Setting up LLM Adapter...');
  const adapter = new OpenAIAdapter({
    apiKey: process.env.OPENAI_API_KEY!,
    enableCircuitBreaker: true,
    enableCostTracking: true,
  });

  // Test LLM call
  const response = await adapter.chat({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Say hello!' }],
  });
  console.log('   ✅ LLM Response:', response.content);
  console.log('   💰 Cost:', adapter.getCostReport(), '\n');

  // 2. Setup Prompt Registry
  console.log('2️⃣ Setting up Prompt Registry...');
  const registry = new PromptRegistry('./core/prompt-registry/prompts');
  await registry.loadAll();
  const stats = registry.getStats();
  console.log(`   ✅ Loaded ${stats.totalPrompts} prompts for ${stats.agents.length} agents\n`);

  // 3. Setup Tools
  console.log('3️⃣ Setting up Tools Framework...');
  const toolRegistry = new ToolRegistry();
  const toolRunner = new ToolRunner();
  
  // Import sample tools
  const { webSearchTool, calculateTool } = await import('../core/tools-framework/src/contracts/sample-tools.js');
  toolRegistry.register(webSearchTool);
  toolRegistry.register(calculateTool);
  console.log(`   ✅ Registered ${toolRegistry.list().length} tools\n`);

  // 4. Setup Orchestrator
  console.log('4️⃣ Setting up Orchestrator...');
  const capabilityRegistry = new CapabilityRegistry();
  const planReplay = new PlanReplay();
  const planner = new Planner(capabilityRegistry);
  const executor = new Executor(capabilityRegistry, planReplay);
  
  // Register capabilities
  capabilityRegistry.register({
    name: 'content_generation',
    type: 'agent',
    description: 'Generate marketing content',
    inputSchema: {},
    outputSchema: {},
    enabled: true,
  });
  console.log(`   ✅ Registered ${capabilityRegistry.getStats().total} capabilities\n`);

  // 5. Create and Execute a Plan
  console.log('5️⃣ Creating and executing a plan...');
  const goal = {
    id: 'demo_goal_1',
    description: 'Generate content about AI automation',
    success_criteria: ['Content generated'],
    context: { topic: 'AI automation' },
  };

  const plan = await planner.plan(goal);
  console.log(`   📋 Plan created with ${plan.steps.length} steps`);
  
  const result = await executor.execute(plan);
  console.log(`   ✅ Execution ${result.status}`);
  console.log(`   ⏱️  Duration: ${result.metadata.totalDuration}ms`);
  console.log(`   📊 Completed: ${result.metadata.completedSteps}/${result.metadata.totalSteps} steps\n`);

  // 6. Review Execution
  console.log('6️⃣ Reviewing execution timeline...');
  const timeline = planReplay.getTimeline(plan.id);
  timeline.forEach((event) => {
    console.log(`   [${event.timestamp}] ${event.event} ${event.duration ? `(${event.duration}ms)` : ''}`);
  });

  console.log('\n✨ Demo complete! AI & Logic Stack is ready for production.');
}

main().catch(console.error);
```

Run it:
```bash
npx tsx examples/ai-workflow-demo.ts
```

### Expected Output

```
🚀 AI & Logic Stack Demo

1️⃣ Setting up LLM Adapter...
   ✅ LLM Response: Hello! How can I help you today?
   💰 Cost: === LLM Cost Report ===
          gpt-3.5-turbo: 1 calls, 15 tokens, $0.0000
          ---
          Total: 1 calls, 15 tokens, $0.0000

2️⃣ Setting up Prompt Registry...
   ✅ Loaded 4 prompts for 4 agents

3️⃣ Setting up Tools Framework...
   ✅ Registered 2 tools

4️⃣ Setting up Orchestrator...
   ✅ Registered 1 capabilities

5️⃣ Creating and executing a plan...
   📋 Plan created with 1 steps
   ✅ Execution completed
   ⏱️  Duration: 127ms
   📊 Completed: 1/1 steps

6️⃣ Reviewing execution timeline...
   [2025-11-01T...] execution_started (0ms)
   [2025-11-01T...] step_started (0ms)
   [2025-11-01T...] step_completed (102ms)
   [2025-11-01T...] execution_completed (25ms)

✨ Demo complete! AI & Logic Stack is ready for production.
```

## 📚 Next Steps

### Learn More
1. **Read the Runbook**: `docs/AI_LOGIC_RUNBOOK.md`
2. **Explore Prompts**: `docs/PROMPT_REGISTRY_GUIDE.md`
3. **Orchestration**: `docs/ORCHESTRATOR_CONTRACTS.md`

### Integrate with Your Agents
```typescript
// Example: Integrate Content Agent
import { OpenAIAdapter } from '@neonhub/llm-adapter';
import { PromptRegistry } from '@neonhub/prompt-registry';

class ContentAgent {
  constructor(
    private adapter: OpenAIAdapter,
    private promptRegistry: PromptRegistry
  ) {}

  async generateBlogPost(topic: string) {
    const prompt = this.promptRegistry.get('content-blog-post');
    const compiled = compiler.compile(prompt, { topic });
    
    return await this.adapter.chat({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: compiled.system },
        { role: 'user', content: compiled.user },
      ],
    });
  }
}
```

### Run Tests
```bash
# Test individual packages
cd core/llm-adapter && pnpm test
cd core/prompt-registry && pnpm test
cd core/tools-framework && pnpm test

# Or test all at once
pnpm test
```

### Monitor in Production
```typescript
// Circuit breaker status
const status = adapter.getCircuitBreakerStatus();
console.log(status); // { state: 'CLOSED', failures: 0 }

// Cost tracking
const cost = adapter.getCostTracker().getTotalCost();
console.log(`Total: $${cost.toFixed(4)}`);

// Tool execution stats
const toolStats = toolRunner.getStats();
console.log('Success rate:', toolStats.successRate);
```

## 🎯 Common Use Cases

### Use Case 1: Content Generation Pipeline
```typescript
// 1. Get prompt
const prompt = registry.get('content-blog-post');

// 2. Compile with variables
const compiled = compiler.compile(prompt, {
  topic: 'AI in Marketing',
  tone: 'professional',
  keywords: ['AI', 'automation', 'ROI'],
});

// 3. Generate content
const response = await adapter.chat({
  model: 'gpt-4',
  messages: [{ role: 'user', content: compiled.user }],
});
```

### Use Case 2: RAG Query
```typescript
// 1. Retrieve relevant context
const context = await kbStore.retrieve('product features', {
  topK: 5,
  filters: { type: 'product', entityId: 'prod_123' },
});

// 2. Format for LLM
const contextText = context.map(r => r.chunk.content).join('\n\n');

// 3. Generate response with context
const response = await adapter.chat({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: `Context:\n${contextText}` },
    { role: 'user', content: 'What are the key features?' },
  ],
});
```

### Use Case 3: Multi-Step Orchestration
```typescript
// Define goal
const goal = {
  id: 'campaign_001',
  description: 'Create and launch email campaign',
  success_criteria: ['Content', 'Design', 'Schedule'],
};

// Plan and execute
const plan = await planner.plan(goal);
const result = await executor.execute(plan);

// Review results
if (result.status === 'completed') {
  console.log('Campaign launched successfully!');
}
```

## 🐛 Troubleshooting

### Issue: "Circuit breaker is OPEN"
```typescript
// Reset circuit breaker
adapter.resetCircuitBreaker();

// Check health
const healthy = await adapter.healthCheck();
```

### Issue: "Module not found"
```bash
# Rebuild packages
pnpm build
```

### Issue: "pgvector extension not found"
```sql
CREATE EXTENSION vector;
```

## 📞 Support

- 📖 Full documentation in `/docs`
- 💬 Questions: dev@neonhub.ai
- 🐛 Issues: Check plan replay logs

---

**Happy Building! 🚀**

