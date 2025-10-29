# CODEX TASK: NeonHub LoopDrive Backend Implementation

**Status**: ✅ Ready to Start  
**Prerequisites**: ✅ All Complete (Types, SDK, Documentation)  
**Estimated Time**: 20-25 hours  
**Priority**: High

---

## Context

NeonHub LoopDrive v1.0 is an identity-first, memory-powered agentic marketing system. The **SDK, types, and documentation are complete** (by Cursor). Your mission is to implement the **backend services, schema, agents, routes, and queue infrastructure**.

**Key Files Already Complete**:
- ✅ Type definitions: `apps/api/src/types/agentic.ts`, `brand-voice.ts`, `budget.ts`
- ✅ SDK client: `core/sdk/src/modules/` (person, voice, send, budget, events)
- ✅ Documentation: `AGENTIC_ARCHITECTURE.md`, `AGENTIC_QUICKSTART.md`
- ✅ Implementation status: `AGENTIC_IMPLEMENTATION_STATUS.md`

---

## Your Implementation Scope

### 1. Prisma Schema Extensions (`apps/api/prisma/schema.prisma`)

Add these 16 new models while preserving ALL existing models:

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

  identities     Identity[]
  consents       Consent[]
  topics         Topic[]
  notes          Note[]
  memEmbeddings  MemEmbedding[]
  objectives     Objective[]
  events         Event[]      @relation("PersonEvents")

  @@index([workspaceId])
  @@map("persons")
}

model Identity {
  id        String   @id @default(cuid())
  personId  String
  type      String
  value     String
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
  id        String    @id @default(cuid())
  personId  String
  channel   String
  scope     String
  status    String
  source    String
  grantedAt DateTime?
  revokedAt DateTime?
  expiresAt DateTime?
  metadata  Json?
  createdAt DateTime  @default(now())

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
  id        String    @id @default(cuid())
  personId  String
  name      String
  weight    Float
  category  String?
  source    String
  lastSeen  DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  person Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@index([personId])
  @@map("topics")
}

model Objective {
  id        String    @id @default(cuid())
  personId  String
  type      String
  status    String
  context   Json?
  priority  Int?
  dueDate   DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  person Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@index([personId, status])
  @@map("objectives")
}

model MemEmbedding {
  id            String                 @id @default(cuid())
  personId      String
  kind          String
  text          String                 @db.Text
  vector        Unsupported("vector")?
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
  type           String
  channel        String?
  source         String
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
  usage       String
  winRate     Float    @default(0.5)
  impressions Int      @default(0)
  conversions Int      @default(0)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([brandId, channel, objective])
  @@map("snippet_library")
}

model Wallet {
  id                   String   @id @default(cuid())
  workspaceId          String   @unique
  organizationId       String
  balance              Int
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
  type        String
  amount      Int
  balance     Int
  source      String
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
  objectives  Json
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
  status        String
  allocations   Json
  totalBudget   Int
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
  amount       Int
  type         String
  category     String
  externalId   String?
  description  String?
  metadata     Json?
  timestamp    DateTime @default(now())

  @@index([workspaceId, timestamp])
  @@index([allocationId])
  @@map("budget_ledger")
}

model StripePayment {
  id              String   @id @default(cuid())
  workspaceId     String
  walletId        String
  paymentIntentId String   @unique
  amount          Int
  currency        String   @default("usd")
  status          String
  paymentMethod   String?
  receiptUrl      String?
  failureReason   String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId])
  @@map("stripe_payments")
}

model StripePayout {
  id               String    @id @default(cuid())
  workspaceId      String
  connectAccountId String
  transferId       String    @unique
  amount           Int
  currency         String    @default("usd")
  status           String
  recipientType    String
  recipientName    String
  description      String
  metadata         Json?
  createdAt        DateTime  @default(now())
  paidAt           DateTime?

  @@index([workspaceId])
  @@map("stripe_payouts")
}
```

**Migration Command**:
```bash
pnpm --filter apps/api run prisma:migrate dev --name add_agentic_models
```

---

### 2. Core Services (`apps/api/src/services/`)

#### `person.service.ts`

```typescript
import { prisma } from '../db/prisma';
import type {
  Person,
  Identity,
  PartialIdentity,
  PersonResolutionResult,
  Consent,
  ConsentUpdate,
  Memory,
  MemoryOpts,
  Topic,
  Note
} from '../types/agentic';

