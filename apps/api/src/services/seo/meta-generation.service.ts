/**
 * SEO Meta Tag Generation Service
 * 
 * AI-powered title and meta description generation with validation,
 * A/B testing suggestions, and optimization recommendations.
 * 
 * @module services/seo/meta-generation
 * @author Cursor Agent (Neon Autonomous Development Agent)
 * @date 2025-10-27
 */

import { openai } from '@/lib/openai';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MetaTagRequirements {
  keyword: string;
  pageType: 'homepage' | 'product' | 'blog' | 'docs' | 'landing' | 'comparison';
  pageContent?: string;
  brand?: string;
  targetAudience?: string;
  uniqueSellingPoint?: string;
}

export interface GeneratedTitle {
  title: string;
  length: number;
  keywordPosition: number; // Position of keyword (0-based)
  score: number; // 0-100 quality score
  warnings: string[];
}

export interface GeneratedDescription {
  description: string;
  length: number;
  hasCTA: boolean;
  hasKeyword: boolean;
  score: number; // 0-100 quality score
  warnings: string[];
}

export interface MetaTags {
  title: GeneratedTitle;
  description: GeneratedDescription;
  alternatives?: {
    titles: GeneratedTitle[];
    descriptions: GeneratedDescription[];
  };
}

export interface MetaValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TITLE_MIN_LENGTH = 30;
const TITLE_MAX_LENGTH = 60;
const TITLE_IDEAL_LENGTH = 55;

const DESCRIPTION_MIN_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 160;
const DESCRIPTION_IDEAL_LENGTH = 155;

const COMMON_CTA_PHRASES = [
  'Learn more',
  'Get started',
  'Try free',
  'Sign up',
  'Discover',
  'Explore',
  'Start today',
  'Join now',
  'See how'
];

// ============================================================================
// META GENERATION SERVICE
// ============================================================================

