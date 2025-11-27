# NeonHub v3.2 — Technical Reference & Project Overview

**Document Version:** 1.0  
**Last Updated:** November 18, 2025  
**Target Audience:** Agency development teams taking over project completion

---

## Table of Contents

1. [Introduction & Purpose](#introduction--purpose)
2. [Architectural Overview](#architectural-overview)
3. [Detailed Component Breakdown](#detailed-component-breakdown)
   - [Frontend (Next.js Application)](#frontend-nextjs-application)
   - [Backend / API Layer](#backend--api-layer)
   - [Agent Infrastructure](#agent-infrastructure)
   - [Data & Memory Structure](#data--memory-structure)
   - [Database Structure](#database-structure)
   - [Connectors & Integrations](#connectors--integrations)
   - [Jobs & Queues](#jobs--queues)
   - [Observability & Security](#observability--security)
   - [CI/CD & DevOps](#cicd--devops)
   - [Documentation & Testing](#documentation--testing)
4. [Current Progress & Outstanding Work](#current-progress--outstanding-work)
5. [Next Steps & Recommendations](#next-steps--recommendations)

---

## Introduction & Purpose

### What is NeonHub?

**NeonHub** is an AI-powered marketing automation platform designed to help marketing teams create, optimize, and execute multi-channel campaigns with minimal manual effort. The platform combines 13 specialized AI agents, a comprehensive connector ecosystem (21 integrations), and a sophisticated content generation engine powered by retrieval-augmented generation (RAG) to deliver personalized, brand-aligned marketing assets at scale.

### Core Goals

- **Automate Campaign Creation:** Generate complete marketing campaigns (email, social, ads, content) from a single brief
- **Multi-Agent Orchestration:** Coordinate specialized AI agents (SEO, Content, Email, Social, Ads, Support, etc.) to handle different aspects of marketing
- **Brand Voice Consistency:** Maintain brand identity across all channels through RAG-powered memory and learning loops
- **Data-Driven Optimization:** Track performance metrics, analyze trends, and continuously improve content based on real-world results
- **All-in-One Platform:** Single dashboard to manage campaigns, content, connectors, analytics, budgets, and team collaboration

### Target Users

- **Marketing Teams (SMB to Enterprise):** Primary users managing campaigns across multiple channels
- **Content Creators:** Writers and designers leveraging AI to accelerate content production
- **Marketing Agencies:** Managing multiple client brands and campaigns from one platform
- **E-commerce Businesses:** Running product-focused campaigns with Shopify/Stripe integration
- **SaaS Companies:** Growth marketing teams optimizing acquisition funnels

### Overall Functionality

NeonHub provides a complete marketing workflow from planning through execution and analytics:

1. **Campaign Planning:** Define goals, target audience, channels, and budget
2. **Content Generation:** AI agents create content (articles, emails, social posts, ad copy) aligned with brand voice
3. **Multi-Channel Distribution:** Publish to email (Gmail/Resend), social (Twitter, LinkedIn, Facebook, Instagram, TikTok), ads (Google Ads), SMS/WhatsApp
4. **Performance Tracking:** Integrate with Google Analytics 4, Search Console, and platform APIs to monitor metrics
5. **Continuous Optimization:** Learning loops feed performance data back to agents for iterative improvement
6. **Collaboration:** Team management, role-based access control, and audit logging

---

## Architectural Overview

### Technology Stack

#### Core Technologies

- **Monorepo Manager:** npm workspaces + pnpm (v9.12.2)
- **Language:** TypeScript 5.9+ (strict mode)
- **Node.js:** v20.x or higher
- **Database:** PostgreSQL 14+ with Neon.tech (serverless Postgres)
- **Vector Database:** pgvector extension for embeddings and RAG

#### Frontend

- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS 3.x + shadcn/ui components (Radix UI primitives)
- **State Management:** React Query (@tanstack/react-query v5)
- **Authentication:** NextAuth.js v5 with GitHub OAuth
- **Real-time:** Socket.io client for live updates
- **Theme:** next-themes with dark mode support

#### Backend

- **API Framework:** Express.js v4
- **RPC Layer:** tRPC v11 for type-safe client-server communication
- **ORM:** Prisma v5.22 (PostgreSQL + pgvector + citext extensions)
- **Job Queue:** BullMQ (Redis-backed)
- **WebSockets:** Socket.io for real-time events
- **AI/LLM:** OpenAI GPT-4, GPT-4-Turbo, DALL-E 3
- **Email:** Resend API (transactional) + Gmail connector (SMTP)
- **Payments:** Stripe (subscriptions, webhooks, checkout)
- **Observability:** Pino (logging), Prometheus (metrics), Sentry (errors)

#### Infrastructure

- **Containerization:** Docker + docker-compose
- **CI/CD:** 33 GitHub Actions workflows (lint, test, build, deploy, auto-sync)
- **Hosting (Production):**
  - Web: Vercel (Next.js)
  - API: Railway (Node.js)
  - Database: Neon.tech (PostgreSQL)
  - CDN: Vercel Edge Network
- **Monitoring:** UptimeRobot, Railway Metrics

### Monorepo Layout

```
NeonHub/
├── apps/
│   ├── api/                     # Backend Express + tRPC API
│   │   ├── src/
│   │   │   ├── agents/          # 13 AI agents (SEO, Email, Social, etc.)
│   │   │   ├── connectors/      # 21 service connectors
│   │   │   ├── services/        # Business logic (content, seo, analytics, etc.)
│   │   │   ├── routes/          # Express REST routes
│   │   │   ├── trpc/            # tRPC routers and procedures
│   │   │   ├── lib/             # Utilities (logger, metrics, encryption, etc.)
│   │   │   ├── middleware/      # Auth, CORS, rate limiting, RBAC
│   │   │   ├── jobs/            # BullMQ job definitions
│   │   │   ├── events/          # Event bus for agent coordination
│   │   │   └── __tests__/       # Unit + integration tests
│   │   └── prisma/
│   │       ├── schema.prisma    # Main database schema
│   │       ├── migrations/      # Database migrations
│   │       └── seed.ts          # Seed data script
│   │
│   └── web/                     # Frontend Next.js application
│       ├── src/
│       │   ├── app/             # Next.js App Router pages
│       │   ├── components/      # React components (UI, forms, dashboards)
│       │   ├── lib/             # Client utilities (tRPC client, hooks, etc.)
│       │   └── styles/          # Global CSS and Tailwind config
│       └── public/              # Static assets (images, fonts, icons)
│
├── core/                        # 17 shared core packages
│   ├── llm-adapter/             # LLM abstraction layer (OpenAI, Anthropic, etc.)
│   ├── memory-rag/              # RAG system with pgvector
│   ├── orchestrator-ai/         # Agent orchestration engine
│   ├── prompt-registry/         # Centralized prompt management
│   ├── tools-framework/         # Tool execution framework for agents
│   ├── ai-governance/           # Policy engine, ethics, compliance
│   ├── cognitive-ethics/        # Content moderation, safety filters
│   ├── data-trust/              # Data governance and privacy
│   ├── eco-optimizer/           # Resource optimization
│   ├── federation/              # Federated learning (future)
│   ├── aib/                     # Agent Intelligence Bus (message routing)
│   ├── self-healing/            # Auto-recovery and diagnostics
│   ├── cooperative-intelligence/# Multi-agent collaboration
│   ├── orchestrator-global/     # Global orchestration layer
│   ├── mesh-resilience/         # Resilience patterns (circuit breaker, retry)
│   ├── qa-sentinel/             # Quality assurance automation
│   └── cognitive-infra/         # Cognitive infrastructure layer
│
├── modules/
│   └── predictive-engine/       # ML prediction and forecasting
│
├── agent-infra/                 # Standalone agent worker infrastructure
│   ├── apps/
│   │   ├── api/                 # Orchestrator API (DAG execution)
│   │   └── worker/              # BullMQ worker for background jobs
│   └── packages/
│       └── connector-sdk/       # SDK for building connectors
│
├── scripts/                     # Build, deployment, and utility scripts
├── docs/                        # Comprehensive documentation (50+ files)
├── .github/workflows/           # 33 CI/CD workflows
└── docker-compose.yml           # Local development environment
```

### How Components Fit Together

1. **User Interaction Flow:**
   - User logs in via NextAuth (GitHub OAuth) → Web App (Next.js)
   - User creates campaign → tRPC call → API Backend
   - API routes request to Agent Orchestrator
   - Orchestrator selects appropriate agent(s) and executes

2. **Agent Execution Flow:**
   - Request → Orchestration Router → Agent Registry → Agent Handler
   - Agent uses Tools Framework to execute actions (call APIs, generate content, query DB)
   - Agent accesses RAG Memory to retrieve brand context
   - Agent records execution in AgentRun (database persistence)
   - Response flows back through orchestrator → tRPC → Web UI

3. **Data Flow:**
   - All persistent data stored in PostgreSQL (Prisma ORM)
   - Vector embeddings stored in pgvector extension (brand voice, documents, conversation memory)
   - Job queue (BullMQ) processes async tasks (email sending, analytics ingestion, learning loops)
   - Real-time updates pushed via Socket.io WebSockets

4. **External Integrations:**
   - Connectors abstract platform APIs (Slack, Gmail, Twitter, etc.)
   - OAuth2 flows managed by ConnectorAuth table
   - Webhooks receive events from external services (Stripe, Shopify)

---

## Detailed Component Breakdown

### Frontend (Next.js Application)

**Location:** `apps/web/`

#### Pages & Routes

NeonHub uses Next.js 15 App Router. Key pages:

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Public homepage | ✅ Complete |
| `/login` | Authentication page | ✅ Complete |
| `/dashboard` | Main dashboard with metrics overview | ✅ Complete |
| `/dashboard/campaigns` | Campaign management | ✅ Complete |
| `/dashboard/content` | Content library and generation | ✅ Complete |
| `/dashboard/agents` | Agent status and configuration | ✅ Complete |
| `/dashboard/seo` | SEO analytics and keyword research | ✅ Complete |
| `/dashboard/analytics` | Performance analytics | ✅ Complete |
| `/dashboard/social` | Social media management | ✅ Complete |
| `/dashboard/email` | Email campaign management | ✅ Complete |
| `/dashboard/trends` | Social media trends monitoring | ✅ Complete |
| `/dashboard/connectors` | Integration management | ⚠️ Partial |
| `/dashboard/billing` | Stripe subscription management | ⚠️ Partial |
| `/dashboard/team` | Team member management | ✅ Complete |
| `/dashboard/brand-voice` | Brand voice configuration | ✅ Complete |
| `/dashboard/settings` | User and organization settings | ✅ Complete |

#### Component Architecture

- **UI Components:** Located in `src/components/ui/` (shadcn/ui primitives)
  - Forms: `input.tsx`, `button.tsx`, `select.tsx`, `textarea.tsx`, etc.
  - Layout: `card.tsx`, `dialog.tsx`, `sheet.tsx`, `tabs.tsx`, etc.
  - Data Display: `table.tsx`, `badge.tsx`, `tooltip.tsx`, `chart.tsx`, etc.
  
- **Feature Components:** Located in `src/components/` organized by domain
  - `campaigns/` — Campaign creation wizards, campaign cards, status displays
  - `content/` — Content editor, preview, publishing workflows
  - `agents/` — Agent status cards, configuration forms
  - `analytics/` — Charts, metrics cards, trend visualizations
  - `connectors/` — OAuth connection flows, status indicators
  - `seo/` — Keyword research UI, content optimizer, link suggestions

#### State Management

- **React Query (TanStack Query):** Used for server state management
  - Automatic caching, refetching, optimistic updates
  - tRPC integration for type-safe API calls
  - Example: `trpc.seo.discoverKeywords.useQuery({ topic: "AI marketing" })`

- **React Context:** Used sparingly for global UI state
  - Theme context (dark/light mode)
  - Toast notifications
  - Real-time socket connection status

- **Local State:** React hooks (`useState`, `useReducer`) for component-level state

#### Styling Patterns

- **Tailwind CSS:** Utility-first CSS framework
  - Custom color palette in `tailwind.config.ts`
  - Dark mode via `class` strategy
  - Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

- **shadcn/ui:** Component library built on Radix UI primitives
  - Accessible, keyboard-navigable components
  - Customizable via Tailwind classes
  - Components imported from `@/components/ui/`

#### Authentication

- **NextAuth.js v5:** Session management
  - GitHub OAuth provider (primary)
  - Credentials provider (email/password, future)
  - Session stored in database (`Session` table)
  - Protected routes via middleware

#### Real-Time Features

- **Socket.io Client:** Connects to API WebSocket server
  - Agent execution progress updates
  - Campaign status changes
  - Real-time notifications

### Backend / API Layer

**Location:** `apps/api/`

#### Express + tRPC Stack

The API uses a dual approach:

1. **Express REST Routes** (`src/routes/`):
   - Legacy endpoints
   - Webhooks (Stripe, Shopify)
   - Health checks (`/health`, `/metrics`)
   - Public endpoints (no auth required)

2. **tRPC Routers** (`src/trpc/routers/`):
   - Modern type-safe endpoints
   - All protected procedures require authentication
   - Automatic TypeScript inference on client

#### REST API Endpoints

**Core Routes:**

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/health` | GET | Health check | ✅ Complete |
| `/api/orchestrate` | POST | Agent orchestration | ✅ Complete |
| `/api/webhooks/stripe` | POST | Stripe webhook handler | ⚠️ Signature verification missing |
| `/api/webhooks/shopify` | POST | Shopify webhook handler | ❌ Not implemented |
| `/api/auth/*` | Multiple | NextAuth endpoints | ✅ Complete |

**Agent Routes** (`/api/agents/*`):
- Mostly deprecated in favor of tRPC `agents.execute` procedure
- Some legacy routes remain for backward compatibility

#### tRPC Routers

**Implemented Routers:**

1. **`agents.router.ts`** — Agent execution and run management
   - `agents.execute` — Execute an agent with intent and payload
   - `agents.listRuns` — List agent execution history
   - `agents.getRunById` — Get detailed run information

2. **`seo.router.ts`** — SEO and content optimization (17+ procedures)
   - `seo.discoverKeywords` — Keyword research with clustering
   - `seo.analyzeIntent` — Search intent classification
   - `seo.scoreDifficulty` — Keyword difficulty scoring
   - `seo.getMetrics` — GA4/GSC analytics
   - `seo.getTrends` — Performance trends
   - `seo.generateMetaTags` — Optimized meta tags
   - `seo.suggestInternalLinks` — Semantic link suggestions
   - `seo.analyzeContent` — Content quality analysis
   - `seo.optimizeContent` — Content improvement suggestions

3. **`content.router.ts`** — Content generation and management
   - `content.generate` — Generate article/post with AI
   - `content.optimize` — Improve existing content
   - `content.publish` — Publish content to channels
   - `content.list` — List all content drafts
   - `content.getById` — Get specific content item

4. **`brand.router.ts`** — Brand voice management
   - `brand.uploadVoiceGuide` — Upload brand guidelines document
   - `brand.getVoiceContext` — RAG context retrieval
   - `brand.updateSettings` — Update brand settings

5. **`ai.router.ts`** — General AI utilities
   - `ai.generateText` — Generate text with LLM
   - `ai.generateImage` — Generate image with DALL-E

6. **`campaign.router.ts`** — Campaign management
   - `campaign.create` — Create new campaign
   - `campaign.list` — List campaigns
   - `campaign.getById` — Get campaign details
   - `campaign.update` — Update campaign
   - `campaign.delete` — Delete campaign

7. **`analytics.router.ts`** — Analytics and metrics
   - `analytics.getDashboardMetrics` — Overview metrics
   - `analytics.getCampaignPerformance` — Campaign-specific metrics
   - `analytics.getContentPerformance` — Content-specific metrics

8. **`billing.router.ts`** — Stripe billing
   - `billing.createCheckoutSession` — Start Stripe checkout
   - `billing.getSubscription` — Get current subscription
   - `billing.cancelSubscription` — Cancel subscription
   - `billing.updatePaymentMethod` — Update payment method

#### Middleware

**Location:** `src/middleware/`

| Middleware | Purpose | Status |
|------------|---------|--------|
| `auth.ts` | JWT/session authentication | ✅ Complete |
| `cors.ts` | CORS configuration | ✅ Complete |
| `rateLimit.ts` | Rate limiting (60 req/min default) | ✅ Complete |
| `rbac.ts` | Role-based access control | ✅ Complete |
| `securityHeaders.ts` | Helmet security headers | ✅ Complete |
| `auditLog.ts` | Audit logging for sensitive operations | ✅ Complete |
| `auditSecurityLog.ts` | Security event logging | ✅ Complete |
| `adminGuard.ts` | Admin-only route protection | ✅ Complete |

#### Services

**Location:** `src/services/`

Core business logic organized by domain:

- **`orchestration/`** — Agent orchestration system
  - `router.ts` — Main orchestration router (circuit breaker, retry, rate limit)
  - `registry.ts` — Agent registry
  - `bootstrap.ts` — Orchestrator initialization
  - `policies.ts` — Resilience policies
  - `types.ts` — Type definitions
  
- **`seo/`** — SEO services
  - `keyword-research.service.ts` — Keyword discovery and clustering
  - `content-optimizer.service.ts` — Content quality analysis
  - `meta-generation.service.ts` — Meta tag generation
  - `internal-linking.service.ts` — Link suggestion engine
  - `recommendations.service.ts` — SEO recommendations

- **`content.service.ts`** — Content generation and management
- **`analytics.service.ts`** — Analytics aggregation
- **`billing/stripe.ts`** — Stripe integration
- **`team.service.ts`** — Team management
- **`documents.service.ts`** — Document handling
- **`tool-execution.service.ts`** — Tool framework execution
- **`predictive-engine.ts`** — ML predictions
- **`migration.service.ts`** — Database migration orchestration

#### Current API Readiness

**✅ Production-Ready:**
- Core orchestration system
- All tRPC routers functional
- Authentication and authorization
- Rate limiting and CORS
- Database connectivity and migrations
- SEO engine (100% complete)
- Content generation
- Agent execution

**⚠️ Partial Implementation:**
- Stripe webhook signature verification (handler exists but not verifying signatures)
- Some connector OAuth refresh flows
- Some queue workers not fully implemented

**❌ Not Implemented:**
- Shopify webhook handler
- Content moderation service (stubbed)
- Advanced predictive analytics (ML models not trained)
- Federated learning (future feature)

### Agent Infrastructure

**Locations:**
- Main agents: `apps/api/src/agents/`
- Worker infrastructure: `agent-infra/`
- Core orchestration: `core/orchestrator-ai/`

#### Implemented Agents

NeonHub includes **13 specialized AI agents:**

| Agent | File | Purpose | Status |
|-------|------|---------|--------|
| **SEOAgent** | `SEOAgent.ts` | Keyword research, content optimization, meta tags, internal linking | ✅ Complete |
| **ContentAgent** | `content/ContentAgent.ts` | Article/blog generation, content planning, editorial calendar | ✅ Complete |
| **EmailAgent** | `EmailAgent.ts` | Email campaign generation, sequence creation, A/B testing | ✅ Complete |
| **SocialAgent** | `SocialAgent.ts` | Social media post generation, scheduling, cross-platform optimization | ✅ Complete |
| **SocialMessagingAgent** | `SocialMessagingAgent.ts` | Direct messaging automation, community engagement | ✅ Complete |
| **AdAgent** | `AdAgent.ts` | Ad copy generation, campaign optimization, A/B test variants | ✅ Complete |
| **CampaignAgent** | `CampaignAgent.ts` | Multi-channel campaign orchestration, budget allocation | ✅ Complete |
| **TrendAgent** | `TrendAgent.ts` | Social media trend monitoring, sentiment analysis, viral content detection | ✅ Complete |
| **InsightAgent** | `InsightAgent.ts` | Data analysis, predictive analytics, performance recommendations | ✅ Complete |
| **DesignAgent** | `DesignAgent.ts` | Visual asset generation (DALL-E), image optimization | ✅ Complete |
| **BrandVoiceAgent** | `BrandVoiceAgent.ts` | Brand voice consistency, tone analysis, guideline enforcement | ✅ Complete |
| **SupportAgent** | `SupportAgent.ts` | Customer support automation, ticket response generation | ✅ Complete |
| **SMSAgent** | `SMSAgent.ts` | SMS campaign generation, Twilio integration | ✅ Complete |

#### Agent Orchestration System

**Architecture:**

```
Request → Orchestration Router → Agent Registry → Agent Handler
          ↓                       ↓                 ↓
     Circuit Breaker         Load Agent       Execute Intent
     Rate Limiter           Lazy Loading      Tool Execution
     Retry Policy          Agent Context      Result Capture
          ↓                       ↓                 ↓
     AgentRun Record        Metrics Tracking   Response
```

**Key Components:**

1. **Orchestration Router** (`src/services/orchestration/router.ts`):
   - Main entry point for all agent requests
   - Enforces authentication and authorization
   - Per-user rate limiting (60 req/min)
   - Circuit breaker pattern (3 failures → 10s cooldown)
   - Retry policy (3 attempts with exponential backoff)
   - AgentRun persistence for audit trail

2. **Agent Registry** (`src/services/orchestration/registry.ts`):
   - Centralized agent registration
   - Lazy loading of agent instances
   - Agent metadata (capabilities, intents, status)

3. **Agent Handlers** (each agent implements `AgentHandler` interface):
   - `handle(req: OrchestratorRequest): Promise<OrchestratorResponse>`
   - Receive intent and payload
   - Execute business logic
   - Return structured response

4. **Agent Run Tracking** (`src/agents/utils/agent-run.ts`):
   - `executeAgentRun()` wrapper function
   - Persists every agent execution to database
   - Tracks: start time, end time, status, input, output, metrics
   - Enables learning loops and analytics

#### Tool Framework

**Location:** `core/tools-framework/`

Agents use a tool execution framework to perform actions:

**Tool Types:**
- **API Tools:** Call external APIs (Twitter, Gmail, Stripe, etc.)
- **Database Tools:** Query/mutate database
- **Generation Tools:** Call LLM for text/image generation
- **Analysis Tools:** Perform calculations, scoring, analysis
- **Integration Tools:** Execute connector operations

**Tool Execution Service** (`src/services/tool-execution.service.ts`):
- Sandboxed tool execution
- Timeout handling
- Error recovery
- Result validation

**Example Tools:**
- `sendEmail` — Send email via Resend/Gmail
- `postToTwitter` — Post tweet via Twitter connector
- `generateImage` — Create image with DALL-E
- `analyzeKeywords` — Keyword research and clustering
- `fetchAnalytics` — Get metrics from GA4/GSC
- `scheduleSocialPost` — Queue social media post

#### Outstanding Agent Work

**High Priority:**
- [ ] Add more comprehensive error handling in all agents
- [ ] Implement agent-to-agent collaboration (cross-agent workflows)
- [ ] Add agent health checks and auto-recovery
- [ ] Implement agent versioning and A/B testing
- [ ] Add more granular tool permissions

**Medium Priority:**
- [ ] Expand tool framework with more integrations
- [ ] Add agent execution quotas and billing integration
- [ ] Implement agent learning from feedback loops
- [ ] Add agent performance benchmarking

### Data & Memory Structure

**Location:** `core/memory-rag/`

NeonHub uses retrieval-augmented generation (RAG) to maintain context and brand voice consistency.

#### Vector Database (pgvector)

**Schema Setup:**
```sql
-- Vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Embedding columns (1536 dimensions for OpenAI text-embedding-ada-002)
ALTER TABLE documents ADD COLUMN embedding vector(1536);
ALTER TABLE chunks ADD COLUMN embedding vector(1536);
ALTER TABLE messages ADD COLUMN embedding vector(1536);
```

#### Key RAG Models

**EmbeddingSpace** — Namespace for embeddings
- Organization-scoped
- Multiple spaces per org (e.g., "brand-voice", "customer-support", "product-docs")
- Configuration for embedding model and dimensions

**Dataset** — Collection of documents
- Types: `documents`, `faq`, `analytics`
- Associated with embedding space
- Metadata and settings

**Document** — Individual document or file
- Uploaded by users (brand guidelines, style guides, product docs)
- Split into chunks for embedding
- Full-text searchable
- Version tracked

**Chunk** — Document fragment
- ~500-1000 tokens per chunk
- Vector embedding stored in pgvector
- Position and context preserved
- Semantic search via cosine similarity

**Conversation** — Chat session
- Types: `support`, `campaign`, `planning`, `ad_hoc`
- Associated with agents and users
- Searchable message history

**Message** — Individual chat message
- Role: `system`, `user`, `assistant`, `tool`
- Embedded for semantic search
- Linked to conversation

**MessageEmbedding** — Explicitly stored message embeddings
- Allows searching across all conversations
- Powers "similar conversations" feature

#### RAG Pipeline

**Ingestion Flow:**
```
Document Upload → Text Extraction → Chunking → Embedding Generation → pgvector Storage
```

**Retrieval Flow:**
```
User Query → Embed Query → Similarity Search (pgvector) → Top-K Chunks → Context Injection → LLM Generation
```

**Implementation:**

1. **Document Upload** (`apps/api/src/services/documents.service.ts`):
   - User uploads PDF/TXT/DOCX
   - Extract text content
   - Store in `documents` table

2. **Chunking** (`core/memory-rag/src/chunker.ts`):
   - Split document into chunks (~500 tokens)
   - Preserve context with overlap
   - Store each chunk in `chunks` table

3. **Embedding** (`core/memory-rag/src/embedder.ts`):
   - Call OpenAI Embeddings API
   - Generate 1536-dimensional vector
   - Store in `embedding` column (pgvector)

4. **Retrieval** (`core/memory-rag/src/retriever.ts`):
   - Embed user query
   - Perform cosine similarity search:
     ```sql
     SELECT * FROM chunks
     WHERE dataset_id = $1
     ORDER BY embedding <=> $2
     LIMIT 5
     ```
   - Return top K most similar chunks

5. **Context Injection** (`core/llm-adapter/src/context-builder.ts`):
   - Prepend retrieved chunks to prompt
   - Format as context: "Here is relevant information from your brand guidelines: ..."
   - Send to LLM

#### Brand Voice Orchestrator

**Purpose:** Ensure all generated content aligns with brand identity

**Flow:**
1. User uploads brand guidelines (PDF, DOCX)
2. Document embedded into "brand-voice" dataset
3. When generating content, agent queries brand voice context
4. Retrieved context injected into LLM prompt
5. Generated content scored for brand alignment
6. Low-scoring content regenerated or flagged for review

**Brand Voice Agent** (`BrandVoiceAgent.ts`):
- Analyzes brand documents
- Extracts tone, style, vocabulary preferences
- Provides context for other agents
- Scores generated content for brand consistency

#### Personal Memory (Future)

**Planned Feature:**
- Per-user embeddings for personalized content
- Learning user preferences over time
- Proactive suggestions based on past behavior

**Status:** ⚠️ Schema defined but not fully implemented

### Database Structure

**Location:** `apps/api/prisma/schema.prisma`

NeonHub uses a comprehensive Prisma schema with **50+ models** organized by domain.

#### Domain-Organized Models

**1. Authentication & Users**

| Model | Purpose |
|-------|---------|
| `User` | User accounts, email, name, image |
| `Account` | OAuth provider accounts (GitHub, Google, etc.) |
| `Session` | NextAuth session tokens |
| `VerificationToken` | Email verification tokens |
| `ApiKey` | API keys for programmatic access |
| `UserSettings` | User preferences and configuration |

**2. Organizations & Teams**

| Model | Purpose |
|-------|---------|
| `Organization` | Top-level organization entity |
| `OrganizationMembership` | User-organization relationships |
| `OrganizationRole` | Custom roles per organization |
| `OrganizationPermission` | Granular permissions |
| `TeamMember` | Team assignments within organization |

**3. Content & SEO**

| Model | Purpose |
|-------|---------|
| `Content` | Published content (articles, posts, etc.) |
| `ContentDraft` | Draft content awaiting review |
| `Keyword` | SEO keywords with intent and priority |
| `Persona` | Target audience personas |
| `EditorialCalendar` | Content publishing schedule |

**4. Campaigns & Marketing**

| Model | Purpose |
|-------|---------|
| `Campaign` | Marketing campaigns (multi-channel) |
| `MarketingCampaign` | Legacy marketing campaign model |
| `MarketingLead` | Lead tracking and scoring |
| `MarketingTouchpoint` | User interaction tracking |
| `MarketingAttribution` | Attribution modeling |
| `MarketingConsent` | GDPR/CCPA consent tracking |

**5. CRM & People**

| Model | Purpose |
|-------|---------|
| `Person` | Individual contacts (leads, customers) |
| `Note` | Notes about people/contacts |

**6. Budget & Finance**

| Model | Purpose |
|-------|---------|
| `Budget` | Organization budgets |
| `BudgetAllocation` | Budget allocation to campaigns |
| `BudgetTransaction` | Spend tracking |

**7. Agents & Orchestration**

| Model | Purpose |
|-------|---------|
| `Agent` | Agent definitions and configuration |
| `AgentRun` | Agent execution history |
| `AgentJob` | Legacy agent job tracking |
| `AgentMetric` | Agent performance metrics |
| `Feedback` | User feedback on agent outputs |
| `Task` | Task management and assignment |

**8. RAG & Knowledge Base**

| Model | Purpose |
|-------|---------|
| `EmbeddingSpace` | Vector embedding namespaces |
| `Dataset` | Document collections |
| `Document` | Uploaded documents |
| `Chunk` | Document chunks with embeddings |
| `Conversation` | Chat conversations |
| `Message` | Individual messages |
| `MessageEmbedding` | Message vector embeddings |

**9. Brand Management**

| Model | Purpose |
|-------|---------|
| `Brand` | Brand definitions per organization |

**10. ML Training & Optimization**

| Model | Purpose |
|-------|---------|
| `TrainingJob` | ML model training jobs |
| `ModelVersion` | Trained model versions |

**11. Connectors & Integration**

| Model | Purpose |
|-------|---------|
| `Connector` | Connector definitions |
| `ConnectorAuth` | OAuth credentials for connectors |
| `Credential` | User-specific credentials |

**12. System & Audit**

| Model | Purpose |
|-------|---------|
| `AuditLog` | Audit trail for all operations |
| `MetricEvent` | System metrics and events |
| `Subscription` | Stripe subscription tracking |

#### Migrations

**Status:** ✅ All migrations applied and stable

**Location:** `apps/api/prisma/migrations/`

**Key Migrations:**
- Initial schema setup
- pgvector extension
- citext extension (case-insensitive text)
- Indexes for performance (userId, organizationId, agentId, etc.)
- Unique constraints

**Migration Commands:**
```bash
# Create new migration
pnpm --filter apps/api prisma migrate dev --name migration_name

# Apply migrations (production)
pnpm --filter apps/api prisma migrate deploy

# View migration status
pnpm --filter apps/api prisma migrate status

# Generate Prisma Client
pnpm --filter apps/api prisma generate
```

#### Indexes

**Performance-critical indexes:**

```sql
-- User lookups
CREATE INDEX ix_user_email ON users(email);
CREATE INDEX ix_user_org ON organization_memberships(user_id, organization_id);

-- Agent runs
CREATE INDEX ix_agent_run_org ON agent_runs(organization_id);
CREATE INDEX ix_agent_run_agent ON agent_runs(agent_id);
CREATE INDEX ix_agent_run_status ON agent_runs(status);

-- Content
CREATE INDEX ix_content_org ON content(organization_id);
CREATE INDEX ix_content_status ON content(status);

-- Campaigns
CREATE INDEX ix_campaign_org ON campaigns(organization_id);
CREATE INDEX ix_campaign_status ON campaigns(status);

-- Chunks (vector similarity)
CREATE INDEX ix_chunk_embedding ON chunks USING ivfflat (embedding vector_cosine_ops);
```

#### Schemas

**pgvector Setup:**
```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector(schema: "public"), citext(schema: "public")]
}
```

**Vector Column:**
```prisma
model Chunk {
  id        Int      @id @default(autoincrement())
  content   String   @db.Text
  embedding Unsupported("vector(1536)")? // pgvector column
  position  Int
  
  // ... other fields
}
```

### Connectors & Integrations

**Location:** `apps/api/src/connectors/`

NeonHub supports **21 external service connectors** for marketing automation.

#### Connector Architecture

**Base Classes:**
- `Connector` (`base/Connector.ts`) — Abstract base class
- `OAuth2Provider` (`auth/OAuth2Provider.ts`) — OAuth 2.0 flow handler
- `ConnectorRegistry` (`base/ConnectorRegistry.ts`) — Centralized registry

**Connector Interface:**
```typescript
interface Connector {
  kind: ConnectorKind;
  name: string;
  
  // Authentication
  authenticate(credentials: ConnectorAuth): Promise<void>;
  refreshToken(auth: ConnectorAuth): Promise<ConnectorAuth>;
  
  // Operations (vary by connector)
  execute(action: string, params: unknown): Promise<unknown>;
}
```

#### Implemented Connectors

| Connector | File | Purpose | OAuth | Status |
|-----------|------|---------|-------|--------|
| **Slack** | `SlackConnector.ts` | Send messages, notifications | ✅ Yes | ✅ Complete |
| **Discord** | `DiscordConnector.ts` | Send messages, webhooks | ✅ Yes | ✅ Complete |
| **Gmail** | `GmailConnector.ts` | Send/receive emails | ✅ Yes | ⚠️ OAuth refresh needed |
| **Google Sheets** | `GoogleSheetsConnector.ts` | Read/write spreadsheets | ✅ Yes | ⚠️ OAuth refresh needed |
| **Google Search Console** | `GoogleSearchConsoleConnector.ts` | SEO metrics, queries | ✅ Yes | ✅ Complete |
| **Google Ads** | `GoogleAdsConnector.ts` | Campaign management | ✅ Yes | ⚠️ OAuth refresh needed |
| **Twitter/X** | `TwitterConnector.ts` | Post tweets, trends | ✅ Yes | ✅ Complete |
| **LinkedIn** | `LinkedInConnector.ts` | Post updates, company pages | ✅ Yes | ⚠️ OAuth refresh needed |
| **Facebook** | `FacebookConnector.ts` | Post to pages, ads | ✅ Yes | ⚠️ OAuth refresh needed |
| **Instagram** | `InstagramConnector.ts` | Post images, stories | ✅ Yes | ⚠️ OAuth refresh needed |
| **TikTok** | `TikTokConnector.ts` | Video upload, analytics | ✅ Yes | ⚠️ OAuth refresh needed |
| **YouTube** | `YouTubeConnector.ts` | Video upload, comments | ✅ Yes | ⚠️ OAuth refresh needed |
| **Reddit** | `RedditConnector.ts` | Post submissions, comments | ✅ Yes | ✅ Complete |
| **WhatsApp** | `WhatsAppConnector.ts` | Send messages (Business API) | 🔑 API Key | ✅ Complete |
| **SMS/Twilio** | `SMSConnector.ts` | Send SMS messages | 🔑 API Key | ✅ Complete |
| **Stripe** | `StripeConnector.ts` | Payments, subscriptions | 🔑 API Key | ✅ Complete |
| **Shopify** | `ShopifyConnector.ts` | Orders, products, inventory | ✅ Yes | ❌ Not implemented |
| **HubSpot** | `HubSpotConnector.ts` | CRM, contacts, deals | ✅ Yes | ⚠️ Partial |
| **Notion** | `NotionConnector.ts` | Databases, pages | ✅ Yes | ⚠️ Partial |
| **Trello** | `TrelloConnector.ts` | Boards, cards, lists | ✅ Yes | ⚠️ Partial |
| **Asana** | `AsanaConnector.ts` | Tasks, projects | ✅ Yes | ⚠️ Partial |

#### OAuth Flows

**Flow:**
1. User clicks "Connect [Service]" in UI
2. Frontend redirects to `/api/connectors/auth/[connector]/authorize`
3. Backend redirects to OAuth provider (e.g., `https://accounts.google.com/o/oauth2/auth`)
4. User authorizes app
5. Provider redirects back to `/api/connectors/auth/[connector]/callback`
6. Backend exchanges authorization code for access token
7. Token stored in `ConnectorAuth` table
8. Frontend shows "Connected" status

**Status:**
- ✅ OAuth authorization flow works for all OAuth connectors
- ⚠️ Token refresh not fully implemented for some connectors (Gmail, Google Sheets, Facebook, Instagram, TikTok, YouTube, LinkedIn)
- ❌ Shopify connector not implemented

#### Outstanding Connector Work

**High Priority:**
- [ ] Implement OAuth token refresh for Google connectors (Gmail, Sheets, Ads)
- [ ] Implement OAuth token refresh for social connectors (Facebook, Instagram, TikTok, YouTube, LinkedIn)
- [ ] Implement Shopify connector and webhook handler
- [ ] Add connector health checks and auto-reconnection
- [ ] Implement connector rate limiting per platform

**Medium Priority:**
- [ ] Expand HubSpot connector (currently only basic CRM operations)
- [ ] Expand Notion connector (currently only basic page operations)
- [ ] Expand Trello/Asana connectors
- [ ] Add more social media platforms (Pinterest, Snapchat)
- [ ] Add analytics platforms (Mixpanel, Amplitude)

### Jobs & Queues

**Location:** `apps/api/src/jobs/`, `apps/api/src/queues/`

NeonHub uses **BullMQ** (Redis-backed job queue) for asynchronous processing.

#### Queue Definitions

**Location:** `src/queues/index.ts`

| Queue Name | Purpose | Status |
|------------|---------|--------|
| `intake` | Process incoming webhook events | ⚠️ Worker not implemented |
| `email` | Send email campaigns and sequences | ⚠️ Worker partial |
| `sms` | Send SMS messages via Twilio | ⚠️ Worker partial |
| `social` | Schedule and publish social media posts | ⚠️ Worker partial |
| `learning` | Process learning loops and model updates | ❌ Worker not implemented |
| `budget` | Track and alert on budget spend | ❌ Worker not implemented |
| `seo-analytics` | Ingest GA4/GSC data and run learning loop | ✅ Complete |

#### Job Definitions

**SEO Analytics Job** (`src/jobs/seo-analytics.job.ts`):
- ✅ **Complete and operational**
- Scheduled: Every 6 hours
- Actions:
  1. Fetch GA4 metrics for all published content
  2. Fetch GSC data (impressions, clicks, CTR, position)
  3. Store metrics in database
  4. Identify underperforming content (CTR < 2%, position > 10)
  5. Queue content optimization tasks
  6. Update internal links based on performance
- Result: Auto-optimizing SEO system

**Email Queue** (`queues/email`):
- ⚠️ **Partially implemented**
- Job types:
  - `send-email` — Send single email
  - `send-campaign` — Send email campaign to list
  - `send-sequence` — Multi-step email sequence
- Status: Jobs enqueued but worker needs completion

**SMS Queue** (`queues/sms`):
- ⚠️ **Partially implemented**
- Job types:
  - `send-sms` — Send single SMS
  - `send-campaign` — Send SMS campaign
- Status: Jobs enqueued but worker needs completion

**Social Queue** (`queues/social`):
- ⚠️ **Partially implemented**
- Job types:
  - `publish-post` — Publish to single platform
  - `publish-multi` — Cross-platform publishing
  - `schedule-post` — Schedule future post
- Status: Jobs enqueued but worker needs completion

#### Worker Infrastructure

**Location:** `agent-infra/apps/worker/`

**Architecture:**
```
BullMQ Queue → Worker Process → Job Handler → Connector/Agent → Result
```

**Worker Status:**
- ✅ SEO analytics worker operational
- ⚠️ Email/SMS/Social workers partially implemented
- ❌ Learning loop worker not started
- ❌ Budget tracking worker not started

#### Outstanding Queue/Worker Work

**Critical:**
- [ ] Complete email queue worker (send campaigns, sequences)
- [ ] Complete SMS queue worker (Twilio integration)
- [ ] Complete social queue worker (multi-platform publishing)
- [ ] Implement intake queue worker (webhook event processing)

**Important:**
- [ ] Implement learning loop worker (agent model updates)
- [ ] Implement budget tracking worker (spend alerts)
- [ ] Add job retry policies and dead letter queues
- [ ] Add worker monitoring and alerting
- [ ] Add job priority and concurrency controls

**Nice to Have:**
- [ ] Add job scheduling UI in dashboard
- [ ] Add job history and logs viewer
- [ ] Add queue metrics and dashboards
- [ ] Implement job chaining and workflows

### Observability & Security

#### Logging

**Library:** Pino (fast, structured JSON logging)

**Configuration:** `src/lib/logger.ts`

**Log Levels:**
- `fatal` — Unrecoverable errors
- `error` — Errors that should be investigated
- `warn` — Warnings (non-critical issues)
- `info` — General information (default level)
- `debug` — Detailed debugging information
- `trace` — Very detailed tracing information

**Usage:**
```typescript
logger.info({ userId, campaignId }, "Campaign created");
logger.error({ error, agentId }, "Agent execution failed");
```

**Log Destinations:**
- Development: Console (pretty-printed)
- Production: JSON to stdout (collected by hosting platform)

#### Metrics

**Library:** Prometheus (time-series metrics)

**Endpoint:** `/metrics` (Prometheus scrape endpoint)

**Metrics Tracked:**
- `agent_runs_total` — Total agent executions (by agent, status, intent)
- `agent_run_duration_seconds` — Agent execution duration histogram
- `circuit_breaker_failures_total` — Circuit breaker trip count
- `rate_limit_hits_total` — Rate limit rejections
- `http_requests_total` — HTTP request count (by method, path, status)
- `http_request_duration_seconds` — HTTP request duration histogram
- `websocket_connections_active` — Active WebSocket connections
- `database_query_duration_seconds` — Database query performance
- `job_queue_size` — Number of jobs in each queue
- `job_processing_duration_seconds` — Job processing time

**Implementation:** `src/lib/metrics.ts`

**Status:** ✅ Comprehensive metrics instrumentation

#### Error Tracking

**Library:** Sentry (optional, configured via `SENTRY_DSN` env var)

**Features:**
- Automatic error capture
- Source map support for stack traces
- User context attachment
- Breadcrumb tracking
- Performance monitoring

**Configuration:** `src/obs/sentry.ts`

**Status:** ✅ Complete (requires Sentry account to activate)

#### Authentication

**Library:** NextAuth.js v5

**Providers:**
- ✅ GitHub OAuth (primary)
- ⚠️ Credentials (email/password, future)
- ⚠️ Google OAuth (future)

**Session Storage:**
- Database sessions (`Session` table)
- Session cookies (httpOnly, secure, sameSite)
- 30-day session expiry

**Status:** ✅ Fully functional

#### Authorization (RBAC)

**Implementation:** `src/middleware/rbac.ts`

**Roles:**
- `owner` — Full access to organization
- `admin` — Manage users, settings, billing
- `member` — Use platform, create content
- `viewer` — Read-only access

**Permissions:**
- `read:content`
- `write:content`
- `delete:content`
- `manage:team`
- `manage:billing`
- `manage:organization`
- `execute:agents`

**Storage:** `OrganizationRole`, `OrganizationPermission` tables

**Status:** ✅ Complete schema, ⚠️ enforcement needs expansion

#### Rate Limiting

**Implementation:** `src/middleware/rateLimit.ts`

**Limits:**
- Public endpoints: 100 req/15min per IP
- Authenticated endpoints: 60 req/min per user
- Agent execution: 60 req/min per user
- Webhook endpoints: 1000 req/hr per organization

**Storage:** In-memory (resets on restart)

**Status:** ✅ Functional, ⚠️ Consider Redis-backed for production

#### CORS

**Implementation:** `src/middleware/cors.ts`

**Configuration:**
- Allowed origins: `CORS_ORIGINS` env var (comma-separated)
- Default development: `http://localhost:3000`
- Production: `https://neonhubecosystem.com`
- Credentials: Allowed
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: Authorization, Content-Type, etc.

**Status:** ✅ Complete

#### Audit Logging

**Implementation:** `src/middleware/auditLog.ts`

**Logged Events:**
- User login/logout
- Organization creation/updates
- Team member changes
- Campaign creation/updates/deletion
- Content publication
- Agent execution (sensitive data)
- Billing events
- Settings changes

**Storage:** `AuditLog` table

**Status:** ✅ Complete

#### Security Headers

**Implementation:** `src/middleware/securityHeaders.ts`

**Headers Applied:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: (restrictive)`
- Content Security Policy (CSP)

**Library:** Helmet.js

**Status:** ✅ Complete

### CI/CD & DevOps

#### GitHub Actions Workflows

**Location:** `.github/workflows/`

**Count:** 33 workflows

**Key Workflows:**

| Workflow | Trigger | Purpose | Status |
|----------|---------|---------|--------|
| `ci.yml` | Push, PR | Lint, typecheck, test, build | ✅ Passing |
| `ci-p0-hardening.yml` | Push | P0 validation suite | ✅ Passing |
| `deploy-production.yml` | Manual | Deploy to production | ⚠️ Needs secrets |
| `deploy-staging.yml` | Push to `staging` | Auto-deploy to staging | ⚠️ Needs secrets |
| `auto-sync-from-siblings.yml` | Hourly | Sync changes from sibling repos | ✅ Active |
| `test-coverage.yml` | Push | Run tests and upload coverage | ✅ Passing |
| `prisma-validate.yml` | Push | Validate Prisma schema | ✅ Passing |
| `docker-build.yml` | Push | Build Docker images | ⚠️ Needs DockerHub creds |
| `security-scan.yml` | Daily | Dependency security audit | ✅ Active |
| `lighthouse.yml` | Weekly | Performance audit | ⚠️ Needs URL |
| `backup-db.yml` | Daily | Database backup | ⚠️ Needs DB access |

**CI Checks (run on every PR):**
1. ESLint (no errors)
2. TypeScript type checking (no errors)
3. Prettier formatting check
4. Prisma schema validation
5. Unit tests (Jest)
6. Integration tests (API endpoints)
7. Build verification (Next.js + API)

**CD Pipeline (production):**
1. Run all CI checks
2. Build Docker images
3. Push to container registry
4. Deploy to Railway (API)
5. Deploy to Vercel (Web)
6. Run smoke tests
7. Notify team

**Status:** ✅ CI fully functional, ⚠️ CD needs production secrets

#### Docker

**Files:**
- `Dockerfile` (root, multi-stage build)
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `docker-compose.yml` (local development)
- `docker-compose.prod.yml` (production)
- `docker-compose.staging.yml` (staging)

**Services:**
- `api` — Backend Express API
- `web` — Frontend Next.js app
- `db` — PostgreSQL 14 with pgvector
- `redis` — Redis for BullMQ
- `worker` — BullMQ worker process

**Commands:**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose build --no-cache
```

**Status:** ✅ Local docker-compose works, ⚠️ Production docker-compose needs secrets

#### Deployment Scripts

**Location:** `scripts/`

Key scripts:
- `scripts/deploy-production.sh` — Production deployment automation
- `scripts/deploy-staging.sh` — Staging deployment automation
- `scripts/smoke-test-production.sh` — Post-deployment smoke tests
- `scripts/backup-database.sh` — Database backup script
- `scripts/restore-database.sh` — Database restore script
- `release/v3.0-hybrid-deployment.sh` — Automated v3.0 deployment

**Status:** ✅ Scripts exist and are tested

#### Infrastructure

**Production Hosting:**
- **Web Frontend:** Vercel (Next.js 15, Edge Network CDN)
- **API Backend:** Railway (Node.js 20, auto-scaling)
- **Database:** Neon.tech (serverless PostgreSQL with pgvector)
- **Redis:** Railway Redis (for BullMQ)
- **CDN:** Vercel Edge Network
- **DNS:** Cloudflare (optional)

**Environment Variables:**

**API (`apps/api/.env`):**
```env
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
PORT=3001
NODE_ENV=production
OPENAI_API_KEY=sk-proj-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
CORS_ORIGINS=https://neonhubecosystem.com
NEXTAUTH_SECRET=...
SENTRY_DSN=...
REDIS_URL=redis://...
```

**Web (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=https://api.neonhubecosystem.com
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://neonhubecosystem.com
NEXT_PUBLIC_SITE_URL=https://neonhubecosystem.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
DATABASE_URL=postgresql://...
GITHUB_ID=...
GITHUB_SECRET=...
```

**Status:** ✅ Environment variables documented

### Documentation & Testing

#### Documentation

**Location:** `docs/`

**Count:** 50+ markdown files

**Key Documentation:**

**Architecture & System:**
- `docs/SYSTEM_ARCHITECTURE.md`
- `docs/DATABASE_AND_DATA_MODEL.md`
- `docs/BACKEND_API_AND_SERVICES.md`
- `docs/FRONTEND_AND_UX_STRUCTURE.md`

**Features:**
- `docs/AGENT_INFRASTRUCTURE_AND_AI_LOGIC.md`
- `docs/SEO_AND_CONTENT_SYSTEM.md`
- `docs/CONNECTOR_ECOSYSTEM.md`

**Operations:**
- `docs/DEVELOPMENT_ENVIRONMENT_AND_SETUP.md`
- `docs/DEPLOYMENT_AND_OPERATIONS_GUIDE.md`
- `docs/TESTING_AND_QUALITY_STRATEGY.md`

**Guides:**
- `docs/HYBRID_DEPLOYMENT_v3.0.md`
- `docs/GA4_OAUTH_SETUP.md`
- `docs/AGENCY_COLLABORATION_BRIEF.md`

**Reports:**
- `SEO_ENGINE_PROGRESS_REPORT_VALIDATED.md`
- `SEO_ENGINE_TECHNICAL_APPENDIX.md`
- `PRODUCTION_READY_100_PERCENT.md`

**Status:** ✅ Comprehensive documentation exists

#### Testing

**Framework:** Jest + TypeScript

**Test Types:**

1. **Unit Tests** (`*.test.ts`, `*.spec.ts`):
   - Test individual functions and classes
   - Mock external dependencies
   - Located alongside source files
   - Example: `apps/api/src/services/__tests__/keyword-research.service.test.ts`

2. **Integration Tests** (`*.integration.spec.ts`):
   - Test API endpoints end-to-end
   - Use test database
   - Example: `apps/api/src/__tests__/p0-validation.test.ts`

3. **E2E Tests** (Playwright, future):
   - Test complete user workflows
   - Browser automation
   - Not yet implemented

**Coverage:**
- **API:** ~60% coverage (32/32 core tests passing)
- **Web:** Minimal coverage (needs expansion)
- **Core packages:** Varies (0-80% depending on package)

**Test Commands:**
```bash
# Run all tests
pnpm test

# Run API tests only
pnpm --filter apps/api test

# Run specific test file
pnpm --filter apps/api test src/__tests__/p0-validation.test.ts

# Watch mode
pnpm --filter apps/api test --watch

# Coverage report
pnpm --filter apps/api test --coverage
```

**Test Database:**
- Separate test database: `neonhub_test`
- Reset before each test suite
- Seeded with fixtures

**Mocks:**
- OpenAI API mocked in tests
- Connectors have mock implementations
- Stripe webhooks mocked
- Example: `src/__mocks__/`

**Status:**
- ✅ Core P0 tests passing (32/32)
- ⚠️ Coverage below 80% (target: 90%+)
- ❌ E2E tests not implemented
- ⚠️ Some agents lack comprehensive test coverage

---

## Current Progress & Outstanding Work

### Overall Project Status

**Completion Estimate:** ~75-80% complete

**Production-Ready Components:**
- ✅ Authentication & authorization
- ✅ Database schema & migrations
- ✅ Core API endpoints (tRPC + REST)
- ✅ Agent orchestration system
- ✅ All 13 agents implemented
- ✅ SEO engine (100% complete, 6 months ahead of schedule)
- ✅ Content generation system
- ✅ Brand voice RAG system
- ✅ Frontend dashboard and major pages
- ✅ CI/CD pipelines

**Components Needing Work:**
- ⚠️ Some connector OAuth refresh flows
- ⚠️ Queue workers (email, SMS, social, learning, budget)
- ⚠️ Stripe webhook signature verification
- ⚠️ Content moderation
- ⚠️ Test coverage expansion
- ❌ Shopify integration
- ❌ E2E testing suite

### Critical Blockers (Must Fix Before Launch)

#### 1. Queue Workers Not Fully Implemented

**Issue:** Jobs are enqueued but workers don't process them.

**Affected Queues:**
- `intake` — Webhook events not processed
- `email` — Email campaigns queued but not sent
- `sms` — SMS campaigns queued but not sent
- `social` — Social posts queued but not published
- `learning` — Learning loops not running
- `budget` — Budget tracking not active

**Impact:**
- Campaigns created but not executed
- No automated email/SMS sending
- No social media scheduling
- No learning/optimization loops
- No budget alerts

**Work Required:**
- Implement worker handlers for each queue
- Test job processing end-to-end
- Add error handling and retries
- Add worker monitoring

**Estimated Effort:** 2-3 weeks (1 developer)

**Priority:** 🔴 **Critical** — Blocking production launch

#### 2. Stripe Webhook Signature Verification Missing

**Issue:** Stripe webhook handler exists but doesn't verify signatures.

**File:** `apps/api/src/routes/stripe-webhook.ts`

**Risk:** Potential security vulnerability (fake webhooks could be processed)

**Work Required:**
```typescript
// Current (insecure):
app.post('/api/webhooks/stripe', async (req, res) => {
  const event = req.body; // No verification!
  // Process event...
});

// Needed (secure):
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // Process verified event...
});
```

**Estimated Effort:** 2 hours

**Priority:** 🔴 **Critical** — Security risk

#### 3. Connector OAuth Token Refresh Not Implemented

**Issue:** OAuth tokens expire (typically after 1 hour). Refresh flow not implemented for several connectors.

**Affected Connectors:**
- Gmail
- Google Sheets
- Google Ads
- Facebook
- Instagram
- TikTok
- YouTube
- LinkedIn

**Impact:** Connectors stop working after ~1 hour, requiring manual re-authentication.

**Work Required:**
- Implement `refreshToken()` method in each connector
- Add token expiry checking before requests
- Auto-refresh when token expires
- Update `ConnectorAuth` table with new tokens

**Example Implementation:**
```typescript
async refreshToken(auth: ConnectorAuth): Promise<ConnectorAuth> {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: auth.refreshToken,
    grant_type: 'refresh_token'
  });
  
  return {
    ...auth,
    accessToken: response.data.access_token,
    expiresAt: new Date(Date.now() + response.data.expires_in * 1000)
  };
}
```

**Estimated Effort:** 1 week (1 developer)

**Priority:** 🟠 **High** — Impacts user experience

### Important Gaps (Should Complete Soon)

#### 4. Content Moderation Service Not Implemented

**Issue:** Content moderation service is stubbed but not functional.

**File:** `core/cognitive-ethics/src/moderation.ts`

**Purpose:** Filter inappropriate content before publication (profanity, hate speech, violence, etc.)

**Work Required:**
- Integrate OpenAI Moderation API or similar
- Define moderation policies per organization
- Add moderation checks before content publication
- Implement appeals workflow

**Estimated Effort:** 1 week (1 developer)

**Priority:** 🟠 **High** — Risk of publishing inappropriate content

#### 5. Test Coverage Below Target

**Current Coverage:**
- API: ~60%
- Web: <10%
- Core packages: Varies (0-80%)

**Target Coverage:** 90%+

**Missing Tests:**
- Agent unit tests (some agents lack comprehensive tests)
- Connector tests
- Service layer tests
- Frontend component tests
- E2E user workflow tests

**Work Required:**
- Write unit tests for all agents
- Write integration tests for all tRPC routers
- Write connector tests (mocked external APIs)
- Write frontend component tests (React Testing Library)
- Write E2E tests (Playwright)

**Estimated Effort:** 3-4 weeks (1 developer)

**Priority:** 🟡 **Medium** — Quality assurance

#### 6. Shopify Integration Not Implemented

**Issue:** Shopify connector stubbed but not functional. Webhook handler missing.

**Use Case:** E-commerce businesses want to trigger campaigns based on orders, abandoned carts, etc.

**Work Required:**
- Implement ShopifyConnector (OAuth flow, API calls)
- Implement webhook handler (`/api/webhooks/shopify`)
- Add webhook event types: `order/created`, `cart/abandoned`, `customer/created`, etc.
- Create Shopify-specific campaign templates

**Estimated Effort:** 2 weeks (1 developer)

**Priority:** 🟡 **Medium** — Feature gap for e-commerce users

#### 7. Missing Agent Health Checks

**Issue:** No automated health monitoring for agents.

**Work Required:**
- Add `health()` method to all agents
- Implement periodic health checks (every 5 minutes)
- Store health status in database
- Alert on repeated failures
- Implement auto-recovery (restart agent)

**Estimated Effort:** 1 week (1 developer)

**Priority:** 🟡 **Medium** — Operational reliability

### Nice to Have (Post-Launch)

#### 8. E2E Testing Suite

**Status:** Not implemented

**Purpose:** Test complete user workflows in browser

**Framework:** Playwright or Cypress

**Example Tests:**
- User signup and onboarding
- Create campaign end-to-end
- Connect integration (OAuth flow)
- Generate and publish content
- View analytics

**Estimated Effort:** 2-3 weeks (1 developer)

**Priority:** 🟢 **Low** — Nice to have

#### 9. Advanced Predictive Analytics

**Status:** ML models not trained

**Purpose:** Predict campaign performance before launch

**Work Required:**
- Collect training data (historical campaign performance)
- Train ML models (regression for CTR, conversion rate)
- Integrate predictions into campaign creation UI
- Add confidence intervals and explanations

**Estimated Effort:** 4-6 weeks (1 ML engineer)

**Priority:** 🟢 **Low** — Advanced feature

#### 10. Federated Learning

**Status:** Planned but not started

**Purpose:** Collaborative learning across organizations without sharing data

**Use Case:** Improve models by learning from all customers' data while preserving privacy

**Work Required:**
- Implement federated learning coordinator
- Implement model aggregation
- Add differential privacy
- Build secure multi-party computation

**Estimated Effort:** 3 months (1-2 ML engineers)

**Priority:** 🟢 **Low** — Research feature

### Summary of Outstanding Work by Category

#### Backend / API
- 🔴 Complete queue workers (2-3 weeks)
- 🔴 Add Stripe webhook signature verification (2 hours)
- 🟠 Implement connector token refresh (1 week)
- 🟠 Implement content moderation (1 week)
- 🟠 Add agent health checks (1 week)
- 🟡 Implement Shopify integration (2 weeks)

#### Frontend / Web
- 🟡 Expand test coverage (3-4 weeks)
- 🟢 Implement E2E tests (2-3 weeks)
- 🟡 Add more dashboard visualizations
- 🟡 Improve mobile responsiveness

#### Infrastructure / DevOps
- 🟠 Set up production secrets in GitHub Actions
- 🟡 Configure production monitoring (Sentry, UptimeRobot)
- 🟡 Set up database backups
- 🟡 Configure CDN and caching

#### Documentation
- 🟢 Update API documentation (minor)
- 🟢 Create video tutorials (optional)
- 🟢 Create agency handoff package (this document!)

#### Testing
- 🟡 Increase unit test coverage to 90%+
- 🟡 Add integration tests for all routers
- 🟢 Add E2E tests (Playwright)

---

## Next Steps & Recommendations

### Immediate Priorities (Week 1-2)

**Goal:** Address critical blockers

1. **Fix Stripe Webhook Security** (2 hours)
   - Add signature verification
   - Test with Stripe CLI
   - Deploy to staging

2. **Complete Email Queue Worker** (1 week)
   - Implement job handler
   - Integrate with Resend/Gmail connectors
   - Test end-to-end email campaign
   - Deploy to staging

3. **Complete SMS Queue Worker** (3 days)
   - Implement job handler
   - Integrate with Twilio connector
   - Test SMS campaign
   - Deploy to staging

4. **Complete Social Queue Worker** (1 week)
   - Implement job handler
   - Integrate with social connectors
   - Test multi-platform posting
   - Deploy to staging

### Short-Term Priorities (Week 3-4)

**Goal:** Complete core functionality

5. **Implement Connector Token Refresh** (1 week)
   - Google connectors (Gmail, Sheets, Ads)
   - Social connectors (Facebook, Instagram, LinkedIn, TikTok, YouTube)
   - Test token expiry and auto-refresh
   - Deploy to staging

6. **Implement Content Moderation** (1 week)
   - Integrate OpenAI Moderation API
   - Add moderation checks to all agents
   - Test with inappropriate content
   - Deploy to staging

7. **Complete Intake Queue Worker** (3 days)
   - Implement webhook event processing
   - Test with Stripe/Shopify webhooks
   - Deploy to staging

### Medium-Term Priorities (Week 5-8)

**Goal:** Improve quality and reliability

8. **Expand Test Coverage** (3 weeks)
   - Write unit tests for all agents
   - Write integration tests for all routers
   - Write connector tests
   - Target: 90%+ coverage

9. **Implement Agent Health Checks** (1 week)
   - Add health monitoring
   - Add auto-recovery
   - Add alerting

10. **Implement Shopify Integration** (2 weeks)
    - Complete Shopify connector
    - Add webhook handler
    - Test order-triggered campaigns

11. **Add E2E Tests** (2 weeks)
    - Set up Playwright
    - Write critical path tests
    - Integrate into CI/CD

### Long-Term Priorities (Post-Launch)

**Goal:** Advanced features and optimization

12. **Predictive Analytics** (4-6 weeks)
    - Collect training data
    - Train ML models
    - Integrate predictions

13. **Advanced Learning Loops** (Ongoing)
    - Refine learning algorithms
    - Add more feedback signals
    - Improve model accuracy

14. **Performance Optimization** (Ongoing)
    - Database query optimization
    - Caching strategy
    - CDN configuration
    - Image optimization

### Recommended Team Structure

**Phase 1 (Critical Blockers):** 2-3 developers
- 1x Backend Engineer (queue workers, Stripe, connectors)
- 1x Full-Stack Engineer (testing, integration)
- 1x DevOps Engineer (part-time, CI/CD setup)

**Phase 2 (Quality & Reliability):** 2 developers
- 1x Backend Engineer (health checks, Shopify)
- 1x QA Engineer (test coverage, E2E tests)

**Phase 3 (Advanced Features):** Varies
- 1x ML Engineer (predictive analytics, federated learning)
- 1x Backend Engineer (learning loops, optimization)

### Risk Mitigation

**Top Risks:**

1. **Queue Workers Not Working in Production**
   - Mitigation: Thorough testing in staging with production-like load
   - Fallback: Manual campaign execution via dashboard

2. **Connector OAuth Issues in Production**
   - Mitigation: Implement token refresh before launch
   - Fallback: Manual re-authentication flow

3. **Database Performance Issues at Scale**
   - Mitigation: Load testing, query optimization, indexes
   - Fallback: Database connection pooling, read replicas

4. **OpenAI API Rate Limits**
   - Mitigation: Implement request queuing, caching, fallback models
   - Fallback: Graceful degradation, user notifications

### Success Criteria

**Ready for Production Launch:**
- ✅ All critical blockers resolved (queue workers, Stripe security, token refresh)
- ✅ Test coverage > 80%
- ✅ All CI/CD pipelines passing
- ✅ Staging environment stable for 1 week
- ✅ Load testing completed successfully
- ✅ Security audit passed
- ✅ Documentation complete
- ✅ Monitoring and alerting configured
- ✅ Backup and recovery procedures tested

**Success Metrics (Post-Launch):**
- 99.9% uptime
- < 500ms API response time (p95)
- < 2s page load time (p95)
- < 1% error rate
- > 80% user satisfaction (NPS)
- > 50% agent success rate (first try)

---

## Conclusion

NeonHub is a sophisticated AI-powered marketing automation platform that is **75-80% complete** and ready for final development push by an agency team. The core architecture is solid, the agent system is functional, and most integrations are in place.

**The primary gaps are:**
1. Queue worker implementation (email, SMS, social, learning, budget)
2. Connector OAuth token refresh flows
3. Stripe webhook security
4. Content moderation
5. Test coverage expansion

With a focused team of 2-3 developers over **4-6 weeks**, these gaps can be closed and the platform can launch to production.

The comprehensive documentation, well-structured codebase, and existing test suite provide a strong foundation for the agency team to complete the remaining work efficiently.

**Next Steps:**
1. Review this document and `project_flow.md` thoroughly
2. Set up local development environment
3. Run existing tests to verify setup
4. Begin work on critical blockers (queue workers, Stripe security)
5. Coordinate with NeonHub stakeholders for requirements clarification
6. Plan sprint schedules and milestones

Good luck with the completion of NeonHub! 🚀
