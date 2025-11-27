# NeonHub API – Endpoint Reference

**For**: External Agencies, Integration Partners  
**Base URL**: `http://localhost:3001/api`  
**Version**: 3.2.0  
**Classification**: **PUBLIC** – Safe for external sharing

---

## Quick Navigation

- [Authentication](#authentication)
- [Health & Monitoring](#health--monitoring)
- [Campaigns](#campaigns)
- [Content](#content)
- [SEO & Keywords](#seo--keywords)
- [Connectors](#connectors)
- [Orchestration](#orchestration)
- [Analytics & Metrics](#analytics--metrics)
- [Team Management](#team-management)
- [Billing](#billing)
- [Data Management](#data-management)

---

## Authentication

### POST /auth/login
Login with email and password to obtain JWT token.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "editor"
  },
  "expiresIn": 86400
}
```

**Error (401)**:
```json
{
  "error": "Invalid credentials",
  "code": "AUTH_INVALID_CREDENTIALS"
}
```

**Auth Required**: ❌ No  
**Rate Limit**: 10 req/min per IP

---

### GET /auth/me
Get current authenticated user profile.

**Response (200)**:
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "editor",
  "organization": { "id": "org_123", "name": "ACME Corp" },
  "permissions": ["campaigns:read", "campaigns:write", ...],
  "createdAt": "2025-11-20T10:00:00Z",
  "lastLogin": "2025-11-23T15:30:00Z"
}
```

**Auth Required**: ✅ Yes (Bearer Token)

---

### POST /auth/logout
Logout and invalidate current session.

**Response (200)**:
```json
{
  "message": "Logged out successfully"
}
```

**Auth Required**: ✅ Yes

---

## Health & Monitoring

### GET /health
Check API health status.

**Response (200)**:
```json
{
  "status": "ok",
  "uptime": 86400,
  "database": "connected",
  "cache": "connected",
  "version": "3.2.0"
}
```

**Response (503)**:
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "message": "Database connection failed"
}
```

**Auth Required**: ❌ No  
**Rate Limit**: 60 req/min per user

---

### GET /health/readyz
Kubernetes-style readiness probe.

**Response (200)**:
```json
{
  "ready": true
}
```

**Response (503)**:
```json
{
  "ready": false,
  "reason": "database_initialization"
}
```

**Auth Required**: ❌ No

---

### GET /metrics
Prometheus-format metrics for monitoring.

**Response**: Text format, Prometheus standard

**Auth Required**: ❌ No (typically accessed by Prometheus scraper)

---

## Campaigns

### GET /api/campaigns
List all campaigns with pagination and filtering.

**Query Parameters**:
- `page` (int): Page number, default 1
- `limit` (int): Items per page, default 20, max 100
- `status` (string): Filter by status (active, draft, completed, paused)
- `dateFrom` (ISO string): Filter by creation date
- `dateTo` (ISO string): Filter by creation date

**Response (200)**:
```json
{
  "data": [
    {
      "id": "campaign_abc123",
      "name": "Black Friday 2025",
      "description": "Holiday promotion",
      "status": "active",
      "scheduledDate": "2025-11-24T00:00:00Z",
      "channels": ["email", "social", "sms"],
      "targetAudience": "high-value customers",
      "createdAt": "2025-11-20T10:00:00Z",
      "createdBy": "user_123"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3
  }
}
```

**Auth Required**: ✅ Yes

---

### POST /api/campaigns
Create a new campaign.

**Request Body**:
```json
{
  "name": "Q4 Promotion",
  "description": "End-of-year sale",
  "scheduledDate": "2025-12-01T00:00:00Z",
  "channels": ["email", "social"],
  "targetAudience": "existing customers",
  "goals": {
    "impressions": 50000,
    "clicks": 5000,
    "conversions": 500
  }
}
```

**Response (201)**:
```json
{
  "id": "campaign_xyz789",
  "name": "Q4 Promotion",
  "status": "draft",
  "createdAt": "2025-11-23T21:00:00Z"
}
```

**Auth Required**: ✅ Yes

---

### GET /api/campaigns/:id
Get campaign details.

**Response (200)**:
```json
{
  "id": "campaign_abc123",
  "name": "Black Friday 2025",
  "description": "Holiday promotion",
  "status": "active",
  "scheduledDate": "2025-11-24T00:00:00Z",
  "launchedAt": "2025-11-24T00:15:30Z",
  "completedAt": null,
  "channels": ["email", "social", "sms"],
  "targetAudience": "high-value customers",
  "metrics": {
    "impressions": 45230,
    "clicks": 4520,
    "conversions": 452,
    "roi": 3.2
  }
}
```

**Auth Required**: ✅ Yes

---

### PATCH /api/campaigns/:id
Update campaign details.

**Request Body** (all fields optional):
```json
{
  "name": "Black Friday 2025 - Extended",
  "status": "paused"
}
```

**Response (200)**:
```json
{
  "id": "campaign_abc123",
  "name": "Black Friday 2025 - Extended",
  "status": "paused",
  "updatedAt": "2025-11-23T21:05:00Z"
}
```

**Auth Required**: ✅ Yes

---

### DELETE /api/campaigns/:id
Delete campaign.

**Response (204)**: No content

**Error (409)**:
```json
{
  "error": "Cannot delete active campaign",
  "code": "CAMPAIGN_ACTIVE"
}
```

**Auth Required**: ✅ Yes

---

### POST /api/campaigns/:id/launch
Launch/execute campaign.

**Response (202)**:
```json
{
  "status": "launching",
  "jobId": "job_launch_123",
  "estimatedDuration": "30s"
}
```

**Auth Required**: ✅ Yes

---

### POST /api/campaigns/:id/pause
Pause active campaign.

**Response (200)**:
```json
{
  "id": "campaign_abc123",
  "status": "paused",
  "pausedAt": "2025-11-23T21:10:00Z"
}
```

**Auth Required**: ✅ Yes

---

## Content

### GET /api/content
List content pieces.

**Query Parameters**:
- `page`, `limit`: Pagination
- `format` (email|social|blog|etc.): Filter by format
- `status` (draft|published|archived): Filter by status

**Response (200)**:
```json
{
  "data": [
    {
      "id": "content_123",
      "title": "Holiday Shopping Tips",
      "format": "blog",
      "status": "published",
      "body": "...",
      "channels": ["blog", "social"],
      "viewCount": 2340,
      "publishedAt": "2025-11-22T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 156 }
}
```

**Auth Required**: ✅ Yes

---

### POST /api/content
Create new content.

**Request**:
```json
{
  "title": "End-of-Year Clearance",
  "body": "Content body here...",
  "format": "email",
  "channels": ["email", "social"],
  "tags": ["sale", "promotion"]
}
```

**Response (201)**:
```json
{
  "id": "content_456",
  "title": "End-of-Year Clearance",
  "status": "draft",
  "createdAt": "2025-11-23T21:00:00Z"
}
```

**Auth Required**: ✅ Yes

---

### POST /api/content/generate
Generate content using AI.

**Request**:
```json
{
  "topic": "Benefits of automated email marketing",
  "format": "email",
  "tone": "professional",
  "length": "medium",
  "targetAudience": "marketing managers"
}
```

**Response (200)**:
```json
{
  "id": "content_789",
  "title": "Unlock Email Marketing Efficiency",
  "body": "...",
  "status": "draft",
  "generatedAt": "2025-11-23T21:01:30Z"
}
```

**Auth Required**: ✅ Yes

---

## SEO & Keywords

### POST /api/seo/keywords/classify-intent
Classify search intent for keywords.

**Request**:
```json
{
  "keywords": [
    "how to write email subject lines",
    "email subject line generator",
    "best email subject lines 2025"
  ]
}
```

**Response (200)**:
```json
{
  "results": [
    {
      "keyword": "how to write email subject lines",
      "intent": "informational",
      "difficulty": 0.45,
      "volume": 1200,
      "trend": "stable"
    },
    {
      "keyword": "email subject line generator",
      "intent": "commercial",
      "difficulty": 0.72,
      "volume": 3400,
      "trend": "rising"
    }
  ]
}
```

**Auth Required**: ✅ Yes

---

### POST /api/seo/meta/generate
Generate optimized meta tags.

**Request**:
```json
{
  "title": "AI Marketing Automation Platform - NeonHub",
  "description": "Automate campaigns, content, and SEO",
  "keywords": ["marketing automation", "campaign management"],
  "url": "https://example.com/platform"
}
```

**Response (200)**:
```json
{
  "title": "AI Marketing Automation | NeonHub Platform",
  "description": "Automate multi-channel campaigns with AI. 50+ integrations, content generation, SEO optimization.",
  "keywords": ["marketing automation", "campaign management", "email automation"],
  "openGraph": {
    "title": "...",
    "description": "...",
    "image": "..."
  }
}
```

**Auth Required**: ✅ Yes

---

### POST /api/seo/content/analyze
Analyze content for SEO optimization.

**Request**:
```json
{
  "url": "https://example.com/article",
  "title": "How to Automate Your Marketing",
  "body": "...",
  "targetKeywords": ["marketing automation", "campaign management"]
}
```

**Response (200)**:
```json
{
  "score": 82,
  "readability": {
    "flesch_kincaid_grade": 7.2,
    "avg_sentence_length": 14,
    "passive_voice_percentage": 12
  },
  "keywordOptimization": {
    "primary": { "keyword": "marketing automation", "density": 2.1, "score": "good" }
  },
  "recommendations": [
    "Add more internal links",
    "Improve meta description",
    "Optimize heading structure"
  ]
}
```

**Auth Required**: ✅ Yes

---

### GET /api/seo/recommendations/weekly
Get weekly SEO recommendations.

**Response (200)**:
```json
{
  "weekOf": "2025-11-17",
  "recommendations": [
    {
      "title": "Optimize hero image on homepage",
      "impact": "high",
      "effort": "low",
      "estimatedTrafficGain": 350
    },
    {
      "title": "Add internal links to top-performing content",
      "impact": "medium",
      "effort": "medium",
      "estimatedTrafficGain": 125
    }
  ]
}
```

**Auth Required**: ✅ Yes

---

## Connectors

### GET /api/connectors
List connected platforms.

**Response (200)**:
```json
{
  "data": [
    {
      "id": "conn_hubspot_123",
      "platform": "hubspot",
      "status": "connected",
      "lastSync": "2025-11-23T20:00:00Z",
      "records": {
        "contacts": 45230,
        "companies": 1234,
        "deals": 567
      }
    },
    {
      "id": "conn_ga4_456",
      "platform": "google_analytics",
      "status": "connected",
      "lastSync": "2025-11-23T21:00:00Z"
    }
  ]
}
```

**Auth Required**: ✅ Yes

---

### POST /api/connectors
Add new connector.

**Request**:
```json
{
  "platform": "hubspot",
  "authToken": "pat-na1-abc123...",
  "name": "HubSpot Production"
}
```

**Response (201)**:
```json
{
  "id": "conn_hubspot_789",
  "platform": "hubspot",
  "status": "connecting",
  "jobId": "job_connect_789"
}
```

**Auth Required**: ✅ Yes

---

### POST /api/connectors/:id/sync
Force sync data from connector.

**Response (202)**:
```json
{
  "status": "syncing",
  "jobId": "job_sync_123",
  "estimatedDuration": "5m"
}
```

**Auth Required**: ✅ Yes

---

## Orchestration

### GET /api/orchestration
List registered agents.

**Response (200)**:
```json
{
  "agents": [
    {
      "id": "agent_email_copy",
      "name": "Email Copy Generator",
      "description": "Generate compelling email copy",
      "version": "1.2.0",
      "inputs": [
        { "name": "topic", "type": "string", "required": true },
        { "name": "tone", "type": "string", "enum": ["casual", "professional"] }
      ],
      "estimatedCost": 0.02
    },
    {
      "id": "agent_trend_analyzer",
      "name": "Trend Analyzer",
      "description": "Analyze trending topics",
      "version": "2.0.1"
    }
  ]
}
```

**Auth Required**: ✅ Yes

---

### POST /api/orchestration/:agentId/run
Execute an agent with inputs.

**Request**:
```json
{
  "topic": "Black Friday marketing strategies",
  "tone": "professional",
  "maxTokens": 1000
}
```

**Response (202)**:
```json
{
  "runId": "run_email_copy_123",
  "agentId": "agent_email_copy",
  "status": "queued",
  "estimatedDuration": "10s"
}
```

**Auth Required**: ✅ Yes

---

### GET /api/orchestration/runs/:runId
Get agent execution result.

**Response (200) - Completed**:
```json
{
  "runId": "run_email_copy_123",
  "agentId": "agent_email_copy",
  "status": "completed",
  "output": {
    "subject": "Last-Minute Black Friday Deals – Save 50%",
    "body": "...",
    "callToAction": "Shop Now"
  },
  "tokensUsed": 247,
  "cost": 0.0247,
  "completedAt": "2025-11-23T21:02:15Z"
}
```

**Response (200) - In Progress**:
```json
{
  "runId": "run_email_copy_123",
  "status": "executing",
  "progress": 0.45
}
```

**Auth Required**: ✅ Yes

---

## Analytics & Metrics

### GET /api/metrics/dashboard
Get dashboard summary metrics.

**Query Parameters**:
- `dateFrom`, `dateTo`: Date range (ISO strings)

**Response (200)**:
```json
{
  "summary": {
    "totalCampaigns": 42,
    "activeCampaigns": 5,
    "totalImpressions": 1234567,
    "totalClicks": 123456,
    "totalConversions": 12345,
    "avgROI": 3.2
  },
  "byChannel": {
    "email": { "impressions": 600000, "clicks": 60000, "conversions": 6000 },
    "social": { "impressions": 400000, "clicks": 50000, "conversions": 5000 },
    "sms": { "impressions": 234567, "clicks": 13456, "conversions": 1345 }
  }
}
```

**Auth Required**: ✅ Yes

---

### GET /api/metrics/campaigns/:id/stats
Get campaign-specific metrics.

**Response (200)**:
```json
{
  "campaignId": "campaign_abc123",
  "name": "Black Friday 2025",
  "status": "completed",
  "metrics": {
    "impressions": 45230,
    "clicks": 4523,
    "clickRate": 0.10,
    "conversions": 452,
    "conversionRate": 0.01,
    "revenue": 45200,
    "roi": 3.5
  },
  "byChannel": {
    "email": {...},
    "social": {...},
    "sms": {...}
  }
}
```

**Auth Required**: ✅ Yes

---

## Team Management

### GET /api/team
List team members.

**Response (200)**:
```json
{
  "members": [
    {
      "id": "user_123",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "admin",
      "joinedAt": "2025-11-01T10:00:00Z"
    },
    {
      "id": "user_456",
      "email": "jane@example.com",
      "name": "Jane Smith",
      "role": "editor",
      "joinedAt": "2025-11-15T14:00:00Z"
    }
  ]
}
```

**Auth Required**: ✅ Yes

---

### POST /api/team/invite
Invite new team member.

**Request**:
```json
{
  "email": "new-member@example.com",
  "role": "editor"
}
```

**Response (201)**:
```json
{
  "invitationId": "inv_123",
  "email": "new-member@example.com",
  "role": "editor",
  "invitedAt": "2025-11-23T21:00:00Z",
  "expiresAt": "2025-11-30T21:00:00Z"
}
```

**Auth Required**: ✅ Yes (Admin only)

---

## Billing

### GET /api/billing/plan
Get current subscription plan.

**Response (200)**:
```json
{
  "plan": "professional",
  "status": "active",
  "billingCycle": "monthly",
  "monthlyPrice": 199,
  "nextBillingDate": "2025-12-23",
  "features": {
    "campaigns": "unlimited",
    "users": 10,
    "connectors": 50,
    "apiRequests": "1M/month"
  }
}
```

**Auth Required**: ✅ Yes

---

### GET /api/billing/usage
Get usage metrics for current billing period.

**Response (200)**:
```json
{
  "billingCycle": "2025-11-01 to 2025-11-30",
  "usage": {
    "apiRequests": { "used": 450000, "limit": 1000000 },
    "campaigns": { "used": 28, "limit": "unlimited" },
    "users": { "used": 8, "limit": 10 }
  }
}
```

**Auth Required**: ✅ Yes

---

## Data Management

### POST /api/data-trust/export-request
Request user data export (GDPR/CCPA compliance).

**Response (202)**:
```json
{
  "requestId": "export_req_123",
  "status": "queued",
  "estimatedCompletionTime": "2025-11-25T21:00:00Z"
}
```

**Auth Required**: ✅ Yes

---

### GET /api/data-trust/export-request/:id
Check export request status.

**Response (200) - Completed**:
```json
{
  "requestId": "export_req_123",
  "status": "completed",
  "downloadUrl": "https://s3.example.com/exports/export_req_123.zip?token=...",
  "expiresAt": "2025-11-30T21:00:00Z"
}
```

**Auth Required**: ✅ Yes

---

## Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `INVALID_REQUEST` | Malformed request | Check request body/params |
| `UNAUTHORIZED` | Invalid/missing token | Login again |
| `FORBIDDEN` | Insufficient permissions | Check user role |
| `NOT_FOUND` | Resource doesn't exist | Verify ID/path |
| `CONFLICT` | State conflict (e.g., can't delete active campaign) | Check resource status |
| `RATE_LIMITED` | Too many requests | Implement exponential backoff |
| `SERVER_ERROR` | Internal server error | Retry with backoff, contact support |

---

## Best Practices

### Pagination
Always paginate list endpoints:
```
GET /api/campaigns?page=1&limit=20
```

### Filtering & Sorting
Use query parameters:
```
GET /api/campaigns?status=active&sort=createdAt&order=desc
```

### Error Handling
Implement exponential backoff for retries:
```
Retry 1: 1 second
Retry 2: 2 seconds
Retry 3: 4 seconds
Retry 4: 8 seconds
Retry 5: 16 seconds (max)
```

### Monitoring
Check `/health` endpoint regularly for API status.

---

**API Version**: 3.2.0 | **Last Updated**: November 23, 2025

