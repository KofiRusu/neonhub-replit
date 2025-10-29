/**
 * SEO Content Optimization Service
 * 
 * Analyzes content quality, readability, keyword optimization,
 * and E-E-A-T signals. Provides actionable recommendations.
 * 
 * @module services/seo/content-optimizer
 * @author Cursor Agent (Neon Autonomous Development Agent)
 * @date 2025-10-27
 */

import { openai } from '@/lib/openai';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ContentAnalysis {
  wordCount: number;
  readability: ReadabilityScore;
  keywordOptimization: KeywordAnalysis;
  headingStructure: HeadingAnalysis;
  internalLinks: LinkAnalysis;
  images: ImageAnalysis;
  eeat: EEATAnalysis;
  score: number; // Overall content quality score (0-100)
  recommendations: Recommendation[];
}

export interface ReadabilityScore {
  fleschReadingEase: number; // 0-100 (higher is easier)
  fleschKincaidGrade: number; // US grade level
  averageSentenceLength: number;
  averageWordLength: number;
  interpretation: string;
  optimal: boolean;
}

export interface KeywordAnalysis {
  targetKeyword: string;
  density: number; // Percentage
  frequency: number;
  prominence: number; // Position of first occurrence (0-1, lower is better)
  lsiKeywords: string[]; // Latent Semantic Indexing keywords
  optimal: boolean;
}

export interface HeadingAnalysis {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  hasH1: boolean;
  hasMultipleH1: boolean;
  hasLogicalHierarchy: boolean;
  headings: { level: number; text: string; hasKeyword: boolean }[];
  issues: string[];
}

export interface LinkAnalysis {
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
  hasDescriptiveAnchors: boolean;
  anchorTextQuality: number; // 0-100
}

export interface ImageAnalysis {
  totalImages: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  altTextQuality: number; // 0-100
}

export interface EEATAnalysis {
  hasAuthorBio: boolean;
  hasCitations: boolean;
  hasUpdatedDate: boolean;
  hasExpertQuotes: boolean;
  trustSignals: string[];
  score: number; // 0-100
}

export interface Recommendation {
  type: 'critical' | 'important' | 'nice-to-have';
  category: 'readability' | 'keywords' | 'structure' | 'links' | 'images' | 'eeat';
  message: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
}

// ============================================================================
// CONTENT OPTIMIZER SERVICE
// ============================================================================

export class ContentOptimizerService {
  /**
   * Analyze content comprehensively
   * 
   * @param content HTML or plain text content
   * @param targetKeyword Primary keyword to optimize for
   * @returns Complete content analysis with recommendations
   */
  async analyzeContent(content: string, targetKeyword: string): Promise<ContentAnalysis> {
    // Run all analyses in parallel for speed
    const [
      wordCount,
      readability,
      keywordOptimization,
      headingStructure,
      internalLinks,
      images,
      eeat
    ] = await Promise.all([
      this.countWords(content),
      this.calculateReadability(content),
      this.analyzeKeywords(content, targetKeyword),
      this.analyzeHeadings(content),
      this.analyzeLinks(content),
      this.analyzeImages(content),
      this.analyzeEEAT(content)
    ]);

    // Calculate overall score (weighted average)
    const score = this.calculateOverallScore({
      readability,
      keywordOptimization,
      headingStructure,
      internalLinks,
      images,
      eeat
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      wordCount,
      readability,
      keywordOptimization,
      headingStructure,
      internalLinks,
      images,
      eeat
    });

    return {
      wordCount,
      readability,
      keywordOptimization,
      headingStructure,
      internalLinks,
      images,
      eeat,
      score,
      recommendations
    };
  }

