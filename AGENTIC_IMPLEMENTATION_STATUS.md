# NeonHub LoopDrive - Implementation Status

**Date**: 2025-10-28  
**Version**: 1.0 (Initial Implementation)  
**Status**: 🟡 In Progress (SDK Complete, Backend Pending)

---

## Implementation Strategy

This implementation is split between **Cursor** (SDK, frontend, integrations, docs) and **Codex** (backend services, schema, agents) to maximize parallel development and avoid conflicts.

###  Division of Labor

| Component                     | Owner  | Status      |
|-------------------------------|--------|-------------|
| Type Definitions              | Cursor | ✅ Complete  |
| SDK Package                   | Cursor | ✅ Complete  |
| Backend Schema (Prisma)       | Codex  | 🔄 Pending   |
| Backend Services              | Codex  | 🔄 Pending   |
| Backend Routes (API)          | Codex  | 🔄 Pending   |
| Agents (Email, SMS, Social)   | Codex  | 🔄 Pending   |
| Queue Infrastructure          | Codex  | 🔄 Pending   |
| Integration Layer (Social)    | Cursor | 🔄 Planned   |
| Frontend Components           | Cursor | 🔄 Planned   |
| Documentation                 | Cursor | ✅ Complete  |
| CI/CD Updates                 | Cursor | 🔄 Planned   |

---

## ✅ Completed (Cursor)

### 1. Type Definitions

**Location**: `apps/api/src/types/`

- ✅ `agentic.ts` - Core agentic architecture types
- ✅ `brand-voice.ts` - Brand voice composition and guardrails
- ✅ `budget.ts` - Budget engine and wallet types

**Details**:
- 300+ type definitions covering Person Graph, Events, Brand Voice, Budget Engine
- Full TypeScript support with JSDoc comments
- Enums for all categorical data (Channel, ConsentStatus, EventType, etc.)

### 2. SDK Package

**Location**: `core/sdk/`

Extended existing SDK with 5 new modules:

#### Person Module (`core/sdk/src/modules/person.ts`)
- ✅ `resolve(identity)` - Identity resolution
- ✅ `get(personId)` - Get person by ID
- ✅ `list(opts)` - List persons
- ✅ `getIdentities(personId)` - Get all identities
- ✅ `addIdentity(personId, identity)` - Add identity
- ✅ `getMemory(personId, opts)` - Fetch personal memory
- ✅ `addMemory(personId, memory)` - Add memory
- ✅ `getTopics(personId)` - Get interests
- ✅ `updateTopic(personId, topic, weight)` - Update topic weight
- ✅ `getConsent(personId, channel)` - Get consent status
- ✅ `updateConsent(personId, consent)` - Update consent
- ✅ `getNotes(personId)` - Get CRM notes
- ✅ `addNote(personId, content)` - Add note
- ✅ `merge(sourceId, targetId)` - Merge persons
- ✅ `search(query)` - Search persons

#### Voice Module (`core/sdk/src/modules/voice.ts`)
- ✅ `compose(args)` - Generate personalized content
- ✅ `guardrail(text, channel, brandId)` - Content safety checks
- ✅ `getPromptPack(useCase, brandId)` - Get prompt templates
- ✅ `getSnippets(filters)` - Query snippet library
- ✅ `addSnippet(snippet)` - Add winning snippet
- ✅ `recordSnippetUsage(snippetId, outcome)` - Track performance
- ✅ `testAlignment(text, brandId)` - Brand voice alignment score
- ✅ `getAnalytics(brandId, dateRange)` - Voice analytics

#### Send Module (`core/sdk/src/modules/send.ts`)
- ✅ `email(args)` - Send personalized email
- ✅ `sms(args)` - Send personalized SMS
- ✅ `dm(args)` - Send social DM
- ✅ `getStatus(sendId)` - Get send status with events
- ✅ `cancel(sendId)` - Cancel scheduled send
- ✅ `getHistory(personId, opts)` - Send history for person
- ✅ `bulk(args)` - Bulk send
- ✅ `getBulkStatus(jobId)` - Bulk job status

