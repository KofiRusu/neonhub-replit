/**
 * SEO Keyword Research Service
 * 
 * AI-powered keyword research with search intent classification,
 * volume analysis, and competitive scoring.
 * 
 * @module services/seo/keyword-research
 * @author Cursor Agent (Neon Autonomous Development Agent)
 * @date 2025-10-27
 */

import { openai } from '@/lib/openai';
import type { PrismaClient } from '@prisma/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';

export interface KeywordMetrics {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  competitionScore: number; // 0-100
  cpc?: number; // Cost per click (indicates commercial intent)
  difficulty: number; // 0-100
  trend: 'rising' | 'stable' | 'declining';
}

export interface KeywordIntent {
  keyword: string;
  intent: SearchIntent;
  confidence: number; // 0-1
  reasoning?: string;
}

export interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  intent: SearchIntent;
  relevanceScore: number; // 0-1
  priority: 'high' | 'medium' | 'low';
}

export interface CompetitorKeyword {
  keyword: string;
  competitor: string;
  position: number;
  searchVolume: number;
  gap: 'high' | 'medium' | 'low'; // Opportunity score
}

// ============================================================================
// KEYWORD RESEARCH SERVICE
// ============================================================================

export class KeywordResearchService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Classify keyword search intent using AI
   * 
   * @example
   * const intent = await service.classifyIntent("how to automate marketing");
   * // { intent: "informational", confidence: 0.95, reasoning: "User seeking knowledge..." }
   */
  async classifyIntent(keyword: string): Promise<KeywordIntent> {
    const prompt = `Classify this keyword into one of four search intent categories:

1. Informational: User seeking knowledge or answers (how-to, what is, guide, tutorial)
2. Navigational: User looking for a specific brand/product (brand name, login, pricing)
3. Commercial: User researching before purchase (best, top, vs, comparison, review)
4. Transactional: User ready to take action (buy, sign up, download, get, subscribe)

Keyword: "${keyword}"

Analyze the keyword and provide:
1. Primary intent category
2. Confidence score (0.0-1.0)
3. Brief reasoning (1-2 sentences)

Output as JSON:
{
  "intent": "informational|navigational|commercial|transactional",
  "confidence": 0.95,
  "reasoning": "Explanation of why this intent was chosen"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO strategist specializing in search intent classification. Analyze keywords accurately and provide confident assessments.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent classification
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        keyword,
        intent: result.intent,
        confidence: result.confidence,
        reasoning: result.reasoning
      };
    } catch (error) {
      console.error(`Error classifying intent for "${keyword}":`, error);
      
      // Fallback: simple heuristic-based classification
      return this.fallbackIntentClassification(keyword);
    }
  }

  /**
   * Classify multiple keywords in batch
   * More efficient than individual calls for large sets
   */
  async classifyIntentBatch(keywords: string[]): Promise<KeywordIntent[]> {
    const prompt = `Classify these keywords into search intent categories:

Keywords:
${keywords.map((k, i) => `${i + 1}. "${k}"`).join('\n')}

Categories:
- informational: User seeking knowledge
- navigational: User looking for specific brand/product
- commercial: User researching before purchase
- transactional: User ready to take action

For each keyword, provide intent and confidence (0.0-1.0).

Output as JSON array:
[
  { "keyword": "keyword 1", "intent": "informational", "confidence": 0.95 },
  { "keyword": "keyword 2", "intent": "commercial", "confidence": 0.88 },
  ...
]`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO strategist. Classify search intent accurately and efficiently.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"results": []}');
      return result.results || result;
    } catch (error) {
      console.error('Error in batch intent classification:', error);
      
      // Fallback to individual classification
      return Promise.all(keywords.map(k => this.classifyIntent(k)));
    }
  }

  /**
   * Generate long-tail keyword variations from a seed keyword
   * 
   * @example
   * const variations = await service.generateLongTail("marketing automation");
   * // ["marketing automation for small business", "best marketing automation tools", ...]
   */
  async generateLongTail(seedKeyword: string, count: number = 20): Promise<string[]> {
    const prompt = `Generate ${count} long-tail keyword variations for: "${seedKeyword}"

Requirements:
- Create natural, search-friendly variations
- Include question formats (how, what, why, when)
- Mix intent types (informational, commercial, transactional)
- Include industry-specific terms (B2B, SaaS, enterprise, small business)
- Avoid keyword stuffing or unnatural phrases

Examples of good long-tail variations:
- "how to automate marketing for small business"
- "best marketing automation software for B2B"
- "marketing automation vs email marketing"
- "free marketing automation tools 2025"

Output as JSON array of strings:
["variation 1", "variation 2", ...]`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert keyword researcher with deep knowledge of SEO and search behavior.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7, // Higher temperature for more variety
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"keywords": []}');
      return result.keywords || result.variations || [];
    } catch (error) {
      console.error(`Error generating long-tail for "${seedKeyword}":`, error);
      return [];
    }
  }

  /**
   * Analyze competitor keywords and identify gaps
   * 
   * @param competitorUrls Array of competitor URLs to analyze
   * @param ourKeywords Keywords we're currently targeting
   * @returns Gaps where competitors rank but we don't
   */
  async findCompetitiveGaps(
    competitorUrls: string[],
    ourKeywords: string[]
  ): Promise<CompetitorKeyword[]> {
    // NOTE: In production, this would integrate with SEMrush/Ahrefs API
    // For now, we'll use AI to simulate competitive analysis
    
    const prompt = `Analyze competitor keywords and identify gaps:

Competitors:
${competitorUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

Our current keywords:
${ourKeywords.join(', ')}

Based on typical marketing automation industry keywords, suggest 10-15 high-value keywords where competitors likely rank but we don't.

Consider:
- Industry-standard terms
- Product comparison keywords
- Feature-specific searches
- Use case keywords
- Integration keywords

Output as JSON array:
[
  {
    "keyword": "suggested keyword",
    "estimatedVolume": 2400,
    "difficulty": 45,
    "intent": "commercial",
    "gap": "high",
    "reasoning": "Why this is a good opportunity"
  },
  ...
]`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert competitive SEO analyst with deep knowledge of the marketing automation industry.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"gaps": []}');
      return result.gaps || result.keywords || [];
    } catch (error) {
      console.error('Error finding competitive gaps:', error);
      return [];
    }
  }

  /**
   * Prioritize keywords based on opportunity score
   * 
   * Formula: (Search Volume / Difficulty) × Intent Weight × Relevance
   */
  async prioritizeKeywords(
    keywords: KeywordMetrics[],
    intents: KeywordIntent[]
  ): Promise<KeywordSuggestion[]> {
    const intentWeights = {
      transactional: 1.0,  // Highest priority (direct conversions)
      commercial: 0.8,     // High priority (comparison, research)
      informational: 0.6,  // Medium priority (awareness, education)
      navigational: 0.4    // Lower priority (brand-specific)
    };

    const suggestions: KeywordSuggestion[] = keywords.map(metric => {
      const intent = intents.find(i => i.keyword === metric.keyword);
      
      // Opportunity score: volume/difficulty ratio
      const opportunityScore = metric.searchVolume / Math.max(metric.difficulty, 1);
      
      // Intent weight
      const intentWeight = intent ? intentWeights[intent.intent] : 0.6;
      
      // Relevance score (would come from semantic similarity in production)
      const relevanceScore = intent?.confidence || 0.7;
      
      // Final priority score
      const priorityScore = opportunityScore * intentWeight * relevanceScore;
      
      // Determine priority tier
      let priority: 'high' | 'medium' | 'low';
      if (priorityScore > 50) priority = 'high';
      else if (priorityScore > 20) priority = 'medium';
      else priority = 'low';

      return {
        keyword: metric.keyword,
        searchVolume: metric.searchVolume,
        difficulty: metric.difficulty,
        intent: intent?.intent || 'informational',
        relevanceScore,
        priority
      };
    });

    // Sort by priority score (high to low)
    return suggestions.sort((a, b) => {
      const scoreA = a.searchVolume / Math.max(a.difficulty, 1) * a.relevanceScore;
      const scoreB = b.searchVolume / Math.max(b.difficulty, 1) * b.relevanceScore;
      return scoreB - scoreA;
    });
  }

  /**
   * Extract keywords from existing content
   * 
   * @param content Page content (HTML or plain text)
   * @returns Extracted keywords with frequency
   */
  async extractKeywords(content: string): Promise<{ keyword: string; frequency: number }[]> {
    const prompt = `Extract the most important keywords and phrases from this content:

Content:
${content.substring(0, 2000)}...

Identify:
- Main topic keywords (1-3 words)
- Important phrases (2-4 words)
- Industry terms
- Product/feature names

Ignore:
- Common stop words (the, and, or, but, etc.)
- Generic terms (thing, stuff, etc.)

Output as JSON array with frequency counts:
[
  { "keyword": "marketing automation", "frequency": 12 },
  { "keyword": "email campaigns", "frequency": 8 },
  ...
]

Limit to top 20 keywords.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content analyst specializing in keyword extraction.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"keywords": []}');
      return result.keywords || [];
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }

  /**
   * Calculate keyword density for SEO analysis
   * 
   * @param content Page content
   * @param keyword Target keyword
   * @returns Density percentage (0-100)
   */
  calculateKeywordDensity(content: string, keyword: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const keywordLower = keyword.toLowerCase();
    
    const keywordCount = words.filter(word => 
      word.includes(keywordLower) || keywordLower.includes(word)
    ).length;
    
    const density = (keywordCount / words.length) * 100;
    return Math.round(density * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Check if keyword density is within optimal range
   * Optimal: 0.5% - 2.5%
   */
  isKeywordDensityOptimal(content: string, keyword: string): {
    density: number;
    optimal: boolean;
    recommendation: string;
  } {
    const density = this.calculateKeywordDensity(content, keyword);
    
    let optimal = true;
    let recommendation = 'Keyword density is optimal';
    
    if (density < 0.5) {
      optimal = false;
      recommendation = 'Keyword density too low. Include the keyword more naturally in the content.';
    } else if (density > 2.5) {
      optimal = false;
      recommendation = 'Keyword density too high. Reduce keyword usage to avoid keyword stuffing.';
    }
    
    return { density, optimal, recommendation };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Fallback intent classification using simple heuristics
   * Used when AI API is unavailable
   */
  private fallbackIntentClassification(keyword: string): KeywordIntent {
    const keywordLower = keyword.toLowerCase();
    
    // Informational indicators
    const informationalPatterns = /^(how|what|why|when|where|guide|tutorial|learn)/;
    if (informationalPatterns.test(keywordLower)) {
      return {
        keyword,
        intent: 'informational',
        confidence: 0.7,
        reasoning: 'Contains question word or educational term'
      };
    }
    
    // Transactional indicators
    const transactionalPatterns = /\b(buy|purchase|order|subscribe|sign up|get|download|free trial)\b/;
    if (transactionalPatterns.test(keywordLower)) {
      return {
        keyword,
        intent: 'transactional',
        confidence: 0.8,
        reasoning: 'Contains action-oriented term indicating purchase intent'
      };
    }
    
    // Commercial indicators
    const commercialPatterns = /\b(best|top|vs|versus|comparison|review|alternative)\b/;
    if (commercialPatterns.test(keywordLower)) {
      return {
        keyword,
        intent: 'commercial',
        confidence: 0.75,
        reasoning: 'Contains comparison or evaluation term'
      };
    }
    
    // Navigational indicators (brand names)
    const navigationalPatterns = /\b(neonhub|zapier|make|n8n|login|pricing|dashboard)\b/;
    if (navigationalPatterns.test(keywordLower)) {
      return {
        keyword,
        intent: 'navigational',
        confidence: 0.85,
        reasoning: 'Contains brand name or site-specific term'
      };
    }
    
    // Default to informational with lower confidence
    return {
      keyword,
      intent: 'informational',
      confidence: 0.5,
      reasoning: 'No clear intent signals detected, defaulting to informational'
    };
  }
}

// ============================================================================
// GOOGLE KEYWORD PLANNER API INTEGRATION (STUB)
// ============================================================================

/**
 * NOTE: This is a stub for future Google Keyword Planner API integration
 * 
 * To implement in production:
 * 1. Sign up for Google Ads API access
 * 2. Install google-ads-api package
 * 3. Configure OAuth2 credentials
 * 4. Implement getSearchVolume() method below
 * 
 * Cost: ~$500/month for API access
 */
export class GoogleKeywordPlannerService {
  /**
   * Get search volume data from Google Keyword Planner API
   * 
   * @param keywords Array of keywords to analyze
   * @param location Geographic location (e.g., 'US', 'UK')
   * @returns Keyword metrics including search volume
   */
  async getSearchVolume(
    keywords: string[],
    _location: string = 'US'
  ): Promise<KeywordMetrics[]> {
    // TODO: Implement Google Ads API integration
    // const api = new GoogleAdsApi({ /* credentials */ });
    // const results = await api.keywordPlanIdeas({ keywords, location });
    
    console.warn('Google Keyword Planner API not yet configured. Returning mock data.');
    
    // Mock data for development
    return keywords.map(keyword => ({
      keyword,
      searchVolume: Math.floor(Math.random() * 5000) + 100,
      competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
      competitionScore: Math.floor(Math.random() * 100),
      cpc: Math.random() * 5 + 0.5,
      difficulty: Math.floor(Math.random() * 100),
      trend: ['rising', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any
    }));
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default KeywordResearchService;