  /**
   * Calculate Flesch Reading Ease and Flesch-Kincaid Grade Level
   * 
   * Flesch Reading Ease: 0-100 (higher is easier)
   * - 90-100: Very Easy (5th grade)
   * - 80-89: Easy (6th grade)
   * - 70-79: Fairly Easy (7th grade)
   * - 60-69: Standard (8th-9th grade) ← TARGET
   * - 50-59: Fairly Difficult (10th-12th grade)
   * - 30-49: Difficult (College)
   * - 0-29: Very Difficult (College graduate)
   */
  async calculateReadability(content: string): Promise<ReadabilityScore> {
    // Strip HTML tags
    const plainText = content.replace(/<[^>]*>/g, ' ').trim();
    
    // Count sentences
    const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;
    
    // Count words
    const words = plainText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    // Count syllables (approximation)
    const syllableCount = this.countSyllables(plainText);
    
    // Calculate metrics
    const averageSentenceLength = wordCount / sentenceCount;
    const averageSyllablesPerWord = syllableCount / wordCount;
    const averageWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;
    
    // Flesch Reading Ease: 206.835 - 1.015(words/sentences) - 84.6(syllables/words)
    const fleschReadingEase = 206.835 
      - 1.015 * averageSentenceLength 
      - 84.6 * averageSyllablesPerWord;
    
    // Flesch-Kincaid Grade Level: 0.39(words/sentences) + 11.8(syllables/words) - 15.59
    const fleschKincaidGrade = 0.39 * averageSentenceLength 
      + 11.8 * averageSyllablesPerWord 
      - 15.59;
    
    // Interpretation
    let interpretation = '';
    let optimal = false;
    
    if (fleschReadingEase >= 60 && fleschReadingEase <= 80) {
      interpretation = 'Optimal: Standard reading level (8th-9th grade)';
      optimal = true;
    } else if (fleschReadingEase > 80) {
      interpretation = 'Too easy: Consider adding more depth';
      optimal = false;
    } else if (fleschReadingEase >= 50) {
      interpretation = 'Acceptable: Fairly difficult (10th-12th grade)';
      optimal = true;
    } else {
      interpretation = 'Too difficult: Simplify language and sentence structure';
      optimal = false;
    }
    
    return {
      fleschReadingEase: Math.round(fleschReadingEase * 100) / 100,
      fleschKincaidGrade: Math.round(fleschKincaidGrade * 100) / 100,
      averageSentenceLength: Math.round(averageSentenceLength * 100) / 100,
      averageWordLength: Math.round(averageWordLength * 100) / 100,
      interpretation,
      optimal
    };
  }

  /**
   * Analyze keyword optimization
   */
  async analyzeKeywords(content: string, targetKeyword: string): Promise<KeywordAnalysis> {
    const plainText = content.replace(/<[^>]*>/g, ' ').toLowerCase();
    const keywordLower = targetKeyword.toLowerCase();
    
    // Count word occurrences
    const words = plainText.split(/\s+/);
    const frequency = words.filter(w => w.includes(keywordLower) || keywordLower.includes(w)).length;
    
    // Calculate density (ideal: 0.5% - 2.5%)
    const density = (frequency / words.length) * 100;
    
    // Calculate prominence (position of first occurrence)
    const firstOccurrence = plainText.indexOf(keywordLower);
    const prominence = firstOccurrence / plainText.length;
    
    // Extract LSI keywords using AI
    const lsiKeywords = await this.extractLSIKeywords(content, targetKeyword);
    
    // Check if optimal (density between 0.5% and 2.5%, prominence in first 20%)
    const optimal = density >= 0.5 && density <= 2.5 && prominence <= 0.2;
    
    return {
      targetKeyword,
      density: Math.round(density * 100) / 100,
      frequency,
      prominence: Math.round(prominence * 100) / 100,
      lsiKeywords,
      optimal
    };
  }

