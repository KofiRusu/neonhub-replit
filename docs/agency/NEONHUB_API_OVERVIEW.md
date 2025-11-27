# NeonHub API Overview

**For**: External Development Partners & Integration Agencies  
**Version**: 3.2.0  
**Last Updated**: November 23, 2025  
**Classification**: **PUBLIC** - Safe for external sharing

---

## What is NeonHub?

NeonHub is a comprehensive **AI-powered marketing automation platform** that orchestrates campaigns, content, and integrations across multiple channels. The NeonHub API provides programmatic access to all core platform features.

### Core Capabilities

| Capability | Purpose |
|-----------|---------|
| **Campaign Management** | Create, schedule, and execute multi-channel marketing campaigns |
| **Content Engine** | Generate, optimize, and publish content across channels (email, social, web) |
| **SEO Automation** | Keyword research, meta generation, content optimization, competitor analysis |
| **Connector Network** | Integrate with 50+ external platforms (HubSpot, Salesforce, Google Analytics, etc.) |
| **Agent Orchestration** | Execute autonomous agents for specialized marketing tasks (email copy, trend analysis) |
| **Analytics & Reporting** | Real-time performance metrics, dashboards, export capabilities |
| **Team Management** | Multi-user access, roles, permissions, audit logging |

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                    NeonHub API (REST)                   │
│              http://localhost:3001/api/                 │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌───▼────┐      ┌────▼────┐      ┌─────▼────┐
    │ Express │      │ Prisma  │      │ WebSocket│
    │  REST   │      │   ORM   │      │  (WS)    │
    │ Routes  │      │         │      │          │
    └────┬────┘      └────┬────┘      └──────────┘
         │                │
         └────────┬───────┘
                  │
         ┌────────▼────────┐
         │ PostgreSQL DB   │
         │  (+ Migrations) │
         └─────────────────┘
```

### Key Technology Stack

- **Framework**: Express.js (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL 16+ with Prisma ORM
- **Authentication**: JWT Bearer tokens
- **Async Jobs**: BullMQ + Redis (queues)
- **Monitoring**: Prometheus metrics, Sentry error tracking
- **Documentation**: OpenAPI (optional), Postman collection, this guide

---

## Authentication Model

### Bearer Token Flow

1. **Client logs in**: `POST /api/auth/login` with email + password
2. **Server responds**: JWT token in response payload
3. **Client stores**: Token in environment/session
4. **Client requests**: Include `Authorization: Bearer <token>` header
5. **Server validates**: Checks token signature, expiry, permissions
6. **Server responds**: Protected resource or 401 Unauthorized

### Roles & Permissions

| Role | Capabilities |
|------|--------------|
| **Admin** | Full platform access, user management, billing, governance |
| **Editor** | Create/edit campaigns, content, connectors |
| **Viewer** | Read-only access to campaigns, analytics, reports |
| **Agent** | Execute specific agent tasks (internal systems) |

---

## Integration Domains

### 1. Content & Campaign Management

- **Campaigns**: CRUD, scheduling, multi-channel execution, pause/resume
- **Content**: Creation, AI generation, optimization, publishing
- **Editorial Calendar**: Plan content publication across channels
- **Brand Voice**: Centralized tone/style guidelines for consistency

### 2. SEO & Optimization

- **Keyword Research**: Intent classification, long-tail generation, competitor gaps
- **Meta Tags**: Automated title/description generation with A/B testing
- **Content Analysis**: Readability, E-E-A-T signals, keyword optimization
- **Recommendations**: Weekly SEO tips, content gaps, performance issues
- **Link Management**: Internal linking suggestions, topic clusters, anchor text

### 3. Connectors (External Integrations)

- **Supported Platforms**: HubSpot, Salesforce, Google Analytics, LinkedIn, Twitter, Instagram, Facebook, Slack, Zapier, many more
- **Capabilities**: Read, write, real-time sync, bidirectional updates
- **Auth**: OAuth 2.0 for most platforms, API key fallback where needed
- **Status Monitoring**: Health checks, sync logs, error tracking

### 4. Agent Orchestration

- **Agents**: Autonomous components for specialized tasks (email copy, trend analysis, report generation)
- **Execution**: Run agents with inputs, get results asynchronously
- **Cost Tracking**: Track token usage, cost per execution
- **Error Handling**: Automatic retries, fallbacks, comprehensive logging

### 5. Analytics & Reporting

- **Dashboards**: KPI summaries, campaign performance, channel analytics
- **Metrics**: Impressions, clicks, conversions, engagement, ROI
- **Exports**: PDF, CSV, JSON exports with custom date ranges
- **Real-time Data**: Streaming metrics via WebSocket or polling

### 6. Team & Access Control

- **User Management**: Add/remove team members, manage roles
- **Invitations**: Email-based invitations with expiry
- **Audit Logging**: Track who did what and when
- **Permission Enforcement**: Row-level security for multi-tenant scenarios

### 7. Data Governance & Compliance

- **Data Export**: GDPR/CCPA-compliant user data exports
- **Deletion**: Cascading deletes with audit trails
- **Compliance**: SOC 2 readiness, encryption at rest/in transit
- **Access Controls**: IP whitelisting, rate limiting, Sentry monitoring

---

## API Communication Patterns

### REST Endpoints

**Standard CRUD Operations**:
```
GET    /campaigns              → List all campaigns
GET    /campaigns/:id          → Get single campaign
POST   /campaigns              → Create campaign
PATCH  /campaigns/:id          → Update campaign
DELETE /campaigns/:id          → Delete campaign
```

### Async Operations

Long-running tasks (agent execution, exports) return a `jobId`:

```bash
# Initiate async operation
POST /agents/:agentId/run
Response: { jobId: "job_123", status: "queued" }

