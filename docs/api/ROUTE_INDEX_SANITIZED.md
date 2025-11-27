# NeonHub API Surface - Sanitized Public Documentation

**Version:** 1.0.0  
**Last Updated:** November 2025  
**Purpose:** External agency cost estimation and technical planning  
**Scope:** High-level REST and tRPC endpoint surface only

---

## ⚠️ Important Notice

This documentation is a **sanitized view** of the NeonHub API designed for external agency partners to estimate project complexity and integration scope. It includes:

✅ **Safe to share:**
- Endpoint paths and methods
- High-level request/response shapes
- Feature status (DONE / PARTIAL / TODO)
- Authentication requirements

❌ **Explicitly excluded:**
- Internal business logic and AI prompts
- Prisma schema details and entity relationships
- Secrets, tokens, API keys, or environment variables
- Low-level implementation details
- Connector authentication flows
- Database schema or query internals

---

## API Domains Overview

| Domain | Status | Endpoints | Auth |
|--------|--------|-----------|------|
| **Auth** | DONE | 2 | Public/Protected |
| **Users & Profile** | DONE | 1 | Protected |
| **Campaigns** | DONE | 10 | Protected |
| **Content & Articles** | DONE | 3 | Protected |
| **Email** | PARTIAL | 1 | Protected |
| **Social Media** | DONE | 2 | Protected |
| **SEO** | DONE | 15+ | Protected |
| **Analytics** | PARTIAL | 2 | Protected |
| **Team & Collaboration** | PARTIAL | 8 | Protected |
| **Billing & Plans** | DONE | 4 | Protected |
| **Documents** | DONE | 5 | Protected |
| **Messages** | DONE | 5 | Protected |
| **Personas** | DONE | 4 | Protected |
| **Keywords** | DONE | 6+ | Protected |
| **Connectors** | PARTIAL | 8+ | Protected |
| **Jobs & Async Tasks** | DONE | 2 | Protected |
| **Marketing** | PARTIAL | 3 | Protected |
| **Settings** | DONE | 4 | Protected |
| **Support & Feedback** | PLANNED | TBD | Protected |
| **Health & Metrics** | DONE | 2 | Public |

---

## 🔐 Authentication

All protected endpoints require:
- **Header:** `Authorization: Bearer {{AUTH_TOKEN}}`
- **Or:** Valid session cookie (NextAuth)
- **Or:** OAuth2 token (connector-specific)

Public endpoints:
- `/health` - No auth required
- `/api/auth/*` - Public auth flows
- `/metrics` - Prometheus metrics (no auth)
- Social webhook callbacks - May accept signed payloads

---

## Detailed Endpoint Reference

### **AUTH**

#### POST /auth/login
**Purpose:** Authenticate user and create session  
**Auth:** Public  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ email, password }` or `{ provider, providerToken }` |
| **Response** | `{ user: { id, email, name, image }, sessionToken, expiresAt }` |

#### GET /auth/me
**Purpose:** Get current authenticated user profile  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None (uses session) |
| **Response** | `{ user: { id, email, name, image, createdAt } }` |

#### POST /auth/logout
**Purpose:** Clear user session  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ success: boolean }` |

---

### **CAMPAIGNS**

#### POST /api/campaigns
**Purpose:** Create a new marketing campaign  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ name, type, config: { objective, channels, budget } }` |
| **Response** | `{ campaignId, name, type, status, createdAt }` |

#### GET /api/campaigns
**Purpose:** List user's campaigns with filters  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | Query: `?status=draft&type=email&page=1&limit=10` |
| **Response** | `{ data: [...campaigns], meta: { total } }` |

#### GET /api/campaigns/:id
**Purpose:** Get campaign details  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ campaignId, name, type, status, channels, schedule, metrics }` |

#### PUT /api/campaigns/:id
**Purpose:** Update campaign  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ name?, type?, config?, status? }` |
| **Response** | `{ campaignId, ...updatedFields }` |

#### DELETE /api/campaigns/:id
**Purpose:** Delete campaign  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ success: boolean, message: "Campaign deleted successfully" }` |

