/**
 * Ad Agent - Automated Ad Campaign Creation & Optimization
 */

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'test-key-for-testing',
});

export interface AdCampaign {
  id: string;
  platform: 'google' | 'facebook' | 'linkedin' | 'twitter';
  headline: string;
  description: string;
  targetAudience: string;
  budget: number;
  keywords?: string[];
  createdAt: Date;
}

export class AdAgent {
  /**
   * Generate ad copy using AI
   */
  async generateAdCopy(params: {
    product: string;
    audience: string;
    platform: string;
    tone?: string;
  }): Promise<{ headline: string; description: string; keywords: string[] }> {
    const { product, audience, platform, tone = 'professional' } = params;

    const prompt = `Create a compelling ${platform} ad for the following:
Product/Service: ${product}
Target Audience: ${audience}
Tone: ${tone}

Generate:
1. A catchy headline (max 30 characters for ${platform})
2. A persuasive description (max 90 characters)
3. 5 relevant keywords for targeting

Format as JSON: { "headline": "...", "description": "...", "keywords": [...] }`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        headline: parsed.headline || 'Great Product',
        description: parsed.description || 'Check it out now!',
        keywords: parsed.keywords || ['marketing', 'business', 'growth'],
      };
    } catch (error) {
      console.error('Ad generation error:', error);
      // Fallback
      return {
        headline: `Transform Your ${product}`,
        description: `Perfect for ${audience}. Get started today!`,
        keywords: ['marketing', 'automation', 'ai', 'growth', 'business'],
      };
    }
  }

  /**
   * Optimize ad campaign based on performance data
   */
  async optimizeCampaign(
    campaign: AdCampaign,
    performance: {
      clicks: number;
      impressions: number;
      conversions: number;
      ctr: number;
    }
  ): Promise<{ recommendations: string[]; adjustedBudget: number }> {
    const ctr = performance.ctr;
    const conversionRate = performance.conversions / performance.clicks;

    const recommendations: string[] = [];
    let adjustedBudget = campaign.budget;

    // Analyze performance
    if (ctr < 0.01) {
      recommendations.push('Low CTR detected. Consider A/B testing new headlines.');
      recommendations.push('Review targeting parameters to reach more relevant audience.');
    } else if (ctr > 0.05) {
      recommendations.push('Excellent CTR! Consider increasing budget to scale.');
      adjustedBudget = campaign.budget * 1.2;
    }

    if (conversionRate < 0.02) {
      recommendations.push('Low conversion rate. Review landing page experience.');
      recommendations.push('Consider adding social proof or customer testimonials.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Campaign performing well. Continue monitoring.');
    }

    return {
      recommendations,
      adjustedBudget: Math.round(adjustedBudget),
    };
  }

  /**
   * Generate ad variations for A/B testing
   */
  async generateVariations(
    originalCampaign: Partial<AdCampaign>
  ): Promise<Array<{ headline: string; description: string }>> {
    const variations = [];

    // Create variations with different approaches
    const approaches = [
      { style: 'benefit-focused', tone: 'enthusiastic' },
      { style: 'problem-solving', tone: 'empathetic' },
      { style: 'urgency-driven', tone: 'direct' },
    ];

    for (const approach of approaches) {
      try {
        const result = await this.generateAdCopy({
          product: originalCampaign.headline || 'Product',
          audience: originalCampaign.targetAudience || 'Business professionals',
          platform: originalCampaign.platform || 'google',
          tone: approach.tone,
        });
        
        variations.push({
          headline: result.headline,
          description: result.description,
        });
      } catch (error) {
        console.error('Variation generation error:', error);
      }
    }

    return variations;
  }

  /**
   * Get sample campaign
   */
  getSampleCampaign(): AdCampaign {
    return {
      id: 'camp_' + Date.now(),
      platform: 'google',
      headline: 'AI Marketing Automation',
      description: 'Transform your marketing with intelligent automation. Start free trial today!',
      targetAudience: 'B2B Marketing Managers',
      budget: 5000,
      keywords: ['marketing automation', 'ai marketing', 'lead generation', 'b2b marketing'],
      createdAt: new Date(),
    };
  }
}

export const adAgent = new AdAgent();