# Poll for result (or use WebSocket for real-time)
GET /jobs/job_123
Response: { status: "completed", result: {...}, cost: 0.05 }
```

### WebSocket (Real-time)

Optional WebSocket connection for live updates:

```
WS ws://localhost:3001/ws
Events: agent.started, agent.completed, campaign.scheduled, etc.
```

---

## Request/Response Format

### Success Response (2xx)

```json
{
  "data": {
    "id": "campaign_abc123",
    "name": "Holiday Promotion 2025",
    "status": "active",
    "createdAt": "2025-11-20T10:00:00Z"
  },
  "meta": {
    "timestamp": "2025-11-23T21:00:00Z",
    "version": "3.2.0"
  }
}
```

### Error Response (4xx/5xx)

```json
{
  "error": "Campaign not found",
  "code": "CAMPAIGN_NOT_FOUND",
  "details": {
    "campaignId": "campaign_invalid"
  }
}
```

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| **General** | 60 req/user | 1 minute |
| **Auth** | 10 req/IP | 1 minute |
| **Webhooks** | Unlimited | (verified only) |

**Headers**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1700000000000
```

---

## Common Use Cases

### 1. Build a Custom Dashboard

```bash
# Get campaign metrics
GET /metrics/campaigns?dateFrom=2025-11-01&dateTo=2025-11-30

# Get content engagement
GET /metrics/content/:contentId

# Export to your BI tool
POST /metrics/export?format=json
```

### 2. Automate Content Publishing

```bash
# Create campaign
POST /campaigns {
  name: "Social Push Q4",
  scheduledDate: "2025-12-01T00:00:00Z"
}

# Generate content
POST /content/generate {
  topic: "Black Friday deals",
  channels: ["twitter", "linkedin"]
}

# Schedule publishing
POST /campaigns/:id/launch
```

### 3. Integrate with CRM

```bash
# Connect HubSpot
POST /connectors {
  platform: "hubspot",
  credentials: {...}  // OAuth token
}

# Sync contacts
POST /connectors/hubspot_123/sync

# Retrieve synced data
GET /connectors/hubspot_123/contacts
```

### 4. Run SEO Analysis

```bash
# Classify keywords
POST /seo/keywords/classify-intent {
  keywords: ["marketing automation", "campaign management"]
}

# Generate meta tags
POST /seo/meta/generate {
  title: "NeonHub - AI Marketing Platform",
  description: "Automate campaigns...",
  url: "https://neonhub.io"
}

# Get recommendations
GET /seo/recommendations/weekly
```

---

## Security Considerations

### Data Protection

- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Authentication**: JWT with signature verification
- **Authorization**: Role-based access control (RBAC)
- **Audit Logging**: All mutations logged with user, timestamp, changes

### Network Security

- **Rate Limiting**: Prevent brute force attacks
- **IP Whitelisting**: Optional for admin endpoints
- **CORS**: Configured per deployment
- **CSRF Protection**: Tokens on state-changing requests

### Compliance

- **GDPR**: Data export, deletion, consent tracking
- **CCPA**: Right-to-know, right-to-delete supported
- **SOC 2 Type II**: Compliant infrastructure
- **PCI-DSS**: Sensitive data handled per requirements (for Stripe)

---

## Error Handling Strategy

### Retry-Safe Endpoints

GET, HEAD, OPTIONS requests are idempotent and safe to retry:

```bash
# Safe to retry with exponential backoff
GET /campaigns/:id

# Implement exponential backoff: 1s, 2s, 4s, 8s, 16s max
```

### Non-Idempotent Endpoints

POST, PATCH, DELETE should include idempotency keys:

```bash
POST /campaigns
X-Idempotency-Key: campaign_creation_123
{...}

# If request repeats with same key, server returns cached result
```

---

## Support & Documentation

### For Developers

- **API Reference**: See `NEONHUB_API_ENDPOINTS_PUBLIC.md`
- **Postman Collection**: `docs/postman/NeonHub.postman_collection.json`
- **Environment Setup**: `docs/api-testing/DEV_ENV_SETUP.md`
- **Testing Guide**: `docs/agency/NEONHUB_POSTMAN_USAGE_GUIDE.md`

### For Questions

- **Endpoint Details**: See endpoint-specific documentation
- **Error Messages**: Check error code table in responses
- **Rate Limits**: Review rate limit headers in responses
- **Status Page**: Check API status endpoint `/health`

---

## Key Metrics & Monitoring

### Availability

- **SLA**: 99.5% uptime (for production deployments)
- **Response Time**: p95 < 500ms for most endpoints
- **Throughput**: Handles 1000+ req/sec per region

### Observability

- **Metrics**: Prometheus format at `/metrics`
- **Tracing**: Distributed traces via Sentry
- **Logs**: Structured JSON logs with context

---

## What You CAN Do

✅ Build custom dashboards  
✅ Integrate with third-party systems  
✅ Automate campaign workflows  
✅ Generate and publish content  
✅ Run SEO analyses  
✅ Manage team access  
✅ Export data for BI/analytics  

## What You CANNOT Do (Protected)

❌ Access raw database  
❌ Modify internal business logic  
❌ Access other users' private data  
❌ Bypass authentication/authorization  
❌ Trigger internal agent logic directly  

---

## Next Steps

1. **Get Started**: Follow `NEONHUB_POSTMAN_USAGE_GUIDE.md`
2. **Explore Endpoints**: Use Postman collection
3. **Read Details**: See `NEONHUB_API_ENDPOINTS_PUBLIC.md`
4. **Build Integration**: Use your preferred SDK/language
5. **Test & Deploy**: Validate in staging before production

---

**Version**: 3.2.0 | **Updated**: November 23, 2025 | **Status**: Production Ready