#### PATCH /api/campaigns/:id/status
**Purpose:** Update campaign status (draft→scheduled→active→paused→completed)  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ status: "draft" | "scheduled" | "active" | "paused" | "completed" }` |
| **Response** | `{ campaignId, status }` |

#### POST /api/campaigns/:id/schedule
**Purpose:** Schedule campaign for execution  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ startDate, endDate?, emailSequence: [...], socialPosts: [...] }` |
| **Response** | `{ campaignId, scheduledFor, sequenceId }` |

#### POST /api/campaigns/:id/ab-test
**Purpose:** Run A/B test on campaign variants  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ variants: [{ name, config }], sampleSize?, duration? }` |
| **Response** | `{ testId, variants: [...], status, results? }` |

#### GET /api/campaigns/:id/analytics
**Purpose:** Get campaign performance metrics  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | Query: `?dateRange=7d&metrics=impressions,clicks,conversions` |
| **Response** | `{ campaignId, impressions, clicks, ctr, conversions, revenue, roi }` |

#### POST /api/campaigns/:id/optimize
**Purpose:** Optimize campaign using AI  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ optimizationGoals: ["ctr", "conversion", "roi"], budget? }` |
| **Response** | `{ optimizationId, recommendations: [...], expectedImprovement }` |

---

### **CONTENT & ARTICLE GENERATION**

#### POST /content/generate
**Purpose:** Generate article content using AI  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ topic, tone, audience, notes?, brandId?, brandVoiceId?, callToAction?, campaignGoal? }` |
| **Response** | `{ jobId, draftId, title, summary, meta, schema, status }` |

#### GET /content/drafts
**Purpose:** List all content drafts (paginated)  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | Query: `?page=1&limit=10` |
| **Response** | `{ data: [...drafts], pagination: { page, limit, total, pages } }` |

#### GET /content/drafts/:id
**Purpose:** Get draft details with full content  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ draftId, title, content, status, createdBy, createdAt, updatedAt }` |

#### tRPC: content.generateArticle
**Purpose:** tRPC mutation for article generation  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ topic, primaryKeyword, tone?, audience?, callToAction?, brandId?, brandVoiceId?, wordCount? }` |
| **Response** | `{ draftId, jobId, title, summary }` |

#### tRPC: content.optimize
**Purpose:** Optimize article for SEO  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ content, primaryKeyword, draftId?, personaId?, brandId? }` |
| **Response** | `{ optimizationId, improvements, readabilityScore, seoScore }` |

---

### **EMAIL**

#### POST /email/sequence
**Purpose:** Generate email sequence for campaign  
**Auth:** Required  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | `{ topic, audience, notes? }` |
| **Response** | `{ sequenceId, emails: [...], previewHtml }` |

#### POST /api/campaigns/:id/email/sequence
**Purpose:** Generate email sequence for specific campaign  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ topic, audience, numEmails, tone }` |
| **Response** | `{ sequenceId, emails: [{ subject, body, schedule }] }` |

#### POST /api/campaigns/email/optimize-subject
**Purpose:** AI-powered subject line optimization  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ originalSubject, context?, tone? }` |
| **Response** | `{ variants: [...], recommendation, expectedOpenRateImprovement }` |

---

### **SOCIAL MEDIA**

#### POST /api/social/:platform/dm
**Purpose:** Send direct message on social platform (Instagram, X, Reddit, WhatsApp)  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ personId, objective, brandId, platform: "instagram" | "x" | "reddit" | "whatsapp" }` |
| **Response** | `{ status: "queued", messageId, platform }` |

#### POST /api/social/:platform/inbound
**Purpose:** Receive inbound social messages (webhook endpoint)  
**Auth:** Webhook signature  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ handle, message, brandId?, metadata? }` |
| **Response** | `{ received: true, personId }` |

#### POST /api/campaigns/social/generate
**Purpose:** Generate social media post for platform  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ content, platform, tone?, includeHashtags? }` |
| **Response** | `{ postId, content, characterCount, hashtags, suggestions }` |

#### POST /api/campaigns/social/optimize
**Purpose:** Optimize content for social platform  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ content, platform: "instagram" | "x" | "facebook" | "linkedin" }` |
| **Response** | `{ optimized, characterCount, mediaRecommendations, bestTimeToPost }` |

