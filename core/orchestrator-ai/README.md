# @neonhub/orchestrator-ai

AI orchestrator with intelligent planning, execution, capability registry, and plan replay for debugging.

## Features

- 🧠 **Intelligent Planner** - Decomposes goals into executable steps
- ⚙️ **Robust Executor** - Executes plans with error handling and retries
- 📋 **Capability Registry** - Manages available tools, agents, and services
- 🔄 **Plan Replay** - Records and replays execution for debugging
- 🔐 **Policy Hooks** - Pre/post-execution policy enforcement
- 📊 **Parallel Execution** - Respects dependencies while maximizing concurrency
- 🎯 **Type-Safe** - Full TypeScript support with Zod validation

## Installation

```bash
pnpm add @neonhub/orchestrator-ai
```

## Quick Start

```typescript
import {
  Planner,
  Executor,
  CapabilityRegistry,
  PlanReplay,
  OrchestratorGoal,
} from '@neonhub/orchestrator-ai';

// Setup
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

// Create a goal
const goal: OrchestratorGoal = {
  id: 'goal_1',
  description: 'Create and publish a blog post',
  success_criteria: ['Content created', 'SEO optimized', 'Published'],
  context: {
    topic: 'AI in Marketing',
    targetAudience: 'Marketing Professionals',
  },
};

// Plan
const plan = await planner.plan(goal);
console.log('Plan:', plan);

// Validate
const validation = await planner.validatePlan(plan);
if (!validation.valid) {
  console.error('Invalid plan:', validation.errors);
}

// Execute
const result = await executor.execute(plan, { userId: '123' });
console.log('Result:', result.status);
console.log('Duration:', result.metadata.totalDuration, 'ms');

// Replay for debugging
await planReplay.replay(plan.id, (entry) => {
  console.log(`[${entry.event}]`, entry.timestamp);
});
```

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Orchestrator                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      │
│  │ Planner  │─────▶│ Executor │─────▶│ Replay   │      │
│  └──────────┘      └──────────┘      └──────────┘      │
│       │                  │                              │
│       ▼                  ▼                              │
│  ┌─────────────────────────────────────────┐           │
│  │      Capability Registry                 │           │
│  │  (Tools, Agents, Services)               │           │
│  └─────────────────────────────────────────┘           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Components

### Planner

Creates multi-step execution plans from high-level goals:

```typescript
const planner = new Planner(capabilityRegistry, {
  maxSteps: 50,
  estimateCosts: true,
});

const plan = await planner.plan(goal);

// Validate plan
const validation = await planner.validatePlan(plan);

// Re-plan after failure
const newPlan = await planner.replan(plan, failedStepId, error);
```

### Executor

Executes plans with error handling:

```typescript
const executor = new Executor(capabilityRegistry, planReplay, {
  parallelExecution: true, // Execute steps in parallel when possible
  stopOnError: false, // Continue execution even if a step fails
  policyHooks: [
    {
      name: 'security_check',
      async preExecution(step, context) {
        // Check if step is allowed
        return { allow: true };
      },
      async postExecution(step, result, context) {
        // Log or audit step execution
      },
    },
  ],
});

const result = await executor.execute(plan, context);
```

### Capability Registry

Manages available capabilities:

```typescript
const registry = new CapabilityRegistry();

// Register
registry.register({
  name: 'seo_optimizer',
  type: 'tool',
  description: 'Optimize content for SEO',
  inputSchema: { /* Zod schema */ },
  outputSchema: { /* Zod schema */ },
  enabled: true,
  metadata: { category: 'seo' },
});

// Query
const capability = registry.get('seo_optimizer');
const tools = registry.getByType('tool');
const seoCapabilities = registry.search('seo');

// Export for LLM
const capabilities = registry.exportForLLM();
```

### Plan Replay

Records and replays execution:

```typescript
const replay = new PlanReplay();

// Automatic recording during execution
const result = await executor.execute(plan);

// Get timeline
const timeline = replay.getTimeline(plan.id);
console.log(timeline);

// Replay with visualization
await replay.replay(plan.id, (entry) => {
  console.log(`[${entry.timestamp}] ${entry.event}`);
});

// Get stats
const stats = replay.getStats(plan.id);
console.log('Total duration:', stats.totalDuration, 'ms');
console.log('Average step duration:', stats.averageStepDuration, 'ms');

// Export/Import
const json = replay.export(plan.id);
replay.import('new_plan_id', json);
```

## Plan Structure

```typescript
interface OrchestratorPlan {
  id: string;
  goalId: string;
  steps: PlanStep[];
  estimatedDuration?: number;
  estimatedCost?: number;
  createdAt: string;
}

interface PlanStep {
  id: string;
  type: 'tool' | 'agent' | 'llm' | 'wait' | 'conditional';
  name: string; // Capability name
  description: string;
  params: Record<string, unknown>;
  dependencies: string[]; // IDs of steps that must complete first
  timeout?: number;
  retries?: number;
}
```

## Execution Patterns

### Sequential Execution

```typescript
const executor = new Executor(registry, replay, {
  parallelExecution: false,
});

const result = await executor.execute(plan);
```

### Parallel Execution

Automatically detects independent steps and executes them in parallel:

```typescript
const executor = new Executor(registry, replay, {
  parallelExecution: true,
});

// Steps without dependencies run in parallel
const result = await executor.execute(plan);
```

### With Policy Hooks

```typescript
const executor = new Executor(registry, replay, {
  policyHooks: [
    {
      name: 'rate_limiter',
      async preExecution(step, context) {
        const allowed = await rateLimiter.check(step.name);
        return {
          allow: allowed,
          reason: allowed ? undefined : 'Rate limit exceeded',
        };
      },
    },
    {
      name: 'audit_logger',
      async postExecution(step, result, context) {
        await auditLog.record(step, result, context);
      },
    },
  ],
});
```

## Integration

### With LLM Adapter

```typescript
import { OpenAIAdapter } from '@neonhub/llm-adapter';

const llmAdapter = new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY! });

// Use LLM for intelligent planning
const response = await llmAdapter.chat({
  model: 'gpt-4',
  messages: [
    {
      role: 'system',
      content: `You are a task planner. Available capabilities: ${JSON.stringify(
        registry.exportForLLM()
      )}`,
    },
    {
      role: 'user',
      content: `Create a plan to: ${goal.description}`,
    },
  ],
});

// Parse LLM response and create plan
```

### With Tools Framework

```typescript
import { ToolRegistry, ToolRunner } from '@neonhub/tools-framework';

const toolRegistry = new ToolRegistry();
const toolRunner = new ToolRunner();

// Auto-register tools as capabilities
for (const tool of toolRegistry.listEnabled()) {
  capabilityRegistry.register({
    name: tool.name,
    type: 'tool',
    description: tool.description,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
    enabled: true,
  });
}

// Execute tool in orchestrator
const executeCapability = async (capability: any, params: any) => {
  const tool = toolRegistry.get(capability.name);
  if (tool) {
    return await toolRunner.execute(tool, params);
  }
};
```

## Error Handling

```typescript
const result = await executor.execute(plan);

if (result.status === 'failed') {
  console.error('Execution failed:', result.error);
  
  // Find failed steps
  const failedSteps = result.steps.filter((s) => s.status === 'failed');
  
  for (const step of failedSteps) {
    console.log(`Step ${step.stepId} failed:`, step.error);
    
    // Re-plan or retry
    const newPlan = await planner.replan(plan, step.stepId, step.error!);
    await executor.execute(newPlan);
  }
}
```

## Testing

```bash
pnpm test
```

## License

MIT

