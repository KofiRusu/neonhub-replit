# NeonHub LoopDrive - Quick Start Guide

Get up and running with NeonHub's agentic marketing architecture in under 10 minutes.

---

## Prerequisites

- Node.js 20+
- PostgreSQL 16 with pgvector
- Redis (for queues)
- OpenAI API key
- (Optional) Channel API keys: Resend, Twilio, Meta, etc.

---

## 1. Installation

```bash
# Clone the repository
git clone https://github.com/NeonHub3A/neonhub.git
cd neonhub

# Install dependencies
pnpm install --frozen-lockfile

# Generate Prisma client
pnpm --filter apps/api run prisma:generate
```

---

## 2. Environment Setup

Copy the environment template and fill in your credentials:

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env
```

### Required Environment Variables

```bash
# apps/api/.env

# Database (Neon.tech or local PostgreSQL with pgvector)
DATABASE_URL="postgresql://user:pass@localhost:5432/neonhub"
DIRECT_DATABASE_URL="postgresql://user:pass@localhost:5432/neonhub"

# OpenAI for Brand Voice Orchestrator
OPENAI_API_KEY="sk-..."

# Redis for queues
REDIS_URL="redis://localhost:6379"

# Email (choose one)
RESEND_API_KEY="re_..."
# or
SENDGRID_API_KEY="SG..."

# SMS (optional)
TWILIO_SID="AC..."
TWILIO_AUTH_TOKEN="..."

# Stripe (for budget wallet)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Auth
NEXTAUTH_SECRET="generate-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 3. Database Setup

### Enable pgvector Extension

```sql
-- Connect to your database
psql $DATABASE_URL

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS citext;
```

### Run Migrations

```bash
# Apply all migrations
pnpm --filter apps/api run prisma:migrate:deploy

# Seed initial data (orgs, brands, agents)
pnpm --filter apps/api run seed
```

### Verify Schema

```bash
# Check migration status
pnpm --filter apps/api run prisma:migrate status

# Open Prisma Studio to explore data
pnpm --filter apps/api run prisma:studio
```

---

## 4. Start Development Servers

```bash
# Terminal 1: Start API server
pnpm --filter apps/api run dev
# → http://localhost:4000

# Terminal 2: Start web app
pnpm --filter apps/web run dev
# → http://localhost:3000

# Terminal 3: Start queue workers (in future implementation)
# pnpm --filter apps/api run workers
```

---

## 5. Verify Installation

### Health Check

```bash
curl http://localhost:4000/api/health

# Expected response:
{
  "status": "healthy",
  "version": "3.2.0",
  "timestamp": "2025-10-28T10:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "openai": "configured"
  }
}
```

---

## 6. Your First Agentic Workflow

### Step 1: Create a Person

```bash
curl -X POST http://localhost:4000/api/person/resolve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $YOUR_API_KEY" \
  -d '{
    "email": "jane.doe@example.com"
  }'
```

**Response:**
```json
{
  "person": {
    "id": "per_abc123",
    "workspaceId": "ws_default",
    "firstName": null,
    "lastName": null
  },
  "identities": [
    {
      "id": "ident_xyz",
      "type": "email",
      "value": "jane.doe@example.com",
      "verified": false
    }
  ],
  "matchedOn": ["email"],
  "confidence": 1.0
}
```

### Step 2: Grant Consent

```bash
curl -X POST http://localhost:4000/api/person/per_abc123/consent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $YOUR_API_KEY" \
  -d '{
    "channel": "email",
    "scope": "marketing",
    "status": "granted",
    "source": "api"
  }'
```

### Step 3: Add Some Memory (Context)

```bash
curl -X POST http://localhost:4000/api/person/per_abc123/memory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $YOUR_API_KEY" \
  -d '{
    "kind": "fact",
    "text": "Interested in marketing automation tools. Currently uses HubSpot.",
    "confidence": 0.9
  }'
```