#### Budget Module (`core/sdk/src/modules/budget.ts`)
- ✅ `plan(request)` - Create allocation plan
- ✅ `execute(allocationId)` - Execute approved plan
- ✅ `pause(allocationId)` - Pause execution
- ✅ `resume(allocationId)` - Resume execution
- ✅ `getAllocation(allocationId)` - Get allocation details
- ✅ `listAllocations(workspaceId, opts)` - List allocations
- ✅ `reconcile(allocationId)` - Planned vs actual report
- ✅ `getLedger(workspaceId, range)` - Transaction log
- ✅ `getWallet(workspaceId)` - Get wallet
- ✅ `getWalletBalance(workspaceId)` - Get balance
- ✅ `getWalletTransactions(workspaceId, opts)` - Transaction history
- ✅ `topUpWallet(workspaceId, amount)` - Stripe top-up
- ✅ `configureAutoReload(workspaceId, config)` - Auto-reload settings
- ✅ `getPayments(workspaceId, opts)` - Stripe payment history
- ✅ `createProfile(profile)` - Save budget profile
- ✅ `listProfiles(workspaceId)` - List profiles
- ✅ `getDashboard(workspaceId, period)` - Budget dashboard data
- ✅ `getAlerts(workspaceId, opts)` - Spend alerts
- ✅ `acknowledgeAlert(alertId)` - Acknowledge alert
- ✅ `getChannelPerformance(workspaceId, channel, period)` - Channel perf history

#### Events Module (`core/sdk/src/modules/events.ts`)
- ✅ `query(filters)` - Query events with filters
- ✅ `get(eventId)` - Get single event
- ✅ `getTimeline(personId, opts)` - Person timeline
- ✅ `getStats(workspaceId, range)` - Event statistics
- ✅ `ingest(event)` - Ingest external event
- ✅ `ingestBatch(events)` - Batch ingest
- ✅ `stream(filters)` - SSE event stream (stub)
- ✅ `getFunnel(workspaceId, steps, opts)` - Conversion funnel
- ✅ `getAttribution(conversionEventId)` - Attribution model

#### SDK Integration
- ✅ Updated `core/sdk/src/index.ts` to export new modules
- ✅ Updated `core/sdk/src/types.ts` to re-export agentic types
- ✅ Created `core/sdk/src/types/agentic.ts` with standalone types
- ✅ Created `core/sdk/src/types/budget.ts` with standalone types

### 3. Documentation

- ✅ **AGENTIC_ARCHITECTURE.md** (500+ lines)
  - System overview with diagrams
  - Data models
  - Agent pipelines (Mermaid flowcharts)
  - Learning loop mechanics
  - Budget engine strategy
  - Tech stack
  - API examples
  - Deployment checklist

- ✅ **AGENTIC_QUICKSTART.md** (450+ lines)
  - Installation steps
  - Environment setup
  - Database migration guide
  - Step-by-step first workflow
  - SDK usage examples
  - React/Next.js integration examples
  - Integration test examples
  - Troubleshooting guide

- ✅ **AGENTIC_IMPLEMENTATION_STATUS.md** (this file)
  - Implementation tracking
  - Division of labor
  - API contract specifications
  - Testing checklist

---

## 🔄 Pending (Codex - Backend Implementation)

### 1. Prisma Schema Extensions

**File**: `apps/api/prisma/schema.prisma`

Add the following models:

```prisma
model Person {
  id             String   @id @default(cuid())
  workspaceId    String
  organizationId String?
  firstName      String?
  lastName       String?
  locale         String?
  timezone       String?
  metadata       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  identities   Identity[]
  consents     Consent[]
  topics       Topic[]
  notes        Note[]
  memEmbeddings MemEmbedding[]
  objectives   Objective[]
  events       Event[]      @relation("PersonEvents")

  @@index([workspaceId])
  @@map("persons")
}

model Identity {
  id        String   @id @default(cuid())
  personId  String
  type      String   // email, phone, instagram, x, etc.
  value     String   // unique per workspace+type
  verified  Boolean  @default(false)
  isPrimary Boolean  @default(false)
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  person Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@unique([type, value])
  @@index([personId])
  @@map("identities")
}

model Consent {
  id        String   @id @default(cuid())
  personId  String
  channel   String   // email, sms, dm, ads
  scope     String   // marketing, transactional, both
  status    String   // granted, revoked, pending, unknown
  source    String   // form, import, api, inferred
  grantedAt DateTime?
  revokedAt DateTime?
  expiresAt DateTime?
  metadata  Json?
  createdAt DateTime @default(now())

  person Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@index([personId, channel])
  @@map("consents")
}

model Note {
  id        String   @id @default(cuid())
  personId  String
  content   String   @db.Text
  authorId  String
  metadata  Json?
  createdAt DateTime @default(now())

  person Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@index([personId])
  @@map("notes")
}

model Topic {
  id        String   @id @default(cuid())
  personId  String
  name      String
  weight    Float    // 0-1 confidence score
  category  String?
  source    String   // inferred, explicit, manual
  lastSeen  DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  person Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@index([personId])
  @@map("topics")
}

model Objective {
  id        String   @id @default(cuid())
  personId  String
  type      String   // nurture, winback, demo_book, etc.
  status    String   // active, paused, completed, abandoned
  context   Json?
  priority  Int?
  dueDate   DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  person Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@index([personId, status])
  @@map("objectives")
}

model MemEmbedding {
  id            String                 @id @default(cuid())
  personId      String
  kind          String                 // fact, intent, message, document, objection, preference
  text          String                 @db.Text
  vector        Unsupported("vector")? // pgvector
  sourceEventId String?
  confidence    Float?
  metadata      Json?
  expiresAt     DateTime?
  createdAt     DateTime               @default(now())

  person Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@index([personId])
  @@map("mem_embeddings")
}

model Event {
  id             String   @id @default(cuid())
  workspaceId    String
  organizationId String?
  personId       String?
  type           String   // email.sent, sms.replied, conversion.purchase, etc.
  channel        String?  // email, sms, instagram, etc.
  source         String   // sendgrid, twilio, meta, gsc, stripe
  payload        Json
  ts             DateTime @default(now())
  metadata       Json?

  person Person? @relation("PersonEvents", fields: [personId], references: [id], onDelete: SetNull)

  @@index([workspaceId, ts])
  @@index([personId, ts])
  @@index([type])
  @@map("events")
}

model SnippetLibrary {
  id          String   @id @default(cuid())
  brandId     String
  channel     String
  objective   String
  snippet     String   @db.Text
  usage       String   // subject, opening, body, cta, ps
  winRate     Float    @default(0.5)
  impressions Int      @default(0)
  conversions Int      @default(0)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([brandId, channel, objective])
  @@map("snippet_library")
}

// Budget Engine Models

model Wallet {
  id                   String   @id @default(cuid())
  workspaceId          String   @unique
  organizationId       String
  balance              Int      // in cents
  currency             String   @default("usd")
  status               String   @default("active")
  autoReloadEnabled    Boolean  @default(false)
  autoReloadThreshold  Int?
  autoReloadAmount     Int?
  metadata             Json?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@map("wallets")
}

model WalletTransaction {
  id          String   @id @default(cuid())
  walletId    String
  type        String   // credit, debit, refund, adjustment
  amount      Int      // in cents, positive for credit, negative for debit
  balance     Int      // balance after transaction
  source      String   // stripe_payment, campaign_spend, refund, manual
  referenceId String?
  description String
  metadata    Json?
  timestamp   DateTime @default(now())

  @@index([walletId, timestamp])
  @@map("wallet_transactions")
}

model BudgetProfile {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  objectives  Json     // array of ObjectiveType
  constraints Json
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workspaceId])
  @@map("budget_profiles")
}

model BudgetAllocation {
  id            String    @id @default(cuid())
  workspaceId   String
  profileId     String?
  status        String    // draft, pending_approval, approved, executing, completed, cancelled
  allocations   Json      // ChannelAllocation[]
  totalBudget   Int       // in cents
  predictedROAS Float?
  approvedBy    String?
  approvedAt    DateTime?
  executedAt    DateTime?
  completedAt   DateTime?
  metadata      Json?
  createdAt     DateTime  @default(now())

  @@index([workspaceId, status])
  @@map("budget_allocations")
}

model BudgetLedger {
  id           String   @id @default(cuid())
  workspaceId  String
  allocationId String?
  channel      String
  amount       Int      // in cents
  type         String   // planned, actual, adjustment
  category     String   // send, ad, creator, service
  externalId   String?
  description  String?
  metadata     Json?
  timestamp    DateTime @default(now())

  @@index([workspaceId, timestamp])
  @@index([allocationId])
  @@map("budget_ledger")
}

model StripePayment {
  id                String   @id @default(cuid())
  workspaceId       String
  walletId          String
  paymentIntentId   String   @unique
  amount            Int
  currency          String   @default("usd")
  status            String
  paymentMethod     String?
  receiptUrl        String?
  failureReason     String?
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([workspaceId])
  @@map("stripe_payments")
}

model StripePayout {
  id                String    @id @default(cuid())
  workspaceId       String
  connectAccountId  String
  transferId        String    @unique
  amount            Int
  currency          String    @default("usd")
  status            String
  recipientType     String
  recipientName     String
  description       String
  metadata          Json?
  createdAt         DateTime  @default(now())
  paidAt            DateTime?

  @@index([workspaceId])
  @@map("stripe_payouts")
}
```