#### POST /api/campaigns/:id/social/schedule
**Purpose:** Schedule social post for campaign  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ platform, content, mediaUrls?, scheduledFor, crossPost? }` |
| **Response** | `{ postId, platform, scheduledFor, status }` |

---

### **SEO**

#### GET /api/seo
**Purpose:** SEO API health check and available endpoints  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ endpoints: { keywords: {...}, meta: {...}, content: {...}, ... } }` |

#### POST /api/seo/audit
**Purpose:** Quick SEO audit for URL  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ url, notes? }` |
| **Response** | `{ auditId, score, issues: [...], recommendations: [...] }` |

#### **Keywords Sub-Domain**

##### POST /api/seo/keywords/classify-intent
**Purpose:** Classify search intent (informational, navigational, transactional, commercial)  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ keyword }` |
| **Response** | `{ keyword, intent: "informational" | "commercial" | "transactional" | "navigational", confidence }` |

##### POST /api/seo/keywords/classify-intent-batch
**Purpose:** Classify intent for multiple keywords  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ keywords: [...] }` |
| **Response** | `{ results: [{ keyword, intent, confidence }] }` |

##### POST /api/seo/keywords/generate-long-tail
**Purpose:** Generate long-tail keyword variations  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ seed, count? }` |
| **Response** | `{ variations: [...], difficulty: [...], searchVolume: [...] }` |

##### POST /api/seo/keywords/competitive-gaps
**Purpose:** Find keyword gaps vs competitors  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ yourDomain, competitors: [...], count? }` |
| **Response** | `{ gaps: [{ keyword, competitors, searchVolume, difficulty }] }` |

##### POST /api/seo/keywords/prioritize
**Purpose:** Prioritize keywords by opportunity score  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ keywords: [...], objectives: ["traffic", "conversion", "brand"] }` |
| **Response** | `{ ranked: [{ keyword, score, reasoning }] }` |

##### POST /api/seo/keywords/extract
**Purpose:** Extract keywords from content  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ content, limit? }` |
| **Response** | `{ keywords: [...], density: {...}, opportunities: [...] }` |

##### POST /api/seo/keywords/density
**Purpose:** Calculate keyword density  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ content, keyword }` |
| **Response** | `{ keyword, density: "0.5%", recommendation, optimal: "1-2%" }` |

#### **Meta Tags Sub-Domain**

##### POST /api/seo/meta/generate-title
**Purpose:** Generate optimized title tag  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ keyword, topic, brandName?, maxChars? }` |
| **Response** | `{ title, characterCount, seoScore, ctrEstimate }` |

##### POST /api/seo/meta/generate-title-variations
**Purpose:** Generate title A/B test variations  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ keyword, topic, brandName?, count? }` |
| **Response** | `{ variations: [{ title, characterCount, ctrEstimate }] }` |

##### POST /api/seo/meta/generate-description
**Purpose:** Generate optimized meta description  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ keyword, topic, callToAction?, maxChars? }` |
| **Response** | `{ description, characterCount, seoScore, ctrEstimate }` |

##### POST /api/seo/meta/generate-description-variations
**Purpose:** Generate description A/B test variations  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ keyword, topic, callToAction?, count? }` |
| **Response** | `{ variations: [{ description, characterCount, ctrEstimate }] }` |

##### POST /api/seo/meta/generate
**Purpose:** Generate complete meta tag bundle  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ keyword, topic, brandName?, callToAction? }` |
| **Response** | `{ title, description, canonical, ogTags, twitterCards }` |

##### POST /api/seo/meta/validate
**Purpose:** Validate existing meta tags  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ title, description, url }` |
| **Response** | `{ issues: [...], warnings: [...], score, suggestions }` |

#### **Content Analysis Sub-Domain**

##### POST /api/seo/content/analyze
**Purpose:** Comprehensive content analysis  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ content, keyword? }` |
| **Response** | `{ readability, seoScore, keywordOptimization, structure, eeatSignals }` |

##### POST /api/seo/content/readability
**Purpose:** Calculate readability scores (Flesch, Dale-Chall, etc.)  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ content }` |
| **Response** | `{ readingLevel, fleschScore, gradeLevel, avgSentenceLength }` |

