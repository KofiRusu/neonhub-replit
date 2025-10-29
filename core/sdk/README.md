# @neonhub/sdk

Official TypeScript/JavaScript SDK for NeonHub AI Marketing Platform

## Installation

```bash
npm install @neonhub/sdk
# or
yarn add @neonhub/sdk
# or
pnpm add @neonhub/sdk
```

## Quick Start

```typescript
import { NeonHubClient } from '@neonhub/sdk';

// Initialize the client
const client = new NeonHubClient({
  baseURL: 'https://api.neonhubecosystem.com',
  apiKey: 'your-api-key-here'
});

// Test connectivity
const health = await client.ping();
console.log(health); // { status: 'ok', version: '3.2.0' }

// Execute an agent
const result = await client.agents.execute({
  agent: 'content-agent',
  input: {
    topic: 'AI-Powered Marketing Automation',
    tone: 'professional',
    audience: 'B2B marketers'
  }
});

console.log(result.output);
```

## Configuration

### API Key Authentication

```typescript
const client = new NeonHubClient({
  baseURL: 'https://api.neonhubecosystem.com',
  apiKey: process.env.NEONHUB_API_KEY
});
```

### Access Token Authentication

```typescript
const client = new NeonHubClient({
  baseURL: 'https://api.neonhubecosystem.com',
  accessToken: 'your-access-token'
});
```

### Advanced Configuration

```typescript
const client = new NeonHubClient({
  baseURL: 'https://api.neonhubecosystem.com',
  apiKey: process.env.NEONHUB_API_KEY,
  timeout: 60000, // 60 seconds
  maxRetries: 5,
  debug: true,
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

## Features

### 👤 Person Graph (NEW - LoopDrive v1.0)

Cross-channel identity resolution and personal memory:

```typescript
// Resolve person by email, phone, or handle
const result = await client.person.resolve({
  email: 'user@example.com'
});
console.log(result.person.id); // per_abc123

// Get personal memory (context)
const memories = await client.person.getMemory(result.person.id, {
  kinds: ['fact', 'intent'],
  limit: 10
});

// Update consent
await client.person.updateConsent(result.person.id, {
  channel: 'email',
  scope: 'marketing',
  status: 'granted',
  source: 'api'
});

// Get activity timeline
const timeline = await client.events.getTimeline(result.person.id, {
  limit: 50,
  includeMemory: true
});
```

### 🎨 Brand Voice (NEW - LoopDrive v1.0)

AI-powered personalized content generation with guardrails:

```typescript
// Compose personalized email
const composition = await client.voice.compose({
  brandId: 'brand_123',
  channel: 'email',
  objective: 'demo_book',
  personId: 'per_abc123',
  constraints: {
    maxLength: 500,
    tone: 'professional',
    includeLink: true
  }
});

console.log(composition.primary.subject);
console.log(composition.primary.body);
console.log(composition.variants); // A/B test variants

// Run guardrail checks
const check = await client.voice.guardrail(
  'Check out this offer!',
  'email',
  'brand_123'
);

if (!check.safe) {
  console.log('Violations:', check.violations);
  console.log('Use this instead:', check.redacted);
}

// Get winning snippets
const snippets = await client.voice.getSnippets({
  brandId: 'brand_123',
  channel: 'email',
  minWinRate: 0.7,
  limit: 10
});
```

### 📤 Multi-Channel Sending (NEW - LoopDrive v1.0)

Send personalized messages across email, SMS, and social DMs:

```typescript
// Send personalized email
const emailResult = await client.send.email({
  personId: 'per_abc123',
  brandId: 'brand_123',
  objective: 'demo_book',
  utmParams: {
    source: 'campaign',
    medium: 'email',
    campaign: 'q4_demo'
  }
});

// Send SMS
const smsResult = await client.send.sms({
  personId: 'per_abc123',
  brandId: 'brand_123',
  objective: 'winback'
});

// Send Instagram DM
const dmResult = await client.send.dm({
  personId: 'per_abc123',
  brandId: 'brand_123',
  platform: 'instagram',
  objective: 'nurture'
});

// Check send status
const status = await client.send.getStatus(emailResult.id);
console.log(status.status); // 'delivered', 'opened', 'clicked', etc.
console.log(status.events); // Full event history
```

### 💰 Budget Engine (NEW - LoopDrive v1.0)

Smart spend allocation across channels with Thompson sampling:

```typescript
// Create budget plan
const plan = await client.budget.plan({
  workspaceId: 'ws_xyz',
  objectives: [
    {
      type: 'demo_book',
      priority: 10,
      targetMetric: 'conversions',
      targetValue: 50
    }
  ],
  constraints: {
    totalBudget: 500000, // $5000 in cents
    period: 'monthly',
    minROAS: 2.5,
    channelLimits: {
      email: 200000,
      sms: 150000,
      instagram: 150000
    }
  },
  strategy: 'bandit' // Thompson sampling
});

console.log('Predicted conversions:', plan.predictions.totalConversions);
console.log('Predicted ROAS:', plan.predictions.averageROAS);

// Execute plan (after approval)
await client.budget.execute(plan.id);

