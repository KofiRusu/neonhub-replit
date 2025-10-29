# NeonHub SEO API Reference
**Version:** 1.0  
**Date:** October 27, 2025  
**Base URL:** `https://api.neonhubecosystem.com/api/seo`

---

## Overview

The NeonHub SEO API provides AI-powered search engine optimization tools including:
- Keyword research and intent classification
- Meta tag generation (titles, descriptions)
- Content analysis and optimization
- Internal linking recommendations
- Competitive analysis and recommendations

All endpoints use **JSON** for request/response bodies and require authentication.

---

## Authentication

```bash
# Include authorization header
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.neonhubecosystem.com/api/seo/...
```

---

## Endpoints

### Health Check

#### GET `/api/seo`
Get API information and available endpoints

**Response:**
```json
{
  "success": true,
  "message": "NeonHub SEO API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

#### GET `/api/seo/health`
Detailed health check

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "keywords": "operational",
    "meta": "operational",
    "content": "operational",
    "recommendations": "operational",
    "links": "operational"
  }
}
```

---

## Keywords API

### POST `/api/seo/keywords/classify-intent`
Classify search intent for a keyword

**Request:**
```json
{
  "keyword": "marketing automation tutorial"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "keyword": "marketing automation tutorial",
    "intent": "informational",
    "confidence": 0.95,
    "reasoning": "Contains educational term 'tutorial' indicating user seeks knowledge"
  }
}
```

**Intent Types:**
- `informational`: User seeking knowledge (how-to, what is, guide)
- `navigational`: User looking for specific brand/product
- `commercial`: User researching before purchase (best, vs, review)
- `transactional`: User ready to take action (buy, sign up, try)

---

### POST `/api/seo/keywords/classify-intent-batch`
Classify intent for multiple keywords (efficient batch processing)

**Request:**
```json
{
  "keywords": [
    "how to automate email marketing",
    "neonhub pricing",
    "best marketing automation software"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "keyword": "how to automate email marketing", "intent": "informational", "confidence": 0.92 },
    { "keyword": "neonhub pricing", "intent": "navigational", "confidence": 0.98 },
    { "keyword": "best marketing automation software", "intent": "commercial", "confidence": 0.89 }
  ],
  "count": 3
}
```

---

### POST `/api/seo/keywords/generate-long-tail`
Generate long-tail keyword variations

**Request:**
```json
{
  "seedKeyword": "marketing automation",
  "count": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    "marketing automation for small business",
    "best marketing automation tools 2025",
    "how to set up marketing automation",
    "marketing automation vs email marketing",
    ...
  ],
  "count": 10,
  "seedKeyword": "marketing automation"
}
```

---

### POST `/api/seo/keywords/competitive-gaps`
Find keywords competitors rank for but NeonHub doesn't

**Request:**
```json
{
  "competitorUrls": [
    "https://zapier.com",
    "https://make.com"
  ],
  "ourKeywords": ["marketing automation", "workflow automation"]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "keyword": "zapier alternatives",
      "estimatedVolume": 5400,
      "difficulty": 45,
      "intent": "commercial",
      "gap": "high",
      "reasoning": "High volume, medium competition, commercial intent"
    }
  ],
  "count": 15,
  "competitors": ["zapier.com", "make.com"]
}
```

---

## Meta Tags API

### POST `/api/seo/meta/generate-title`
Generate AI-powered title tag

**Request:**
```json
{
  "keyword": "marketing automation",
  "pageType": "product",
  "brand": "NeonHub",
  "uniqueSellingPoint": "AI-powered workflow automation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Marketing Automation Platform - AI-Powered Workflows | NeonHub",
    "length": 59,
    "keywordPosition": 0,
    "score": 95,
    "warnings": []
  }
}
```

---

### POST `/api/seo/meta/generate`
Generate complete meta tags (title + description)

**Request:**
```json
{
  "keyword": "email automation",
  "pageType": "landing",
  "targetAudience": "small business owners",
  "uniqueSellingPoint": "No-code email automation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": {
      "title": "Email Automation Made Simple - No-Code Platform | NeonHub",
      "length": 58,
      "score": 92
    },
    "description": {
      "description": "Automate your email marketing with NeonHub's no-code platform. Perfect for small business owners who want powerful automation without complexity. Start free trial today.",
      "length": 157,
      "hasCTA": true,
      "hasKeyword": true,
      "score": 95
    }
  }
}
```

---

### POST `/api/seo/meta/validate`
Validate existing meta tags

