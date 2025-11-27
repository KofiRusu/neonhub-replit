# Golden E2E Marketing Flow

This document describes the complete end-to-end marketing automation flow in NeonHub, from campaign creation through content generation, scheduling, connector execution, and metrics collection.

## Overview

The golden flow demonstrates a complete campaign lifecycle:

1. **Create Campaign** → Create a marketing campaign record
2. **Generate Content** → Use ContentAgent to generate article/email/social content
3. **Schedule Multi-Channel** → Schedule email + social posts for the campaign
4. **Queue Processing** → BullMQ workers process compose & send jobs
5. **Connector Execution** → Connectors (Resend, Twilio, Twitter, etc.) send content
6. **Metrics Collection** → Events ingested and metrics recorded

## Step-by-Step Flow

### Step 1: Create Campaign

**Endpoint**: `POST /api/campaigns`

**Payload**:
```json
{
  "name": "Product Launch Q1 2025",
  "objective": "Generate awareness and leads for new product",
  "startDate": "2025-01-15T00:00:00Z",
  "endDate": "2025-03-31T23:59:59Z",
  "budget": 50000,
  "channels": ["email", "social", "content"]
}
```

**Expected Response**:
```json
{
  "id": "clx...",
  "name": "Product Launch Q1 2025",
  "status": "draft",
  "createdAt": "2025-01-10T..."
}
```

### Step 2: Generate Email Content

**Endpoint**: Via tRPC `content.generateArticle` or REST `/api/content/generate`

**Payload**:
```json
{
  "topic": "10 Ways Our Product Transforms Your Workflow",
  "primaryKeyword": "workflow automation",
  "secondaryKeywords": ["productivity", "efficiency", "automation tools"],
  "tone": "professional",
  "wordCount": 1200,
  "brandId": "clx...",
  "callToAction": "Start your free trial today"
}
```

**Expected Response**:
```json
{
  "jobId": "clx...",
  "draftId": "clx...",
  "content": "# 10 Ways Our Product...",
  "meta": {
    "title": "...",
    "description": "..."
  }
}
```

### Step 3: Generate Email Sequence

**Via EmailAgent**: `POST /api/email/sequence` (proxy route) or direct tRPC call

**Payload**:
```json
{
  "topic": "Product Launch Q1 2025",
  "objective": "nurture",
  "audience": "SaaS founders and product managers",
  "tone": "friendly",
  "numEmails": 3
}
```

**Expected Response**:
```json
{
  "jobId": "clx...",
  "sequence": [
    {
      "day": 0,
      "subject": "Introducing: The Future of Workflow Automation",
      "body": "Hi there,\n\nWe're excited to share..."
    },
    {
      "day": 3,
      "subject": "See How Teams Save 10+ Hours/Week",
      "body": "..."
    },
    {
      "day": 7,
      "subject": "Last Chance: Start Your Free Trial",
      "body": "..."
    }
  ]
}
```

### Step 4: Schedule Email Sends

**For each email in the sequence**, call `EmailAgent.sendPersonalizedEmail()`:

**Payload**:
```json
{
  "personId": "clx_person_123",
  "objective": "nurture",
  "brandId": "clx_brand_456",
  "operatorId": "clx_user_789"
}
```

**Internal Flow**:
1. EmailAgent checks consent via `PersonService.getConsent(personId, "email")`
2. If granted, composes message via `BrandVoiceService.compose()`
3. Enqueues job to `email.compose` queue
4. Worker processes job and enqueues to `email.send` queue
5. `email.send` worker calls Resend API
6. Event ingested via `EventIntakeService.ingest()`

**Queue Jobs Created**:
- `email.compose` → processes brand voice composition
- `email.send` → sends via Resend

### Step 5: Generate and Schedule Social Post

**Via SocialAgent**: `POST /api/social/generate` or tRPC

**Payload**:
```json
{
  "platform": "twitter",
  "content": "Excited to announce our new workflow automation tool! 🚀",
  "includeHashtags": true,
  "brandId": "clx_brand_456",
  "callToAction": "Learn more at neonhub.com"
}
```

**Expected Response**:
```json
{
  "jobId": "clx...",
  "content": "Excited to announce our new workflow automation tool! 🚀 Learn more at neonhub.com #automation #productivity #saas",
  "hashtags": ["automation", "productivity", "saas"],
  "estimatedReach": 1500
}
```

**Schedule for Publishing**:
```json
{
  "campaignId": "clx_campaign_...",
  "platform": "twitter",
  "content": "...",
  "scheduledFor": "2025-01-15T10:00:00Z"
}
```