### Step 4: Compose Personalized Email with Brand Voice

```bash
curl -X POST http://localhost:4000/api/brand-voice/compose \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $YOUR_API_KEY" \
  -d '{
    "brandId": "brand_default",
    "channel": "email",
    "objective": "demo_book",
    "personId": "per_abc123",
    "constraints": {
      "maxLength": 500,
      "tone": "professional",
      "includeLink": true
    }
  }'
```

**Response:**
```json
{
  "primary": {
    "subject": "Quick question about your HubSpot setup",
    "body": "Hi there,\n\nI noticed you're using HubSpot for your marketing automation...",
    "cta": "Book a 15-minute demo",
    "ps": null
  },
  "variants": [
    { "subject": "Supercharge your HubSpot with AI", "body": "..." },
    { "subject": "15 minutes to 10x your marketing ROI?", "body": "..." }
  ],
  "metadata": {
    "model": "gpt-4-turbo",
    "tokensUsed": 380,
    "latencyMs": 1100,
    "snippetsUsed": []
  }
}
```

### Step 5: Send the Email

```bash
curl -X POST http://localhost:4000/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $YOUR_API_KEY" \
  -d '{
    "personId": "per_abc123",
    "brandId": "brand_default",
    "objective": "demo_book",
    "utmParams": {
      "source": "quickstart",
      "medium": "email",
      "campaign": "demo"
    }
  }'
```

**Response:**
```json
{
  "id": "send_def456",
  "status": "queued",
  "personId": "per_abc123",
  "channel": "email",
  "externalId": null,
  "sentAt": null
}
```

### Step 6: Check Send Status

```bash
curl http://localhost:4000/api/send/send_def456/status \
  -H "Authorization: Bearer $YOUR_API_KEY"
```

**Response:**
```json
{
  "id": "send_def456",
  "status": "delivered",
  "events": [
    { "type": "email.sent", "ts": "2025-10-28T10:05:00Z" },
    { "type": "email.delivered", "ts": "2025-10-28T10:05:02Z" }
  ],
  "lastUpdated": "2025-10-28T10:05:02Z"
}
```

### Step 7: View Person Timeline

```bash
curl http://localhost:4000/api/person/per_abc123/timeline \
  -H "Authorization: Bearer $YOUR_API_KEY"
```

**Response:**
```json
[
  {
    "id": "evt_1",
    "type": "email.sent",
    "channel": "email",
    "ts": "2025-10-28T10:05:00Z",
    "payload": { "subject": "Quick question about your HubSpot setup" }
  },
  {
    "id": "evt_2",
    "type": "email.delivered",
    "channel": "email",
    "ts": "2025-10-28T10:05:02Z",
    "payload": {}
  }
]
```

---

## 7. Using the SDK (TypeScript)

### Installation

```bash
npm install @neonhub/sdk
# or
pnpm add @neonhub/sdk
```

### Basic Usage

```typescript
import { NeonHubClient } from '@neonhub/sdk';

// Initialize client
const client = new NeonHubClient({
  baseURL: 'http://localhost:4000',
  apiKey: 'your-api-key'
});

// Resolve person
const result = await client.person.resolve({
  email: 'jane.doe@example.com'
});
console.log('Person ID:', result.person.id);

// Grant consent
await client.person.updateConsent(result.person.id, {
  channel: 'email',
  scope: 'marketing',
  status: 'granted',
  source: 'api'
});

// Compose with brand voice
const composition = await client.voice.compose({
  brandId: 'brand_default',
  channel: 'email',
  objective: 'demo_book',
  personId: result.person.id,
  constraints: {
    maxLength: 500,
    tone: 'professional'
  }
});

console.log('Subject:', composition.primary.subject);
console.log('Body:', composition.primary.body);

// Send email
const sendResult = await client.send.email({
  personId: result.person.id,
  brandId: 'brand_default',
  objective: 'demo_book',
  utmParams: {
    source: 'sdk',
    medium: 'email',
    campaign: 'demo'
  }
});

console.log('Send ID:', sendResult.id);

// Check status
const status = await client.send.getStatus(sendResult.id);
console.log('Status:', status.status);

// Get timeline
const timeline = await client.events.getTimeline(result.person.id, {
  limit: 10
});
timeline.forEach(event => {
  console.log(`${event.type} at ${event.ts}`);
});
```

