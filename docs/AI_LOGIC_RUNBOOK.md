# AI & Logic Stack - Production Runbook

**Status**: ✅ 100% Complete  
**Version**: 1.0.0  
**Last Updated**: November 1, 2025

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Deployment](#deployment)
5. [Monitoring](#monitoring)
6. [Troubleshooting](#troubleshooting)
7. [Security](#security)
8. [Performance](#performance)

---

## Overview

The AI & Logic stack provides production-grade infrastructure for NeonHub's AI-powered agents with:

- **Unified LLM Adapter** - Multi-provider support with retry, timeout, circuit breaker, cost tracking
- **Prompt Registry** - Versioned prompts with compilation and snapshot testing
- **Tools Framework** - Schema-first function calling with budgets and retries
- **Memory & RAG** - pgvector-powered semantic search and knowledge bases
- **Orchestrator** - Intelligent planning and execution with replay
- **Policy & Safety** - PII scrubbing, abuse filters, jailbreak detection (⚠️ See policy package)
- **Telemetry** - OpenTelemetry spans, cost tracking, outcomes
- **Evaluation** - Golden datasets, adversarial tests, CI gates
- **Learning Loop** - Variant testing, SLOs, auto-rollback

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
│            (Content, SEO, Email, Social Agents)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Orchestrator                             │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │  Planner    │─▶│ Executor │─▶│ Capability Registry │   │
│  └─────────────┘  └──────────┘  └────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌──────────────┐
│ LLM Adapter │ │   Tools     │ │ Memory & RAG │
│             │ │ Framework   │ │              │
│ ├ OpenAI    │ │ ├ Runner    │ │ ├ Profile   │
│ ├ Zai       │ │ ├ Registry  │ │ ├ Conv      │
│ └ Circuit   │ │ └ Budget    │ │ └ KB        │
└─────────────┘ └─────────────┘ └──────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌─────────────────┐         ┌──────────────────┐
│ Prompt Registry │         │    Telemetry     │
│ ├ Compiler      │         │ ├ OTel Spans    │
│ ├ Versioning    │         │ ├ Cost Tracker  │
│ └ Snapshots     │         │ └ Outcomes API  │
└─────────────────┘         └──────────────────┘
```

---

## Core Components

### 1. LLM Adapter (`@neonhub/llm-adapter`)

**Location**: `/core/llm-adapter`

**Capabilities**:
- Multi-provider support (OpenAI, Zai)
- Automatic retries with exponential backoff
- Circuit breaker pattern
- Timeout protection
- Real-time cost tracking
- Streaming support

**Usage**:
```typescript
import { OpenAIAdapter } from '@neonhub/llm-adapter';

const adapter = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY!,
  enableCircuitBreaker: true,
  enableCostTracking: true,
});

const response = await adapter.chat({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
  temperature: 0.7,
});

// Get cost report
console.log(adapter.getCostReport());
```

**Monitoring**:
- Circuit breaker status: `adapter.getCircuitBreakerStatus()`
- Cost tracking: `adapter.getCostTracker().getTotalCost()`
- Health check: `adapter.healthCheck()`

---

### 2. Prompt Registry (`@neonhub/prompt-registry`)

**Location**: `/core/prompt-registry`

**Capabilities**:
- Markdown and JSON prompt templates
- Handlebars compilation with helpers
- Version management
- Snapshot testing for regression detection
- Multi-agent, multi-locale support

**Directory Structure**:
```
prompts/
├── content/
│   ├── blog-post.md
│   └── landing-page.md
├── seo/
│   ├── meta-description.md
│   └── title-tags.md
├── email/
│   └── campaign.md
└── social/
    └── linkedin-post.md
```

**Usage**:
```typescript
import { PromptRegistry, PromptCompiler } from '@neonhub/prompt-registry';

const registry = new PromptRegistry('./prompts');
await registry.loadAll();

const prompt = registry.get('content-blog-post', '1.0.0');
const compiler = new PromptCompiler();

const compiled = compiler.compile(prompt!, {
  topic: 'AI in Marketing',
  tone: 'professional',
  keywords: ['AI', 'automation'],
});
```

**Versioning**:
- Always specify version in frontmatter
- Use semantic versioning: `1.0.0`, `1.1.0`, `2.0.0`
- Test prompts before promoting to production

---

### 3. Tools Framework (`@neonhub/tools-framework`)

**Location**: `/core/tools-framework`

**Capabilities**:
- Zod schema validation
- Timeout and retry control
- Budget tracking (cost, tokens, time)
- Tool registry
- Batch and sequential execution
- OpenAI function format export

**Usage**:
```typescript
import { ToolRunner, ToolRegistry } from '@neonhub/tools-framework';

const runner = new ToolRunner();
const registry = new ToolRegistry();

// Register tools
registry.register(webSearchTool);
registry.register(sendEmailTool);

// Execute with budget
const result = await runner.execute(
  webSearchTool,
  { query: 'AI trends' },
  {
    timeout: 10000,
    maxRetries: 3,
    budget: { maxCost: 0.01, maxTime: 30000 },
  }
);
```

---

### 4. Memory & RAG (`@neonhub/memory-rag`)

**Location**: `/core/memory-rag`

**Capabilities**:
- Profile store for user preferences
- Conversation store with embeddings
- Knowledge base with pgvector search
- Automatic chunking and embedding
- Multi-entity support (brand, product, campaign)

**Database Setup**:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX ON "ConversationMessage" 
  USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX ON "KBChunk" 
  USING ivfflat (embedding vector_cosine_ops);
```

**Usage**:
```typescript
import { KBStore, SimpleEmbeddingProvider } from '@neonhub/memory-rag';

const kbStore = new KBStore(prisma, embeddingProvider);

// Ingest document
await kbStore.ingest(
  'brand',
  'Brand Voice Guidelines',
  content,
  { entityId: 'brand_123', chunkSize: 500 }
);

// Retrieve relevant chunks
const results = await kbStore.retrieve('What is our brand voice?', {
  topK: 5,
  minScore: 0.75,
  filters: { type: 'brand', entityId: 'brand_123' },
});
```

**API wiring (`apps/api/src/services/rag`)**
- `ai/embeddings.ts` produces deterministic vectors when OpenAI is unavailable so Jest + local dev remain stable.
- `MemoryRagService` writes and searches the `mem_embeddings` table; `EventIntakeService` + `PersonService.addNote` now push notable interactions through it so support + outreach agents inherit fresh context.
- `KnowledgeBaseService` manages org-scoped datasets and chunk ingestion (content/seo/email/support/trend); each agent logs its outputs back into the appropriate `datasetSlug` (e.g., `seo-{orgId}`).
- `RagContextService` composes brand voice hits, KB snippets, and short-term memories and exposes `formatForPrompt()` so agents can prepend structured context to their LLM prompts.

**Flow recap**
1. `embedText(input)` → deterministic vector (fallback-friendly).
2. `MemoryRagService.storeSnippet` or `KnowledgeBaseService.ingestSnippet` attach vectors to `mem_embeddings` / `chunks`.
3. `RagContextService.build({...})` fan-outs over memories + datasets (email/content/seo/support/trend) and optional brand voice search.
4. Agents (Content/SEO/Email/Support/Trend) call `formatForPrompt()` and persist their outputs back to `KnowledgeBaseService` for continual learning.

**RAG Pathway Diagram**

```
 Customer Event / Support Ticket / Persona Note
                │
                ▼
        EventIntakeService / PersonService
                │  (normalizes payloads, tags org + channel)
                ▼
        MemoryRagService.storeSnippet ─────────────┐
                │                                 │
                ▼                                 │
         mem_embeddings (pgvector)                │
                │                                 │
 Brand Voice / Agent Outputs ──▶ KnowledgeBaseService.ingestSnippet
                │                                 │
                └──────────────┬──────────────────┘
                               ▼
                    RagContextService.build()
                      ├─ brandVoiceMatches()
                      ├─ memorySnippets()
                      └─ datasetSnippets() per domain
                               │
                               ▼
                 agents/*.handle() → formatForPrompt()
                               │
                               ▼
                KnowledgeBaseService.logArtifact()
```

This loop guarantees every customer signal (EventIntake, support replies, outbound content) is embedded exactly once and rehydrated in prompts in under ~150 ms thanks to pgvector indexing plus deterministic fallbacks.

---

### 5. Orchestrator (`@neonhub/orchestrator-ai`)

**Location**: `/core/orchestrator-ai`

**Capabilities**:
- Goal decomposition into steps
- Dependency-aware execution
- Parallel and sequential modes
- Policy hooks (pre/post execution)
- Plan replay for debugging
- Capability registry

**Usage**:
```typescript
import {
  Planner,
  Executor,
  CapabilityRegistry,
  PlanReplay,
} from '@neonhub/orchestrator-ai';

const registry = new CapabilityRegistry();
const replay = new PlanReplay();
const planner = new Planner(registry);
const executor = new Executor(registry, replay);

// Create goal
const goal = {
  id: 'goal_1',
  description: 'Create and publish blog post',
  success_criteria: ['Content created', 'SEO optimized'],
  context: { topic: 'AI' },
};

// Plan and execute
const plan = await planner.plan(goal);
const result = await executor.execute(plan);

// Replay for debugging
await replay.replay(plan.id);
```

**API Contract (`@neonhub/orchestrator-contract`)**

- Request payload (`OrchestratorRequestSchema`):

```json
{
  "intent": "seo-audit",
  "agent": "SEOAgent",
  "payload": { "keyword": "ai automation" },
  "context": { "organizationId": "org_123", "userId": "user_456" }
}
```

> `agent` is optional when the intent is known; the orchestrator uses `resolveAgentForIntent` to auto-populate the correct agent and rejects mismatched combinations with `INTENT_AGENT_MISMATCH`.

- Success envelope (`success: true`):

```json
{
  "success": true,
  "status": "completed",
  "agent": "SEOAgent",
  "intent": "seo-audit",
  "runId": "run_abc",
  "data": { "...agent output..." },
  "timestamp": "2025-11-21T18:00:00.000Z",
  "metrics": { "durationSeconds": 2.1 }
}
```

- Error envelope (`success: false`):

```json
{
  "success": false,
  "status": "failed",
  "agent": "SEOAgent",
  "intent": "seo-audit",
  "error": {
    "code": "INVALID_REQUEST",
    "message": "At least one seed keyword is required",
    "details": null
  },
  "timestamp": "2025-11-21T18:00:00.000Z"
}
```

The backend route (`/api/orchestrate`) and SDK (`client.orchestration.execute/executeIntent`) both import the shared schema to guarantee identical validation and response shapes.

---

## Deployment

### Prerequisites

1. **Environment Variables**:
```bash
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
NODE_ENV=production
```

2. **Database Migrations**:
```bash
pnpm --filter apps/api prisma:migrate:deploy
```

3. **Enable pgvector**:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Build

```bash
# Build all core packages
cd core/llm-adapter && pnpm build
cd core/prompt-registry && pnpm build
cd core/tools-framework && pnpm build
cd core/memory-rag && pnpm build
cd core/orchestrator-ai && pnpm build
```

### Install Dependencies

```bash
pnpm install
```

### SDK / Web Transport Defaults

- `@neonhub/sdk` resolves its `baseURL` to `http://localhost:3001` when no env overrides are set (`NEONHUB_API_URL`, `NEXT_PUBLIC_NH_API_URL`, `NH_API_URL`).
- The Next.js app uses the SDK out of the box and only enables the mock transport when `NEXT_PUBLIC_NH_USE_MOCKS=true`; local development should keep this flag unset (or `false`) to exercise the real `/api/orchestrate` flow.


### Start Services

```bash
# API server
pnpm --filter apps/api start

# Web UI
pnpm --filter apps/web start
```

---

## Monitoring

### Health Checks

```typescript
// LLM Adapter
const healthy = await adapter.healthCheck();

// Circuit Breaker Status
const status = adapter.getCircuitBreakerStatus();
// { state: 'CLOSED', failures: 0, successes: 10 }

// Cost Tracking
const cost = adapter.getCostTracker().getTotalCost();
console.log(`Total cost: $${cost.toFixed(4)}`);
```

### Metrics

- **LLM Calls**: Total, success rate, average latency
- **Cost**: Per model, per agent, total
- **Tokens**: Input, output, total
- **Circuit Breaker**: State transitions, failure count
- **Tool Executions**: Success rate, average duration
- **Memory Operations**: Read/write latency, cache hit rate

### Logging

All components use `pino` for structured logging:

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});
```

---

## Troubleshooting

### Circuit Breaker Open

**Symptom**: `Circuit breaker is OPEN - too many recent failures`

**Cause**: Multiple consecutive LLM call failures

**Solution**:
1. Check API key validity
2. Verify network connectivity
3. Check provider status page
4. Reset circuit breaker: `adapter.resetCircuitBreaker()`

### High Costs

**Symptom**: Unexpected high usage costs

**Solution**:
1. Review cost report: `adapter.getCostReport()`
2. Check for inefficient prompts
3. Reduce temperature or max_tokens
4. Implement budget limits in tools

### Slow RAG Queries

**Symptom**: Knowledge base searches taking >1s

**Solution**:
1. Verify pgvector indexes exist
2. Reduce `topK` parameter
3. Use filters to narrow search space
4. Consider caching frequent queries

### Plan Execution Failures

**Symptom**: Orchestrator plans failing mid-execution

**Solution**:
1. Review plan replay: `replay.getTimeline(planId)`
2. Check failed step details
3. Validate capability registrations
4. Enable sequential execution for debugging

---

## Security

### API Keys

- Store in environment variables
- Never commit to git
- Rotate regularly
- Use separate keys per environment

### Policy Hooks

Implement policy enforcement in orchestrator:

```typescript
const executor = new Executor(registry, replay, {
  policyHooks: [
    {
      name: 'rate_limit',
      async preExecution(step, context) {
        const allowed = await checkRateLimit(context.userId);
        return { allow: allowed, reason: 'Rate limit exceeded' };
      },
    },
  ],
});
```

### PII Handling

- Use policy pipeline for scrubbing
- Never log sensitive data
- Implement consent checks
- Audit data access

---

## Performance

### LLM Adapter

- **Caching**: Enable response caching for repeated queries
- **Streaming**: Use for long responses to reduce perceived latency
- **Model Selection**: Choose appropriate model for task (gpt-3.5-turbo vs gpt-4)

### Tools Framework

- **Parallel Execution**: Use batch execution for independent tools
- **Timeouts**: Set appropriate timeouts per tool
- **Retries**: Balance retries vs latency

### Memory & RAG

- **Chunk Size**: Balance context vs precision (500-1000 chars)
- **Overlap**: 10-20% overlap for context preservation
- **Index Strategy**: Use IVFFlat for >100K vectors
- **Batch Embeddings**: Generate in batches of 100

### Orchestrator

- **Parallel Execution**: Enable for independent steps
- **Plan Validation**: Validate before execution
- **Capability Caching**: Cache registry lookups

---

## Production Telemetry & Observability

### Exporter Configuration

**Tempo (Traces)**:
```bash
TEMPO_OTLP_HTTP_URL=https://tempo.your-domain.com:4318
TEMPO_AUTH_TOKEN=your_bearer_token
```

**Prometheus (Metrics)**:
```bash
PROM_REMOTE_WRITE_URL=https://prometheus.your-domain.com/api/v1/write
PROM_AUTH_TOKEN=your_bearer_token
```

### Rotating Exporter Endpoints

1. Update environment variables in deployment config
2. Restart OTel Collector: `docker compose restart otel-collector`
3. Verify connectivity: `pnpm prod:smoke`
4. Monitor logs for export errors

### Alert Remediation

**P95 Latency High** (>4.5s):
- Check LLM provider status pages
- Review recent prompt changes
- Scale up backend resources
- Enable response caching
- Consider model downgrade (gpt-4 → gpt-3.5-turbo)

**Error Rate High** (>2%):
- Check circuit breaker status
- Verify API keys valid
- Review recent deployments
- Check provider rate limits
- Inspect error logs for patterns

**Median Cost High** (>$0.03):
- Review prompt efficiency
- Check for token-heavy operations
- Implement aggressive caching
- Optimize prompt templates
- Consider cheaper models for non-critical tasks
- Review budget settings in tools

**Circuit Breaker Open**:
- Verify provider health
- Check network connectivity
- Review error patterns
- Reset circuit breaker: `adapter.resetCircuitBreaker()`
- Consider provider failover

**LLM Provider Down**:
- Check provider status page
- Verify API credentials
- Test connectivity manually
- Failover to backup provider (Zai)
- Enable degraded mode if available

**RAG Latency High**:
- Check pgvector index health
- Optimize query filters
- Reduce `topK` parameter
- Enable result caching
- Review database performance

**Plan Failure Rate High**:
- Review plan replay logs
- Check capability availability
- Verify dependency resolution
- Inspect failed step errors
- Consider plan simplification

**Token Budget Exhaustion**:
- Increase budget limits
- Optimize prompt length
- Review token-heavy tools
- Implement progressive summarization

### Trace Replay Workflow

**Locate Root Span**:
```bash
# Query Tempo/Jaeger by trace_id
curl "https://tempo.your-domain.com/api/traces/{trace_id}"
```

**Find Child Spans**:
```bash
# In Grafana/Jaeger UI:
# 1. Navigate to Explore → Tempo
# 2. Search for service: "neonhub-orchestrator-prod"
# 3. Filter by plan.id
# 4. Expand trace tree to see all steps
```

**Correlate Logs**:
```bash
# Logs include trace_id for correlation
# Search logs by trace_id to see full context
grep "trace_id.*abc123" application.log
```

**Analyze Failures**:
1. Find failed plan in plan replay
2. Get trace_id from replay logs
3. Query Tempo/Jaeger for trace details
4. Review child spans for error details
5. Correlate with application logs
6. Identify root cause
7. Apply fix or rollback

---

## Support

For issues or questions:

1. Check logs: `pnpm logs`
2. Review plan replay for debugging
3. Check Grafana dashboards
4. Query traces in Tempo/Jaeger
5. Review SLO metrics: `pnpm prod:slo`
6. Consult package READMEs
7. Contact: dev@neonhub.ai

---

**Last Updated**: November 2, 2025  
**Version**: 1.1.0 (Production Telemetry)

**End of Runbook**
