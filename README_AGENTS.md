# NeonHub AI Agents Documentation

## Overview

NeonHub v3.0 includes 5 powerful AI agents that automate various marketing tasks:

1. **AdAgent** - Campaign creation & optimization
2. **InsightAgent** - Data analysis & predictions
3. **DesignAgent** - AI-powered design generation
4. **TrendAgent** - Social media trend monitoring
5. **OutreachAgent** - B2B lead generation & outreach

---

## 1. AdAgent - Campaign Creation & Optimization

**Purpose**: Automate ad campaign creation, optimization, and A/B testing across multiple platforms.

### Features
- AI-powered ad copy generation for Google, Facebook, LinkedIn, and Twitter
- Campaign performance optimization with actionable recommendations
- A/B test variant generation
- Multi-platform targeting

### API Endpoints

#### Generate Ad Copy
```http
POST /api/agents/ad/generate
Content-Type: application/json

{
  "product": "AI Marketing Platform",
  "audience": "B2B Marketers",
  "platform": "google",
  "tone": "professional"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "headline": "Transform Your Marketing with AI",
    "description": "Automate campaigns and boost ROI by 300%",
    "keywords": ["marketing automation", "ai", "b2b", "growth", "roi"]
  }
}
```

#### Optimize Campaign
```http
POST /api/agents/ad/optimize
Content-Type: application/json

{
  "campaign": {
    "id": "camp_123",
    "platform": "google",
    "headline": "...",
    "budget": 5000
  },
  "performance": {
    "clicks": 600,
    "impressions": 10000,
    "conversions": 30,
    "ctr": 0.06
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      "Excellent CTR! Consider increasing budget to scale.",
      "High conversion rate - maintain current targeting."
    ],
    "adjustedBudget": 6000
  }
}
```

#### Get Sample Campaign
```http
GET /api/agents/ad/sample
```

---

## 2. InsightAgent - Data Analysis & Predictions

**Purpose**: Analyze marketing data, detect trends, identify anomalies, and predict future performance.

### Features
- Automated data analysis with confidence scores
- Trend detection and anomaly identification
- Predictive analytics using machine learning
- Actionable recommendations

### API Endpoints

#### Analyze Data
```http
POST /api/agents/insight/analyze
Content-Type: application/json

{
  "metrics": [
    { "name": "Page Views", "value": 10000, "previousValue": 8000 },
    { "name": "Conversion Rate", "value": 5.2, "previousValue": 6.8 }
  ],
  "timeframe": "last 7 days"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "trend",
      "title": "Page Views Surge",
      "description": "Page Views has increased by 25.0% in the last 7 days",
      "confidence": 0.85,
      "impact": "medium",
      "actionable": true,
      "suggestedActions": [
        "Investigate what's driving the Page Views increase",
        "Update forecasts based on new trend"
      ]
    }
  ]
}
```

#### Predict Trends
```http
POST /api/agents/insight/predict
Content-Type: application/json

{
  "historicalData": [
    { "date": "2025-01-01", "value": 100 },
    { "date": "2025-01-02", "value": 110 },
    { "date": "2025-01-03", "value": 120 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      { "date": "2025-01-04", "value": 128 },
      { "date": "2025-01-05", "value": 136 }
    ],
    "confidence": 0.7
  }
}
```

---

## 3. DesignAgent - AI-Powered Design Generation

**Purpose**: Generate design specifications and visuals using AI (DALL-E integration).

### Features
- AI design specification generation
- DALL-E image generation
- Color palette creation
- Multi-platform optimization (Instagram, Facebook, Twitter, LinkedIn)

### API Endpoints

#### Generate Design Spec
```http
POST /api/agents/design/generate
Content-Type: application/json

{
  "type": "social-post",
  "brand": "NeonHub",
  "message": "Launch your AI marketing campaign",
  "audience": "B2B marketers"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "layout": "Modern grid layout with hero image",
    "colors": ["#6366f1", "#8b5cf6", "#f59e0b"],
    "typography": "Inter font, bold headlines",
    "elements": ["Brand logo", "Headline", "CTA button"],
    "dallePrompt": "Professional social media post for NeonHub..."
  }
}
```

#### Generate Image (DALL-E)
```http
POST /api/agents/design/image
Content-Type: application/json

{
  "prompt": "Modern AI marketing platform dashboard, neon colors, futuristic",
  "size": "1024x1024"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/..."
  }
}
```

---

## 4. TrendAgent - Social Media Trend Monitoring

**Purpose**: Monitor trending topics across Twitter and Reddit in real-time.

### Features
- Twitter trending topics via Twitter API v2
- Reddit hot posts from any subreddit
- Aggregated trends from all platforms
- Sentiment analysis
- Mock data support for development

### API Endpoints

#### Get Twitter Trends
```http
GET /api/agents/trends/twitter
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "keyword": "AI Revolution",
      "volume": 15000,
      "sentiment": 0.8,
      "platform": "twitter",
      "timestamp": "2025-10-12T..."
    }
  ]
}
```

