# Orchestrator Contracts & Integration Guide

## Overview

The Orchestrator coordinates multi-step workflows by planning, executing, and monitoring agent and tool operations.

## Core Contracts

### Goal Definition

```typescript
interface OrchestratorGoal {
  id: string;
  description: string;
  success_criteria: string[];
  constraints?: Record<string, unknown>;
  context?: Record<string, unknown>;
}
```

**Example**:
```typescript
const goal: OrchestratorGoal = {
  id: 'campaign_launch_001',
  description: 'Create and launch email marketing campaign',
  success_criteria: [
    'Content generated',
    'Design approved',
    'List segmented',
    'Campaign scheduled',
  ],
  context: {
    productId: 'prod_123',
    targetAudience: 'enterprise',
    launchDate: '2025-12-01',
  },
};
```

### Plan Structure

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
  dependencies: string[]; // Step IDs that must complete first
  timeout?: number;
  retries?: number;
}
```

**Example**:
```typescript
const plan: OrchestratorPlan = {
  id: 'plan_abc123',
  goalId: 'campaign_launch_001',
  steps: [
    {
      id: 'step_1',
      type: 'agent',
      name: 'content_generation',
      description: 'Generate email content',
      params: {
        productId: 'prod_123',
        template: 'promotional',
      },
      dependencies: [],
      timeout: 60000,
      retries: 3,
    },
    {
      id: 'step_2',
      type: 'tool',
      name: 'design_renderer',
      description: 'Render email design',
      params: {
        contentId: '{{step_1.output.id}}',
        theme: 'modern',
      },
      dependencies: ['step_1'],
      timeout: 30000,
      retries: 2,
    },
  ],
  estimatedDuration: 90000,
  estimatedCost: 0.05,
  createdAt: '2025-11-01T10:00:00Z',
};
```

### Execution Result

```typescript
interface ExecutionResult {
  planId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  steps: StepResult[];
  output?: unknown;
  error?: string;
  metadata: {
    totalDuration: number;
    totalCost?: number;
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
  };
  startedAt: string;
  completedAt?: string;
}

interface StepResult {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: unknown;
  error?: string;
  duration?: number;
  startedAt?: string;
  completedAt?: string;
}
```

## Capability Registration

### Registering Tools

```typescript
capabilityRegistry.register({
  name: 'web_search',
  type: 'tool',
  description: 'Search the web for information',
  inputSchema: z.object({
    query: z.string(),
    maxResults: z.number().default(5),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    })),
  }),
  enabled: true,
});
```

### Registering Agents

```typescript
capabilityRegistry.register({
  name: 'content_agent',
  type: 'agent',
  description: 'Generate marketing content',
  inputSchema: z.object({
    type: z.enum(['blog', 'email', 'social']),
    topic: z.string(),
  }),
  outputSchema: z.object({
    content: z.string(),
    metadata: z.object({
      wordCount: z.number(),
      readingTime: z.number(),
    }),
  }),
  enabled: true,
  metadata: {
    version: '1.0.0',
    owner: 'marketing-team',
  },
});
```

### Registering Services

```typescript
capabilityRegistry.register({
  name: 'email_service',
  type: 'service',
  description: 'Send transactional emails',
  inputSchema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  outputSchema: z.object({
    messageId: z.string(),
    sent: z.boolean(),
  }),
  enabled: true,
});
```

## Policy Hooks

### Pre-Execution Hook

```typescript
const rateLimitHook: PolicyHook = {
  name: 'rate_limiter',
  async preExecution(step, context) {
    const userId = context.userId as string;
    const allowed = await rateLimiter.checkLimit(userId, step.name);
    
    return {
      allow: allowed,
      reason: allowed ? undefined : 'Rate limit exceeded',
    };
  },
};
```

### Post-Execution Hook

```typescript
const auditHook: PolicyHook = {
  name: 'audit_logger',
  async postExecution(step, result, context) {
    await auditLog.create({
      userId: context.userId,
      action: step.name,
      status: result.status,
      timestamp: new Date(),
      metadata: {
        duration: result.duration,
        params: step.params,
      },
    });
  },
};
```

### Security Hook

```typescript
const securityHook: PolicyHook = {
  name: 'security_check',
  async preExecution(step, context) {
    // Check if user has permission
    const hasPermission = await authService.checkPermission(
      context.userId,
      step.name
    );
    
    if (!hasPermission) {
      return {
        allow: false,
        reason: 'Insufficient permissions',
      };
    }
    
    // Check for sensitive data
    const hasSensitiveData = detectSensitiveData(step.params);
    if (hasSensitiveData && !context.consentGiven) {
      return {
        allow: false,
        reason: 'Sensitive data detected, consent required',
      };
    }
    
    return { allow: true };
  },
};
```

## Plan Replay

### Recording Events

Events are automatically recorded during execution:

- `plan_created`
- `execution_started`
- `step_started`
- `step_completed`
- `step_failed`
- `execution_completed`
- `execution_failed`

### Replaying Execution

```typescript
await planReplay.replay(planId, async (entry) => {
  console.log(`[${entry.timestamp}] ${entry.event}`);
  
  if (entry.event === 'step_failed') {
    const stepData = entry.data as StepResult;
    console.error(`Step failed: ${stepData.error}`);
  }
});
```

### Getting Timeline

```typescript
const timeline = planReplay.getTimeline(planId);

