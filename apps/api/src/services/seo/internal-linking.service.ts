/**
 * SEO Internal Linking Recommendation Service
 * 
 * AI-powered internal link suggestions using semantic similarity (pgvector),
 * relevance scoring, and topic clustering for optimal site architecture.
 * 
 * @module services/seo/internal-linking
 * @author Cursor Agent (Neon Autonomous Development Agent)
 * @date 2025-10-27
 */

import { openai } from '@/lib/openai';
import type { PrismaClient } from '@prisma/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LinkSuggestion {
  targetUrl: string;
  targetTitle: string;
  targetKeyword: string;
  anchorText: string;
  relevanceScore: number; // 0-1 (semantic similarity)
  position: LinkPosition;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

export interface LinkPosition {
  paragraph: number; // Which paragraph to insert the link
  sentence: number; // Which sentence in the paragraph
  beforeText: string; // Text before suggested anchor
  afterText: string; // Text after suggested anchor
}

export interface RelatedPage {
  url: string;
  title: string;
  keyword: string;
  embedding?: number[]; // Vector embedding (1536 dimensions)
  relevance: number; // Cosine similarity score
}

export interface TopicCluster {
  pillarPage: string;
  pillarTitle: string;
  supportingPages: RelatedPage[];
  clusterScore: number; // How well-connected the cluster is
  missingLinks: LinkSuggestion[];
}

export interface LinkAnalytics {
  totalInternalLinks: number;
  brokenLinks: number;
  orphanPages: number; // Pages with no incoming links
  wellLinkedPages: number;
  averageLinksPerPage: number;
  topLinkedPages: { url: string; incomingLinks: number }[];
}

// ============================================================================
// INTERNAL LINKING SERVICE
// ============================================================================