**Request:**
```json
{
  "title": "Marketing Automation | NeonHub",
  "description": "NeonHub is a platform.",
  "keyword": "marketing automation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "errors": [
      "Description too short (24 chars). Minimum: 120"
    ],
    "warnings": [
      "Title length 31 chars. Ideal range: 50-60"
    ],
    "suggestions": [
      "Expand description to 150-160 characters",
      "Include value proposition and call-to-action"
    ]
  }
}
```

---

## Content API

### POST `/api/seo/content/analyze`
Comprehensive content analysis

**Request:**
```json
{
  "content": "<h1>Marketing Automation Guide</h1><p>Marketing automation helps...</p>",
  "targetKeyword": "marketing automation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wordCount": 1547,
    "readability": {
      "fleschReadingEase": 72.5,
      "fleschKincaidGrade": 8.2,
      "interpretation": "Optimal: Standard reading level",
      "optimal": true
    },
    "keywordOptimization": {
      "targetKeyword": "marketing automation",
      "density": 1.2,
      "frequency": 18,
      "prominence": 0.05,
      "lsiKeywords": ["email campaigns", "workflow automation", "lead nurturing"],
      "optimal": true
    },
    "headingStructure": {
      "h1Count": 1,
      "h2Count": 5,
      "h3Count": 8,
      "hasH1": true,
      "hasMultipleH1": false,
      "hasLogicalHierarchy": true,
      "issues": []
    },
    "internalLinks": {
      "internalLinks": 7,
      "externalLinks": 3,
      "brokenLinks": 0,
      "hasDescriptiveAnchors": true,
      "anchorTextQuality": 85
    },
    "images": {
      "totalImages": 4,
      "imagesWithAlt": 4,
      "imagesWithoutAlt": 0,
      "altTextQuality": 100
    },
    "eeat": {
      "hasAuthorBio": true,
      "hasCitations": true,
      "hasUpdatedDate": true,
      "hasExpertQuotes": false,
      "trustSignals": ["Author bio", "Citations", "Updated date"],
      "score": 75
    },
    "score": 88,
    "recommendations": [
      {
        "type": "important",
        "category": "eeat",
        "message": "Add expert quotes to boost authority",
        "impact": "medium",
        "effort": "medium"
      }
    ]
  }
}
```

---

### POST `/api/seo/content/readability`
Calculate readability scores

**Request:**
```json
{
  "content": "Your content here..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fleschReadingEase": 72.5,
    "fleschKincaidGrade": 8.2,
    "averageSentenceLength": 15.3,
    "averageWordLength": 4.8,
    "interpretation": "Optimal: Standard reading level (8th-9th grade)",
    "optimal": true
  }
}
```

---

## Recommendations API

### GET `/api/seo/recommendations/weekly`
Generate weekly SEO recommendations

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "trending-1698451200000",
      "type": "trending_keywords",
      "priority": "high",
      "category": "keywords",
      "title": "5 Trending Keyword Opportunities",
      "description": "Capitalize on rising search trends: ai marketing automation, chatgpt for marketing, automated customer journeys",
      "impact": "high",
      "effort": "medium",
      "estimatedImpact": "+20-30% organic traffic if acted quickly",
      "actionSteps": [
        "Review trending keywords list",
        "Create content targeting top 3 keywords",
        "Optimize existing pages for trending terms",
        "Monitor rankings weekly"
      ]
    },
    {
      "id": "stale-marketing-automation-guide",
      "type": "content_refresh",
      "priority": "high",
      "title": "Update: Marketing Automation Guide",
      "description": "Traffic down 25%, last updated 390 days ago",
      "impact": "medium",
      "effort": "medium",
      "estimatedImpact": "Recover 50-80% of lost traffic",
      "actionSteps": [
        "Update statistics and data points",
        "Add new examples or case studies",
        "Improve readability",
        "Refresh meta description"
      ]
    }
  ],
  "count": 12,
  "generatedAt": "2025-10-27T12:00:00Z"
}
```

---

### GET `/api/seo/recommendations/trending`
Find trending keywords

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "keyword": "ai marketing automation 2025",
      "searchVolume": 3500,
      "growthRate": 45,
      "opportunity": "high",
      "suggestedAction": "Create comprehensive guide on AI in marketing automation"
    }
  ],
  "count": 8
}
```

---

## Links API

### POST `/api/seo/links/suggest`
Suggest internal links using semantic similarity