for (const event of timeline) {
  console.log(`${event.timestamp}: ${event.event} (${event.duration}ms)`);
}
```

### Execution Stats

```typescript
const stats = planReplay.getStats(planId);

console.log('Total duration:', stats.totalDuration, 'ms');
console.log('Average step duration:', stats.averageStepDuration, 'ms');
console.log('Event counts:', stats.eventCounts);
```

## Integration Patterns

### Pattern 1: Simple Sequential Execution

```typescript
const plan = await planner.plan(goal);
const result = await executor.execute(plan, { userId: '123' });

if (result.status === 'completed') {
  console.log('Success!', result.output);
} else {
  console.error('Failed:', result.error);
}
```

### Pattern 2: Parallel Execution

```typescript
const executor = new Executor(registry, replay, {
  parallelExecution: true, // Enable parallel execution
});

const result = await executor.execute(plan);
```

### Pattern 3: With Policy Enforcement

```typescript
const executor = new Executor(registry, replay, {
  policyHooks: [rateLimitHook, auditHook, securityHook],
});

const result = await executor.execute(plan, {
  userId: '123',
  consentGiven: true,
});
```

### Pattern 4: Error Recovery

```typescript
const result = await executor.execute(plan);

if (result.status === 'failed') {
  // Find failed step
  const failedStep = result.steps.find((s) => s.status === 'failed');
  
  if (failedStep) {
    // Re-plan without failed step
    const newPlan = await planner.replan(
      plan,
      failedStep.stepId,
      failedStep.error!
    );
    
    // Retry execution
    const retryResult = await executor.execute(newPlan);
  }
}
```

### Pattern 5: Conditional Execution

```typescript
const plan: OrchestratorPlan = {
  steps: [
    {
      id: 'step_1',
      type: 'agent',
      name: 'sentiment_analysis',
      description: 'Analyze sentiment',
      params: { text: 'Sample text' },
      dependencies: [],
    },
    {
      id: 'step_2_positive',
      type: 'conditional',
      name: 'handle_positive',
      description: 'Handle positive sentiment',
      params: {
        condition: '{{step_1.output.sentiment}} === "positive"',
      },
      dependencies: ['step_1'],
    },
    {
      id: 'step_2_negative',
      type: 'conditional',
      name: 'handle_negative',
      description: 'Handle negative sentiment',
      params: {
        condition: '{{step_1.output.sentiment}} === "negative"',
      },
      dependencies: ['step_1'],
    },
  ],
};
```

## Debugging

### Enable Verbose Logging

```typescript
const logger = pino({ level: 'debug' });
```

### Inspect Plan Structure

```typescript
console.log('Plan:', JSON.stringify(plan, null, 2));
```

### Review Replay Timeline

```typescript
const timeline = planReplay.getTimeline(planId);
console.table(timeline);
```

### Export Plan History

```typescript
const history = planReplay.export(planId);
fs.writeFileSync('plan_history.json', history);
```

---

**End of Contracts Guide**