### 2. Core Services

**Location**: `apps/api/src/services/`

#### `person.service.ts`
- Identity resolution logic (merge duplicate persons)
- Memory retrieval with pgvector similarity search
- Consent checking with policy enforcement
- Topic weight updates

#### `brand-voice.service.ts`
- LLM composition wrapper (OpenAI GPT-4/5)
- Prompt template management
- Guardrail execution (toxicity, PII, spam)
- Snippet library query and ranking

#### `event-intake.service.ts`
- Event normalization from different sources
- Classification (topic, intent, sentiment)
- Embedding generation
- Queue-based ingestion

#### `learning-loop.service.ts`
- Prompt weight tuning based on outcomes
- Persona topic updates
- Snippet win-rate calculation
- Cadence optimization

#### `budget.service.ts`
- Thompson sampling (bandit) allocator
- Channel performance history tracking
- Stripe wallet integration
- Reconciliation engine

### 3. Agent Implementations

**Location**: `apps/api/src/agents/`

#### `EmailAgent.ts` (extend existing)
- Add `sendPersonalized()` method
- Integrate with PersonService, BrandVoiceService
- Deliverability checks
- Event logging

#### `SMSAgent.ts` (new)
- TCPA compliance checks
- Twilio integration
- Link shortening with UTM
- Reply parsing

#### `SocialMessagingAgent.ts` (new)
- Multi-platform support (IG, X, Reddit, WhatsApp)
- Platform-specific rate limiting
- Thread context management
- Webhook handling

### 4. API Routes

**Location**: `apps/api/src/routes/`

#### `person.ts` (new)
```typescript
POST   /api/person/resolve
GET    /api/person/:id
GET    /api/person
GET    /api/person/:id/identities
POST   /api/person/:id/identities
GET    /api/person/:id/memory
POST   /api/person/:id/memory
GET    /api/person/:id/topics
POST   /api/person/:id/topics
GET    /api/person/:id/consent
POST   /api/person/:id/consent
GET    /api/person/:id/notes
POST   /api/person/:id/notes
POST   /api/person/merge
GET    /api/person/search
GET    /api/person/:id/timeline
```

#### `brand-voice.ts` (extend or create new endpoints)
```typescript
POST   /api/brand-voice/compose
POST   /api/brand-voice/guardrail
GET    /api/brand-voice/prompt/:useCase
GET    /api/brand-voice/snippets
POST   /api/brand-voice/snippets
POST   /api/brand-voice/snippets/:id/usage
POST   /api/brand-voice/test-alignment
GET    /api/brand-voice/:brandId/analytics
```

#### `sms.ts` (new)
```typescript
POST   /api/sms/send
POST   /api/sms/inbound  // webhook
```

#### `social.ts` (extend existing)
```typescript
POST   /api/social/:platform/dm
POST   /api/social/:platform/inbound  // webhook
```

#### `send.ts` (new - unified send interface)
```typescript
GET    /api/send/:id/status
POST   /api/send/:id/cancel
GET    /api/person/:id/sends
POST   /api/send/bulk
GET    /api/send/bulk/:jobId
```

