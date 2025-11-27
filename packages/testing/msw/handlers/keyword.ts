/**
 * MSW Handlers for Keyword Research
 * Mocks external API calls for deterministic testing
 */

import { http, HttpResponse } from 'msw';
import { KeywordFactory } from '../factories/keyword';

const BASE_URL = process.env.KEYWORD_API_URL || 'https://api.keywordapi.com';

export const keywordHandlers = [
  /**
   * Mock keyword intent classification API
   */
  http.post(`${BASE_URL}/classify`, async ({ request }) => {
    const body = await request.json() as { keyword: string };
    const keyword = body.keyword?.toLowerCase() || '';

    // Determine intent based on keyword patterns
    let intent = 'informational';
    if (keyword.includes('buy') || keyword.includes('sign up')) intent = 'transactional';
    else if (keyword.includes('best') || keyword.includes('vs') || keyword.includes('compare'))
      intent = 'commercial';
    else if (keyword.includes('login') || keyword.includes('pricing')) intent = 'navigational';

    return HttpResponse.json({
      keyword: body.keyword,
      intent,
      confidence: 0.87 + Math.random() * 0.1,
      reasoning: `Keyword "${body.keyword}" classified as ${intent}`,
    });
  }),

  /**
   * Mock difficulty scoring API
   */
  http.post(`${BASE_URL}/difficulty`, async ({ request }) => {
    const body = await request.json() as { keyword: string; searchVolume?: number };
    const volume = body.searchVolume ?? 5000;
    const keywordLength = body.keyword?.split(' ').length ?? 1;

    // Simple difficulty algorithm: longer tail = easier
    const baseDifficulty = Math.min(100, (Math.log(volume + 1) / Math.log(100000)) * 80);
    const tailBonus = Math.max(0, 15 - keywordLength * 3);
    const difficulty = Math.max(0, Math.min(100, baseDifficulty - tailBonus));

    return HttpResponse.json({
      keyword: body.keyword,
      difficulty: Math.round(difficulty),
    });
  }),

  /**
   * Mock search volume API
   */
  http.post(`${BASE_URL}/volume`, async ({ request }) => {
    const body = await request.json() as { keywords: string[] };

    const results = (body.keywords || []).map((kw: string) => ({
      keyword: kw,
      searchVolume: Math.floor(Math.random() * 100000),
      trend: ['rising', 'stable', 'declining'][Math.floor(Math.random() * 3)] as const,
    }));

    return HttpResponse.json({ results });
  }),

  /**
   * Mock competition analysis API
   */
  http.post(`${BASE_URL}/competition`, async ({ request }) => {
    const body = await request.json() as { keyword: string };
    const keyword = body.keyword?.toLowerCase() || '';

    // Simple heuristic: common words = high competition
    const commonWords = ['marketing', 'seo', 'business', 'online', 'digital', 'software'];
    const isCommon = commonWords.some((word) => keyword.includes(word));

    const competitionScore = isCommon ? 65 + Math.random() * 30 : 20 + Math.random() * 35;

    return HttpResponse.json({
      keyword: body.keyword,
      competitionScore: Math.round(competitionScore),
      competitionLevel:
        competitionScore > 70 ? 'high' : competitionScore > 40 ? 'medium' : 'low',
    });
  }),

  /**
   * Mock AI intent classification (fallback/premium)
   */
  http.post(`${BASE_URL}/ai/intent`, async ({ request }) => {
    const body = await request.json() as { keyword: string };

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate latency

    const intents = ['informational', 'navigational', 'commercial', 'transactional'] as const;
    const intent = intents[Math.floor(Math.random() * intents.length)];

    return HttpResponse.json({
      keyword: body.keyword,
      intent,
      confidence: 0.85 + Math.random() * 0.14,
      reasoning: `AI classified "${body.keyword}" as ${intent} based on semantic analysis`,
    });
  }),

  /**
   * Mock timeout scenario (for error testing)
   */
  http.post(`${BASE_URL}/slow-endpoint`, async () => {
    // Simulate a slow endpoint that times out
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return HttpResponse.json({ success: true });
  }),
];

/**
 * Helper to create keyword test data from factory
 */
export const createKeywordTestData = () => {
  return KeywordFactory.metrics();
};

/**
 * Helper to get mock intent classification
 */
export const mockIntentClassification = (keyword: string) => {
  return {
    keyword,
    intent: 'informational' as const,
    confidence: 0.92,
    reasoning: `Test mock for "${keyword}"`,
  };
};
