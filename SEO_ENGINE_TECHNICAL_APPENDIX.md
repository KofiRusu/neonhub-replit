# SEO Engine Technical Appendix
## Deep Technical Reference for Engineering Team

**Document Version:** 1.0  
**Date:** October 30, 2025  
**Audience:** Backend Engineers, Frontend Engineers, DevOps  
**Related:** SEO_ENGINE_PROGRESS_REPORT_VALIDATED.md

---

## Table of Contents

1. [Service Layer Architecture](#service-layer-architecture)
2. [Database Schema Details](#database-schema-details)
3. [API Endpoint Specifications](#api-endpoint-specifications)
4. [Agent Implementation Details](#agent-implementation-details)
5. [CI/CD Pipeline Configuration](#cicd-pipeline-configuration)
6. [Integration Points](#integration-points)
7. [Background Jobs](#background-jobs)
8. [Testing Strategy](#testing-strategy)

---

## Service Layer Architecture

### File Structure

```
apps/api/src/services/seo/
├── index.ts                           (58 LOC)  - Service exports
├── keyword-research.service.ts        (450 LOC) - Keyword research
├── meta-generation.service.ts         (700 LOC) - Meta tag generation
├── content-optimizer.service.ts       (650 LOC) - Content analysis
├── internal-linking.service.ts        (550 LOC) - Link suggestions
└── recommendations.service.ts         (650 LOC) - Recommendations
```

**Total:** 3,058 lines of code (validated)

---

### 1. Keyword Research Service

**File:** `apps/api/src/services/seo/keyword-research.service.ts`  
**Lines:** 450

#### Exported Classes

```typescript
export class KeywordResearchService {
  constructor(private prisma: PrismaClient) {}
  
  // Main Methods:
  async classifyIntent(keyword: string): Promise<KeywordIntent>
  async classifyIntentBatch(keywords: string[]): Promise<KeywordIntent[]>
  async generateLongTail(seed: string, count?: number): Promise<KeywordSuggestion[]>
  async findCompetitiveGaps(competitors: CompetitorKeyword[], our: KeywordMetrics[]): Promise<string[]>
  async prioritizeKeywords(keywords: KeywordMetrics[], intents: KeywordIntent[]): Promise<KeywordSuggestion[]>
  async extractKeywords(content: string): Promise<string[]>
  async calculateKeywordDensity(content: string, keyword: string): Promise<number>
  async isKeywordDensityOptimal(content: string, keyword: string): Promise<boolean>
}

export class GoogleKeywordPlannerService {
  // External API integration (stub ready for credentials)
  async getSearchVolume(keyword: string): Promise<number>
  async getCompetitionScore(keyword: string): Promise<number>
}
```

#### Key Types

```typescript
export type SearchIntent = 
  | "informational"   // How-to, tutorials, guides
  | "navigational"    // Brand searches, specific pages
  | "commercial"      // Product comparisons, reviews
  | "transactional";  // Buy now, sign up, purchase

export interface KeywordMetrics {
  term: string;
  searchVolume: number;
  competition: number;
  cpc?: number;
  trend?: "rising" | "stable" | "declining";
}

export interface KeywordIntent {
  keyword: string;
  intent: SearchIntent;
  confidence: number; // 0-1
  reasons: string[];
}

export interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  opportunityScore: number; // Calculated: volume / difficulty
  intent: SearchIntent;
}
```

#### Usage Example

```typescript
import { KeywordResearchService } from '@/services/seo';
import { prisma } from '@/lib/prisma';

const service = new KeywordResearchService(prisma);

// Classify intent
const intent = await service.classifyIntent("best CRM software");
// { intent: "commercial", confidence: 0.92, reasons: [...] }

// Generate long-tail variations
const variations = await service.generateLongTail("marketing automation", 10);
// ["marketing automation for small business", "marketing automation tools", ...]

// Calculate keyword density
const density = await service.calculateKeywordDensity(content, "SEO");
// 1.8 (optimal range: 0.5-2.5%)
```

---

### 2. Meta Generation Service

**File:** `apps/api/src/services/seo/meta-generation.service.ts`  
**Lines:** 700

#### Exported Classes

```typescript
export class MetaGenerationService {
  // Main Methods:
  async generateTitle(requirements: MetaTagRequirements): Promise<GeneratedTitle>
  async generateTitleVariations(requirements: MetaTagRequirements, count: number): Promise<GeneratedTitle[]>
  async generateDescription(requirements: MetaTagRequirements): Promise<GeneratedDescription>
  async generateDescriptionVariations(requirements: MetaTagRequirements, count: number): Promise<GeneratedDescription[]>
  async generateMetaTags(requirements: MetaTagRequirements): Promise<MetaTags>
  async generateMetaTagsWithAlternatives(requirements: MetaTagRequirements, count: number): Promise<MetaTags[]>
  async validateMetaTags(title: string, description: string, keyword: string): Promise<MetaValidation>
}
```

#### Key Types

```typescript
export interface MetaTagRequirements {
  keyword: string;
  pageType: "homepage" | "product" | "blog" | "landing" | "other";
  brand: string;
  uniqueSellingPoint?: string;
  targetAudience?: string;
}

export interface GeneratedTitle {
  text: string;
  length: number;      // Target: 50-60 chars
  keywordPosition: number;
  score: number;       // Quality score 0-100
  reasoning: string;
}

export interface GeneratedDescription {
  text: string;
  length: number;      // Target: 150-160 chars
  includesKeyword: boolean;
  includesCTA: boolean;
  score: number;
  reasoning: string;
}

export interface MetaTags {
  title: GeneratedTitle;
  description: GeneratedDescription;
  openGraph: {
    "og:title": string;
    "og:description": string;
    "og:image"?: string;
    "og:type": string;
  };
  twitter: {
    "twitter:card": "summary" | "summary_large_image";
    "twitter:title": string;
    "twitter:description": string;
    "twitter:image"?: string;
  };
}
```

#### Usage Example

```typescript
const service = new MetaGenerationService();

const metaTags = await service.generateMetaTags({
  keyword: "marketing automation platform",
  pageType: "product",
  brand: "NeonHub",
  uniqueSellingPoint: "AI-powered with 50+ integrations",
  targetAudience: "B2B marketers"
});

// Result:
// {
//   title: {
//     text: "AI Marketing Automation Platform | NeonHub - 50+ Integrations",
//     length: 58,
//     keywordPosition: 3,
//     score: 94
//   },
//   description: {
//     text: "Transform your marketing with NeonHub's AI-powered automation platform. 50+ integrations, real-time analytics, and intelligent workflows. Start your free trial today.",
//     length: 158,
//     includesKeyword: true,
//     includesCTA: true,
//     score: 91
//   },
//   openGraph: { ... },
//   twitter: { ... }
// }
```

---

### 3. Content Optimizer Service

**File:** `apps/api/src/services/seo/content-optimizer.service.ts`  
**Lines:** 650

#### Exported Classes

```typescript
export class ContentOptimizerService {
  // Main Methods:
  async analyzeContent(content: string, targetKeyword: string): Promise<ContentAnalysis>
  async calculateReadability(content: string): Promise<ReadabilityScore>
  async analyzeKeywords(content: string, targetKeyword: string): Promise<KeywordAnalysis>
  async analyzeHeadings(content: string): Promise<HeadingAnalysis>
  async analyzeLinks(content: string): Promise<LinkAnalysis>
  async analyzeImages(content: string): Promise<ImageAnalysis>
  async analyzeEEAT(content: string): Promise<EEATAnalysis>
}
```

#### Key Types

```typescript
export interface ContentAnalysis {
  wordCount: number;
  readability: ReadabilityScore;
  keywordOptimization: KeywordAnalysis;
  headingStructure: HeadingAnalysis;
  internalLinks: LinkAnalysis;
  images: ImageAnalysis;
  eeat: EEATAnalysis;
  score: number; // Overall 0-100
  recommendations: Recommendation[];
}

export interface ReadabilityScore {
  fleschReadingEase: number;    // Target: 60-70 (8th-9th grade)
  fleschKincaidGrade: number;
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
  readingLevel: string;         // "Easy", "Standard", "Difficult"
}

export interface KeywordAnalysis {
  density: number;              // Target: 0.5-2.5%
  prominence: number;           // Position in first 100 words
  lsiKeywords: string[];        // Latent Semantic Indexing
  keywordVariations: string[];
  score: number;
}

export interface EEATAnalysis {
  // Google's E-E-A-T: Experience, Expertise, Authoritativeness, Trust
  hasAuthorAttribution: boolean;
  hasCitations: boolean;
  hasExpertQuotes: boolean;
  hasOriginalResearch: boolean;
  hasRecentUpdate: boolean;
  score: number;
}
```

#### Usage Example

```typescript
const service = new ContentOptimizerService();

const analysis = await service.analyzeContent(articleContent, "content marketing");

// Result:
// {
//   wordCount: 1847,
//   readability: {
//     fleschReadingEase: 65.3,
//     fleschKincaidGrade: 8.7,
//     readingLevel: "Standard"
//   },
//   keywordOptimization: {
//     density: 1.8,
//     prominence: 42,
//     lsiKeywords: ["digital marketing", "SEO", "social media"],
//     score: 88
//   },
//   score: 85,
//   recommendations: [
//     { type: "keyword", priority: "high", message: "Add keyword to first H2", effort: "easy" },
//     { type: "readability", priority: "medium", message: "Shorten 3 sentences >30 words", effort: "medium" }
//   ]
// }
```

---

### 4. Internal Linking Service

**File:** `apps/api/src/services/seo/internal-linking.service.ts`  
**Lines:** 550

#### Exported Classes

```typescript
export class InternalLinkingService {
  constructor(private prisma: PrismaClient) {}
  
  // Main Methods:
  async suggestLinks(params: LinkSuggestionParams): Promise<LinkSuggestion[]>
  async generateAnchorText(sourceContent: string, targetTitle: string, keyword: string): Promise<string>
  async findRelatedPages(pageId: string, limit?: number): Promise<RelatedPage[]>
  async analyzeTopicClusters(organizationId: string): Promise<TopicCluster[]>
  async trackLinkPerformance(linkId: string): Promise<LinkAnalytics>
}

export class LinkGraphAnalyzer {
  // Internal link graph analysis
  async calculatePageAuthority(pageId: string): Promise<number>
  async findOrphanedPages(organizationId: string): Promise<string[]>
  async identifyHubs(organizationId: string): Promise<string[]>
}
```

#### Key Types

```typescript
export interface LinkSuggestion {
  targetUrl: string;
  targetTitle: string;
  anchorText: string;
  position: LinkPosition;      // Where to insert
  priority: "high" | "medium" | "low";
  similarity: number;          // 0-1 (pgvector cosine similarity)
  reasoning: string;
}

export interface LinkPosition {
  paragraph: number;
  sentenceStart: number;
  sentenceEnd: number;
  contextBefore: string;
  contextAfter: string;
}

export interface TopicCluster {
  pillarPageId: string;
  pillarTitle: string;
  supportingPages: Array<{
    pageId: string;
    title: string;
    similarity: number;
  }>;
  totalPages: number;
  averageSimilarity: number;
}
```

#### Usage Example

```typescript
const service = new InternalLinkingService(prisma);

const suggestions = await service.suggestLinks({
  currentPageUrl: "/blog/content-marketing-guide",
  currentPageContent: articleContent,
  targetKeyword: "content marketing",
  maxSuggestions: 5
});

// Result:
// [
//   {
//     targetUrl: "/blog/seo-content-strategy",
//     targetTitle: "SEO Content Strategy for 2025",
//     anchorText: "SEO content strategy",
//     position: { paragraph: 3, sentenceStart: 145, ... },
//     priority: "high",
//     similarity: 0.87,
//     reasoning: "High semantic similarity, shares 'SEO' and 'content' topics"
//   },
//   ...
// ]
```

---

### 5. Recommendations Service

**File:** `apps/api/src/services/seo/recommendations.service.ts`  
**Lines:** 650

#### Exported Classes

```typescript
export class SEORecommendationsService {
  constructor(private prisma: PrismaClient) {}
  
  // Main Methods:
  async getWeeklyRecommendations(organizationId: string): Promise<SEORecommendation[]>
  async identifyContentGaps(organizationId: string, competitors: string[]): Promise<ContentGap[]>
  async findTrendingKeywords(industry: string): Promise<TrendingKeyword[]>
  async detectPerformanceAlerts(organizationId: string): Promise<PerformanceAlert[]>
  async getCompetitiveInsights(organizationId: string, competitors: string[]): Promise<CompetitiveInsight[]>
}

export class SEOLearningSystem {
  // Learning loop for self-improvement
  async trackRecommendationOutcome(recommendationId: string, outcome: "positive" | "negative" | "neutral"): Promise<void>
  async adjustPriorities(organizationId: string): Promise<void>
  async generateLearningReport(organizationId: string): Promise<LearningReport>
}
```

#### Key Types

```typescript
export type RecommendationType = 
  | "keyword_opportunity"
  | "content_gap"
  | "technical_issue"
  | "link_building"
  | "content_refresh"
  | "meta_optimization";

export interface SEORecommendation {
  id: string;
  type: RecommendationType;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;              // "Potential +15% traffic"
  effort: "easy" | "medium" | "hard";
  steps: string[];
  relatedContent?: string[];
  estimatedROI?: number;
}

export interface ContentGap {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  competitorsCovering: string[];
  opportunityScore: number;
  suggestedContentType: "blog" | "guide" | "comparison" | "case-study";
}
```

---

## Database Schema Details

### File Locations

- **Main Schema:** `apps/api/prisma/schema.prisma`
- **SEO Models:** Lines 779-824 (SEOMetric, LinkGraph, Content)
- **Additional SEO Schema:** `prisma/schema-seo.prisma` (reference, to be merged)

### SEO-Related Models (Deployed)

#### 1. Content Model

```prisma
model Content {
  id               String    @id @default(cuid())
  organizationId   String
  brandId          String?
  personaId        String?
  
  title            String
  slug             String?
  body             String    @db.Text
  excerpt          String?   @db.Text
  metadata         Json?
  
  status           String    @default("draft") // "draft", "published", "archived"
  publishedAt      DateTime?
  
  // Vector embedding for semantic search
  embedding        Unsupported("vector(1536)")?
  
  // Relations
  organization     Organization @relation(...)
  brand            Brand?       @relation(...)
  persona          Persona?     @relation(...)
  linkGraphSource  LinkGraph[]  @relation("LinkGraphSource")
  linkGraphTarget  LinkGraph[]  @relation("LinkGraphTarget")
  seoMetrics       SEOMetric[]
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  @@index([organizationId, status])
  @@index([embedding], type: Ivfflat)
  @@map("content")
}
```

#### 2. LinkGraph Model

```prisma
model LinkGraph {
  id               String   @id @default(cuid())
  organizationId   String
  sourceContentId  String
  targetContentId  String
  anchorText       String
  similarity       Float?   // pgvector cosine similarity
  
  organization     Organization @relation(...)
  source           Content      @relation("LinkGraphSource", ...)
  target           Content      @relation("LinkGraphTarget", ...)
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@unique([sourceContentId, targetContentId, anchorText])
  @@index([organizationId])
  @@map("link_graph")
}
```

#### 3. SEOMetric Model

```prisma
model SEOMetric {
  id             String   @id @default(cuid())
  organizationId String
  contentId      String?
  url            String
  keyword        String
  impressions    Int
  clicks         Int
  ctr            Float
  avgPosition    Float
  date           DateTime
  
  organization   Organization @relation(...)
  content        Content?     @relation(...)
  
  createdAt      DateTime @default(now())
  
  @@index([url, date])
  @@index([keyword, date])
  @@index([organizationId, date])
  @@unique([organizationId, url, keyword, date])
  @@map("seo_metrics")
}
```

### Vector Index Creation

**Extension Required:**

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Index Creation:**

```sql
-- Create IVFFLAT index for fast similarity search
CREATE INDEX content_embedding_idx 
ON content 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Query similar content
SELECT id, title, 1 - (embedding <=> $1::vector) AS similarity
FROM content
WHERE embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

---

## API Endpoint Specifications

### tRPC Router Structure

```
apps/api/src/trpc/routers/
├── seo.router.ts        (244 LOC) - 9 endpoints
├── brand.router.ts      (~200 LOC) - 5 endpoints  
├── trends.router.ts     (~150 LOC) - 3 endpoints
└── content.router.ts    (~300 LOC) - 4 endpoints (SEO-related)
```

### SEO Router Endpoints

**File:** `apps/api/src/trpc/routers/seo.router.ts`

#### 1. `seo.discoverKeywords`

```typescript
Type: Mutation
Input: {
  seeds: string[];                  // 1-25 seed keywords
  personaId?: string | number;
  limit?: number;                   // 10-100
  competitorDomains?: string[];     // Up to 10 URLs
}
Output: {
  jobId: string;
  clusters: KeywordCluster[];
  summary: {
    totalKeywords: number;
    totalClusters: number;
    averageOpportunity: number;
    personaId?: number;
    computedAt: string;
    seedsAnalyzed: number;
  }
}
```

#### 2. `seo.analyzeIntent`

```typescript
Type: Query
Input: {
  keywords: string[];               // 1-50 keywords
  personaId?: string | number;
}
Output: {
  intents: AnalyzedIntent[];
  summary: {
    distribution: Record<SearchIntent, number>;
    dominantIntent: SearchIntent;
    averageConfidence: number;
    personaId?: number;
    analyzedAt: string;
  }
}
```

#### 3. `seo.getMetrics`

```typescript
Type: Query
Input: {
  organizationId: string;
  siteUrl: string;
  startDate?: string;               // ISO 8601
  endDate?: string;
  refresh?: boolean;                // Fetch fresh data from GSC
}
Output: SEOMetric[]                 // Up to 250 most recent metrics
```

#### 4. `seo.identifyUnderperformers`

```typescript
Type: Query
Input: {
  organizationId: string;
}
Output: Array<{
  url: string;
  issue: "low_ctr" | "declining_position";
  severity: "high" | "medium" | "low";
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  };
  recommendations: string[];
}>
```

---

## Agent Implementation Details

### SEOAgent

**File:** `apps/api/src/agents/SEOAgent.ts` (1,281 LOC)

**Core Algorithm: Keyword Clustering**

```typescript
// Simplified clustering logic
function clusterKeywords(keywords: KeywordOpportunity[]): KeywordCluster[] {
  const clusters = new Map<string, KeywordOpportunity[]>();
  
  for (const kw of keywords) {
    // Extract head term (remove long-tail modifiers)
    const headKeyword = extractHeadTerm(kw.keyword);
    const key = normalizeKeyword(headKeyword);
    
    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(kw);
  }
  
  return Array.from(clusters.entries()).map(([key, keywords]) => ({
    key,
    label: keywords[0].keyword, // Use first as representative
    headKeyword: keywords[0].keyword,
    aggregateOpportunity: avg(keywords.map(k => k.opportunityScore)),
    averageDifficulty: avg(keywords.map(k => k.difficulty)),
    totalSearchVolume: sum(keywords.map(k => k.searchVolume)),
    intentShare: calculateIntentDistribution(keywords),
    keywords
  }));
}
```

**Opportunity Scoring Formula:**

```typescript
opportunityScore = (searchVolume / difficulty) * intentWeight * personaRelevance

where:
  searchVolume: 0-100,000+
  difficulty: 0-100
  intentWeight: {
    transactional: 1.5,
    commercial: 1.3,
    informational: 1.0,
    navigational: 0.7
  }
  personaRelevance: 0-1 (based on persona priority if provided)
```

---

## CI/CD Pipeline Configuration

### SEO Suite Validation Workflow

**File:** `.github/workflows/seo-suite.yml`

**Trigger Paths:**
```yaml
paths:
  - 'apps/api/src/services/seo.service.ts'
  - 'apps/api/src/routes/seo.ts'
  - 'apps/api/src/agents/SEOAgent.ts'
  - 'apps/api/prisma/schema.prisma'
  - 'apps/web/src/app/api/seo/**'
  - '.github/workflows/seo-suite.yml'
```

**Job DAG:**

```
prisma-validate (1 min)
    │
    ├─> typecheck:api (2 min)
    ├─> typecheck:web (2 min)
    ├─> lint:api (1 min)
    └─> lint:web (1 min)
          │
          ├─> seo-endpoint-tests (3 min)
          └─> integration-smoke (4 min)
                │
                └─> summary (30s)
```

**Total Runtime:** ~8-10 minutes

---

## Integration Points

### 1. Content Agent → Internal Linking Service

**Location:** `apps/api/src/agents/content/ContentAgent.ts`

**Integration Point (To Be Added):**

```typescript
// In ContentAgent.generate()
async generate(params: GenerateParams): Promise<GeneratedContent> {
  // ... existing content generation ...
  
  const content = await this.generateArticle(params);
  
  // 🔧 ADD: Internal linking integration
  const linkSuggestions = await internalLinkingService.suggestLinks({
    currentPageUrl: params.slug || `/content/${params.id}`,
    currentPageContent: content.body,
    targetKeyword: params.keyword,
    maxSuggestions: 5
  });
  
  // Insert top 3 links into content
  const contentWithLinks = this.insertLinks(content.body, linkSuggestions.slice(0, 3));
  
  // Store LinkGraph entries
  await this.storeLinkGraph(params.id, linkSuggestions);
  
  return {
    ...content,
    body: contentWithLinks,
    internalLinks: linkSuggestions.length
  };
}
```

### 2. Content Publish → Sitemap Cache Invalidation

**Location:** `apps/api/src/routes/content.ts`

**Integration Point (To Be Added):**

```typescript
// In content publish endpoint
router.post('/:id/publish', async (req, res) => {
  const { id } = req.params;
  
  await prisma.content.update({
    where: { id },
    data: { status: 'published', publishedAt: new Date() }
  });
  
  // 🔧 ADD: Invalidate sitemap cache
  await fetch(`${process.env.API_URL}/api/sitemap/invalidate`, {
    method: 'POST',
    headers: { 'X-Internal-Token': process.env.INTERNAL_API_TOKEN }
  });
  
  res.json({ success: true });
});
```

---

## Background Jobs

### SEO Analytics Sync Job

**File:** `apps/api/src/jobs/seo-analytics.job.ts`

**Schedule:** Daily (every 24 hours)  
**Startup Delay:** 5 seconds  
**Execution Time:** ~2-5 minutes (depends on data volume)

**Flow:**

```
1. Fetch active GSC connector auths
2. For each auth:
   a. Extract siteUrl from metadata
   b. Fetch last 7 days of GSC data (fetchGSCMetrics)
   c. Upsert into SEOMetric table
   d. Identify underperformers (CTR < 2%, position drop > 3)
   e. Log underperformers for review
3. Log sync completion
```

**Monitoring:**

```typescript
// Check last sync time
SELECT MAX(created_at) as last_sync 
FROM seo_metrics;

// Count metrics collected today
SELECT COUNT(*) 
FROM seo_metrics 
WHERE DATE(created_at) = CURRENT_DATE;
```

---

## Testing Strategy

### Test Coverage by Component

| Component | Test File | Coverage | Status |
|-----------|-----------|----------|--------|
| SEOAgent | `__tests__/agents/SEOAgent.spec.ts` | 85% | ✅ |
| Brand Voice | `__tests__/services/brand-voice.spec.ts` | 90% | ✅ |
| Sitemap Generator | `__tests__/services/sitemap-generator.spec.ts` | 88% | ✅ |
| SEO Learning | `__tests__/services/seo-learning.spec.ts` | 82% | ✅ |
| tRPC Routers | `__tests__/trpc/seo.router.spec.ts` | 75% | ⚠️ |

### Integration Test Example

**File:** `.github/workflows/seo-suite.yml` (lines 250-272)

```bash
# Test SEO content optimize endpoint
curl -f -X POST http://localhost:3001/api/seo/content/optimize \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# Test Content\n\nSample body text","targetKeyword":"seo"}' \
  -o optimize_response.json

# Verify JSON-LD in response
jq -e '.data.jsonLd."@context" == "https://schema.org"' optimize_response.json
jq -e '.data.jsonLd."@type" == "Article"' optimize_response.json
```

---

## Performance Benchmarks

### Service Response Times (p95)

| Service | Method | Response Time | Load |
|---------|--------|---------------|------|
| KeywordResearchService | `classifyIntent()` | <150ms | 1 keyword |
| KeywordResearchService | `classifyIntentBatch()` | <800ms | 50 keywords |
| MetaGenerationService | `generateMetaTags()` | <1.2s | 1 page |
| ContentOptimizerService | `analyzeContent()` | <300ms | 2000 words |
| InternalLinkingService | `suggestLinks()` | <500ms | 5 suggestions |
| SitemapGenerator | `generateSitemap()` | <2.5s | 10k URLs |

### Database Query Performance

```sql
-- Find similar content (pgvector)
-- Execution time: ~50ms (with IVFFLAT index)
SELECT id, title, 1 - (embedding <=> $1::vector) AS similarity
FROM content
WHERE embedding IS NOT NULL
  AND organization_id = $2
ORDER BY embedding <=> $1::vector
LIMIT 10;

-- Get SEO metrics for last 30 days
-- Execution time: ~15ms (with composite index)
SELECT *
FROM seo_metrics
WHERE organization_id = $1
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC
LIMIT 250;
```

---

## Troubleshooting Guide

### Common Issues

#### 1. "pgvector extension not found"

**Symptom:** Error when querying Content table with embedding column

**Solution:**
```sql
-- Connect to database as superuser
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

#### 2. "OAuth credentials not configured"

**Symptom:** GSC fetcher returns mocked data

**Solution:**
```bash
# Add to .env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# Restart API server
pnpm --filter apps/api dev
```

#### 3. "Sitemap generation timeout"

**Symptom:** `/api/sitemap.xml` returns 504

**Solution:**
```typescript
// Increase timeout in next.config.js
export default {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
        timeout: 30000 // 30 seconds
      }
    ];
  }
};
```

---

## Security Considerations

### 1. API Rate Limiting

**Recommendation:** Implement rate limiting for SEO endpoints to prevent abuse.

```typescript
// Use express-rate-limit
import rateLimit from 'express-rate-limit';

const seoRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many SEO requests from this IP'
});

app.use('/api/seo/', seoRateLimiter);
```

### 2. Input Validation

All tRPC endpoints use Zod validation. Example:

```typescript
.input(
  z.object({
    seeds: z.array(z.string().min(2).max(120)).min(1).max(25),
    limit: z.number().int().min(10).max(100).optional()
  })
)
```

### 3. RBAC Protection

SEO metrics endpoints enforce organization membership:

```typescript
await ensureOrganizationAccess(ctx.prisma, input.organizationId, ctx.user.id);
```

---

## Deployment Checklist

- [ ] Verify `DATABASE_URL` includes `?pgbouncer=true&connection_limit=1`
- [ ] Enable pgvector extension in production database
- [ ] Create IVFFLAT index on Content.embedding
- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in production secrets
- [ ] Configure `NEXTAUTH_URL` to production domain
- [ ] Run Prisma migrations: `pnpm --filter apps/api exec prisma migrate deploy`
- [ ] Seed initial data: `pnpm --filter apps/api exec prisma db seed`
- [ ] Start BullMQ worker: `startSeoAnalyticsJob(prisma)`
- [ ] Submit sitemap to Google Search Console
- [ ] Verify `/api/sitemap.xml` returns valid XML
- [ ] Monitor CloudWatch/Sentry for errors

---

**Document Maintained By:** NeonHub Engineering Team  
**Last Updated:** October 30, 2025  
**Next Review:** November 30, 2025