#### `budget.ts` (new)
```typescript
POST   /api/budget/plan
POST   /api/budget/allocation/:id/execute
POST   /api/budget/allocation/:id/pause
POST   /api/budget/allocation/:id/resume
GET    /api/budget/allocation/:id
GET    /api/budget/allocations
POST   /api/budget/allocation/:id/reconcile
GET    /api/budget/ledger
GET    /api/budget/wallet/:workspaceId
GET    /api/budget/wallet/:workspaceId/transactions
POST   /api/budget/wallet/:workspaceId/topup
POST   /api/budget/wallet/:workspaceId/auto-reload
GET    /api/budget/payments
POST   /api/budget/profiles
GET    /api/budget/profiles
GET    /api/budget/dashboard/:workspaceId
GET    /api/budget/alerts
POST   /api/budget/alerts/:id/acknowledge
GET    /api/budget/performance/:channel
```

#### `events.ts` (new)
```typescript
POST   /api/events/query
GET    /api/events/:id
GET    /api/events/stats
POST   /api/events/ingest
POST   /api/events/ingest/batch
POST   /api/events/funnel
GET    /api/events/:id/attribution
```

### 5. Queue Infrastructure

**Location**: `apps/api/src/queues/`

Create queue setup and workers:

```typescript
// queues/index.ts
import { Queue, Worker } from 'bullmq';

export const queues = {
  'intake.fetch': new Queue('intake.fetch', { connection: redisConnection }),
  'intake.normalize': new Queue('intake.normalize', { connection: redisConnection }),
  'intake.embed': new Queue('intake.embed', { connection: redisConnection }),
  'email.compose': new Queue('email.compose', { connection: redisConnection }),
  'email.send': new Queue('email.send', { connection: redisConnection }),
  'sms.compose': new Queue('sms.compose', { connection: redisConnection }),
  'sms.send': new Queue('sms.send', { connection: redisConnection }),
  'social.compose': new Queue('social.compose', { connection: redisConnection }),
  'social.send': new Queue('social.send', { connection: redisConnection }),
  'learning.tune': new Queue('learning.tune', { connection: redisConnection }),
  'budget.execute': new Queue('budget.execute', { connection: redisConnection })
};

// workers/email-compose.worker.ts
const worker = new Worker('email.compose', async (job) => {
  const { personId, brandId, objective } = job.data;
  // Compose logic
}, { connection: redisConnection });
```

### 6. Tests

**Location**: `apps/api/src/__tests__/`

Add comprehensive test coverage for:
- Person resolution logic
- Brand voice composition
- Consent checking
- Budget allocation algorithm
- Event ingestion pipeline
- Queue processing

---

## 🔄 Planned (Cursor - Phase 2)

### 1. Integration Layer

**Location**: `apps/api/src/integrations/social/`

#### Instagram DM Connector
- OAuth2 flow
- Meta Graph API integration
- Webhook handler for incoming messages
- Rate limiting (1000 req/hour)

#### X/Twitter DM Connector
- OAuth 2.0 with PKCE
- Twitter API v2 DM endpoints
- Account Activity API webhooks
- Rate limiting (1000 DM/day)

#### Reddit Private Message Connector
- OAuth2 authorization
- /api/compose endpoint integration
- Inbox polling
- Rate limiting (60 req/min)

#### WhatsApp Business Connector
- Cloud API or On-Premises
- Template message support
- Session message support (24hr window)
- Webhook handler

### 2. Frontend Components

**Location**: `apps/web/src/components/agentic/`

#### Person Components
- `PersonTimeline.tsx` - Event timeline with virtualization
- `PersonMemoryView.tsx` - Memory cards with relevance scores
- `PersonTopics.tsx` - Topic cloud with weights
- `PersonConsent.tsx` - Consent management UI
- `PersonIdentities.tsx` - Identity resolution UI

#### Brand Voice Components
- `BrandVoicePlayground.tsx` - Interactive composer
- `ComposerTester.tsx` - A/B variant comparison
- `GuardrailChecker.tsx` - Real-time safety checks
- `SnippetLibrary.tsx` - Win-rate sorted snippets