**Request:**
```json
{
  "currentPageUrl": "https://neonhubecosystem.com/blog/marketing-automation-guide",
  "currentPageContent": "Marketing automation helps businesses...",
  "targetKeyword": "marketing automation",
  "maxSuggestions": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "targetUrl": "/features/email-automation",
      "targetTitle": "Email Automation Features",
      "targetKeyword": "email automation",
      "anchorText": "email automation features",
      "relevanceScore": 0.85,
      "position": {
        "paragraph": 2,
        "sentence": 1,
        "beforeText": "Many businesses use",
        "afterText": "to streamline their campaigns"
      },
      "reasoning": "Related to 'marketing automation' with 85% similarity",
      "priority": "high"
    }
  ],
  "count": 5,
  "sourceUrl": "/blog/marketing-automation-guide"
}
```

---

### POST `/api/seo/links/generate-anchor`
Generate contextual anchor text

**Request:**
```json
{
  "sourceContent": "Email marketing remains one of the most effective...",
  "targetKeyword": "email automation",
  "targetTitle": "Complete Email Automation Guide"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "anchorText": "email automation guide",
    "targetKeyword": "email automation",
    "targetTitle": "Complete Email Automation Guide"
  }
}
```

---

## Rate Limits

| Tier | Requests/Hour | Requests/Day |
|------|---------------|--------------|
| Free | 100 | 1,000 |
| Pro | 1,000 | 10,000 |
| Enterprise | 10,000 | 100,000 |

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid API key)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

---

## Code Examples

### Node.js (TypeScript)

```typescript
import axios from 'axios';

const API_URL = 'https://api.neonhubecosystem.com/api/seo';
const API_KEY = process.env.NEONHUB_API_KEY;

// Classify keyword intent
async function classifyIntent(keyword: string) {
  const response = await axios.post(
    `${API_URL}/keywords/classify-intent`,
    { keyword },
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );
  
  return response.data.data;
}

// Generate meta tags
async function generateMetaTags(requirements) {
  const response = await axios.post(
    `${API_URL}/meta/generate`,
    requirements,
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );
  
  return response.data.data;
}

// Analyze content
async function analyzeContent(content: string, keyword: string) {
  const response = await axios.post(
    `${API_URL}/content/analyze`,
    { content, targetKeyword: keyword },
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );
  
  return response.data.data;
}

// Get weekly recommendations
async function getWeeklyRecommendations() {
  const response = await axios.get(
    `${API_URL}/recommendations/weekly`,
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );
  
  return response.data.data;
}
```

### Python

```python
import requests

API_URL = "https://api.neonhubecosystem.com/api/seo"
API_KEY = os.getenv("NEONHUB_API_KEY")

headers = {"Authorization": f"Bearer {API_KEY}"}

# Classify keyword intent
def classify_intent(keyword):
    response = requests.post(
        f"{API_URL}/keywords/classify-intent",
        json={"keyword": keyword},
        headers=headers
    )
    return response.json()["data"]

# Generate meta tags
def generate_meta_tags(requirements):
    response = requests.post(
        f"{API_URL}/meta/generate",
        json=requirements,
        headers=headers
    )
    return response.json()["data"]

# Analyze content
def analyze_content(content, keyword):
    response = requests.post(
        f"{API_URL}/content/analyze",
        json={"content": content, "targetKeyword": keyword},
        headers=headers
    )
    return response.json()["data"]
```

### cURL

```bash
# Classify intent
curl -X POST https://api.neonhubecosystem.com/api/seo/keywords/classify-intent \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"marketing automation"}'

# Generate title
curl -X POST https://api.neonhubecosystem.com/api/seo/meta/generate-title \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "email automation",
    "pageType": "product",
    "brand": "NeonHub"
  }'

# Analyze content
curl -X POST https://api.neonhubecosystem.com/api/seo/content/analyze \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<h1>Guide</h1><p>Content here...</p>",
    "targetKeyword": "automation"
  }'
```

---

## Best Practices

1. **Batch Requests**: Use batch endpoints (`/classify-intent-batch`) for multiple keywords
2. **Cache Results**: Cache keyword/intent classifications (they don't change often)
3. **Rate Limiting**: Respect rate limits; implement exponential backoff
4. **Error Handling**: Always check `success` field before accessing `data`
5. **Content Length**: Keep content under 50KB for optimal performance

---

## Support

- **Documentation**: https://docs.neonhubecosystem.com/seo-api
- **Status Page**: https://status.neonhubecosystem.com
- **Support Email**: support@neonhubecosystem.com
- **Community**: https://community.neonhubecosystem.com

---

**Last Updated:** October 27, 2025  
**API Version:** 1.0.0

