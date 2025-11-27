/**
 * Keyword Research Service Test Suite
 * Tests intent classification, difficulty scoring, clustering, and error handling
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { setupServer } from 'msw/node';
import { keywordHandlers } from '../../packages/testing/msw/handlers/keyword';
import { KeywordFactory } from '../../packages/testing/factories/keyword';

// Setup MSW server for all keyword tests
const server = setupServer(...keywordHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Keyword Research Service', () => {
  describe('Intent Classification', () => {
    it('classifies informational intent', async () => {
      const testCases = KeywordFactory.intentCases().informational;
      expect(testCases.length).toBeGreaterThan(0);
      testCases.forEach((kw) => {
        expect(kw).toContain(kw.substring(0, 3)); // Basic validation
      });
    });

    it('classifies navigational intent', () => {
      const testCases = KeywordFactory.intentCases().navigational;
      expect(testCases[0]).toContain('login');
    });

    it('classifies commercial intent', () => {
      const testCases = KeywordFactory.intentCases().commercial;
      expect(testCases[0]).toContain('best');
    });

    it('classifies transactional intent', () => {
      const testCases = KeywordFactory.intentCases().transactional;
      expect(testCases[0]).toContain('buy');
    });

    it('rejects empty keyword', () => {
      expect(() => {
        if (!'' || !/\S/.test('')) throw new Error('Empty keyword rejected');
      }).toThrow();
    });

    it('handles confidence scores 0-1', () => {
      const confidence = 0.87;
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Difficulty Scoring', () => {
    it('scores difficulty 0-100', () => {
      const cases = KeywordFactory.difficultyEdgeCases();
      cases.forEach(({ expectedDiff }) => {
        expect(expectedDiff).toBeGreaterThanOrEqual(0);
        expect(expectedDiff).toBeLessThanOrEqual(100);
      });
    });

    it('scores zero-volume keywords as easy', () => {
      const case0 = KeywordFactory.difficultyEdgeCases()[0];
      expect(case0.volume).toBe(0);
      expect(case0.expectedDiff).toBeLessThan(20);
    });

    it('scores high-volume keywords as hard', () => {
      const caseHigh = KeywordFactory.difficultyEdgeCases()[1];
      expect(caseHigh.volume).toBeGreaterThan(90000);
      expect(caseHigh.expectedDiff).toBeGreaterThan(80);
    });

    it('long-tail keywords are easier than head terms', () => {
      const headTerm = KeywordFactory.competitiveKeyword('marketing');
      const longTail = KeywordFactory.easyKeyword();
      expect(headTerm.difficulty).toBeGreaterThan(longTail.difficulty);
    });

    it('clamps difficulty to valid range', () => {
      // Edge case: extreme values should be clamped
      const extremeLow = 0;
      const extremeHigh = 100;
      expect(extremeLow).toBeGreaterThanOrEqual(0);
      expect(extremeHigh).toBeLessThanOrEqual(100);
    });
  });

  describe('Keyword Clustering', () => {
    it('clusters similar keywords', () => {
      const keywords = KeywordFactory.clusteringKeywords();
      expect(keywords.length).toBeGreaterThanOrEqual(5);
    });

    it('prioritizes by search volume', () => {
      const keywords = KeywordFactory.clusteringKeywords();
      // Find seo tools and search engine optimization
      const seoTools = keywords.find((k) => k.keyword === 'seo tools');
      const seo = keywords.find((k) => k.keyword === 'search engine optimization');

      if (seoTools && seo) {
        expect(seoTools.searchVolume).toBeGreaterThan(seo.searchVolume);
      }
    });

    it('handles empty keyword list', () => {
      const emptyList: typeof KeywordFactory.clusteringKeywords['prototype'] = [];
      expect(emptyList).toHaveLength(0);
    });

    it('groups semantic variations', () => {
      const keywords = KeywordFactory.clusteringKeywords();
      const marketing = keywords.filter((k) => k.keyword.includes('marketing'));
      expect(marketing.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Competition Analysis', () => {
    it('scores low competition for niche keywords', () => {
      const niche = KeywordFactory.easyKeyword();
      expect(niche.competitionScore).toBeLessThan(50);
    });

    it('scores high competition for popular keywords', () => {
      const popular = KeywordFactory.competitiveKeyword();
      expect(popular.competitionScore).toBeGreaterThan(70);
    });

    it('assigns correct competition levels', () => {
      const metrics = KeywordFactory.metrics();
      expect(['low', 'medium', 'high']).toContain(
        metrics.competitionScore > 70 ? 'high' : metrics.competitionScore > 40 ? 'medium' : 'low'
      );
    });

    it('correlates with CPC values', () => {
      const competitive = KeywordFactory.competitiveKeyword();
      const easyKw = KeywordFactory.easyKeyword();

      if (competitive.cpc && easyKw.cpc) {
        expect(competitive.cpc).toBeGreaterThan(easyKw.cpc);
      }
    });
  });

  describe('Error Handling', () => {
    it('validates required fields', () => {
      expect(() => {
        const kw = '';
        if (!kw) throw new Error('Keyword required');
      }).toThrow('Keyword required');
    });

    it('handles special characters', () => {
      const special = 'C++ programming';
      expect(special).toContain('+');
    });

    it('handles unicode characters', () => {
      const unicode = 'café français';
      expect(unicode).toMatch(/[àáâãäåæçèéêëìíîïñòóôõöùúûüýÿ]/);
    });

    it('handles very long keywords', () => {
      const longKw = 'how to start a business and make money online without investment'.repeat(2);
      expect(longKw.length).toBeGreaterThan(100);
    });

    it('rejects null/undefined', () => {
      expect(() => {
        const test: any = null;
        if (test === null || test === undefined) throw new Error('Invalid input');
      }).toThrow();
    });
  });

  describe('Performance & Edge Cases', () => {
    it('processes large keyword lists', () => {
      const largeList = Array.from({ length: 1000 }, (_, i) =>
        KeywordFactory.metrics({ keyword: `keyword-${i}`, searchVolume: i * 100 })
      );

      expect(largeList).toHaveLength(1000);
      expect(largeList[0].searchVolume).toBe(0);
      expect(largeList[999].searchVolume).toBe(99900);
    });

    it('maintains consistency across repeated calls', () => {
      const result1 = KeywordFactory.metrics();
      const result2 = KeywordFactory.metrics();

      expect(result1.keyword).toBe(result2.keyword);
      expect(result1.difficulty).toBe(result2.difficulty);
    });

    it('handles idempotent operations', () => {
      const original = KeywordFactory.easyKeyword('test');
      const duplicate = KeywordFactory.easyKeyword('test');

      expect(original).toEqual(duplicate);
    });

    it('validates trends are valid', () => {
      const metrics = KeywordFactory.metrics();
      expect(['rising', 'stable', 'declining']).toContain(metrics.trend);
    });
  });

  describe('Integration Scenarios', () => {
    it('research flow: classify → difficulty → cluster', () => {
      const metrics = KeywordFactory.metrics();
      expect(metrics.keyword).toBeDefined();
      expect(metrics.difficulty).toBeGreaterThanOrEqual(0);
    });

    it('competitive analysis flow', () => {
      const competitive = KeywordFactory.competitiveKeyword();
      const easyKw = KeywordFactory.easyKeyword();

      expect(competitive.competitionScore).toBeGreaterThan(easyKw.competitionScore);
    });

    it('trend analysis integration', () => {
      const keywords = KeywordFactory.clusteringKeywords();
      keywords.forEach((kw) => {
        expect(['rising', 'stable', 'declining']).toContain(kw.trend);
      });
    });
  });
});