export const PersonService = {
  /**
   * Resolve person by partial identity (email, phone, handle)
   * Merge logic: if multiple persons match, merge them
   */
  async resolve(identity: PartialIdentity): Promise<PersonResolutionResult> {
    // 1. Query identities table for matching value
    // 2. If found, return person with all identities
    // 3. If multiple persons found, merge them
    // 4. If not found, create new person + identity
    // Implementation here...
  },

  async get(personId: string): Promise<Person | null> {
    return prisma.person.findUnique({ where: { id: personId } });
  },

  async getIdentities(personId: string): Promise<Identity[]> {
    return prisma.identity.findMany({ where: { personId } });
  },

  async addIdentity(personId: string, identity: Partial<Identity>): Promise<Identity> {
    return prisma.identity.create({
      data: { personId, ...identity }
    });
  },

  /**
   * Fetch personal memory with pgvector similarity search
   */
  async getMemory(personId: string, opts?: MemoryOpts): Promise<Memory[]> {
    // Use pgvector <=> operator for similarity search if opts.query provided
    // Otherwise return latest memories filtered by kind
    // Implementation here...
  },

  async addMemory(personId: string, memory: Partial<Memory>): Promise<Memory> {
    // Generate embedding via OpenAI
    // Store in mem_embeddings table
    // Implementation here...
  },

  async getTopics(personId: string): Promise<Topic[]> {
    return prisma.topic.findMany({
      where: { personId },
      orderBy: { weight: 'desc' }
    });
  },

  async updateTopic(personId: string, name: string, weight: number): Promise<Topic> {
    return prisma.topic.upsert({
      where: { personId_name: { personId, name } },
      update: { weight, lastSeen: new Date() },
      create: { personId, name, weight, source: 'manual' }
    });
  },

  async getConsent(personId: string, channel?: string): Promise<Consent[]> {
    return prisma.consent.findMany({
      where: { personId, ...(channel ? { channel } : {}) }
    });
  },

  async updateConsent(personId: string, consent: ConsentUpdate): Promise<Consent> {
    return prisma.consent.create({
      data: {
        personId,
        ...consent,
        grantedAt: consent.status === 'granted' ? new Date() : null,
        revokedAt: consent.status === 'revoked' ? new Date() : null
      }
    });
  },

  async getNotes(personId: string): Promise<Note[]> {
    return prisma.note.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' }
    });
  },

  async addNote(personId: string, content: string, authorId: string): Promise<Note> {
    return prisma.note.create({
      data: { personId, content, authorId }
    });
  }
};
```

#### `brand-voice.service.ts`

```typescript
import OpenAI from 'openai';
import type {
  BrandVoiceComposerArgs,
  ComposerResult,
  GuardrailCheck,
  PromptPack
} from '../types/agentic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const BrandVoiceService = {
  /**
   * Compose personalized content with brand voice
   */
  async compose(args: BrandVoiceComposerArgs): Promise<ComposerResult> {
    // 1. Fetch brand voice config
    // 2. Fetch person memory for context
    // 3. Build prompt with brand style + person context
    // 4. Call OpenAI GPT-4/5
    // 5. Generate 3 variants (primary + 2 alternates)
    // 6. Query snippet library for high performers
    // 7. Return composed messages
    // Implementation here...
  },

  /**
   * Run guardrail checks (toxicity, PII, spam, compliance)
   */
  async guardrail(text: string, channel: string, brandId: string): Promise<GuardrailCheck> {
    // 1. Check toxicity via OpenAI moderation API
    // 2. Scan for PII (email, phone, SSN patterns)
    // 3. Check spam score (link density, caps, exclamation)
    // 4. Validate compliance rules per channel
    // 5. Return violations or safe=true
    // Implementation here...
  },

  async getPromptPack(useCase: string, brandId: string): Promise<PromptPack> {
    // Fetch stored prompt template for brand + use case
    // Implementation here...
  }
};
```

#### `event-intake.service.ts`

```typescript
import type { Event } from '../types/agentic';