export class MetaGenerationService {
  /**
   * Generate optimized title tag
   * 
   * @example
   * const title = await service.generateTitle({
   *   keyword: "marketing automation",
   *   pageType: "product",
   *   brand: "NeonHub",
   *   uniqueSellingPoint: "AI-powered workflow automation"
   * });
   */
  async generateTitle(requirements: MetaTagRequirements): Promise<GeneratedTitle> {
    const prompt = this.buildTitlePrompt(requirements);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert SEO copywriter specializing in crafting high-converting title tags.

Best practices:
- Include target keyword at the beginning (first 3-5 words)
- Keep length between ${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH} characters (ideal: ${TITLE_IDEAL_LENGTH})
- Make it compelling and click-worthy
- Include brand name at the end (unless homepage)
- Use power words (best, ultimate, proven, easy, fast)
- Avoid clickbait or misleading claims
- Match user search intent

Output ONLY the title tag text (no quotes, formatting, or explanation).`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7, // Balanced creativity and consistency
        max_tokens: 100
      });

      const titleText = completion.choices[0].message.content?.trim() || '';
      return this.validateAndScoreTitle(titleText, requirements.keyword);
    } catch (error) {
      console.error('Error generating title:', error);
      
      // Fallback to template-based generation
      return this.generateTitleFallback(requirements);
    }
  }

  /**
   * Generate multiple title variations for A/B testing
   * 
   * @param count Number of variations to generate (2-5 recommended)
   */
  async generateTitleVariations(
    requirements: MetaTagRequirements,
    count: number = 3
  ): Promise<GeneratedTitle[]> {
    const prompt = this.buildTitlePrompt(requirements);
    const variationPrompt = `${prompt}

Generate ${count} different variations:
1. One optimized for CTR (click-through rate) - emotional, compelling
2. One optimized for SEO - keyword-rich, descriptive
3. One balanced - combines both approaches

Output as JSON array:
["title variation 1", "title variation 2", "title variation 3"]`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO copywriter. Generate diverse title variations optimized for different goals.'
          },
          { role: 'user', content: variationPrompt }
        ],
        temperature: 0.8, // Higher temperature for more variety
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"titles": []}');
      const titles = result.titles || result.variations || [];
      
      return titles.map((title: string) => 
        this.validateAndScoreTitle(title, requirements.keyword)
      );
    } catch (error) {
      console.error('Error generating title variations:', error);
      
      // Fallback: generate single title
      const single = await this.generateTitle(requirements);
      return [single];
    }
  }

  /**
   * Generate optimized meta description
   * 
   * @example
   * const description = await service.generateDescription({
   *   keyword: "marketing automation",
   *   pageType: "product",
   *   pageContent: "NeonHub helps you automate...",
   *   targetAudience: "small business owners"
   * });
   */
  async generateDescription(requirements: MetaTagRequirements): Promise<GeneratedDescription> {
    const prompt = this.buildDescriptionPrompt(requirements);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert SEO copywriter specializing in meta descriptions.

Best practices:
- Include target keyword naturally (not at the very beginning)
- Keep length between ${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH} characters (ideal: ${DESCRIPTION_IDEAL_LENGTH})
- Include a clear call-to-action (CTA)
- Highlight unique value proposition
- Address user's pain point or desire
- Use active voice
- Avoid duplicate content across pages
- Don't stuff keywords

Output ONLY the meta description text (no quotes or formatting).`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      const descriptionText = completion.choices[0].message.content?.trim() || '';
      return this.validateAndScoreDescription(descriptionText, requirements.keyword);
    } catch (error) {
      console.error('Error generating description:', error);
      
      // Fallback to template-based generation
      return this.generateDescriptionFallback(requirements);
    }
  }

  /**
   * Generate multiple description variations for A/B testing
   */
  async generateDescriptionVariations(
    requirements: MetaTagRequirements,
    count: number = 3
  ): Promise<GeneratedDescription[]> {
    const prompt = this.buildDescriptionPrompt(requirements);
    const variationPrompt = `${prompt}

Generate ${count} different variations:
1. One focused on benefits - "what's in it for me"
2. One focused on features - specific capabilities
3. One focused on social proof - trust signals

Output as JSON array:
["description 1", "description 2", "description 3"]`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO copywriter. Generate diverse meta description variations.'
          },
          { role: 'user', content: variationPrompt }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"descriptions": []}');
      const descriptions = result.descriptions || result.variations || [];
      
      return descriptions.map((desc: string) => 
        this.validateAndScoreDescription(desc, requirements.keyword)
      );
    } catch (error) {
      console.error('Error generating description variations:', error);
      
      // Fallback: generate single description
      const single = await this.generateDescription(requirements);
      return [single];
    }
  }

  /**
   * Generate complete meta tags (title + description) in one call
   */
  async generateMetaTags(requirements: MetaTagRequirements): Promise<MetaTags> {
    const [title, description] = await Promise.all([
      this.generateTitle(requirements),
      this.generateDescription(requirements)
    ]);

    return { title, description };
  }

  /**
   * Generate meta tags with A/B testing alternatives
   */
  async generateMetaTagsWithAlternatives(
    requirements: MetaTagRequirements,
    variationCount: number = 3
  ): Promise<MetaTags> {
    const [title, description, titleAlts, descriptionAlts] = await Promise.all([
      this.generateTitle(requirements),
      this.generateDescription(requirements),
      this.generateTitleVariations(requirements, variationCount),
      this.generateDescriptionVariations(requirements, variationCount)
    ]);

    return {
      title,
      description,
      alternatives: {
        titles: titleAlts,
        descriptions: descriptionAlts
      }
    };
  }

  /**
   * Validate existing meta tags and provide recommendations
   */
  validateMetaTags(title: string, description: string, keyword: string): MetaValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Title validation
    const titleLength = title.length;
    if (titleLength < TITLE_MIN_LENGTH) {
      errors.push(`Title too short (${titleLength} chars). Minimum: ${TITLE_MIN_LENGTH}`);
    } else if (titleLength > TITLE_MAX_LENGTH) {
      errors.push(`Title too long (${titleLength} chars). Maximum: ${TITLE_MAX_LENGTH}`);
    } else if (titleLength < TITLE_IDEAL_LENGTH - 10 || titleLength > TITLE_IDEAL_LENGTH + 10) {
      warnings.push(`Title length ${titleLength} chars. Ideal range: ${TITLE_IDEAL_LENGTH - 5}-${TITLE_IDEAL_LENGTH + 5}`);
    }

    if (!title.toLowerCase().includes(keyword.toLowerCase())) {
      errors.push('Target keyword not found in title');
    } else {
      const keywordIndex = title.toLowerCase().indexOf(keyword.toLowerCase());
      if (keywordIndex > 20) {
        warnings.push('Keyword appears late in title. Move closer to beginning for better SEO.');
      }
    }

    // Description validation
    const descLength = description.length;
    if (descLength < DESCRIPTION_MIN_LENGTH) {
      errors.push(`Description too short (${descLength} chars). Minimum: ${DESCRIPTION_MIN_LENGTH}`);
    } else if (descLength > DESCRIPTION_MAX_LENGTH) {
      errors.push(`Description too long (${descLength} chars). Maximum: ${DESCRIPTION_MAX_LENGTH}`);
    } else if (descLength < DESCRIPTION_IDEAL_LENGTH - 15 || descLength > DESCRIPTION_IDEAL_LENGTH + 5) {
      warnings.push(`Description length ${descLength} chars. Ideal: ${DESCRIPTION_IDEAL_LENGTH - 10}-${DESCRIPTION_IDEAL_LENGTH}`);
    }

    if (!description.toLowerCase().includes(keyword.toLowerCase())) {
      warnings.push('Target keyword not found in description');
      suggestions.push(`Include "${keyword}" naturally in the description`);
    }

    const hasCTA = COMMON_CTA_PHRASES.some(cta => 
      description.toLowerCase().includes(cta.toLowerCase())
    );
    if (!hasCTA) {
      warnings.push('No clear call-to-action (CTA) in description');
      suggestions.push('Add a CTA like "Learn more", "Get started", or "Try free"');
    }

    // Additional suggestions
    if (title === description.substring(0, title.length)) {
      warnings.push('Title and description are too similar');
      suggestions.push('Make description more detailed and include different value propositions');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private buildTitlePrompt(requirements: MetaTagRequirements): string {
    let prompt = `Generate an SEO-optimized title tag for a ${requirements.pageType} page.

Target keyword: "${requirements.keyword}"
Brand: ${requirements.brand || 'NeonHub'}`;

    if (requirements.uniqueSellingPoint) {
      prompt += `\nUnique selling point: ${requirements.uniqueSellingPoint}`;
    }

    if (requirements.targetAudience) {
      prompt += `\nTarget audience: ${requirements.targetAudience}`;
    }

    prompt += `\n\nRequirements:
- Include "${requirements.keyword}" near the beginning
- Length: ${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH} characters (ideal: ${TITLE_IDEAL_LENGTH})
- Make it compelling and click-worthy
- ${requirements.pageType !== 'homepage' ? `Include brand name "${requirements.brand || 'NeonHub'}" at the end` : 'Brand name optional for homepage'}

Generate ONE optimized title tag.`;

    return prompt;
  }

  private buildDescriptionPrompt(requirements: MetaTagRequirements): string {
    let prompt = `Generate an SEO-optimized meta description for a ${requirements.pageType} page.

Target keyword: "${requirements.keyword}"`;

    if (requirements.pageContent) {
      prompt += `\n\nPage content summary:\n${requirements.pageContent.substring(0, 500)}`;
    }

    if (requirements.uniqueSellingPoint) {
      prompt += `\n\nUnique selling point: ${requirements.uniqueSellingPoint}`;
    }

    if (requirements.targetAudience) {
      prompt += `\n\nTarget audience: ${requirements.targetAudience}`;
    }

    prompt += `\n\nRequirements:
- Include "${requirements.keyword}" naturally
- Length: ${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH} characters (ideal: ${DESCRIPTION_IDEAL_LENGTH})
- Include a clear call-to-action
- Highlight key benefits or value proposition
- Address user's pain point or desire

Generate ONE optimized meta description.`;

    return prompt;
  }

  private validateAndScoreTitle(title: string, keyword: string): GeneratedTitle {
    const length = title.length;
    const keywordLower = keyword.toLowerCase();
    const titleLower = title.toLowerCase();
    const keywordPosition = titleLower.indexOf(keywordLower);
    
    const warnings: string[] = [];
    let score = 100;

    // Length scoring
    if (length < TITLE_MIN_LENGTH || length > TITLE_MAX_LENGTH) {
      warnings.push(`Length ${length} chars is outside optimal range (${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH})`);
      score -= 30;
    } else if (Math.abs(length - TITLE_IDEAL_LENGTH) > 10) {
      warnings.push(`Length ${length} chars is acceptable but not ideal (${TITLE_IDEAL_LENGTH})`);
      score -= 10;
    }

    // Keyword position scoring
    if (keywordPosition === -1) {
      warnings.push('Target keyword not found');
      score -= 40;
    } else if (keywordPosition > 20) {
      warnings.push('Keyword appears late in title');
      score -= 15;
    }

    // Truncation check (Google truncates at ~600px, roughly 60 chars)
    if (length > 60) {
      warnings.push('Title may be truncated in search results');
      score -= 5;
    }

    return {
      title,
      length,
      keywordPosition,
      score: Math.max(0, score),
      warnings
    };
  }

  private validateAndScoreDescription(description: string, keyword: string): GeneratedDescription {
    const length = description.length;
    const keywordLower = keyword.toLowerCase();
    const descLower = description.toLowerCase();
    const hasKeyword = descLower.includes(keywordLower);
    const hasCTA = COMMON_CTA_PHRASES.some(cta => descLower.includes(cta.toLowerCase()));
    
    const warnings: string[] = [];
    let score = 100;

    // Length scoring
    if (length < DESCRIPTION_MIN_LENGTH || length > DESCRIPTION_MAX_LENGTH) {
      warnings.push(`Length ${length} chars is outside optimal range (${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH})`);
      score -= 30;
    } else if (Math.abs(length - DESCRIPTION_IDEAL_LENGTH) > 15) {
      warnings.push(`Length ${length} chars is acceptable but not ideal (${DESCRIPTION_IDEAL_LENGTH})`);
      score -= 10;
    }

    // Keyword scoring
    if (!hasKeyword) {
      warnings.push('Target keyword not found');
      score -= 25;
    }

    // CTA scoring
    if (!hasCTA) {
      warnings.push('No clear call-to-action detected');
      score -= 15;
    }

    // Truncation check (Google truncates at ~920px, roughly 160 chars)
    if (length > 160) {
      warnings.push('Description may be truncated in search results');
      score -= 5;
    }

    return {
      description,
      length,
      hasCTA,
      hasKeyword,
      score: Math.max(0, score),
      warnings
    };
  }

  private generateTitleFallback(requirements: MetaTagRequirements): GeneratedTitle {
    const templates = {
      homepage: `${requirements.keyword} | ${requirements.brand || 'NeonHub'}`,
      product: `${requirements.keyword} - ${requirements.uniqueSellingPoint || 'Powerful Automation'} | ${requirements.brand || 'NeonHub'}`,
      blog: `${requirements.keyword}: Complete Guide | ${requirements.brand || 'NeonHub'}`,
      docs: `${requirements.keyword} Documentation | ${requirements.brand || 'NeonHub'}`,
      landing: `${requirements.keyword} - Start Free Trial | ${requirements.brand || 'NeonHub'}`,
      comparison: `${requirements.keyword}: Comparison & Review | ${requirements.brand || 'NeonHub'}`
    };

    const title = templates[requirements.pageType] || templates.product;
    return this.validateAndScoreTitle(title, requirements.keyword);
  }

  private generateDescriptionFallback(requirements: MetaTagRequirements): GeneratedDescription {
    const templates = {
      homepage: `${requirements.brand || 'NeonHub'} offers ${requirements.keyword} solutions for ${requirements.targetAudience || 'businesses'}. ${requirements.uniqueSellingPoint || 'Automate workflows with AI'}. Start your free trial today.`,
      product: `Discover ${requirements.keyword} with ${requirements.brand || 'NeonHub'}. ${requirements.uniqueSellingPoint || 'Powerful automation platform'}. ${requirements.targetAudience ? `Perfect for ${requirements.targetAudience}` : 'Built for teams'}. Try free now.`,
      blog: `Learn everything about ${requirements.keyword} in this comprehensive guide. Expert tips, best practices, and actionable insights. Read more on ${requirements.brand || 'NeonHub'}.`,
      docs: `Complete ${requirements.keyword} documentation for ${requirements.brand || 'NeonHub'}. Step-by-step guides, API references, and examples. Get started today.`,
      landing: `Transform your workflow with ${requirements.keyword}. ${requirements.uniqueSellingPoint || 'AI-powered automation'}. Join thousands of ${requirements.targetAudience || 'users'}. Start free trial.`,
      comparison: `Compare ${requirements.keyword} options. In-depth analysis, features, pricing, and recommendations. Find the best solution for your needs.`
    };

    const description = templates[requirements.pageType] || templates.product;
    return this.validateAndScoreDescription(description, requirements.keyword);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MetaGenerationService;