##### POST /api/seo/content/keywords
**Purpose:** Analyze keyword optimization  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ content, primaryKeyword, secondaryKeywords? }` |
| **Response** | `{ optimization: "good" | "fair" | "poor", density, placement, suggestions }` |

##### POST /api/seo/content/headings
**Purpose:** Analyze heading structure (H1, H2, H3, etc.)  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ content }` |
| **Response** | `{ h1Count, h2Count, structure, issues, suggestions }` |

##### POST /api/seo/content/links
**Purpose:** Analyze internal and external links  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ content }` |
| **Response** | `{ internalLinks, externalLinks, anchorText, broken: [...] }` |

##### POST /api/seo/content/images
**Purpose:** Analyze images and alt text  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ content }` |
| **Response** | `{ imageCount, altTextMissing, suggestions }` |

##### POST /api/seo/content/eeat
**Purpose:** Analyze E-E-A-T signals (Experience, Expertise, Authority, Trustworthiness)  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ content, authorInfo? }` |
| **Response** | `{ experience, expertise, authority, trustworthiness, overallScore }` |

#### **Recommendations Sub-Domain**

##### GET /api/seo/recommendations/weekly
**Purpose:** Generate weekly SEO recommendations  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | Query: `?limit=10` |
| **Response** | `{ recommendations: [{ priority, type, impact, action }] }` |

##### POST /api/seo/recommendations/competitors
**Purpose:** Analyze competitors  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ domains: [...], keywords?: [...] }` |
| **Response** | `{ competitors: [{ domain, rankings, traffic }], gaps: [...] }` |

##### GET /api/seo/recommendations/content-gaps
**Purpose:** Identify content gaps  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ gaps: [{ topic, keyword, searchVolume, difficulty }] }` |

##### GET /api/seo/recommendations/trending
**Purpose:** Find trending keywords  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | Query: `?industry=tech&region=us&limit=10` |
| **Response** | `{ trending: [{ keyword, trendLine, searchVolume, content }] }` |

##### GET /api/seo/recommendations/stale-content
**Purpose:** Find stale content needing refresh  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | Query: `?monthsOld=6` |
| **Response** | `{ stale: [{ url, lastUpdated, performance, recommendations }] }` |

##### GET /api/seo/recommendations/competitive-gaps
**Purpose:** Find competitive keyword gaps  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | Query: `?competitors=domain1.com,domain2.com` |
| **Response** | `{ gaps: [{ keyword, theyRank, weRank, opportunity }] }` |

##### POST /api/seo/recommendations/for-page
**Purpose:** Generate page-specific recommendations  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ url, keyword? }` |
| **Response** | `{ recommendations: [{ area, issue, fix, impact }] }` |

#### **Links Sub-Domain**

##### POST /api/seo/links/suggest
**Purpose:** Suggest internal links for a page  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ pageUrl, keyword }` |
| **Response** | `{ suggestions: [{ url, anchorText, relevance }] }` |

##### POST /api/seo/links/generate-anchor
**Purpose:** Generate anchor text variations  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ keyword, targetPage }` |
| **Response** | `{ anchors: [...], recommendations: [...] }` |

##### POST /api/seo/links/validate-anchor
**Purpose:** Validate anchor text quality  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ anchorText, targetKeyword? }` |
| **Response** | `{ score, issues: [...], suggestions }` |

##### GET /api/seo/links/site-structure
**Purpose:** Analyze site-wide link structure  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ totalPages, linkDensity, orphanedPages, deepestPath }` |

##### POST /api/seo/links/topic-clusters
**Purpose:** Build topic clusters for internal linking  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ pillarKeyword, relatedKeywords?: [...] }` |
| **Response** | `{ pillar, clusters: [{ topic, keywords, suggestedUrls }] }` |

#### tRPC: seo.discoverKeywords
**Purpose:** tRPC mutation for keyword discovery  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ seeds, personaId?, limit?, competitorDomains? }` |
| **Response** | `{ keywords: [...], searchVolume, difficulty, intent }` |

---

### **ANALYTICS**

#### POST /analytics/executive-summary
**Purpose:** Generate executive summary of performance  
**Auth:** Required  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | `{ notes? }` |
| **Response** | `{ summary, keyMetrics, trends, recommendations }` |