**Internal Flow**:
1. SocialAgent creates `SocialPost` record
2. Enqueues to `social.compose` queue
3. Worker processes and enqueues to `social.send` queue
4. `social.send` worker uses TwitterConnector to post
5. Event recorded

### Step 6: Monitor Metrics

**Check Campaign Metrics**: `GET /api/campaigns/{campaignId}/metrics`

**Expected Response**:
```json
{
  "impressions": 1234,
  "clicks": 89,
  "conversions": 12,
  "emailsSent": 150,
  "emailsOpened": 67,
  "socialPosts": 5,
  "socialEngagement": 234
}
```

**WebSocket Updates**:
Clients subscribed to `campaign:{campaignId}` receive real-time updates:
```javascript
socket.on("campaign:metric:update", (data) => {
  // { campaignId, metric: "impressions", value: 1235 }
});
```

**Prometheus Metrics**:
- `agent_runs_total{agent="EmailAgent",status="success"}` increments
- `queue_jobs_total{queue="email.send",status="completed"}` increments
- `http_requests_total{method="POST",route="/api/campaigns",status_code="200"}` increments

## Testing the Golden Flow

### Local Development

1. **Start services**:
```bash
# Terminal 1: Start Postgres + Redis
docker-compose up -d

# Terminal 2: Start API with workers
cd apps/api
pnpm dev

# Terminal 3: Start Web UI
cd apps/web
pnpm dev
```

2. **Configure test credentials**:
```bash
# .env file
RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWITTER_BEARER_TOKEN=...
```

3. **Execute the flow via UI**:
   - Navigate to `/campaigns/new`
   - Fill in campaign details
   - Click "Generate Content" → triggers ContentAgent
   - Click "Schedule Email Sequence" → triggers EmailAgent
   - Click "Create Social Posts" → triggers SocialAgent
   - Monitor `/dashboard` for real-time metrics

4. **Verify queue processing**:
```bash
# Check Redis queues
docker exec -it neonhub-redis redis-cli
> LLEN bull:email.compose
> LLEN bull:email.send
```

5. **Check metrics**:
```bash
curl http://localhost:3001/metrics | grep agent_runs
curl http://localhost:3001/metrics | grep queue_jobs
```

### Production Verification

1. **Health checks**:
```bash
curl https://api.neonhubecosystem.com/health
curl https://neonhubecosystem.com/api/health
```

2. **Create test campaign via API**:
```bash
curl -X POST https://api.neonhubecosystem.com/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign","objective":"lead_generation",...}'
```

3. **Monitor metrics**:
```bash
curl https://api.neonhubecosystem.com/metrics | grep -E "(agent_runs|queue_jobs|http_requests)"
```

## Success Criteria

A successful golden flow run includes:

- ✅ Campaign created in database (`Campaign` record)
- ✅ Content generated (`ContentDraft` record + `AgentRun` with status=SUCCESS)
- ✅ Email sequence created (`EmailSequence` records)
- ✅ Social posts scheduled (`SocialPost` records)
- ✅ Queue jobs processed (check Redis or BullMQ UI)
- ✅ Connector actions executed (check logs for Resend/Twilio/Twitter API calls)
- ✅ Events recorded (`Event` table populated)
- ✅ Metrics visible (`CampaignMetric` updated, Prometheus `/metrics` showing increments)
- ✅ WebSocket updates received (dashboard updates in real-time)

## Troubleshooting

### Jobs stuck in queue
```bash
# Check worker status
docker logs neonhub-api | grep "Queue workers started"

# Inspect stuck jobs
docker exec -it neonhub-redis redis-cli
> LRANGE bull:email.send:failed 0 -1
```

### Connector auth failures
```bash
# Check connector credentials
curl http://localhost:3001/api/connectors/auth \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test specific connector
curl -X POST http://localhost:3001/api/connectors/slack/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Missing metrics
```bash
# Verify Prometheus endpoint
curl http://localhost:3001/metrics

# Check if workers are recording
grep "recordQueueJob" apps/api/src/queues/workers/*.ts
```

## Related Documentation

- [Architecture Overview](./AGENTIC_ARCHITECTURE.md)
- [Connector Development](../agent-infra/docs/CONNECTOR_SDK.md)
- [Deployment Runbook](./DEPLOY_RUNBOOK.md) *(to be created in Phase 3)*
- [Observability Guide](./OBSERVABILITY.md) *(to be created in Phase 2)*


