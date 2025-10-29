# NeonHub SDK Inventory

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")  
**Phase:** 1 - SDK Creation  
**API Version:** 3.2.0

---

## Current API Surface

### Core Routes (25 endpoints)

| Route | Purpose | Methods | Priority |
|-------|---------|---------|----------|
| `/agents` | Agent management & execution | GET, POST | 🔴 High |
| `/analytics` | Analytics & metrics | GET | 🟡 Medium |
| `/auth` | Authentication & sessions | GET, POST | 🔴 High |
| `/billing` | Stripe billing integration | GET, POST | 🔴 High |
| `/brand-voice` | Brand voice management | GET, POST, PUT | 🔴 High |
| `/campaign` | Campaign orchestration | GET, POST, PUT | 🔴 High |
| `/connectors` | 3rd-party integrations | GET, POST | 🟡 Medium |
| `/content` | Content generation | GET, POST, PUT | 🔴 High |
| `/credentials` | OAuth credentials | GET, POST, DELETE | 🟡 Medium |
| `/data-trust` | Data governance | GET | 🟢 Low |
| `/documents` | Document management | GET, POST, PUT, DELETE | 🟡 Medium |
| `/eco-metrics` | Sustainability metrics | GET | 🟢 Low |
| `/editorial-calendar` | Content calendar | GET, POST, PUT | 🟡 Medium |
| `/email` | Email campaigns | GET, POST | 🟡 Medium |
| `/feedback` | User feedback | GET, POST | 🟢 Low |
| `/governance` | Policy management | GET, POST | 🟢 Low |
| `/health` | System health | GET | 🔴 High |
| `/jobs` | Agent job tracking | GET | 🟡 Medium |
| `/keywords` | SEO keywords | GET, POST | 🟡 Medium |
| `/marketing` | Marketing analytics | GET, POST | 🔴 High |
| `/messages` | Conversation messages | GET, POST | 🟡 Medium |
| `/metrics` | System metrics | GET, POST | 🟡 Medium |
| `/orchestrate` | Multi-agent orchestration | POST | 🔴 High |
| `/orchestration` | Orchestration config | GET, POST | 🔴 High |
| `/personas` | Target personas | GET, POST | 🟡 Medium |

### Specialized Routes

#### SEO (/seo/*)
- `/seo/content` - Content optimization
- `/seo/keywords` - Keyword analysis  
- `/seo/links` - Internal linking
- `/seo/meta` - Meta tag generation
- `/seo/recommendations` - SEO recommendations

#### Settings & Team
- `/settings` - User settings
- `/tasks` - Task management
- `/team` - Team members
- `/trends` - Trend analysis

#### Webhooks
- `/stripe-webhook` - Stripe event handler (webhook only)

---

## SDK Requirements

### Must-Have (MVP)

1. **Core Client**
   - HTTP client with retry/timeout
   - Automatic auth token handling
   - TypeScript types for all endpoints
   - Error handling & custom exceptions

2. **Agent Module**
   - `sdk.agents.list()` → GET /agents
   - `sdk.agents.get(id)` → GET /agents/:id
   - `sdk.agents.execute(input)` → POST /agents/execute
   - Types: `AgentKind`, `AgentStatus`, `AgentJob`

3. **Content Module**
   - `sdk.content.generate(params)` → POST /content/generate
   - `sdk.content.list()` → GET /content
   - `sdk.content.get(id)` → GET /content/:id
   - Types: `ContentDraft`, `ContentKind`

4. **Campaign Module**
   - `sdk.campaigns.create(data)` → POST /campaign
   - `sdk.campaigns.list()` → GET /campaign
   - `sdk.campaigns.get(id)` → GET /campaign/:id
   - `sdk.campaigns.update(id, data)` → PUT /campaign/:id
   - Types: `Campaign`, `CampaignStatus`, `CampaignMetric`

5. **Marketing Module**
   - `sdk.marketing.metrics()` → GET /marketing/metrics
   - `sdk.marketing.campaigns()` → GET /marketing/campaigns
   - `sdk.marketing.leads()` → GET /marketing/leads
   - Types: `MarketingCampaign`, `MarketingLead`

6. **Orchestration Module**
   - `sdk.orchestration.execute(workflow)` → POST /orchestrate
   - `sdk.orchestration.status(runId)` → GET /orchestration/:runId
   - Types: `OrchestrationInput`, `OrchestrationResult`

### Nice-to-Have (Phase 2)