#### GET /analytics/brand-voice-kpis
**Purpose:** Get brand voice KPIs  
**Auth:** Required  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ metrics: { tone, consistency, engagement, sentiment } }` |

---

### **TEAM & COLLABORATION**

#### GET /api/team/members
**Purpose:** List team members with filters  
**Auth:** Required (Admin)  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | Query: `?role=Admin&status=active` |
| **Response** | `{ members: [{ id, name, email, role, status }] }` |

#### GET /api/team/members/:id
**Purpose:** Get team member details  
**Auth:** Required (Admin)  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ id, name, email, role, department, createdAt, lastActive }` |

#### PUT /api/team/members/:id
**Purpose:** Update team member role/status  
**Auth:** Required (Admin)  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | `{ role?, department?, status? }` |
| **Response** | `{ id, role, department, status }` |

#### DELETE /api/team/members/:id
**Purpose:** Remove team member  
**Auth:** Required (Admin)  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ success: boolean, removedId }` |

#### GET /api/team/stats
**Purpose:** Get team statistics  
**Auth:** Required (Admin)  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ totalMembers, byRole, avgTenure, engagementScore }` |

#### POST /api/team/invite
**Purpose:** Invite team member via email  
**Auth:** Required (Admin)  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | `{ email, role: "Admin" | "Member" | "Guest", message? }` |
| **Response** | `{ id, email, role, inviteToken, expiresAt, emailSent }` |

#### GET /api/team/invitations
**Purpose:** List pending invitations  
**Auth:** Required (Admin)  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ invitations: [{ id, email, role, sentAt, expiresAt }] }` |

#### GET /api/team/accept?token={{INVITE_TOKEN}}
**Purpose:** Accept team invitation (landing page)  
**Auth:** Public (token-based)  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | Query: `?token={{INVITE_TOKEN}}` |
| **Response** | HTML page with success/error message |

---

### **BILLING & PLANS**

#### GET /api/billing/plan
**Purpose:** Get current billing plan and limits  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ plan: "starter" | "pro" | "enterprise", limits: { campaigns, emails, socialPosts, agentCalls }, status, currentPeriod }` |

#### GET /api/billing/usage
**Purpose:** Get usage metrics against plan limits  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ campaigns: { used, total }, emails: { used, total }, socialPosts: { used, total }, agentCalls: { used, total } }` |

#### GET /api/billing/invoices
**Purpose:** List invoices (last 12)  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ invoices: [{ id, amount, currency, status, createdAt, invoiceUrl }] }` |

#### POST /api/billing/checkout
**Purpose:** Create Stripe checkout session  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ plan?: "starter" | "pro" | "enterprise", priceId?, successUrl, cancelUrl }` |
| **Response** | `{ sessionId, url, expiresAt }` |

#### POST /api/billing/portal
**Purpose:** Create Stripe customer portal session  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ returnUrl }` |
| **Response** | `{ sessionId, url }` |

---

### **DOCUMENTS**

#### POST /api/documents
**Purpose:** Create new document  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ title, content, type?: "general" | "contract" | "proposal" | "report", tags?, metadata? }` |
| **Response** | `{ id, title, type, status, createdAt }` |

#### GET /api/documents
**Purpose:** List documents with filters  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | Query: `?status=draft&type=proposal` |
| **Response** | `{ documents: [{ id, title, type, status, createdAt }] }` |

#### GET /api/documents/:id
**Purpose:** Get document details  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ id, title, content, type, status, createdBy, createdAt }` |

#### PUT /api/documents/:id
**Purpose:** Update document  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ title?, content?, type?, status?, tags?, metadata? }` |
| **Response** | `{ id, ...updatedFields }` |

#### DELETE /api/documents/:id
**Purpose:** Delete document  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ success: boolean }` |

#### POST /api/documents/:id/version
**Purpose:** Create new document version  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ versionId, documentId, version, createdAt }` |

---

### **MESSAGES**

#### POST /api/messages
**Purpose:** Send message  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ receiverId, subject?, body, threadId?, replyToId?, attachments?, tags? }` |
| **Response** | `{ id, threadId, status, createdAt }` |

