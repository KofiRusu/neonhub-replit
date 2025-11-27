# NeonHub API - Complete Endpoint Inventory

**Generated**: November 23, 2025  
**API Base URL**: `http://localhost:3001/api`  
**Authentication**: Bearer Token (JWT)  
**Version**: 3.2.0

---

## Summary by Module

| Module | Endpoints | Auth Required | Primary Use |
|--------|-----------|---------------|-------------|
| **Health & System** | 2 | No | API readiness, monitoring |
| **Auth & Users** | 4-6 | Partial | Login, auth, user management |
| **Campaigns** | 8-12 | Yes | Campaign CRUD, scheduling, execution |
| **Marketing** | 6-8 | Yes | Marketing operations, channel mgmt |
| **Content** | 8-10 | Yes | Content creation, management, retrieval |
| **SEO & Keywords** | 15-20 | Yes | Keyword research, meta generation, optimization |
| **Connectors** | 6-10 | Yes | Third-party API connections (HubSpot, etc.) |
| **Agents & Orchestration** | 8-12 | Yes | Agent registration, execution, results |
| **Analytics & Metrics** | 6-8 | Yes | Performance metrics, analytics, reporting |
| **Billing & Subscriptions** | 4-6 | Yes | Billing, pricing, subscriptions |
| **Team & Access** | 6-8 | Yes | Team management, invitations, roles |
| **Data Management** | 4-6 | Yes | Data trust, governance, exports |
| **SMS & Social** | 4-6 | Partial | SMS/social messaging, posting |
| **Beta Features** | 8-12 | Yes | Documents, tasks, feedback, personas, etc. |

**Total Estimated Endpoints**: 100+

---

## Detailed Endpoint Listing

### 1. Health & System (Public, No Auth)

```
GET  /health
GET  /health/readyz
GET  /metrics
```

**Purpose**: API readiness, liveness probes, Prometheus metrics  
**Auth**: None  
**Typical Use**: Monitoring, load balancer health checks

---

### 2. Auth & Users (Partial Auth)

```
POST   /auth/login              - Authenticate with email + password
GET    /auth/me                 - Get current user profile
POST   /auth/logout             - Logout current session
GET    /auth/refresh            - Refresh JWT token
POST   /auth/register           - Register new user (if enabled)
GET    /auth/verify/:token      - Verify email via token
```

**Auth**: 
- `POST /auth/login`: **None** (public)
- Others: **Bearer Token** (requires login)

**Typical Response**: `{ token: "jwt...", user: { id, email, name, role }, ... }`

---

### 3. Campaigns (`/api/campaigns`)

```
GET    /                         - List all campaigns
GET    /:id                      - Get campaign details
POST   /                         - Create campaign
PATCH  /:id                      - Update campaign
DELETE /:id                      - Delete campaign
GET    /:id/schedule             - Get campaign schedule
POST   /:id/launch              - Launch/execute campaign
POST   /:id/pause               - Pause campaign
POST   /:id/resume              - Resume campaign
```

**Auth**: **Bearer Token**  
**Typical Fields**:
- Request: `{ name, description, scheduledDate, channels, targetAudience, ... }`
- Response: `{ id, name, status, createdAt, ... }`

---

### 4. Content (`/api/content` or root mount)

```
GET    /                         - List content pieces
GET    /:id                      - Get content details
POST   /                         - Create content
PATCH  /:id                      - Update content
DELETE /:id                      - Delete content
POST   /analyze                  - Analyze content for SEO/quality
POST   /generate                 - Generate content via AI
GET    /trending                 - Get trending content topics
```

**Auth**: **Bearer Token**  
**Typical Fields**:
- Request: `{ title, body, format, channels, tags, ... }`
- Response: `{ id, title, status, viewCount, ... }`

---

### 5. SEO & Keywords (`/api/seo`, `/api/keywords`)

```
POST   /seo/keywords/classify-intent          - Classify search intent
POST   /seo/keywords/classify-intent-batch    - Batch classify intent
POST   /seo/keywords/generate-long-tail       - Generate long-tail variations
POST   /seo/keywords/prioritize               - Prioritize by opportunity
POST   /seo/keywords/competitive-gaps         - Find keyword gaps
POST   /seo/meta/generate-title               - Generate title tag
POST   /seo/meta/generate-description         - Generate meta description
POST   /seo/meta/validate                     - Validate existing meta
POST   /seo/content/analyze                   - Analyze content
POST   /seo/content/readability               - Calculate readability
POST   /seo/recommendations/weekly            - Weekly SEO recommendations
POST   /seo/recommendations/competitors       - Competitive analysis
GET    /seo/links/site-structure              - Site structure analysis
POST   /seo/links/topic-clusters              - Build topic clusters
```

**Auth**: **Bearer Token**  
**Typical Fields**:
- Request: `{ keyword, url, competitorUrls, language, ... }`
- Response: `{ score, recommendations, opportunities, ... }`

---

### 6. Connectors (`/api/connectors`)

```
GET    /                         - List connected platforms
GET    /:id                      - Get connector details
POST   /                         - Add new connector
DELETE /:id                      - Remove connector
GET    /:id/status               - Check connector health
POST   /:id/sync                 - Force sync data
POST   /:id/test-connection      - Test connector credentials
```

**Auth**: **Bearer Token**  
**Typical Connectors**: HubSpot, Salesforce, Google Analytics, etc.  
**Typical Response**: `{ id, name, status, lastSync, ... }`

---

### 7. Agents & Orchestration (`/api/orchestration`)

```
GET    /                         - List registered agents
GET    /:agentId                 - Get agent details
POST   /:agentId/run             - Execute agent with input
GET    /runs/:runId              - Get run status/results
GET    /runs/:runId/logs         - Get run logs
POST   /runs/:runId/cancel       - Cancel running agent
```