export const EventIntakeService = {
  /**
   * Ingest and normalize external event
   */
  async ingest(raw: any): Promise<Event> {
    // 1. Normalize to Event schema
    // 2. Classify (topic, intent, sentiment)
    // 3. Generate embedding if text content
    // 4. Write to events table
    // 5. Queue for learning loop processing
    // Implementation here...
  },

  async classify(event: Event) {
    // Use OpenAI or local classifier to extract topic/intent/sentiment
    // Implementation here...
  }
};
```

#### `learning-loop.service.ts`

```typescript
export const LearningService = {
  /**
   * Update prompt weights based on outcomes
   */
  async updatePromptWeights(objective: string, channel: string, outcome: 'conversion' | 'no_conversion') {
    // Track conversion rates per prompt template
    // Adjust selection weights
    // Implementation here...
  },

  /**
   * Update person topic weights based on engagement
   */
  async updatePersonaTopics(personId: string, events: any[]) {
    // Increment topic weights for engaged content
    // Decay unused topics
    // Implementation here...
  },

  /**
   * Rank snippets by win-rate
   */
  async rankSnippets() {
    // Query snippet_library, sort by winRate
    // Implementation here...
  }
};
```

#### `budget.service.ts`

```typescript
import Stripe from 'stripe';
import type { BudgetAllocationRequest, AllocationPlan } from '../types/budget';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const BudgetService = {
  /**
   * Create allocation plan using Thompson sampling (bandit)
   */
  async plan(request: BudgetAllocationRequest): Promise<AllocationPlan> {
    // 1. Fetch historical performance per channel
    // 2. Build Beta(α, β) distributions for each channel
    // 3. Sample from distributions
    // 4. Allocate budget proportional to samples
    // 5. Predict conversions & ROAS
    // 6. Return plan
    // Implementation here...
  },

  /**
   * Execute approved allocation
   */
  async execute(allocationId: string) {
    // 1. Debit wallet
    // 2. Queue campaign jobs per channel
    // 3. Log to budget_ledger
    // Implementation here...
  },

  /**
   * Reconcile planned vs actual spend
   */
  async reconcile(allocationId: string) {
    // 1. Query budget_ledger for actual spend
    // 2. Compare vs planned allocation
    // 3. Calculate variance
    // 4. Return reconciliation report
    // Implementation here...
  },

  /**
   * Top up wallet via Stripe
   */
  async topUpWallet(workspaceId: string, amount: number) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { workspaceId }
    });

    await prisma.stripePayment.create({
      data: {
        workspaceId,
        walletId: `wallet_${workspaceId}`,
        paymentIntentId: paymentIntent.id,
        amount,
        status: 'pending'
      }
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    };
  }
};
```

---

### 3. Agent Implementations (`apps/api/src/agents/`)

#### Extend `EmailAgent.ts`

```typescript
async sendPersonalized(args: {
  personId: string;
  brandId: string;
  objective: string;
  utmParams?: Record<string, string>;
}) {
  // 1. Resolve identity → email + consent
  const result = await PersonService.resolve({ personId: args.personId });
  const email = result.identities.find(i => i.type === 'email')?.value;
  
  if (!email) throw new Error('No email identity');

  // 2. Check consent
  const consents = await PersonService.getConsent(args.personId, 'email');
  if (!consents.some(c => c.status === 'granted')) {
    throw new Error('No email consent');
  }

  // 3. Fetch memory
  const memory = await PersonService.getMemory(args.personId, { limit: 5 });

  // 4. Compose with BVO
  const composition = await BrandVoiceService.compose({
    brandId: args.brandId,
    channel: 'email',
    objective: args.objective,
    personId: args.personId
  });

  // 5. Deliverability checks
  // Check spam score, DKIM, etc.

  // 6. Send via Resend
  // await resend.emails.send(...)

  // 7. Log event
  await EventIntakeService.ingest({
    type: 'email.sent',
    personId: args.personId,
    channel: 'email',
    source: 'resend',
    payload: { subject: composition.primary.subject }
  });
}
```

#### Create `SMSAgent.ts`

```typescript
export class SMSAgent {
  async send(args: { personId: string; brandId: string; objective: string }) {
    // 1. Resolve phone identity + TCPA consent
    // 2. Fetch memory snapshot
    // 3. BVO compose (max 160 chars)
    // 4. Link shortener + UTM
    // 5. Twilio send
    // 6. Log event
    // Implementation here...
  }

