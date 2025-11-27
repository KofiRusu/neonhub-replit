# Phase 3 Development Guide — MVP Feature Implementation

**Status:** ✅ Ready for implementation  
**Blocker Status:** All critical blockers resolved ✅  
**Test Coverage:** 46/46 suites passing, 181/181 tests green  
**Last Updated:** November 3, 2025

---

## 🎯 Phase 3 Goals

| Goal | Target | Current | Status |
|------|--------|---------|--------|
| **Feature Completeness** | 90% | 60% | 🔄 In Progress |
| **Test Coverage** | 85% | 26% | 🔄 In Progress |
| **Production Readiness** | 100% | 62% | 🔄 In Progress |
| **Agent Functionality** | Full orchestration | 80% | 🟢 Near Complete |
| **Learning Loop** | Enabled | ✅ Enabled | ✅ DONE |
| **Monitoring** | Prometheus ready | ✅ Ready | ✅ DONE |

---

## 🚀 Core Features to Implement

### 1. **Content Generation Pipeline** (High Priority)
```
Goal: Automated content creation with learning feedback
Status: 50% complete
```

**What exists:**
- ✅ ContentAgent template
- ✅ Brand voice ingestion
- ✅ SEO keyword research
- ✅ AI text generation (OpenAI)

**What needs finishing:**
- [ ] Content quality scoring
- [ ] Feedback loop integration
- [ ] A/B testing framework
- [ ] Performance analytics dashboard

**Implementation Path:**
1. Create `ContentQualityService`
   - Evaluate readability, SEO score, brand alignment
   - Rate on 0-100 scale
2. Wire to AgentRun feedback
   - Store scores in agentRunMetric
   - Use for learning reward signal
3. Build A/B testing router
   - Split traffic between variants
   - Track conversion metrics

**Test Requirements:**
- Unit: Content scoring logic
- Integration: Feedback loop end-to-end
- E2E: Dashboard displays metrics

---

### 2. **Email Campaign Orchestration** (High Priority)
```
Goal: Multi-touch email sequences with optimization
Status: 60% complete
```

**What exists:**
- ✅ EmailAgent with sequence generation
- ✅ Resend integration
- ✅ Template engine
- ✅ Learning context wired

**What needs finishing:**
- [ ] Campaign management UI
- [ ] Delivery scheduling
- [ ] Open/click tracking
- [ ] Unsubscribe handling

**Implementation Path:**
1. Create `CampaignService`
   - Track campaign state (draft, scheduled, sending, completed)
   - Store send times per recipient
2. Add delivery scheduling
   - Use BullMQ job queue
   - Schedule sends at optimal times
3. Implement event webhooks
   - Track opens/clicks from Resend
   - Feed back into learning loop

**Test Requirements:**
- Unit: Campaign state machine
- Integration: Resend webhook handling
- E2E: Send campaign, track metrics

---

### 3. **Social Media Publishing** (Medium Priority)
```
Goal: Multi-platform content distribution
Status: 40% complete
```

**What exists:**
- ✅ SocialAgent template
- ✅ Platform connectors (Twitter, LinkedIn, Instagram, etc.)
- ✅ Post scheduling framework

**What needs finishing:**
- [ ] Content adaptation per platform
- [ ] Engagement metrics collection
- [ ] Hashtag optimization
- [ ] Cross-posting coordination

**Implementation Path:**
1. Create `PlatformAdapterService`
   - Format content for each platform
   - Enforce platform constraints (character limits, etc.)
2. Add engagement tracking
   - Pull metrics from APIs
   - Aggregate performance data
3. Wire learning for engagement
   - High-engagement posts as positive rewards
   - Low-engagement as learning signals

**Test Requirements:**
- Unit: Content adaptation logic
- Integration: Platform API mocking
- E2E: Publish across platforms

---

### 4. **Analytics & Dashboards** (Medium Priority)
```
Goal: Real-time performance visibility
Status: 30% complete
```

**What exists:**
- ✅ Prometheus metrics
- ✅ AgentRun persistence
- ✅ Learning metrics recording

**What needs finishing:**
- [ ] Analytics API endpoints
- [ ] Dashboard components
- [ ] Report generation
- [ ] Alert thresholds

**Implementation Path:**
1. Create `AnalyticsService`
   - Aggregate metrics by time period
   - Calculate KPIs (ROI, conversion rate, etc.)
2. Add dashboard routes
   - `/api/analytics/summary` - overall stats
   - `/api/analytics/agents` - per-agent metrics
   - `/api/analytics/campaigns` - campaign performance
3. Build React components
   - Charts and graphs
   - Real-time updates via WebSocket

**Test Requirements:**
- Unit: Analytics calculations
- Integration: Data aggregation
- E2E: Dashboard loads and updates

---

### 5. **Billing & Subscription** (Medium Priority)
```
Goal: Stripe integration and usage-based billing
Status: 20% complete
```

**What exists:**
- ✅ Stripe webhook router
- ✅ Subscription schema in Prisma
- ✅ Product definitions

**What needs finishing:**
- [ ] Checkout flow
- [ ] Usage metering
- [ ] Invoice generation
- [ ] Plan management UI

**Implementation Path:**
1. Create `BillingService`
   - Sync subscriptions with Stripe
   - Handle webhook events
   - Calculate usage charges
2. Add checkout routes
   - `/api/billing/checkout` - create session
   - `/api/billing/portal` - manage subscription
3. Wire usage metering
   - Track agent runs as billable events
   - Submit metrics to Stripe

**Test Requirements:**
- Unit: Usage calculation
- Integration: Stripe API mocking
- E2E: Complete checkout flow

---

## 📋 Implementation Checklist

### For Each Feature:

```typescript
// 1. Create service
src/services/{feature}.service.ts
- ✅ Input validation (Zod schemas)
- ✅ Error handling
- ✅ Logging
- ✅ Type safety

// 2. Create tRPC router
src/trpc/routers/{feature}.router.ts
- ✅ Input/output schemas
- ✅ Authorization checks
- ✅ Error responses
- ✅ Request logging

// 3. Create tests
src/services/__tests__/{feature}.service.spec.ts
- ✅ Unit tests (80%+ coverage)
- ✅ Integration tests
- ✅ Error scenarios

// 4. Create frontend (if applicable)
src/components/{Feature}/*.tsx
- ✅ Component composition
- ✅ State management
- ✅ Accessibility (ARIA)
- ✅ Error boundaries

// 5. Update documentation
docs/{Feature}_API.md
- ✅ Endpoint documentation
- ✅ Error codes
- ✅ Examples
```

---

## 🧪 Testing Standards

### Unit Tests (Must have)
```typescript
describe("Service", () => {
  it("happy path", async () => {
    const result = await service.doThing();
    expect(result).toBeDefined();
  });

  it("error handling", async () => {
    await expect(service.doThing(invalid)).rejects.toThrow();
  });

  it("edge cases", async () => {
    const result = await service.doThing(empty);
    expect(result).toEqual(expectedDefault);
  });
});
```

**Coverage Targets:**
- Statements: 85%+
- Branches: 80%+
- Functions: 85%+
- Lines: 85%+

### Integration Tests (Where applicable)
```typescript
describe("Service Integration", () => {
  it("persists to database", async () => {
    const result = await service.create(input);
    const fetched = await db.find(result.id);
    expect(fetched).toEqual(result);
  });
});
```

### E2E Tests (For critical paths)
```gherkin
Feature: Campaign Management
  Scenario: Create and send campaign
    Given user is authenticated
    When user creates campaign
    Then campaign appears in dashboard
    And metrics are tracked
```

---

## 🔄 Learning Loop Integration

**All features must support learning:**

1. **Record signals** in agent runs:
```typescript
await recordAgentLearning({
  runId: "123",
  agentId: "EmailAgent",
  organizationId: "org-1",
  input: { topic: "Q4 campaign" },
  output: { emails: [...] },
  reward: 1, // positive for success
  metrics: { 
    openRate: 0.25,
    clickRate: 0.05,
  },
});
```

2. **Use recalled context** in prompts:
```typescript
const { prompt, context } = await buildLearningAugmentedPrompt(
  "EmailAgent",
  basePrompt,
  "email_sequence_q4",
  { maxMemories: 3 }
);
```

3. **Monitor rewards** via Prometheus:
```
agent_learning_recorded_total{agent="EmailAgent", reward_positive="true"}
```

---

## 📊 Progress Tracking

### Weekly Targets
- **Week 1 (Nov 3-9):** Content + Email (complete 2 features)
- **Week 2 (Nov 10-16):** Social + Analytics (complete 2 features)  
- **Week 3 (Nov 17-23):** Billing + Polish (complete 1 feature + fixes)

### Metrics to Track
- ✅ Tests passing: 181/181 ✅
- 📈 Coverage: 26% → 60% target
- 🚀 Features complete: 0 → 5 target
- 📦 Production readiness: 62% → 90% target

---

## 🛠 Development Commands

```bash
# Start development
pnpm dev

# Run tests continuously
pnpm --filter apps/api test:watch

# Check coverage
pnpm --filter apps/api test:coverage

# Lint and fix
pnpm lint -- --fix

# Type check
pnpm type-check

# Build for production
pnpm build

# View test results
open apps/api/coverage/lcov-report/index.html
```

---

## 🎓 Code Examples

### Creating a New Service

```typescript
// apps/api/src/services/my-feature.service.ts
import { prisma } from "../db/prisma.js";
import { logger } from "../lib/logger.js";
import { z } from "zod";

const InputSchema = z.object({
  organizationId: z.string(),
  data: z.record(z.unknown()),
});

export async function processFeature(input: z.infer<typeof InputSchema>) {
  const validated = InputSchema.parse(input);
  
  try {
    logger.info({ organizationId: validated.organizationId }, "Processing feature");
    
    // Your logic here
    
    return { success: true, id: "123" };
  } catch (error) {
    logger.error({ error, input: validated }, "Feature processing failed");
    throw error;
  }
}
```

### Creating a tRPC Router

```typescript
// apps/api/src/trpc/routers/my-feature.router.ts
import { publicProcedure, router } from "../trpc.js";
import { z } from "zod";
import { processFeature } from "../../services/my-feature.service.js";

export const myFeatureRouter = router({
  create: publicProcedure
    .input(z.object({ data: z.record(z.unknown()) }))
    .mutation(async ({ input, ctx }) => {
      return processFeature({
        organizationId: ctx.organizationId,
        data: input.data,
      });
    }),
});
```

---

## ✅ Success Criteria for Phase 3

Phase 3 is complete when:

- ✅ All 5 core features fully implemented
- ✅ 85%+ test coverage achieved
- ✅ All tRPC endpoints documented
- ✅ Frontend components deployed
- ✅ Production monitoring active
- ✅ Learning loop generating insights
- ✅ Zero TypeScript errors
- ✅ CI/CD pipelines green
- ✅ User documentation complete
- ✅ Security audit passed

**Estimated Duration:** 3-4 weeks  
**Target Completion:** Late November 2025

---

## 📞 Getting Help

- Check existing agent implementations in `src/agents/`
- Review test examples in `src/__tests__/`
- See schema examples in `prisma/schema.prisma`
- Ask questions in commit messages or docs

**Let's ship Phase 3!** 🚀