---

## 8. Budget Allocation Example

```typescript
import { NeonHubClient } from '@neonhub/sdk';

const client = new NeonHubClient({
  baseURL: 'http://localhost:4000',
  apiKey: 'your-api-key'
});

// Create budget plan
const plan = await client.budget.plan({
  workspaceId: 'ws_default',
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

console.log('Allocation plan:', plan.channels);
console.log('Predicted ROAS:', plan.predictions.averageROAS);
console.log('Predicted conversions:', plan.predictions.totalConversions);

// Approve and execute (in production, this would require approval workflow)
await client.budget.execute(plan.id);

// Check wallet balance
const balance = await client.budget.getWalletBalance('ws_default');
console.log('Wallet balance:', balance / 100, 'USD');

// Get dashboard
const dashboard = await client.budget.getDashboard('ws_default', {
  from: new Date('2025-10-01'),
  to: new Date('2025-10-31')
});
console.log('Total spent:', dashboard.summary.totalSpent / 100, 'USD');
console.log('Average ROAS:', dashboard.summary.avgROAS);
```

---

## 9. Frontend Integration (React/Next.js)

### Person Timeline Component

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { NeonHubClient } from '@neonhub/sdk';

const client = new NeonHubClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  apiKey: process.env.NEXT_PUBLIC_API_KEY!
});

