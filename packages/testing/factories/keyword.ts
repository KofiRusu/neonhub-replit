/**
 * Keyword Research Factory
 * Generates deterministic test data for keyword research services
 */

export interface KeywordMetricsFactory {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  competitionScore: number;
  cpc?: number;
  difficulty: number;
  trend: 'rising' | 'stable' | 'declining';
}

export const KeywordFactory = {
  /**
   * Create a basic keyword metrics object
   */
  metrics(overrides?: Partial<KeywordMetricsFactory>): KeywordMetricsFactory {
    return {
      keyword: 'marketing automation',
      searchVolume: 5000,
      competition: 'medium',
      competitionScore: 55,
      cpc: 12.5,
      difficulty: 45,
      trend: 'rising',
      ...overrides,
    };
  },

  /**
   * Create an easy long-tail keyword
   */
  easyKeyword(keyword = 'how to automate marketing workflows'): KeywordMetricsFactory {
    return this.metrics({
      keyword,
      searchVolume: 200,
      competition: 'low',
      competitionScore: 25,
      difficulty: 18,
    });
  },

  /**
   * Create a competitive head term
   */
  competitiveKeyword(keyword = 'marketing'): KeywordMetricsFactory {
    return this.metrics({
      keyword,
      searchVolume: 50000,
      competition: 'high',
      competitionScore: 85,
      cpc: 45.0,
      difficulty: 78,
    });
  },

  /**
   * Create multiple keywords for clustering tests
   */
  clusteringKeywords(): KeywordMetricsFactory[] {
    return [
      this.metrics({ keyword: 'marketing automation', searchVolume: 5000, difficulty: 45 }),
      this.metrics({ keyword: 'automated marketing', searchVolume: 4500, difficulty: 43 }),
      this.metrics({ keyword: 'marketing automation software', searchVolume: 2000, difficulty: 50 }),
      this.metrics({ keyword: 'seo tools', searchVolume: 8000, difficulty: 60 }),
      this.metrics({ keyword: 'search engine optimization', searchVolume: 7000, difficulty: 65 }),
    ];
  },

  /**
   * Create keywords with edge-case difficulties
   */
  difficultyEdgeCases(): Array<{ keyword: string; volume: number; expectedDiff: number }> {
    return [
      { keyword: 'ultra niche long tail phrase no volume', volume: 0, expectedDiff: 5 },
      { keyword: 'common word', volume: 100000, expectedDiff: 85 },
      { keyword: 'medium term', volume: 5000, expectedDiff: 45 },
      { keyword: 'x', volume: 1000000, expectedDiff: 90 },
    ];
  },

  /**
   * Create search intent test cases
   */
  intentCases() {
    return {
      informational: [
        'how to start a business',
        'what is seo',
        'machine learning tutorial',
        'best practices for',
      ],
      navigational: [
        'facebook login',
        'amazon prime video',
        'slack download',
        'github pricing',
      ],
      commercial: [
        'best marketing automation software',
        'top rated project management tools',
        'saas vs on-premise',
        'comparison of crm platforms',
      ],
      transactional: [
        'buy marketing automation tool',
        'sign up for hubspot',
        'download seo software',
        'subscribe to analytics platform',
      ],
    };
  },
};