#### Get Reddit Trends
```http
GET /api/agents/trends/reddit?subreddit=marketing
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "keyword": "SaaS Growth Hacks",
      "volume": 8000,
      "sentiment": 0.75,
      "platform": "reddit",
      "timestamp": "2025-10-12T..."
    }
  ]
}
```

#### Get Aggregated Trends
```http
GET /api/agents/trends/aggregate
```

Returns trends from all platforms, sorted by volume.

### Environment Variables

```env
# Twitter API (optional - uses mock data if not provided)
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_BEARER_TOKEN=...

# Reddit API (optional - uses mock data if not provided)
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER_AGENT=NeonHub/3.0
```

---

## 5. OutreachAgent - B2B Lead Generation & Outreach

**Purpose**: Automated lead scraping and professional proposal generation.

### Features
- Web scraping with Puppeteer for lead generation
- Company directory crawling
- Professional PDF proposal generation
- Email template creation
- Mock data support for testing

### API Endpoints

#### Scrape Leads
```http
POST /api/agents/outreach/scrape
Content-Type: application/json

{
  "url": "https://example.com/companies",
  "maxPages": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "companyName": "Acme Corp",
      "website": "https://acmecorp.com",
      "industry": "Technology",
      "contactEmail": "info@acmecorp.com",
      "description": "Leading provider of enterprise software"
    }
  ]
}
```

#### Generate PDF Proposal
```http
POST /api/agents/outreach/proposal
Content-Type: application/json

{
  "proposalData": {
    "clientName": "John Smith",
    "clientCompany": "Acme Corp",
    "proposalTitle": "AI Marketing Automation Proposal",
    "services": [
      "AI Content Generation",
      "Trend Analysis",
      "Lead Generation"
    ],
    "pricing": [
      { "item": "Platform Setup", "amount": 2500 },
      { "item": "Monthly Subscription", "amount": 3000 }
    ],
    "timeline": "Phase 1: 2 weeks\\nPhase 2: 4 weeks",
    "terms": "6-month commitment, 30 days notice for cancellation"
  }
}
```

**Response:** PDF file download

#### Generate Email Template
```http
POST /api/agents/outreach/email-template
Content-Type: application/json

{
  "companyName": "Acme Corp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "template": "Subject: Transform Your Marketing with AI...\\n\\nHi there,\\n\\nI noticed Acme Corp..."
  }
}
```

---

## Environment Variables Reference

### Required for All Agents
```env
OPENAI_API_KEY=sk-proj-...       # Required for AdAgent, InsightAgent, DesignAgent
```

### Optional (TrendAgent)
```env
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_BEARER_TOKEN=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER_AGENT=NeonHub/3.0
```

### Optional (Communication)
```env
RESEND_API_KEY=re_...           # Email service
SENDGRID_API_KEY=SG...          # Alternative email service
TWILIO_ACCOUNT_SID=AC...        # SMS service
TWILIO_AUTH_TOKEN=...
```

---

## Testing

All agents have comprehensive test coverage:

```bash
# Run all agent tests
npm test --workspace=apps/api

# Run specific agent tests
npm test --workspace=apps/api -- AdAgent.test.ts
npm test --workspace=apps/api -- InsightAgent.test.ts
npm test --workspace=apps/api -- DesignAgent.test.ts
npm test --workspace=apps/api -- TrendAgent.test.ts
npm test --workspace=apps/api -- OutreachAgent.test.ts
```

**Test Coverage:**
- AdAgent: 7 tests
- InsightAgent: 7 tests
- DesignAgent: 6 tests
- TrendAgent: 3 tests
- OutreachAgent: 9 tests

**Total: 32 agent tests** ✅

---

## Development Mode

All agents gracefully handle missing API keys and provide fallback responses:

- **AdAgent**: Returns generic ad copy if OpenAI API fails
- **InsightAgent**: Uses statistical analysis without AI enhancement
- **DesignAgent**: Returns default design specifications
- **TrendAgent**: Uses mock trend data
- **OutreachAgent**: Uses mock lead data

This allows development without requiring all external API keys.

---

## Production Deployment

### 1. Set All Required Environment Variables

Ensure these are set in your production environment:

```env
# Core
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=postgresql://...

# Billing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Communication
RESEND_API_KEY=re_...

# Social APIs (optional but recommended for TrendAgent)
TWITTER_BEARER_TOKEN=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
```

### 2. Build and Deploy

```bash
# Build all workspaces
npm run build

# Run migrations
npm run prisma:migrate:deploy --workspace=apps/api

# Start production servers
npm start
```

---

## API Rate Limits

Be aware of external API rate limits:

- **OpenAI**: 60 requests/minute (depends on plan)
- **Twitter API**: 450 requests/15 minutes (standard)
- **Reddit API**: 60 requests/minute
- **DALL-E**: Image generation costs per request

Consider implementing caching and request queuing for production use.

---

## Support & Documentation

- **Main README**: `/README.md`
- **API Documentation**: `/docs/`
- **Environment Templates**: 
  - `ENV_TEMPLATE.example` (root)
  - `apps/api/ENV_TEMPLATE.example`
  - `apps/web/ENV_TEMPLATE.example`

For issues or questions, please open an issue on GitHub.