**Auth**: **Bearer Token** + **Admin** in many cases  
**Typical Response**: `{ agentId, runId, status, output, cost, ... }`

---

### 8. Analytics & Metrics (`/api/metrics`, `/api/analytics`)

```
GET    /dashboard                - Dashboard summary metrics
GET    /campaigns/:id/stats      - Campaign performance stats
GET    /content/:id/engagement   - Content engagement metrics
GET    /trends                   - Trending metrics
POST   /export                   - Export analytics report
```

**Auth**: **Bearer Token**  
**Typical Response**: `{ views, clicks, conversions, roi, ... }`

---

### 9. Billing & Subscriptions (`/api/billing`)

```
GET    /plan                     - Get current subscription plan
GET    /usage                    - Get usage metrics
POST   /checkout-session         - Create checkout session
POST   /webhook                  - Stripe webhook handler
GET    /invoices                 - List invoices
```

**Auth**: **Bearer Token** (except `/webhook`)  
**Typical Response**: `{ plan, status, renewalDate, ... }`

---

### 10. Team & Access (`/api/team`)

```
GET    /                         - List team members
POST   /invite                   - Invite new member
DELETE /:memberId                - Remove member
PATCH  /:memberId/role           - Update member role
GET    /invitations              - List pending invitations
```

**Auth**: **Bearer Token**  
**Typical Response**: `{ memberId, email, role, status, ... }`

---

### 11. Data Management (`/api/data-trust`, `/api/governance`)

```
GET    /export-log               - Data export audit log
POST   /export-request           - Request data export
GET    /compliance/status        - Compliance checklist
```

**Auth**: **Bearer Token** + **Admin**  
**Typical Response**: `{ status, downloadUrl, expiresAt, ... }`

---

### 12. SMS & Social (`/api/sms`, `/api/social`)

```
POST   /messages/send            - Send SMS/social message
GET    /conversations            - List conversations
GET    /conversations/:id        - Get conversation thread
POST   /conversations/:id/reply  - Reply to message
GET    /scheduled                - List scheduled posts
```

**Auth**: **Bearer Token** (Auth optional for some SMS endpoints)  
**Typical Response**: `{ messageId, status, deliveryStatus, ... }`

---

### 13. Beta Features

#### Documents (`/api/documents`)
```
GET    /                 - List documents
POST   /                 - Upload document
GET    /:id              - Get document
DELETE /:id              - Delete document
```

#### Tasks (`/api/tasks`)
```
GET    /                 - List tasks
POST   /                 - Create task
PATCH  /:id              - Update task
DELETE /:id              - Delete task
POST   /:id/complete     - Mark task complete
```

#### Feedback (`/api/feedback`)
```
POST   /                 - Submit feedback
GET    /                 - List feedback (admin only)
```

#### Personas (`/api/personas`)
```
GET    /                 - List personas
POST   /                 - Create persona
PATCH  /:id              - Update persona
DELETE /:id              - Delete persona
```

#### Keywords (`/api/keywords`)
```
GET    /                 - List keywords
POST   /                 - Add keyword
DELETE /:id              - Remove keyword
```

#### Editorial Calendar (`/api/editorial-calendar`)
```
GET    /                 - Get calendar
POST   /entry            - Add calendar entry
DELETE /entry/:id        - Remove entry
```

---

## Authentication

### Flow
1. **POST /auth/login** with email + password
2. Receive JWT token in response
3. Use Bearer token in `Authorization: Bearer <token>` header for subsequent requests
4. Token typically expires after 24 hours or per configuration

### Example Auth Header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Response Format

### Success (2xx)
```json
{
  "data": { /* endpoint-specific data */ },
  "meta": { "timestamp": "2025-11-23T21:00:00Z" }
}
```

### Error (4xx/5xx)
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": { /* optional */ }
}
```

---

## Common Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| **200** | Success | Request succeeded |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Check request body/params |
| **401** | Unauthorized | Missing/invalid auth token |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **429** | Rate Limited | Wait before retrying |
| **500** | Server Error | Internal server error |

---

## Rate Limiting

- **General endpoints**: 60 requests/minute per user
- **Auth endpoints**: 10 requests/minute per IP
- **Stripe webhooks**: Unlimited (verified webhooks)

Headers included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1700000000000
```

---

## Environment Variables (For Docs Reference)

See `DEV_ENV_SETUP.md` for local API startup.

**Key variables**:
- `ENCRYPTION_KEY` - AES-256 encryption key (64 hex chars)
- `NODE_ENV` - development/staging/production
- `DATABASE_URL` - Prisma database connection
- `ENABLE_WORKERS` - Skip BullMQ in dev (default: false)
- `ENABLE_CONNECTORS` - Skip connector registration in dev (default: false)

---

## Test User Credentials

For local testing:
```
Email: test@neonhub.local
Password: TestPassword123!
```

Seed data includes multiple test campaigns, content, etc.

---

## Notes for Integration Teams

1. **Async Operations**: Long-running operations (agent execution, exports) return a `jobId` and can be polled via `GET /jobs/:jobId`
2. **Webhooks**: Certain operations trigger webhooks (Stripe billing, agent completion)
3. **Pagination**: List endpoints support `?page=1&limit=20` params
4. **Sorting**: Most list endpoints support `?sort=createdAt&order=desc`
5. **Filtering**: Advanced filtering via query params, e.g., `?status=active&dateFrom=...`

---

## Next Steps

- See `docs/agency/NEONHUB_API_ENDPOINTS_PUBLIC.md` for agency-safe structured reference
- See `docs/agency/NEONHUB_POSTMAN_USAGE_GUIDE.md` for Postman import instructions
- See `docs/postman/NeonHub.postman_collection.json` for Postman collection with examples