#### Budget Components
- `BudgetAllocator.tsx` - Drag-based allocation UI
- `SpendChart.tsx` - Time-series spend visualization
- `ChannelBreakdown.tsx` - Pie chart by channel
- `WalletBalance.tsx` - Balance widget with top-up

#### Learning Components
- `LearningDashboard.tsx` - Win-rate trends
- `PromptPerformance.tsx` - Prompt version comparison
- `TopicWeights.tsx` - Heatmap of topic evolution
- `CadenceOptimizer.tsx` - Best send times

### 3. CI/CD Updates

#### Queue Health Workflow
```yaml
# .github/workflows/queue-health.yml
name: Queue Health Check
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check Queue Lag
        run: |
          # Query queue stats
          # Alert if lag > 5 min
      - name: Notify Slack
        if: failure()
        uses: slackapi/slack-github-action@v1
```

#### Smoke Test Updates
Add to `scripts/post-deploy-smoke.sh`:
```bash
# Test person resolution
curl -f $API_URL/api/person/health

# Test brand voice
curl -f $API_URL/api/brand-voice/health

# Test identity resolution roundtrip
# Test event ingestion pipeline
```

---

## API Contract (For Backend Implementation)

### Person Resolution Endpoint

```
POST /api/person/resolve
Request:
{
  "email"?: string,
  "phone"?: string,
  "handle"?: string,
  "type"?: IdentityType
}

Response:
{
  "person": Person,
  "identities": Identity[],
  "matchedOn": IdentityType[],
  "confidence": number (0-1)
}
```

### Brand Voice Compose Endpoint

```
POST /api/brand-voice/compose
Request:
{
  "brandId": string,
  "channel": Channel,
  "objective": ObjectiveType | string,
  "personId": string,
  "context"?: object,
  "constraints"?: {
    "maxLength"?: number,
    "tone"?: string,
    "includeEmoji"?: boolean,
    "includeLink"?: boolean,
    "urgency"?: "low" | "medium" | "high"
  },
  "draft"?: string
}

Response:
{
  "primary": {
    "subject"?: string,
    "body": string,
    "cta"?: string,
    "ps"?: string
  },
  "variants": [
    {
      "subject"?: string,
      "body": string,
      "cta"?: string
    }
  ],
  "metadata": {
    "model": string,
    "tokensUsed": number,
    "latencyMs": number,
    "snippetsUsed": string[]
  }
}
```

### Email Send Endpoint

```
POST /api/email/send
Request:
{
  "personId": string,
  "brandId": string,
  "objective": ObjectiveType | string,
  "fromName"?: string,
  "fromEmail"?: string,
  "replyTo"?: string,
  "utmParams"?: object,
  "scheduleFor"?: ISO8601,
  "metadata"?: object
}

Response:
{
  "id": string,
  "status": "queued" | "sent" | "delivered" | "failed",
  "personId": string,
  "channel": "email",
  "externalId"?: string,
  "error"?: string,
  "metadata"?: object,
  "sentAt"?: ISO8601
}
```

### Budget Plan Endpoint