  /**
   * Analyze heading structure (H1, H2, H3 hierarchy)
   */
  async analyzeHeadings(content: string): Promise<HeadingAnalysis> {
    const h1Matches: string[] = content.match(/<h1[^>]*>(.*?)<\/h1>/gi) ?? [];
    const h2Matches: string[] = content.match(/<h2[^>]*>(.*?)<\/h2>/gi) ?? [];
    const h3Matches: string[] = content.match(/<h3[^>]*>(.*?)<\/h3>/gi) ?? [];
    
    const h1Count = h1Matches.length;
    const h2Count = h2Matches.length;
    const h3Count = h3Matches.length;
    
    const hasH1 = h1Count > 0;
    const hasMultipleH1 = h1Count > 1;
    
    // Extract heading texts
    const headings: { level: number; text: string; hasKeyword: boolean }[] = [];
    
    [1, 2, 3].forEach(level => {
      const matches: string[] = content.match(new RegExp(`<h${level}[^>]*>(.*?)<\/h${level}>`, 'gi')) ?? [];
      matches.forEach((match) => {
        const text = match.replace(/<[^>]*>/g, '').trim();
        headings.push({
          level,
          text,
          hasKeyword: text.toLowerCase().includes('keyword') // Will be replaced with actual keyword check
        });
      });
    });
    
    // Check logical hierarchy
    const hasLogicalHierarchy = this.checkHeadingHierarchy(headings);
    
    // Identify issues
    const issues: string[] = [];
    if (!hasH1) issues.push('Missing H1 tag');
    if (hasMultipleH1) issues.push(`Multiple H1 tags found (${h1Count})`);
    if (!hasLogicalHierarchy) issues.push('Heading hierarchy is not logical (skipped levels)');
    if (h2Count === 0) issues.push('No H2 tags found - add subheadings');
    
    return {
      h1Count,
      h2Count,
      h3Count,
      hasH1,
      hasMultipleH1,
      hasLogicalHierarchy,
      headings,
      issues
    };
  }

  /**
   * Analyze internal and external links
   */
  async analyzeLinks(content: string): Promise<LinkAnalysis> {
    const linkMatches: string[] = content.match(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi) ?? [];
    
    let internalLinks = 0;
    let externalLinks = 0;
    let hasDescriptiveAnchors = true;
    const genericAnchors = ['click here', 'read more', 'here', 'link', 'this'];
    
    linkMatches.forEach(link => {
      // Check if internal or external
      if (link.includes('href="/"') || link.includes('href="/') || !link.includes('href="http')) {
        internalLinks++;
      } else {
        externalLinks++;
      }
      
      // Check anchor text quality
      const anchorText = link.replace(/<[^>]*>/g, '').toLowerCase().trim();
      if (genericAnchors.includes(anchorText)) {
        hasDescriptiveAnchors = false;
      }
    });
    
    // Anchor text quality score
    const anchorTextQuality = hasDescriptiveAnchors ? 100 : 60;
    
    return {
      internalLinks,
      externalLinks,
      brokenLinks: 0, // Would require actual link checking
      hasDescriptiveAnchors,
      anchorTextQuality
    };
  }

  /**
   * Analyze images and alt text
   */
  async analyzeImages(content: string): Promise<ImageAnalysis> {
    const imageMatches: string[] = content.match(/<img[^>]+>/gi) ?? [];
    const totalImages = imageMatches.length;
    
    let imagesWithAlt = 0;
    let goodAltTexts = 0;
    
    imageMatches.forEach(img => {
      const altMatch = img.match(/alt=["']([^"']*)["']/i);
      if (altMatch && altMatch[1].trim().length > 0) {
        imagesWithAlt++;
        
        // Check alt text quality (not just filename, has meaningful description)
        const altText = altMatch[1].toLowerCase();
        if (!altText.includes('.jpg') && !altText.includes('.png') && altText.split(' ').length >= 3) {
          goodAltTexts++;
        }
      }
    });
    
    const imagesWithoutAlt = totalImages - imagesWithAlt;
    const altTextQuality = totalImages > 0 ? (goodAltTexts / totalImages) * 100 : 100;
    
    return {
      totalImages,
      imagesWithAlt,
      imagesWithoutAlt,
      altTextQuality: Math.round(altTextQuality)
    };
  }