7. **SEO Module**
   - `sdk.seo.analyzeKeywords()`
   - `sdk.seo.optimizeContent()`
   - `sdk.seo.generateMeta()`

8. **Document Module**
   - `sdk.documents.create()`
   - `sdk.documents.search()`
   - `sdk.documents.update()`

9. **Team Module**
   - `sdk.team.members()`
   - `sdk.team.invite()`
   - `sdk.team.remove()`

### Future Enhancements

- WebSocket support for real-time updates
- Streaming responses for long-running operations
- Batch operations
- Pagination helpers
- Rate limit handling
- Webhook verification utilities

---

## Type System Requirements

### From Prisma Schema

Export these enums and types:
- `AgentKind`, `AgentStatus`
- `ContentKind`, `CampaignStatus`
- `MessageRole`, `ConversationKind`
- `DatasetKind`, `TrainStatus`
- `ConnectorKind`
- `MarketingCampaignType`, `MarketingCampaignStatus`
- `MarketingLeadGrade`, `MarketingLeadStatus`
- `MarketingTouchpointType`

### Custom Error Classes

- `NeonHubError` - Base error class
- `AgentError` - Agent execution errors
- `APIError` - HTTP request errors
- `ValidationError` - Input validation errors
- `RateLimitError` - Rate limit exceeded
- `AuthenticationError` - Auth failures

### Zod Schemas

For runtime validation:
- All input parameters
- Response shapes
- Configuration objects

---

## SDK Architecture

```
core/sdk/
├── package.json
├── tsconfig.json
├── README.md
├── CHANGELOG.md
├── src/
│   ├── index.ts              # Main export
│   ├── client.ts             # HTTP client
│   ├── types.ts              # Type exports
│   ├── errors.ts             # Error classes
│   ├── schemas.ts            # Zod schemas
│   ├── modules/
│   │   ├── agents.ts         # Agent operations
│   │   ├── content.ts        # Content operations
│   │   ├── campaigns.ts      # Campaign operations
│   │   ├── marketing.ts      # Marketing operations
│   │   ├── orchestration.ts  # Orchestration
│   │   └── seo.ts            # SEO operations
│   └── __tests__/
│       ├── client.test.ts
│       ├── agents.test.ts
│       └── integration.test.ts
└── examples/
    ├── basic-usage.ts
    ├── agent-execution.ts
    ├── content-generation.ts
    ├── campaign-creation.ts
    └── orchestration.ts
```

---

## API Gaps Identified

### Missing

1. **Versioning**
   - No API versioning system
   - Recommendation: Add `/v1/` prefix or version header

2. **Pagination**
   - List endpoints don't have consistent pagination
   - Recommendation: Add `?page=1&limit=20` support

3. **Filtering**
   - Limited query parameter support
   - Recommendation: Add filtering DSL

4. **Error Standards**
   - Inconsistent error response shapes
   - Recommendation: Standardize error format

5. **Rate Limiting Info**
   - No rate limit headers exposed
   - Recommendation: Add `X-RateLimit-*` headers

### Documentation Gaps

1. No OpenAPI/Swagger spec
2. No API changelog
3. No deprecation policy
4. No SLA/uptime guarantees
5. No request/response examples

---

## Implementation Plan

### Phase 1.1: Foundation (Week 1)
- [x] Inventory complete
- [ ] Create SDK package structure
- [ ] Implement HTTP client
- [ ] Add error classes
- [ ] Export Prisma types

### Phase 1.2: Core Modules (Week 1)
- [ ] Agent module
- [ ] Content module
- [ ] Campaign module
- [ ] Marketing module
- [ ] Orchestration module

### Phase 1.3: Testing (Week 1-2)
- [ ] Unit tests (>95% coverage)
- [ ] Integration tests
- [ ] Contract tests
- [ ] Example scripts

### Phase 1.4: Documentation (Week 2)
- [ ] README with quickstart
- [ ] API reference
- [ ] Migration guide
- [ ] CHANGELOG

---

## Success Criteria

- ✅ Single import path: `import { NeonHubClient } from '@neonhub/sdk'`
- ✅ All types exported and discoverable
- ✅ 5+ working examples
- ✅ >95% test coverage
- ✅ Complete documentation
- ✅ Zero external dependencies (except Prisma types)

---

**Status:** ✅ Inventory Complete  
**Next Step:** Create SDK package structure  
**Assigned:** Phase 1 Implementation