export function PersonTimeline({ personId }: { personId: string }) {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ['timeline', personId],
    queryFn: () => client.events.getTimeline(personId, { limit: 50 })
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Activity Timeline</h2>
      <div className="space-y-2">
        {timeline?.map(event => (
          <div key={event.id} className="border p-4 rounded">
            <div className="flex justify-between">
              <span className="font-medium">{event.type}</span>
              <span className="text-sm text-gray-500">
                {new Date(event.ts).toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {event.channel} • {event.source}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Brand Voice Playground

```tsx
'use client';

import { useState } from 'react';
import { NeonHubClient } from '@neonhub/sdk';

const client = new NeonHubClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  apiKey: process.env.NEXT_PUBLIC_API_KEY!
});

export function BrandVoicePlayground() {
  const [personId, setPersonId] = useState('');
  const [objective, setObjective] = useState('demo_book');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompose = async () => {
    setLoading(true);
    try {
      const composition = await client.voice.compose({
        brandId: 'brand_default',
        channel: 'email',
        objective,
        personId,
        constraints: { maxLength: 500 }
      });
      setResult(composition);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Brand Voice Playground</h2>
      
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Person ID"
          value={personId}
          onChange={(e) => setPersonId(e.target.value)}
          className="w-full p-2 border rounded"
        />
        
        <select
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="demo_book">Book Demo</option>
          <option value="winback">Win Back</option>
          <option value="nurture">Nurture</option>
          <option value="upsell">Upsell</option>
        </select>

        <button
          onClick={handleCompose}
          disabled={loading || !personId}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Composing...' : 'Compose Email'}
        </button>
      </div>

      {result && (
        <div className="space-y-4 mt-6">
          <div className="border p-4 rounded">
            <h3 className="font-bold mb-2">Primary Variant</h3>
            <p className="text-sm text-gray-600 mb-1">Subject:</p>
            <p className="font-medium mb-3">{result.primary.subject}</p>
            <p className="text-sm text-gray-600 mb-1">Body:</p>
            <p className="whitespace-pre-wrap">{result.primary.body}</p>
            {result.primary.cta && (
              <button className="mt-3 bg-green-600 text-white px-4 py-2 rounded">
                {result.primary.cta}
              </button>
            )}
          </div>

          {result.variants.map((variant, idx) => (
            <div key={idx} className="border p-4 rounded bg-gray-50">
              <h3 className="font-bold mb-2">Variant {String.fromCharCode(65 + idx)}</h3>
              <p className="text-sm text-gray-600 mb-1">Subject:</p>
              <p className="font-medium">{variant.subject}</p>
            </div>
          ))}

          <div className="text-sm text-gray-500">
            Model: {result.metadata.model} • 
            Tokens: {result.metadata.tokensUsed} • 
            Latency: {result.metadata.latencyMs}ms
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 10. Testing

### Run Tests

```bash
# Backend unit tests
pnpm --filter apps/api run test

# Backend with coverage
pnpm --filter apps/api run test:coverage

# Frontend E2E tests
pnpm --filter apps/web run test:e2e
```

### Integration Test Example

```typescript
// apps/api/src/__tests__/integration/agentic-flow.test.ts

import { NeonHubClient } from '@neonhub/sdk';

describe('Agentic Flow Integration', () => {
  const client = new NeonHubClient({
    baseURL: 'http://localhost:4000',
    apiKey: process.env.TEST_API_KEY!
  });

  it('should complete full personalized email flow', async () => {
    // 1. Resolve person
    const result = await client.person.resolve({
      email: 'test@example.com'
    });
    expect(result.person.id).toBeDefined();

    // 2. Grant consent
    await client.person.updateConsent(result.person.id, {
      channel: 'email',
      scope: 'marketing',
      status: 'granted',
      source: 'test'
    });

    // 3. Add memory
    await client.person.addMemory(result.person.id, {
      kind: 'fact',
      text: 'Interested in AI marketing tools',
      confidence: 0.9
    });

    // 4. Compose email
    const composition = await client.voice.compose({
      brandId: 'brand_default',
      channel: 'email',
      objective: 'demo_book',
      personId: result.person.id
    });
    expect(composition.primary.subject).toBeDefined();
    expect(composition.primary.body).toContain('AI');

    // 5. Send email
    const sendResult = await client.send.email({
      personId: result.person.id,
      brandId: 'brand_default',
      objective: 'demo_book'
    });
    expect(sendResult.status).toBe('queued');

    // 6. Verify timeline
    const timeline = await client.events.getTimeline(result.person.id);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].type).toBe('email.sent');
  });
});
```

---

## 11. Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check pgvector
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### Redis Connection Issues

```bash
# Test Redis
redis-cli -u $REDIS_URL ping
# Should return: PONG
```

### OpenAI API Issues

```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Queue Not Processing

```bash
# Check queue stats
curl http://localhost:4000/api/queues/stats \
  -H "Authorization: Bearer $API_KEY"

# Restart workers
pnpm --filter apps/api run workers
```

---

## 12. Next Steps

- [ ] Read [AGENTIC_ARCHITECTURE.md](./AGENTIC_ARCHITECTURE.md) for detailed system design
- [ ] Explore the [SDK documentation](./core/sdk/README.md)
- [ ] Configure additional channel integrations (Twilio, Meta, etc.)
- [ ] Set up Stripe for budget wallet functionality
- [ ] Deploy to staging environment
- [ ] Configure monitoring and alerts

---

## Resources

- **API Documentation**: `apps/api/API_REFERENCE_AGENTIC.md` (coming soon)
- **SDK Examples**: `core/sdk/examples/`
- **Deployment Guide**: `DB_DEPLOYMENT_RUNBOOK.md`
- **Architecture Diagrams**: `AGENTIC_ARCHITECTURE.md`
- **Discord Community**: [discord.gg/neonhub](https://discord.gg/neonhub)

---

**Need Help?**

- GitHub Issues: https://github.com/NeonHub3A/neonhub/issues
- Discord: https://discord.gg/neonhub
- Email: support@neonhubecosystem.com

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-28