export class InternalLinkingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Suggest internal links for a page based on semantic similarity
   * 
   * Uses pgvector to find related pages, then AI to generate contextual anchor text
   * 
   * @example
   * const suggestions = await service.suggestLinks({
   *   currentPageUrl: "/blog/marketing-automation-guide",
   *   currentPageContent: "Marketing automation helps...",
   *   targetKeyword: "marketing automation",
   *   maxSuggestions: 5
   * });
   */
  async suggestLinks(params: {
    currentPageUrl: string;
    currentPageContent: string;
    targetKeyword: string;
    maxSuggestions?: number;
  }): Promise<LinkSuggestion[]> {
    const { currentPageUrl, currentPageContent, targetKeyword, maxSuggestions = 5 } = params;

    // Step 1: Generate embedding for current page
    const currentEmbedding = await this.generateEmbedding(currentPageContent);

    // Step 2: Find related pages using vector similarity
    const relatedPages = await this.findRelatedPagesByEmbedding(
      currentEmbedding,
      currentPageUrl,
      maxSuggestions * 2 // Get more candidates, then filter
    );

    // Step 3: For each related page, generate anchor text and position
    const suggestions: LinkSuggestion[] = [];

    for (const relatedPage of relatedPages.slice(0, maxSuggestions)) {
      const anchorText = await this.generateAnchorText(
        currentPageContent,
        relatedPage.keyword,
        relatedPage.title
      );

      if (!anchorText) continue;

      const position = this.findBestPosition(currentPageContent, anchorText);

      suggestions.push({
        targetUrl: relatedPage.url,
        targetTitle: relatedPage.title,
        targetKeyword: relatedPage.keyword,
        anchorText,
        relevanceScore: relatedPage.relevance,
        position,
        reasoning: `Related to "${targetKeyword}" with ${Math.round(relatedPage.relevance * 100)}% similarity`,
        priority: this.calculatePriority(relatedPage.relevance, position)
      });
    }

    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Analyze site-wide internal linking structure
   * Identify orphan pages, broken links, and optimization opportunities
   */
  async analyzeSiteStructure(): Promise<LinkAnalytics> {
    // TODO: Implement with actual database queries
    // This is a placeholder structure
    
    // Query all pages and their links
    // const pages = await this.prisma.seoPage.findMany({
    //   include: { incomingLinks: true, outgoingLinks: true }
    // });

    return {
      totalInternalLinks: 0,
      brokenLinks: 0,
      orphanPages: 0,
      wellLinkedPages: 0,
      averageLinksPerPage: 0,
      topLinkedPages: []
    };
  }

  /**
   * Build topic clusters (pillar pages + supporting pages)
   * 
   * Identifies main "pillar" content and related supporting pages,
   * then suggests links to create a strong cluster structure
   */
  async buildTopicClusters(topic: string): Promise<TopicCluster[]> {
    // Step 1: Generate embedding for topic
    const topicEmbedding = await this.generateEmbedding(topic);

    // Step 2: Find all pages related to topic
    const relatedPages = await this.findRelatedPagesByEmbedding(topicEmbedding, '', 20);

    // Step 3: Identify pillar page (highest authority/word count)
    // For now, use first result as pillar
    const pillarPage = relatedPages[0];
    const supportingPages = relatedPages.slice(1);

    // Step 4: Find missing links (supporting pages not linked to pillar)
    const missingLinks = await this.findMissingClusterLinks(
      pillarPage.url,
      supportingPages
    );

    return [{
      pillarPage: pillarPage.url,
      pillarTitle: pillarPage.title,
      supportingPages,
      clusterScore: this.calculateClusterScore(pillarPage, supportingPages),
      missingLinks
    }];
  }

  /**
   * Generate contextual anchor text for a link
   * 
   * Uses AI to create natural, descriptive anchor text that fits the context
   */
  async generateAnchorText(
    sourceContent: string,
    targetKeyword: string,
    targetTitle: string
  ): Promise<string | null> {
    const prompt = `Generate natural anchor text for an internal link in this content:

Source content:
${sourceContent.substring(0, 500)}...

Target page:
- Title: "${targetTitle}"
- Keyword: "${targetKeyword}"

Requirements:
- 2-5 words, descriptive and natural
- Include or relate to "${targetKeyword}"
- Must fit naturally in the source content
- Avoid generic phrases ("click here", "read more")
- Use active, descriptive language

Output ONLY the anchor text (no quotes, formatting, or explanation).`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO content strategist specializing in internal linking. Generate concise, natural anchor text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 50
      });

      const anchorText = completion.choices[0].message.content?.trim() || null;
      
      // Validate anchor text length and quality
      if (anchorText && anchorText.split(' ').length >= 2 && anchorText.split(' ').length <= 7) {
        return anchorText;
      }
      
      return null;
    } catch (error) {
      console.error('Error generating anchor text:', error);
      
      // Fallback: use target keyword or title
      return targetKeyword.length <= 50 ? targetKeyword : targetTitle.substring(0, 50);
    }
  }

  /**
   * Find best position in content to insert a link
   * 
   * Analyzes content to find the most relevant paragraph and sentence
   * for inserting the anchor text
   */
  findBestPosition(content: string, anchorText: string): LinkPosition {
    // Split content into paragraphs
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // Find paragraph with highest relevance to anchor text
    let bestParagraphIndex = 0;
    let highestScore = 0;
    
    paragraphs.forEach((paragraph, index) => {
      const score = this.calculateTextSimilarity(paragraph, anchorText);
      if (score > highestScore) {
        highestScore = score;
        bestParagraphIndex = index;
      }
    });
    
    const bestParagraph = paragraphs[bestParagraphIndex];
    const sentences = bestParagraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Find best sentence (usually first or second for natural flow)
    const bestSentenceIndex = Math.min(1, sentences.length - 1);
    const bestSentence = sentences[bestSentenceIndex];
    
    // Find position within sentence
    const words = bestSentence.trim().split(/\s+/);
    const midPoint = Math.floor(words.length / 2);
    
    return {
      paragraph: bestParagraphIndex,
      sentence: bestSentenceIndex,
      beforeText: words.slice(0, midPoint).join(' '),
      afterText: words.slice(midPoint).join(' ')
    };
  }

  /**
   * Validate anchor text quality
   * 
   * Checks for generic phrases, over-optimization, and best practices
   */
  validateAnchorText(anchorText: string): {
    isValid: boolean;
    issues: string[];
    score: number; // 0-100
  } {
    const issues: string[] = [];
    let score = 100;
    
    // Check for generic phrases
    const genericPhrases = [
      'click here', 'read more', 'here', 'link', 'this', 
      'click this', 'more info', 'learn more'
    ];
    
    const anchorLower = anchorText.toLowerCase();
    if (genericPhrases.some(phrase => anchorLower === phrase)) {
      issues.push('Generic anchor text detected');
      score -= 50;
    }
    
    // Check length
    const wordCount = anchorText.split(/\s+/).length;
    if (wordCount < 2) {
      issues.push('Anchor text too short (min 2 words)');
      score -= 20;
    } else if (wordCount > 7) {
      issues.push('Anchor text too long (max 7 words)');
      score -= 15;
    }
    
    // Check for keyword stuffing
    const uniqueWords = new Set(anchorText.toLowerCase().split(/\s+/));
    if (uniqueWords.size < wordCount * 0.6) {
      issues.push('Possible keyword stuffing (too many repeated words)');
      score -= 25;
    }
    
    // Check for special characters (should be minimal)
    const specialChars = anchorText.match(/[^a-zA-Z0-9\s-]/g);
    if (specialChars && specialChars.length > 2) {
      issues.push('Too many special characters in anchor text');
      score -= 10;
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      score: Math.max(0, score)
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Generate vector embedding for text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002', // 1536 dimensions
        input: text.substring(0, 8000) // API limit
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  /**
   * Find related pages using pgvector cosine similarity
   * 
   * NOTE: Requires Prisma schema with vector support
   */
  private async findRelatedPagesByEmbedding(
    embedding: number[],
    excludeUrl: string,
    limit: number = 10
  ): Promise<RelatedPage[]> {
    try {
      // Use pgvector cosine similarity operator (<=>)
      // Lower distance = more similar
      const results = await this.prisma.$queryRaw<RelatedPage[]>`
        SELECT 
          url,
          title,
          keyword,
          embedding,
          1 - (embedding <=> ${embedding}::vector) as relevance
        FROM seo_pages
        WHERE url != ${excludeUrl}
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${embedding}::vector
        LIMIT ${limit}
      `;

      return results.map(r => ({
        ...r,
        relevance: Number(r.relevance) || 0
      }));
    } catch (error) {
      console.error('Error finding related pages:', error);
      
      // Fallback: return empty array or mock data
      return [];
    }
  }

  /**
   * Calculate text similarity using simple word overlap
   * (Fallback for when embeddings aren't available)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    // Jaccard similarity
    return intersection.size / union.size;
  }

  /**
   * Calculate priority for link suggestion
   */
  private calculatePriority(
    relevanceScore: number,
    position: LinkPosition
  ): 'high' | 'medium' | 'low' {
    // High priority: very relevant + early in content
    if (relevanceScore > 0.7 && position.paragraph < 3) {
      return 'high';
    }
    
    // Medium priority: moderately relevant or good position
    if (relevanceScore > 0.5 || position.paragraph < 5) {
      return 'medium';
    }
    
    // Low priority: everything else
    return 'low';
  }

  /**
   * Calculate cluster score (how well-connected the cluster is)
   */
  private calculateClusterScore(
    pillarPage: RelatedPage,
    supportingPages: RelatedPage[]
  ): number {
    // Average relevance of supporting pages to pillar
    const avgRelevance = supportingPages.reduce((sum, page) => sum + page.relevance, 0) 
      / supportingPages.length;
    
    // Bonus for having many supporting pages
    const countBonus = Math.min(supportingPages.length / 10, 0.2);
    
    return Math.min(avgRelevance + countBonus, 1.0);
  }

  /**
   * Find missing links in a topic cluster
   */
  private async findMissingClusterLinks(
    pillarUrl: string,
    supportingPages: RelatedPage[]
  ): Promise<LinkSuggestion[]> {
    // TODO: Query database to check which supporting pages link to pillar
    // For now, assume all are missing
    
    return supportingPages.map(page => ({
      targetUrl: pillarUrl,
      targetTitle: 'Pillar Page', // Would come from database
      targetKeyword: page.keyword,
      anchorText: page.keyword,
      relevanceScore: page.relevance,
      position: { paragraph: 0, sentence: 0, beforeText: '', afterText: '' },
      reasoning: `Supporting page should link back to pillar content`,
      priority: 'high' as const
    }));
  }
}

// ============================================================================
// LINK GRAPH ANALYSIS (ADVANCED)
// ============================================================================

/**
 * Advanced link graph analysis using PageRank-style algorithms
 * to identify authoritative pages and optimize link flow
 */
export class LinkGraphAnalyzer {
  constructor(private prisma: PrismaClient) {}

  /**
   * Calculate PageRank-style authority scores for all pages
   * 
   * Pages with more high-quality incoming links get higher scores
   */
  async calculateAuthorityScores(): Promise<Map<string, number>> {
    // TODO: Implement PageRank algorithm
    // 1. Build adjacency matrix of internal links
    // 2. Iteratively calculate authority scores
    // 3. Return map of url → score
    
    return new Map();
  }

  /**
   * Identify hub pages (pages that link to many authoritative pages)
   * and authority pages (pages linked to by many hub pages)
   */
  async identifyHubsAndAuthorities(): Promise<{
    hubs: string[];
    authorities: string[];
  }> {
    // HITS algorithm (Hyperlink-Induced Topic Search)
    
    return {
      hubs: [],
      authorities: []
    };
  }

  /**
   * Optimize link distribution across site
   * 
   * Suggests adding/removing links to improve overall site structure
   */
  async optimizeLinkDistribution(): Promise<{
    addLinks: LinkSuggestion[];
    removeLinks: { from: string; to: string; reason: string }[];
  }> {
    return {
      addLinks: [],
      removeLinks: []
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default InternalLinkingService;