// Check wallet balance
const balance = await client.budget.getWalletBalance('ws_xyz');
console.log('Balance:', balance / 100, 'USD');

// Top up wallet via Stripe
const topup = await client.budget.topUpWallet('ws_xyz', 500000);
// Returns Stripe PaymentIntent client secret for frontend

// Reconcile (planned vs actual)
const report = await client.budget.reconcile(plan.id);
console.log('Variance:', report.summary.variancePercent, '%');
console.log('Actual ROAS:', report.performance.actualROAS);
```

### 📊 Events & Analytics (NEW - LoopDrive v1.0)

Query event stream and analyze conversion funnels:

```typescript
// Query events with filters
const events = await client.events.query({
  workspaceId: 'ws_xyz',
  personId: 'per_abc123',
  types: ['email.opened', 'email.clicked'],
  dateFrom: new Date('2025-01-01'),
  limit: 100
});

// Get event stats
const stats = await client.events.getStats('ws_xyz', {
  from: new Date('2025-10-01'),
  to: new Date('2025-10-31')
});

console.log('Total events:', stats.totalEvents);
console.log('By type:', stats.byType);
console.log('By channel:', stats.byChannel);

// Get conversion funnel
const funnel = await client.events.getFunnel('ws_xyz', [
  'email.sent',
  'email.opened',
  'email.clicked',
  'conversion.meeting.booked'
]);

funnel.steps.forEach(step => {
  console.log(`${step.event}: ${step.count} (${step.conversionRate}%)`);
});

// Get attribution
const attribution = await client.events.getAttribution('evt_conversion_123');
console.log('Touchpoints:', attribution.touchpoints);
console.log('Weights:', attribution.weights);
```

### 🤖 Agents

Execute AI agents for various marketing tasks:

```typescript
// List available agents
const agents = await client.agents.list();

// Execute an agent
const job = await client.agents.execute({
  agent: 'insight-agent',
  input: { query: 'Top marketing trends 2025' },
  organizationId: 'org_123'
});

// Wait for completion
const completed = await client.agents.waitForCompletion(job.id);
console.log(completed.output);
```

### 📝 Content Generation

Generate marketing content with AI:

```typescript
// Generate content
const draft = await client.content.generate({
  topic: 'Email Marketing Best Practices',
  tone: 'professional',
  audience: 'small business owners',
  kind: 'article'
});

// Update draft
await client.content.updateDraft(draft.id, {
  title: 'New Title',
  body: 'Updated content...'
});

// Publish
const published = await client.content.publish(draft.id);
```

### 🎯 Campaigns

Manage marketing campaigns:

```typescript
// Create campaign
const campaign = await client.campaigns.create({
  name: 'Q1 2025 Launch',
  type: 'email',
  organizationId: 'org_123',
  ownerId: 'user_456',
  config: {
    segments: ['segment_1', 'segment_2']
  },
  budget: {
    total: 10000,
    currency: 'USD'
  }
});

// Start campaign
await client.campaigns.start(campaign.id);

// Get metrics
const metrics = await client.campaigns.getMetrics(campaign.id);
```

### 📊 Marketing Analytics

Track marketing performance:

```typescript
// Get overall metrics
const metrics = await client.marketing.getMetrics({
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});

console.log(metrics.roi, metrics.conversions);

// List leads
const leads = await client.marketing.listLeads({
  status: 'qualified',
  grade: 'A'
});
```

### 🔄 Orchestration

Run multi-agent workflows:

```typescript
// Execute orchestration
const run = await client.orchestration.execute({
  workflow: 'content-to-campaign',
  params: {
    topic: 'Product Launch',
    channels: ['email', 'social']
  },
  organizationId: 'org_123'
});

// Wait for completion
const result = await client.orchestration.waitForCompletion(run.runId);
console.log(result.steps);
```

## Error Handling

The SDK provides typed error classes:

```typescript
import {
  NeonHubError,
  APIError,
  ValidationError,
  AuthenticationError,
  RateLimitError
} from '@neonhub/sdk';

try {
  await client.agents.execute({ /* ... */ });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.errors);
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof AuthenticationError) {
    console.error('Authentication failed');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import type {
  Agent,
  AgentKind,
  Campaign,
  ContentDraft,
  MarketingLead
} from '@neonhub/sdk';

// All types are exported and available
const agent: Agent = await client.agents.get('agent_123');
```

## Examples

See the [examples directory](./examples) for complete working examples:

- [Basic Usage](./examples/basic-usage.ts)
- [Agent Execution](./examples/agent-execution.ts)
- [Content Generation](./examples/content-generation.ts)
- [Campaign Creation](./examples/campaign-creation.ts)
- [Orchestration](./examples/orchestration.ts)

## API Reference

For detailed API documentation, see [SDK_REFERENCE.md](../../docs/SDK_REFERENCE.md)

## Requirements

- Node.js >=18.0.0
- TypeScript >=5.0.0 (for TypeScript projects)

## License

MIT

## Support

- Documentation: https://docs.neonhubecosystem.com
- Issues: https://github.com/NeonHub3A/neonhub/issues
- Email: support@neonhubecosystem.com

---

Made with ❤️ by NeonHub Technologies

