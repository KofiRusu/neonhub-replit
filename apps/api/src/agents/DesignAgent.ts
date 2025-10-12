/**
 * Design Agent - AI-Powered Design Generation & Optimization
 */

import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DesignAsset {
  id: string;
  type: 'social-post' | 'banner' | 'email-header' | 'infographic';
  prompt: string;
  colors: string[];
  dimensions: { width: number; height: number };
  style: string;
  url?: string;
  createdAt: Date;
}

export class DesignAgent {
  /**
   * Generate design specifications using AI
   */
  async generateDesignSpec(params: {
    type: string;
    brand: string;
    message: string;
    audience?: string;
  }): Promise<{
    layout: string;
    colors: string[];
    typography: string;
    elements: string[];
    dallePrompt: string;
  }> {
    const { type, brand, message, audience = 'general' } = params;

    const prompt = `Design a ${type} for ${brand} with the message: "${message}"
Target audience: ${audience}

Provide design specifications including:
1. Layout description
2. Color palette (hex codes)
3. Typography recommendations
4. Key visual elements
5. DALL-E prompt for generating the visual

Format as JSON.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        layout: parsed.layout || 'Modern grid layout',
        colors: parsed.colors || ['#6366f1', '#8b5cf6', '#f59e0b'],
        typography: parsed.typography || 'Sans-serif, bold headlines',
        elements: parsed.elements || ['Logo', 'Headline', 'CTA Button'],
        dallePrompt: parsed.dallePrompt || `Modern ${type} design for ${brand}`,
      };
    } catch (error) {
      console.error('Design spec generation error:', error);
      return {
        layout: 'Clean, modern layout with clear hierarchy',
        colors: ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981'],
        typography: 'Inter font family, 24px headlines, 16px body',
        elements: ['Brand logo', 'Headline text', 'Key visual', 'Call-to-action button'],
        dallePrompt: `Professional ${type} design for ${brand}, modern style, clean layout`,
      };
    }
  }

  /**
   * Generate image using DALL-E
   */
  async generateImage(prompt: string, size: '256x256' | '512x512' | '1024x1024' = '1024x1024'): Promise<string | null> {
    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
      });

      return response.data[0]?.url || null;
    } catch (error) {
      console.error('Image generation error:', error);
      return null;
    }
  }

  /**
   * Optimize design for different platforms
   */
  async optimizeForPlatform(
    originalDesign: DesignAsset,
    targetPlatform: 'instagram' | 'facebook' | 'twitter' | 'linkedin'
  ): Promise<Partial<DesignAsset>> {
    const platformSpecs = {
      instagram: { width: 1080, height: 1080, aspectRatio: '1:1' },
      facebook: { width: 1200, height: 630, aspectRatio: '1.91:1' },
      twitter: { width: 1200, height: 675, aspectRatio: '16:9' },
      linkedin: { width: 1200, height: 627, aspectRatio: '1.91:1' },
    };

    const spec = platformSpecs[targetPlatform];

    return {
      dimensions: { width: spec.width, height: spec.height },
      style: `${originalDesign.style} optimized for ${targetPlatform}`,
      prompt: `${originalDesign.prompt} (${spec.aspectRatio} aspect ratio for ${targetPlatform})`,
    };
  }

  /**
   * Generate color palette
   */
  generateColorPalette(brandColor: string, scheme: 'monochromatic' | 'analogous' | 'complementary' = 'analogous'): string[] {
    // This is a simplified version - in production, use a proper color theory library
    const baseColor = brandColor.replace('#', '');
    const r = parseInt(baseColor.substr(0, 2), 16);
    const g = parseInt(baseColor.substr(2, 2), 16);
    const b = parseInt(baseColor.substr(4, 2), 16);

    const palette = [brandColor];

    if (scheme === 'complementary') {
      // Add complementary color (opposite on color wheel)
      const compR = 255 - r;
      const compG = 255 - g;
      const compB = 255 - b;
      palette.push(`#${compR.toString(16).padStart(2, '0')}${compG.toString(16).padStart(2, '0')}${compB.toString(16).padStart(2, '0')}`);
    }

    // Add lighter and darker versions
    palette.push(`#${Math.min(255, r + 40).toString(16).padStart(2, '0')}${Math.min(255, g + 40).toString(16).padStart(2, '0')}${Math.min(255, b + 40).toString(16).padStart(2, '0')}`);
    palette.push(`#${Math.max(0, r - 40).toString(16).padStart(2, '0')}${Math.max(0, g - 40).toString(16).padStart(2, '0')}${Math.max(0, b - 40).toString(16).padStart(2, '0')}`);

    return palette;
  }

  /**
   * Get sample design asset
   */
  getSampleDesign(): DesignAsset {
    return {
      id: 'design_' + Date.now(),
      type: 'social-post',
      prompt: 'Modern AI marketing automation promotional post',
      colors: ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981'],
      dimensions: { width: 1080, height: 1080 },
      style: 'Modern gradient with geometric shapes',
      createdAt: new Date(),
    };
  }
}

export const designAgent = new DesignAgent();