#### GET /api/messages
**Purpose:** List messages (optionally filtered by thread)  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | Query: `?threadId={{THREAD_ID}}&unreadOnly=true` |
| **Response** | `{ messages: [{ id, from, to, body, status, createdAt }] }` |

#### GET /api/messages/:id
**Purpose:** Get message details  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ id, from, to, body, status, attachments, createdAt }` |

#### PUT /api/messages/:id/read
**Purpose:** Mark message as read  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ id, status: "read" }` |

#### DELETE /api/messages/:id
**Purpose:** Delete message  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ success: boolean }` |

#### GET /api/messages/threads
**Purpose:** List message threads  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ threads: [{ id, participants, lastMessage, unreadCount }] }` |

#### GET /api/messages/unread-count
**Purpose:** Get unread message count  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ unreadCount: number }` |

---

### **PERSONAS**

#### GET /api/personas
**Purpose:** List all personas  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ personas: [{ id, name, summary, createdAt }] }` |

#### GET /api/personas/:id
**Purpose:** Get persona details  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ id, name, summary, demographics, behaviors, content }` |

#### POST /api/personas
**Purpose:** Create new persona  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ name, summary? }` |
| **Response** | `{ id, name, summary, createdAt }` |

#### PUT /api/personas/:id
**Purpose:** Update persona  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ name?, summary? }` |
| **Response** | `{ id, name, summary }` |

#### DELETE /api/personas/:id
**Purpose:** Delete persona  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ success: boolean }` |

---

### **KEYWORDS**

#### GET /api/keywords
**Purpose:** List keywords  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | Query: `?campaign={{ID}}` |
| **Response** | `{ keywords: [{ id, keyword, intent, difficulty, searchVolume }] }` |

#### GET /api/keywords/:id
**Purpose:** Get keyword details  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ id, keyword, intent, difficulty, searchVolume, trends }` |

#### POST /api/keywords
**Purpose:** Add keyword  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ keyword, intent, campaignId? }` |
| **Response** | `{ id, keyword, intent }` |

#### PUT /api/keywords/:id
**Purpose:** Update keyword  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ keyword?, intent?, priority? }` |
| **Response** | `{ id, ...updatedFields }` |

#### DELETE /api/keywords/:id
**Purpose:** Delete keyword  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ success: boolean }` |

---

### **JOBS & ASYNC TASKS**

#### GET /api/jobs
**Purpose:** List all jobs (paginated, filterable)  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | Query: `?page=1&limit=10&agent=email` |
| **Response** | `{ data: [{ id, agent, status, createdAt }], pagination: { page, limit, total } }` |

#### GET /api/jobs/:id
**Purpose:** Get job status and results  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ id, agent, status: "pending" | "running" | "completed" | "failed", progress, result?, error? }` |

---

### **MARKETING**

#### GET /api/marketing/overview
**Purpose:** Get marketing overview (campaigns, leads, metrics)  
**Auth:** Required  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ totalCampaigns, totalLeads, recentMetrics: [...] }` |

#### GET /api/marketing/campaigns
**Purpose:** List marketing campaigns  
**Auth:** Required  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ campaigns: [{ id, name, type, status, budget }] }` |

#### POST /api/marketing/campaigns
**Purpose:** Create marketing campaign  
**Auth:** Required  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | `{ name, description?, type, status?, brandId?, budget?, startDate?, endDate? }` |
| **Response** | `{ id, name, type, status }` |

---

### **SETTINGS**

#### GET /api/settings
**Purpose:** Get user settings  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ brandVoice, notifications, privacy, timezone, locale, webhookUrl }` |

#### PUT /api/settings
**Purpose:** Update settings  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ brandVoice?, emailNotifications?, timezone?, locale?, webhookUrl?, webhookSecret? }` |
| **Response** | `{ ...updatedSettings }` |

#### PUT /api/settings/brand-voice
**Purpose:** Update brand voice settings  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ tone?, vocabulary?, values?, personalityTraits? }` |
| **Response** | `{ brandVoice: {...} }` |