```
POST /api/budget/plan
Request:
{
  "workspaceId": string,
  "profileId"?: string,
  "objectives": [
    {
      "type": ObjectiveType,
      "priority": number (1-10),
      "targetMetric": "leads" | "conversions" | "roas" | "engagement" | "reach",
      "targetValue"?: number,
      "weight"?: number
    }
  ],
  "constraints": {
    "totalBudget": number,  // cents
    "period": "daily" | "weekly" | "monthly" | "campaign",
    "minBudgetPerChannel"?: number,
    "maxBudgetPerChannel"?: number,
    "channelLimits"?: { [channel]: number },
    "minROAS"?: number,
    "blacklistChannels"?: Channel[],
    "whitelistChannels"?: Channel[],
    "testBudgetPercent"?: number
  },
  "strategy"?: "bandit" | "proportional" | "equal" | "manual" | "optimizer",
  "dryRun"?: boolean
}

Response:
{
  "id": string,
  "workspaceId": string,
  "requestId": string,
  "strategy": AllocationStrategyType,
  "channels": [
    {
      "channel": Channel,
      "objective": ObjectiveType,
      "budget": number,
      "estimatedReach": number,
      "estimatedImpressions": number,
      "estimatedClicks": number,
      "estimatedConversions": number,
      "estimatedROAS": number,
      "confidence": number,
      "creative"?: object,
      "targeting"?: object
    }
  ],
  "totalBudget": number,
  "predictions": {
    "totalReach": number,
    "totalImpressions": number,
    "totalClicks": number,
    "totalConversions": number,
    "totalRevenue": number,
    "averageROAS": number,
    "riskLevel": "low" | "medium" | "high",
    "modelConfidence": number
  },
  "confidence": number,
  "reasoning": string,
  "alternatives"?: AllocationPlan[],
  "status": "draft" | "pending_approval" | "approved" | "rejected",
  "createdAt": ISO8601,
  "approvedBy"?: string,
  "approvedAt"?: ISO8601
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Person resolution logic
- [ ] Identity merging
- [ ] Consent policy enforcement
- [ ] Memory retrieval with pgvector
- [ ] Brand voice composition
- [ ] Guardrail checks
- [ ] Budget allocation algorithm
- [ ] Thompson sampling bandit
- [ ] Event classification
- [ ] Snippet win-rate calculation

### Integration Tests
- [ ] Full email flow (resolve → compose → send → observe)
- [ ] SMS flow
- [ ] Social DM flow
- [ ] Budget planning and execution
- [ ] Learning loop feedback
- [ ] Wallet top-up via Stripe
- [ ] Event ingestion pipeline
- [ ] Queue processing

### E2E Tests (Playwright)
- [ ] Person timeline UI
- [ ] Brand voice playground
- [ ] Budget allocator drag-and-drop
- [ ] Consent management
- [ ] Dashboard visualizations

---

## Success Metrics

- [ ] 95%+ test coverage on new code
- [ ] Zero TypeScript errors
- [ ] Zero linting errors
- [ ] All migrations run successfully
- [ ] All queues processing jobs
- [ ] API response time < 200ms (p95)
- [ ] LLM composition latency < 2s (p95)
- [ ] SDK builds without errors
- [ ] Documentation complete and accurate

---

## Timeline Estimate

| Phase | Component                    | Estimated Time |
|-------|------------------------------|----------------|
| 1     | Type Definitions             | ✅ 1h (Done)    |
| 1     | SDK Package                  | ✅ 2h (Done)    |
| 1     | Documentation                | ✅ 2h (Done)    |
| 2     | Prisma Schema                | 3h             |
| 2     | Core Services                | 6h             |
| 2     | Agents                       | 4h             |
| 2     | API Routes                   | 4h             |
| 2     | Queue Infrastructure         | 2h             |
| 2     | Backend Tests                | 4h             |
| 3     | Integration Layer            | 4h             |
| 4     | Frontend Components          | 6h             |
| 5     | CI/CD + Final Integration    | 2h             |
| **TOTAL**                          | **~40h**       |

**Parallel Execution**: Phases 1-2 (Backend) can run simultaneously with Phases 3-4 (Integrations + Frontend), reducing calendar time to **~25 hours**.

---

## Coordination Points (Cursor ↔ Codex)

### 1. Type Sync
- **Cursor** has defined all types in `apps/api/src/types/`
- **Codex** should import these types in services/routes
- No type duplication - single source of truth

### 2. API Contract
- **Cursor** SDK expects specific request/response shapes (documented above)
- **Codex** backend must match these contracts exactly
- Use Zod schemas for validation on both sides

### 3. Testing
- **Codex** writes backend tests
- **Cursor** writes integration tests against running backend
- Coordinate on test data fixtures

### 4. Environment Variables
- **Both** need to sync on required env vars (documented in QUICKSTART)
- **Cursor** will add to ENV_TEMPLATE.example once Codex confirms

### 5. Deployment
- **Codex** completes backend + migrations
- **Cursor** deploys frontend + docs
- **Both** verify end-to-end in staging

---

## Questions / Blockers

None currently. Implementation paths are clear. Ready to proceed.

---

**Next Action**: Codex to begin Phase 2 (Backend Implementation) as specified above.

**Status**: ✅ Ready for Backend Development