  /**
   * Analyze E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)
   */
  async analyzeEEAT(content: string): Promise<EEATAnalysis> {
    const contentLower = content.toLowerCase();
    
    // Check for E-E-A-T signals
    const hasAuthorBio = contentLower.includes('author') || contentLower.includes('written by');
    const hasCitations = contentLower.includes('source:') || contentLower.includes('reference:') || contentLower.includes('study');
    const hasUpdatedDate = contentLower.includes('updated') || contentLower.includes('last modified');
    const hasExpertQuotes = contentLower.includes('expert') || contentLower.includes('according to');
    
    // Identify trust signals
    const trustSignals: string[] = [];
    if (hasAuthorBio) trustSignals.push('Author bio present');
    if (hasCitations) trustSignals.push('Citations included');
    if (hasUpdatedDate) trustSignals.push('Updated date shown');
    if (hasExpertQuotes) trustSignals.push('Expert quotes included');
    
    // Calculate E-E-A-T score
    let score = 0;
    if (hasAuthorBio) score += 25;
    if (hasCitations) score += 25;
    if (hasUpdatedDate) score += 25;
    if (hasExpertQuotes) score += 25;
    
    return {
      hasAuthorBio,
      hasCitations,
      hasUpdatedDate,
      hasExpertQuotes,
      trustSignals,
      score
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private countWords(content: string): number {
    const plainText = content.replace(/<[^>]*>/g, ' ');
    const words = plainText.split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }

  private countSyllables(text: string): number {
    // Simplified syllable counting (vowel groups)
    const words = text.toLowerCase().split(/\s+/);
    let syllables = 0;
    
    words.forEach(word => {
      word = word.replace(/[^a-z]/g, '');
      if (word.length === 0) return;
      
      // Count vowel groups
      const vowelGroups = word.match(/[aeiouy]+/g);
      syllables += vowelGroups ? vowelGroups.length : 1;
      
      // Adjust for silent 'e'
      if (word.endsWith('e')) syllables--;
      
      // Each word has at least one syllable
      if (syllables < 1) syllables = 1;
    });
    
    return syllables;
  }

  private async extractLSIKeywords(content: string, targetKeyword: string): Promise<string[]> {
    const prompt = `Extract 5-10 Latent Semantic Indexing (LSI) keywords from this content that are semantically related to the target keyword "${targetKeyword}".

LSI keywords are terms and phrases that commonly appear together with the target keyword in high-quality content.

Content:
${content.substring(0, 1000)}...

Output as JSON array:
["lsi keyword 1", "lsi keyword 2", ...]`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO analyst specializing in semantic keyword research.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"keywords": []}');
      return result.keywords || [];
    } catch (error) {
      console.error('Error extracting LSI keywords:', error);
      return [];
    }
  }

  private checkHeadingHierarchy(headings: { level: number; text: string }[]): boolean {
    let prevLevel = 0;
    
    for (const heading of headings) {
      // Check if we skip levels (e.g., H1 → H3 without H2)
      if (heading.level > prevLevel + 1 && prevLevel !== 0) {
        return false;
      }
      prevLevel = heading.level;
    }
    
    return true;
  }

  private calculateOverallScore(analysis: {
    readability: ReadabilityScore;
    keywordOptimization: KeywordAnalysis;
    headingStructure: HeadingAnalysis;
    internalLinks: LinkAnalysis;
    images: ImageAnalysis;
    eeat: EEATAnalysis;
  }): number {
    // Weighted scoring
    const weights = {
      readability: 0.20,
      keywords: 0.25,
      headings: 0.15,
      links: 0.10,
      images: 0.10,
      eeat: 0.20
    };
    
    const scores = {
      readability: analysis.readability.optimal ? 100 : 60,
      keywords: analysis.keywordOptimization.optimal ? 100 : 50,
      headings: analysis.headingStructure.issues.length === 0 ? 100 : Math.max(0, 100 - analysis.headingStructure.issues.length * 20),
      links: analysis.internalLinks.anchorTextQuality,
      images: analysis.images.altTextQuality,
      eeat: analysis.eeat.score
    };
    
    const overallScore = 
      scores.readability * weights.readability +
      scores.keywords * weights.keywords +
      scores.headings * weights.headings +
      scores.links * weights.links +
      scores.images * weights.images +
      scores.eeat * weights.eeat;
    
    return Math.round(overallScore);
  }

  private generateRecommendations(data: {
    wordCount: number;
    readability: ReadabilityScore;
    keywordOptimization: KeywordAnalysis;
    headingStructure: HeadingAnalysis;
    internalLinks: LinkAnalysis;
    images: ImageAnalysis;
    eeat: EEATAnalysis;
  }): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Word count recommendations
    if (data.wordCount < 300) {
      recommendations.push({
        type: 'critical',
        category: 'readability',
        message: `Content is too short (${data.wordCount} words). Aim for at least 300 words for better SEO.`,
        impact: 'high',
        effort: 'medium'
      });
    } else if (data.wordCount < 1000) {
      recommendations.push({
        type: 'important',
        category: 'readability',
        message: `Consider expanding content to 1,000+ words for better depth and ranking potential.`,
        impact: 'medium',
        effort: 'hard'
      });
    }
    