#### PUT /api/settings/notifications
**Purpose:** Update notification preferences  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ emailNotifications?, pushNotifications?, notificationFrequency? }` |
| **Response** | `{ emailNotifications, pushNotifications, notificationFrequency }` |

#### PUT /api/settings/privacy
**Purpose:** Update privacy settings  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ dataRetention, allowAnalytics?, allowPersonalization? }` |
| **Response** | `{ dataRetention, allowAnalytics, allowPersonalization }` |

---

### **CONNECTORS**

#### GET /api/connectors
**Purpose:** List available connectors  
**Auth:** Required  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ connectors: [{ name, kind, supported: true/false, auth: "api_key" | "oauth2" }] }` |

#### GET /api/connectors/auth
**Purpose:** List authenticated connector accounts  
**Auth:** Required  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ auths: [{ connectorName, accountId, accountName, status }] }` |

#### POST /api/connectors/:name/auth
**Purpose:** Authenticate connector (OAuth or API key)  
**Auth:** Required  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | `{ apiKey?, apiSecret?, oauthCode?, accountId?, accountName? }` |
| **Response** | `{ success: boolean, accountId, redirectUrl? }` |

#### POST /api/connectors/:name/action
**Purpose:** Execute connector action  
**Auth:** Required  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | `{ input, accountId? }` |
| **Response** | `{ success: boolean, data }` |

#### POST /api/connectors/:name/trigger
**Purpose:** Fire connector trigger  
**Auth:** Required  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | `{ settings?, cursor?, accountId? }` |
| **Response** | `{ items: [...], cursor? }` |

#### DELETE /api/connectors/:name/auth/:accountId
**Purpose:** Remove connector authentication  
**Auth:** Required  
**Status:** PARTIAL

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ success: boolean }` |

---

### **AGENTS** (tRPC)

#### tRPC: agents.execute
**Purpose:** Execute any registered agent (email, seo, social, content, support)  
**Auth:** Required  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | `{ agent: "email" | "seo" | "social" | "content" | "support", intent: string, payload?: unknown }` |
| **Response** | `{ result, jobId?, status }` |

---

### **HEALTH & METRICS**

#### GET /health
**Purpose:** API health check (public)  
**Auth:** Public  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | `{ status: "ok", timestamp, uptime, database, redis }` |

#### GET /metrics
**Purpose:** Prometheus metrics endpoint  
**Auth:** Public (internal only recommended)  
**Status:** DONE

| Type | Shape |
|------|-------|
| **Request** | None |
| **Response** | Prometheus-format metrics (text/plain) |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Total REST Endpoints** | 85+ |
| **Total tRPC Procedures** | 25+ |
| **Protected Endpoints** | 110+ |
| **Public Endpoints** | 3 |
| **DONE Status** | 95+ |
| **PARTIAL Status** | 18 |
| **TODO Status** | 0 |
| **Domains** | 20 |

---

## Implementation Status Key

- **DONE** - Fully implemented, tested, production-ready
- **PARTIAL** - Core functionality implemented, may have gaps or missing features
- **TODO** - Planned or in design phase, not implemented
- **NOT IMPLEMENTED** - Deprecated or will not be built

---

## Notes for Integration Partners

### Request/Response Structure

All REST endpoints follow a consistent pattern:

**Success Response (2xx):**
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "meta": { /* pagination/metadata if applicable */ }
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Pagination

List endpoints support:
- `page` (default: 1)
- `limit` (default: 10, max: 100)

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 500,
    "pages": 50
  }
}
```

### Rate Limiting

- General: 100 requests/minute
- Auth: 10 requests/minute
- Webhooks: No limit (trusted sources)

---

## What's NOT Exposed

This document intentionally excludes:

❌ Internal agent prompts or LLM configurations  
❌ Database schema or Prisma models  
❌ Secret management or encryption details  
❌ Internal business logic or algorithms  
❌ Connector authentication flows  
❌ Queue/worker internals  
❌ Caching strategies  
❌ Admin-only endpoints (except those explicitly marked)  

---

## Questions?

Contact the NeonHub team for clarification on:
- Specific endpoint capabilities or limitations
- Integration timelines or SLAs
- Custom feature development
- Licensing or support terms

---

**Document Version:** 1.0.0  
**Generated:** November 2025  
**Sanitization Level:** Full (safe for external sharing)