  async parseReply(inbound: any) {
    // Parse intent/sentiment from reply
    // Update person memory
    // Implementation here...
  }
}
```

#### Create `SocialMessagingAgent.ts`

```typescript
export class SocialMessagingAgent {
  async sendDM(args: {
    personId: string;
    platform: string;
    brandId: string;
    objective: string;
  }) {
    // 1. Platform connector (IG, X, Reddit, WhatsApp)
    // 2. Rate limit check
    // 3. Fetch platform context (recent posts, comments)
    // 4. BVO compose (platform style)
    // 5. Send via platform API
    // 6. Log event
    // Implementation here...
  }
}
```

---

### 4. API Routes (`apps/api/src/routes/`)

Create/extend these route files:

- `person.ts` - 13 endpoints (resolve, get, list, identities, memory, topics, consent, notes, merge, search, timeline)
- `brand-voice.ts` - 6 endpoints (compose, guardrail, prompt, snippets, test-alignment, analytics)
- `sms.ts` - 2 endpoints (send, inbound webhook)
- `social.ts` - extend for DM endpoints
- `send.ts` - 5 endpoints (status, cancel, history, bulk, bulk-status)
- `budget.ts` - 16 endpoints (plan, execute, pause, resume, etc.)
- `events.ts` - 7 endpoints (query, get, stats, ingest, funnel, attribution)

Use existing route patterns from `apps/api/src/routes/` and add Zod validation.

---

### 5. Queue Infrastructure (`apps/api/src/queues/`)

```typescript
// queues/index.ts
import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../config/redis';

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

---

### 6. Tests (`apps/api/src/__tests__/`)

Add comprehensive test coverage:

```typescript
// __tests__/integration/agentic-flow.test.ts
describe('Agentic Flow', () => {
  it('should resolve → compose → send → observe', async () => {
    // Full workflow test
  });
});

// __tests__/services/person.service.test.ts
describe('PersonService', () => {
  it('should resolve person by email', async () => {
    // ...
  });

  it('should merge duplicate persons', async () => {
    // ...
  });
});

// __tests__/services/budget.service.test.ts
describe('BudgetService', () => {
  it('should allocate using bandit strategy', async () => {
    // ...
  });
});
```

---

## Environment Variables

Add to `ENV_TEMPLATE.example`:

```bash
# OpenAI for Brand Voice
OPENAI_API_KEY=sk-...

# Redis for queues
REDIS_URL=redis://localhost:6379

# Twilio for SMS
TWILIO_SID=AC...
TWILIO_AUTH_TOKEN=...

# Stripe for budget wallet
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Success Criteria

- [ ] All 16 new models in schema with proper relations
- [ ] 5 core services implemented with full typing
- [ ] 3 agent pipelines working (Email enhanced, SMS new, Social DM new)
- [ ] 40+ new route handlers with Zod validation
- [ ] 11 queue workers processing jobs
- [ ] 95%+ test coverage on new code
- [ ] Zero lint/type errors
- [ ] Migration runs successfully on dev DB
- [ ] Smoke tests pass

---

## Coordination with Cursor

- **Types**: Already defined in `apps/api/src/types/agentic.ts` - import and use these
- **SDK**: Already built and expects specific API contracts - match request/response shapes exactly
- **Documentation**: Already complete - reference `AGENTIC_ARCHITECTURE.md` for design decisions

---

## Timeline

**Estimated**: 20-25 hours

Suggested breakdown:
- Schema + Migration: 3h
- Services: 6h
- Agents: 4h
- Routes: 4h
- Queues: 2h
- Tests: 4h
- Integration + Fixes: 2-4h

---

**Ready to proceed?** All prerequisites are complete. The types, SDK, and docs provide a clear API contract to implement against.

**Status**: ✅ Ready for Backend Development

