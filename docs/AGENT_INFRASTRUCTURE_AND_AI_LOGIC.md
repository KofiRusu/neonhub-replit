# NeonHub Agent Infrastructure & AI Logic

**Version:** 3.0+  
**Last Updated:** November 17, 2025  
**Status:** Production-grade AI System

---

## Table of Contents

1. [Overview](#overview)
2. [The Seven Agents](#the-seven-agents)
3. [Agent Architecture](#agent-architecture)
4. [AI Logic Implementation](#ai-logic-implementation)
5. [Learning Loops & Adaptation](#learning-loops--adaptation)
6. [Memory & RAG](#memory--rag)
7. [Tool Execution Framework](#tool-execution-framework)
8. [Agent Orchestration](#agent-orchestration)
9. [Scoring & Quality](#scoring--quality)
10. [Performance Metrics](#performance-metrics)
11. [Related Documentation](#related-documentation)

---

## Overview

NeonHub's agent infrastructure is built on the **LoopDrive architecture** - an identity-first, memory-powered, closed-loop learning system. The platform features **seven specialized AI agents** working together to automate marketing workflows.

### Key Capabilities

- **Multi-Agent Coordination:** Seven specialized agents with distinct capabilities
- **Learning Loops:** Continuous improvement from campaign outcomes
- **RAG-Powered Memory:** pgvector for personal and brand memory
- **Tool Execution:** Extensible tool framework for agent actions
- **Quality Scoring:** Content scoring before delivery
- **Performance Tracking:** Full telemetry and metrics

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                User Request / Campaign Goal              │
└────────────────────┬────────────────────────────────────┘
                     │
              ┌──────▼───────┐
              │ Orchestrator │ ← Decomposes tasks
              │    Agent     │
              └──────┬───────┘
                     │
      ┌──────────────┼──────────────┬──────────────┐
      │              │              │              │
┌─────▼─────┐  ┌────▼────┐   ┌─────▼─────┐  ┌────▼────┐
│ Campaign  │  │ Content │   │    SEO    │  │  Email  │
│   Agent   │  │  Agent  │   │   Agent   │  │  Agent  │
└─────┬─────┘  └────┬────┘   └─────┬─────┘  └────┬────┘
      │             │               │             │
      └─────────────┴───────────────┴─────────────┘
                     │
              ┌──────▼───────┐
              │ Learning Loop│ ← Collects metrics
              │   & Scoring  │    & improves
              └──────────────┘
```

---

## The Seven Agents

### 1. Campaign Agent (Ad Agent)

**File:** `apps/api/src/agents/campaign.agent.ts`

**Purpose:** Campaign creation, strategy, and budget optimization

**Capabilities:**
- Generate campaign strategies from business goals
- Create multi-variant campaigns (A/B/C testing)
- Optimize budget allocation across channels
- Schedule campaign execution
- Analyze campaign performance
- Recommend improvements

**Inputs:**
- Business objective (awareness, leads, sales, etc.)
- Target audience
- Budget
- Timeline
- Channels (email, social, paid ads)

**Outputs:**
- Campaign strategy document
- Campaign configuration
- Execution schedule
- Budget allocation plan

**Tools:**
- Campaign creation
- Budget optimizer
- Analytics tracker
- A/B test manager

### 2. Content Agent

**File:** `apps/api/src/agents/content.agent.ts`

**Purpose:** AI-powered content generation across formats

**Capabilities:**
- Generate blog posts, articles, landing pages
- Create email sequences
- Write social media posts
- Produce product descriptions
- Maintain brand voice consistency (via RAG)
- Optimize for SEO
- Score content quality

**Inputs:**
- Content type (blog, email, social, etc.)
- Topic / prompt
- Target audience
- Tone / style
- Word count / constraints
- Brand voice guide

**Outputs:**
- Generated content draft
- Quality score (0-100)
- SEO recommendations
- Internal linking suggestions

**Tools:**
- LLM text generation (GPT-4/5)
- Brand voice RAG retrieval
- SEO analyzer
- Readability scorer

### 3. SEO Agent

**File:** `apps/api/src/agents/seo.agent.ts`

**Purpose:** Search engine optimization and keyword strategy

**Capabilities:**
- Keyword research with clustering
- Search intent classification
- Keyword difficulty scoring
- Meta tag generation (title, description)
- Schema markup (JSON-LD)
- Internal linking suggestions
- Content optimization
- Analytics tracking (GA4, Search Console)

**Inputs:**
- Target keywords or topic
- Content URL or draft
- Target geography
- Competitor URLs

**Outputs:**
- Keyword clusters with metrics
- Optimized meta tags
- Schema markup JSON
- Internal link recommendations
- Content optimization report

**Tools:**
- Keyword research API
- Competitor analysis
- GA4 integration
- Search Console integration
- pgvector similarity search (for internal links)

**See:** [`docs/SEO_AND_CONTENT_SYSTEM.md`](./SEO_AND_CONTENT_SYSTEM.md) for complete SEO documentation

### 4. Email Agent

**File:** `apps/api/src/agents/email.agent.ts`

**Purpose:** Email marketing automation and personalization

**Capabilities:**
- Generate personalized email copy
- Create email sequences (nurture, onboarding, etc.)
- A/B test subject lines and content
- Optimize send times per contact
- Track engagement (opens, clicks, replies)
- Segment audiences dynamically

**Inputs:**
- Email goal (nurture, convert, onboard, etc.)
- Target audience / segment
- Brand voice
- Existing customer data
- Send schedule constraints

**Outputs:**
- Email copy (subject + body)
- Variants for A/B testing
- Personalization tokens
- Optimal send time

**Tools:**
- Email composer
- Personalization engine
- Send time optimizer
- Engagement tracker

### 5. Social Agent

**File:** `apps/api/src/agents/social.agent.ts`

**Purpose:** Social media management and engagement

**Capabilities:**
- Generate platform-specific posts (Twitter, LinkedIn, Instagram)
- Adapt content to platform constraints
- Schedule posts at optimal times
- Monitor engagement (likes, shares, comments)
- Identify influencer opportunities
- Track competitor activity

**Inputs:**
- Platform (Twitter, LinkedIn, Instagram, etc.)
- Topic / message
- Brand voice
- Media assets (images, videos)
- Target audience

**Outputs:**
- Platform-specific post copy
- Media recommendations
- Optimal posting time
- Hashtag suggestions
- Engagement forecast

**Tools:**
- Post composer
- Platform adapter
- Media optimizer
- Engagement tracker
- Influencer finder

### 6. Support Agent

**File:** `apps/api/src/agents/support.agent.ts`

**Purpose:** Customer support automation and ticket handling

**Capabilities:**
- Generate support responses
- Analyze customer sentiment
- Route tickets to appropriate teams
- Suggest KB articles
- Track customer satisfaction
- Identify common issues

**Inputs:**
- Support ticket / message
- Customer history
- Product context
- KB articles

**Outputs:**
- Support response draft
- Sentiment score
- Routing recommendation
- KB article suggestions
- Escalation flag

**Tools:**
- Response generator
- Sentiment analyzer
- KB search (RAG)
- Ticket router

### 7. Trend Agent (Insight Agent)

**File:** `apps/api/src/agents/insight.agent.ts`

**Purpose:** Trend detection and market intelligence

**Capabilities:**
- Monitor social media trends
- Identify trending topics
- Analyze competitor activity
- Spot emerging opportunities
- Predict trend longevity
- Generate trend-based content ideas

**Inputs:**
- Industry / topic
- Competitors
- Geography
- Timeframe

**Outputs:**
- Trending topics with scores
- Trend analysis report
- Content opportunities
- Competitor insights

**Tools:**
- Social listening (Twitter, Reddit APIs)
- Trend scoring algorithm
- Competitor tracker
- Opportunity analyzer

---

## Agent Architecture

### Agent Handler Interface

All agents implement a common interface:

```typescript
interface AgentHandler {
  meta: AgentMeta;
  handle(input: AgentInput, context: AgentContext): Promise<AgentOutput>;
}

interface AgentMeta {
  name: string;
  kind: AgentKind;  // COPILOT | WORKFLOW | ANALYST
  capabilities: string[];
  requiredTools: string[];
}

interface AgentInput {
  prompt?: string;
  params: Record<string, any>;
}

interface AgentContext {
  user: User;
  workspace: Workspace;
  agent: Agent;
  memory?: MemoryContext;  // RAG context
  tools: ToolExecutor;
  logger: Logger;
}

interface AgentOutput {
  status: 'success' | 'error';
  result?: any;
  metadata?: {
    tokensUsed?: number;
    duration?: number;
    toolsUsed?: string[];
  };
  error?: string;
}
```

### Agent Lifecycle

```
1. Request Received
   ↓
2. Load Agent Configuration
   ↓
3. Retrieve Memory Context (RAG)
   ↓
4. Prepare Tools
   ↓
5. Execute Agent Handler
   ├── LLM Generation
   ├── Tool Execution
   └── Result Assembly
   ↓
6. Score Output Quality
   ↓
7. Persist AgentRun + ToolExecutions
   ↓
8. Update Metrics
   ↓
9. Return Result
```

---

## AI Logic Implementation

### Core AI Packages

#### 1. LLM Adapter (`core/llm-adapter`)

**Purpose:** Unified interface for multiple LLM providers

**Features:**
- OpenAI GPT-3.5/4/5
- Anthropic Claude 3.7
- Ollama (local models)
- Exponential backoff with jitter
- Circuit breaker pattern
- Cost tracking
- Streaming support

**Usage:**
```typescript
import { OpenAIAdapter } from '@neonhub/llm-adapter';

const adapter = new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY });

const response = await adapter.generate({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Generate a blog post...' }],
  temperature: 0.7,
  maxTokens: 2000
});
```

**See:** [`docs/AI_LLM_ADAPTERS.md`](./AI_LLM_ADAPTERS.md)

#### 2. Prompt Registry (`core/prompt-registry`)

**Purpose:** Centralized prompt management with versioning

**Features:**
- Markdown & JSON templates
- Handlebars compiler
- Versioning (semantic versioning)
- A/B testing support
- Multi-agent prompts
- Variable validation

**Usage:**
```typescript
import { PromptRegistry } from '@neonhub/prompt-registry';

const registry = new PromptRegistry({ basePath: './prompts' });
const prompt = await registry.getPrompt('content-agent/blog-post', '1.0.0');

const rendered = prompt.render({ 
  topic: 'AI Trends',
  tone: 'professional',
  wordCount: 1000
});
```

**See:** [`docs/PROMPT_REGISTRY_GUIDE.md`](./PROMPT_REGISTRY_GUIDE.md)

#### 3. Memory RAG (`core/memory-rag`)

**Purpose:** Vector memory and Retrieval Augmented Generation

**Features:**
- pgvector integration
- Embedding generation (OpenAI)
- Similarity search
- Memory management
- Context window optimization

**Usage:**
```typescript
import { VectorStore, EmbeddingService } from '@neonhub/memory-rag';

const vectorStore = new VectorStore({ prisma });
const embeddingService = new EmbeddingService({ llmAdapter });

// Store memory
const embedding = await embeddingService.embed('Brand voice guideline...');
await vectorStore.store({ personId, text, embedding, kind: 'brand_voice' });

// Retrieve similar memories
const context = await vectorStore.search({ personId, query: 'tone guidelines', limit: 5 });
```

#### 4. Tools Framework (`core/tools-framework`)

**Purpose:** Extensible tool execution for agents

**Features:**
- Tool registry
- Safe execution (sandboxed)
- Input/output validation (Zod)
- Retry logic
- Timeout protection
- Execution telemetry

**Usage:**
```typescript
import { ToolExecutor, ToolRegistry } from '@neonhub/tools-framework';

const toolRegistry = new ToolRegistry();
toolRegistry.register('search_web', searchWebTool);
toolRegistry.register('send_email', sendEmailTool);

const executor = new ToolExecutor({ registry: toolRegistry });

const result = await executor.execute('search_web', {
  query: 'latest AI trends',
  limit: 10
});
```

---

## Learning Loops & Adaptation

### Closed-Loop Learning System

NeonHub implements a closed-loop learning system where every campaign outcome feeds back to improve future performance.

```
┌─────────────┐
│ Agent Run   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Collect Metrics │ ← Opens, clicks, conversions
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Score Outcome   │ ← Success/failure classification
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Update Weights  │ ← Prompt weights, parameters
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Store Learning  │ ← AgentMetrics, Learning table
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Next Agent Run  │ ← Improved performance
└─────────────────┘
```

### Learning Loop Service

**File:** `apps/api/src/services/learning-loop.service.ts`

**Features:**
- Outcome tracking
- Performance scoring
- Parameter optimization
- A/B test winner selection
- Prompt evolution

**Example:**
```typescript
// After agent run completes
await learningLoopService.recordOutcome({
  agentRunId,
  metrics: {
    opens: 150,
    clicks: 45,
    conversions: 12
  }
});

// Learning loop analyzes and updates
await learningLoopService.optimize({
  agentId,
  targetMetric: 'conversions'
});

// Next run uses optimized parameters
const nextRun = await agentService.execute({
  agentId,
  input: { ... } // Uses learned parameters
});
```

### Agent Metrics Tracking

**Database:** `AgentMetrics` table

```prisma
model AgentMetrics {
  id              String   @id @default(cuid())
  agentId         String
  date            DateTime @db.Date
  totalRuns       Int      @default(0)
  successfulRuns  Int      @default(0)
  failedRuns      Int      @default(0)
  avgDuration     Float?
  totalTokens     Int      @default(0)
  totalCost       Float    @default(0)
}
```

**Aggregation:** Daily rollup of agent performance

**See:** [`docs/AI_LOGIC_RUNBOOK.md`](./AI_LOGIC_RUNBOOK.md) for operational details

---

## Memory & RAG

### Personal Memory (LoopDrive)

Each `Person` has personal memory stored in `MemEmbedding`:

```prisma
model MemEmbedding {
  id         String  @id @default(cuid())
  personId   String
  kind       String  // fact | intent | message | objection
  text       String  @db.Text
  embedding  Unsupported("vector(1536)")?
  createdAt  DateTime @default(now())
}
```

**Use Cases:**
- Remember customer preferences
- Track purchase history
- Store conversation context
- Personalize messaging

### Brand Voice Memory

Brand voice guidelines are embedded for RAG:

```prisma
model BrandVoiceEmbedding {
  id        String  @id @default(cuid())
  guideId   String
  chunk     String  @db.Text
  embedding Unsupported("vector(1536)")?
  createdAt DateTime @default(now())
}
```

**Use Cases:**
- Maintain brand voice consistency
- Guide content generation
- Validate tone matching

### RAG Pipeline

```typescript
// 1. Embed query
const queryEmbedding = await embeddingService.embed(prompt);

// 2. Search similar memories
const memories = await vectorStore.search({
  personId,
  embedding: queryEmbedding,
  limit: 5
});

// 3. Build context
const context = memories.map(m => m.text).join('\n\n');

// 4. Generate with context
const response = await llmAdapter.generate({
  messages: [
    { role: 'system', content: `Context:\n${context}` },
    { role: 'user', content: prompt }
  ]
});
```

---

## Tool Execution Framework

### Tool Registry

Agents can use registered tools:

```typescript
const toolRegistry = new ToolRegistry();

toolRegistry.register('search_web', {
  name: 'search_web',
  description: 'Search the web for information',
  input: z.object({
    query: z.string(),
    limit: z.number().optional()
  }),
  execute: async (input) => {
    // Implementation
  }
});
```

### Tool Execution Tracking

**Database:** `ToolExecution` table

```prisma
model ToolExecution {
  id          String    @id @default(cuid())
  agentRunId  String
  toolName    String
  input       Json
  output      Json?
  status      String    // pending | running | completed | failed
  startedAt   DateTime  @default(now())
  completedAt DateTime?
}
```

**Benefits:**
- Full audit trail
- Debug agent behavior
- Optimize tool usage
- Track tool costs

---

## Agent Orchestration

### Orchestrator Agent

**File:** `apps/api/src/services/orchestration/index.ts`

**Purpose:** Coordinate multiple agents for complex workflows

**Pattern:**
```typescript
// User request: "Launch a product campaign"
orchestrator.execute({
  goal: 'Launch product campaign',
  constraints: { budget: 10000, timeline: '2 weeks' }
});

// Orchestrator decomposes:
// 1. Campaign Agent → Create strategy
// 2. Content Agent → Generate landing page
// 3. SEO Agent → Optimize content
// 4. Email Agent → Create email sequence
// 5. Social Agent → Create social posts
// 6. Campaign Agent → Execute launch
```

**Features:**
- Task decomposition
- Agent routing
- Dependency management
- Failure handling
- Result synthesis

**See:** [`docs/ORCHESTRATION_GUIDE.md`](./ORCHESTRATION_GUIDE.md)

---

## Scoring & Quality

### Content Quality Scoring

**Service:** `apps/api/src/services/seo/content-optimizer.service.ts`

**Scoring Dimensions:**
1. **Readability** (Flesch-Kincaid) - Target: 60-70
2. **SEO** (keyword density, headers, meta) - Target: 80+
3. **Brand Alignment** (RAG similarity) - Target: 0.8+
4. **E-E-A-T** (expertise, authority, trust) - Target: 70+

**Aggregate Score:** `(readability * 0.2) + (seo * 0.3) + (brand * 0.3) + (eeat * 0.2)`

**Quality Gates:**
- **Excellent:** 85-100 → Publish immediately
- **Good:** 70-84 → Review and publish
- **Fair:** 50-69 → Revise before publishing
- **Poor:** <50 → Regenerate

---

## Performance Metrics

### Agent Performance KPIs

- **Success Rate:** Successful runs / total runs
- **Avg Duration:** Mean execution time
- **Token Usage:** Total tokens consumed
- **Cost:** Total spend on LLM API calls
- **User Satisfaction:** Explicit user feedback

### Campaign Performance KPIs

- **Open Rate:** Email opens / sends
- **Click Rate:** Clicks / opens
- **Conversion Rate:** Conversions / clicks
- **ROI:** Revenue / spend

### Learning Loop KPIs

- **Improvement Rate:** Performance delta over time
- **Optimization Cycles:** Number of learning iterations
- **Parameter Convergence:** Stability of learned parameters

---

## Related Documentation

### Agent Documentation
- [`AGENTIC_ARCHITECTURE.md`](../AGENTIC_ARCHITECTURE.md) - LoopDrive architecture
- [`AGENTIC_DELIVERY_SUMMARY.md`](../AGENTIC_DELIVERY_SUMMARY.md) - Delivery summary
- [`AGENT_INFRA_COMPLETION_REPORT.md`](../AGENT_INFRA_COMPLETION_REPORT.md) - Completion report
- [`AI_LOGIC_IMPLEMENTATION_COMPLETE.md`](../AI_LOGIC_IMPLEMENTATION_COMPLETE.md) - Implementation status
- [`docs/AGENTS_OVERVIEW.md`](./AGENTS_OVERVIEW.md) - Agent overview
- [`README_AGENTS.md`](../README_AGENTS.md) - User-facing agent docs

### AI Implementation
- [`docs/AI_LOGIC_RUNBOOK.md`](./AI_LOGIC_RUNBOOK.md) - Operations guide
- [`docs/AI_LLM_ADAPTERS.md`](./AI_LLM_ADAPTERS.md) - LLM adapter guide
- [`docs/AI_PIPELINE.md`](./AI_PIPELINE.md) - AI pipeline architecture
- [`docs/AI_WIRING_FINAL.md`](./AI_WIRING_FINAL.md) - System wiring

### Orchestration
- [`docs/ORCHESTRATION_GUIDE.md`](./ORCHESTRATION_GUIDE.md) - Orchestration patterns
- [`docs/ORCHESTRATOR_CONTRACTS.md`](./ORCHESTRATOR_CONTRACTS.md) - API contracts

### Core Packages
- [`core/llm-adapter/README.md`](../../core/llm-adapter/README.md) - LLM adapter
- [`core/memory-rag/README.md`](../../core/memory-rag/README.md) - Memory RAG
- [`core/prompt-registry/README.md`](../../core/prompt-registry/README.md) - Prompt registry
- [`core/tools-framework/README.md`](../../core/tools-framework/README.md) - Tools framework
- [`core/orchestrator-ai/README.md`](../../core/orchestrator-ai/README.md) - AI orchestrator

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2025  
**Maintained By:** NeonHub AI Team  
**Next Review:** December 1, 2025