    // Readability recommendations
    if (!data.readability.optimal) {
      recommendations.push({
        type: 'important',
        category: 'readability',
        message: `${data.readability.interpretation}. Current Flesch score: ${data.readability.fleschReadingEase}`,
        impact: 'medium',
        effort: 'medium'
      });
    }
    
    // Keyword recommendations
    if (!data.keywordOptimization.optimal) {
      if (data.keywordOptimization.density < 0.5) {
        recommendations.push({
          type: 'important',
          category: 'keywords',
          message: `Keyword density too low (${data.keywordOptimization.density}%). Include "${data.keywordOptimization.targetKeyword}" more naturally.`,
          impact: 'high',
          effort: 'easy'
        });
      } else if (data.keywordOptimization.density > 2.5) {
        recommendations.push({
          type: 'critical',
          category: 'keywords',
          message: `Keyword density too high (${data.keywordOptimization.density}%). Risk of keyword stuffing. Reduce usage.`,
          impact: 'high',
          effort: 'medium'
        });
      }
      
      if (data.keywordOptimization.prominence > 0.2) {
        recommendations.push({
          type: 'important',
          category: 'keywords',
          message: `Target keyword appears late in content. Move closer to the beginning.`,
          impact: 'medium',
          effort: 'easy'
        });
      }
    }
    
    // Heading recommendations
    data.headingStructure.issues.forEach(issue => {
      recommendations.push({
        type: issue.includes('Missing H1') ? 'critical' : 'important',
        category: 'structure',
        message: issue,
        impact: issue.includes('Missing H1') ? 'high' : 'medium',
        effort: 'easy'
      });
    });
    
    // Link recommendations
    if (data.internalLinks.internalLinks < 3) {
      recommendations.push({
        type: 'important',
        category: 'links',
        message: `Add more internal links (current: ${data.internalLinks.internalLinks}). Aim for 3-5 relevant links.`,
        impact: 'medium',
        effort: 'medium'
      });
    }
    
    if (!data.internalLinks.hasDescriptiveAnchors) {
      recommendations.push({
        type: 'important',
        category: 'links',
        message: 'Use descriptive anchor text. Avoid generic phrases like "click here" or "read more".',
        impact: 'medium',
        effort: 'easy'
      });
    }
    
    // Image recommendations
    if (data.images.imagesWithoutAlt > 0) {
      recommendations.push({
        type: 'critical',
        category: 'images',
        message: `${data.images.imagesWithoutAlt} image(s) missing alt text. Add descriptive alt text for accessibility and SEO.`,
        impact: 'high',
        effort: 'easy'
      });
    }
    
    if (data.images.altTextQuality < 70) {
      recommendations.push({
        type: 'important',
        category: 'images',
        message: 'Improve alt text quality. Use descriptive phrases (3-10 words) instead of filenames.',
        impact: 'medium',
        effort: 'easy'
      });
    }
    
    // E-E-A-T recommendations
    if (!data.eeat.hasAuthorBio) {
      recommendations.push({
        type: 'important',
        category: 'eeat',
        message: 'Add author bio with credentials to establish expertise and authority.',
        impact: 'medium',
        effort: 'easy'
      });
    }
    
    if (!data.eeat.hasCitations) {
      recommendations.push({
        type: 'important',
        category: 'eeat',
        message: 'Include citations and references to credible sources to build trust.',
        impact: 'medium',
        effort: 'medium'
      });
    }
    
    if (!data.eeat.hasUpdatedDate) {
      recommendations.push({
        type: 'nice-to-have',
        category: 'eeat',
        message: 'Add "Updated: [date]" to show content freshness.',
        impact: 'low',
        effort: 'easy'
      });
    }
    
    // Sort by impact and type
    return recommendations.sort((a, b) => {
      const typeOrder = { critical: 0, important: 1, 'nice-to-have': 2 };
      const impactOrder = { high: 0, medium: 1, low: 2 };
      
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ContentOptimizerService;
