/**
 * Brand Voice Module - Composition and guardrails
 * @module modules/voice
 */

import type { HTTPClient } from '../client';
import type {
  BrandVoiceComposerArgs,
  ComposerResult,
  GuardrailCheck,
  PromptPack,
  SnippetLibrary,
  SnippetFilters,
} from '../types/agentic';

export class VoiceModule {
  constructor(private readonly client: HTTPClient) {}

  /**
   * Compose personalized content with brand voice
   *
   * @example
   * ```typescript
   * const result = await client.voice.compose({
   *   brandId: 'brand_123',
   *   channel: 'email',
   *   objective: 'demo_book',
   *   personId: 'per_456',
   *   constraints: {
   *     maxLength: 500,
   *     tone: 'professional',
   *     includeLink: true
   *   }
   * });
   *
   * console.log(result.subjectLines[0]);
   * console.log(result.htmlVariants[0]);
   * console.log(result.body); // text fallback for SMS
   * ```
  */
  async compose(args: BrandVoiceComposerArgs): Promise<ComposerResult> {
    return this.client.post<ComposerResult>('/brand-voice/compose', {
      body: args,
    });
  }

  /**
   * Run guardrail checks on content
   *
   * @example
   * ```typescript
   * const check = await client.voice.guardrail(
   *   'Check out this amazing offer!',
   *   'email',
   *   'brand_123'
   * );
   *
   * if (!check.safe) {
   *   console.log('Violations:', check.violations);
   *   console.log('Use this instead:', check.redacted);
   * }
   * ```
   */
  async guardrail(
    text: string,
    channel: string,
    brandId: string
  ): Promise<GuardrailCheck> {
    return this.client.post<GuardrailCheck>('/brand-voice/guardrail', {
      body: { text, channel, brandId },
    });
  }

  /**
   * Get prompt pack for a specific use case
   *
   * @example
   * ```typescript
   * const pack = await client.voice.getPromptPack('email_nurture', 'brand_123');
   * console.log(pack.systemPrompt);
   * console.log(pack.variables);
   * ```
   */
  async getPromptPack(useCase: string, brandId: string): Promise<PromptPack> {
    return this.client.get<PromptPack>(`/brand-voice/prompts/${useCase}`, {
      query: { brandId },
    });
  }

  /**
   * Get winning snippets from library
   *
   * @example
   * ```typescript
   * const snippets = await client.voice.getSnippets({
   *   brandId: 'brand_123',
   *   channel: 'email',
   *   objective: 'demo_book',
   *   minWinRate: 0.7,
   *   limit: 10
   * });
   *
   * // Use top-performing subject lines
   * snippets.forEach(s => {
   *   if (s.usage === 'subject') {
   *     console.log(`${s.snippet} (win rate: ${s.winRate})`);
   *   }
   * });
   * ```
   */
  async getSnippets(filters: SnippetFilters): Promise<SnippetLibrary[]> {
    return this.client.get<SnippetLibrary[]>('/brand-voice/snippets', {
      query: filters,
    });
  }

  /**
   * Add a snippet to the library
   */
  async addSnippet(
    snippet: Omit<
      SnippetLibrary,
      'id' | 'winRate' | 'impressions' | 'conversions' | 'createdAt' | 'updatedAt'
    >
  ): Promise<SnippetLibrary> {
    return this.client.post<SnippetLibrary>('/brand-voice/snippets', {
      body: snippet,
    });
  }

  /**
   * Record snippet usage (for learning loop)
   */
  async recordSnippetUsage(
    snippetId: string,
    outcome: 'conversion' | 'no_conversion'
  ): Promise<void> {
    await this.client.post(`/brand-voice/snippets/${snippetId}/usage`, {
      body: { outcome },
    });
  }

  /**
   * Test brand voice alignment score
   */
  async testAlignment(
    text: string,
    brandId: string
  ): Promise<{ score: number; feedback: string[] }> {
    return this.client.post('/brand-voice/test-alignment', {
      body: { text, brandId },
    });
  }

  /**
   * Get brand voice analytics
   */
  async getAnalytics(brandId: string, dateRange: { from: Date; to: Date }) {
    return this.client.get(`/brand-voice/${brandId}/analytics`, {
      query: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      },
    });
  }
}
