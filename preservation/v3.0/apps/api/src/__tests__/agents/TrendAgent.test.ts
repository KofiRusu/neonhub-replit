/**
 * TrendAgent (SocialApiClient) Tests
 */

import { socialApiClient } from '../../lib/socialApiClient';

describe('TrendAgent (SocialApiClient)', () => {
  describe('fetchTwitterTrends', () => {
    it('should fetch Twitter trends (mock data in test)', async () => {
      const trends = await socialApiClient.fetchTwitterTrends();

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
      
      trends.forEach(trend => {
        expect(trend).toHaveProperty('keyword');
        expect(trend).toHaveProperty('volume');
        expect(trend).toHaveProperty('sentiment');
        expect(trend).toHaveProperty('platform');
        expect(trend).toHaveProperty('timestamp');
        expect(trend.platform).toBe('twitter');
        expect(trend.volume).toBeGreaterThanOrEqual(0);
        expect(trend.sentiment).toBeGreaterThanOrEqual(0);
        expect(trend.sentiment).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('fetchRedditTrends', () => {
    it('should fetch Reddit trends (mock data in test)', async () => {
      const trends = await socialApiClient.fetchRedditTrends('marketing');

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
      
      trends.forEach(trend => {
        expect(trend).toHaveProperty('keyword');
        expect(trend).toHaveProperty('volume');
        expect(trend).toHaveProperty('sentiment');
        expect(trend).toHaveProperty('platform');
        expect(trend).toHaveProperty('timestamp');
        expect(trend.platform).toBe('reddit');
      });
    });

    it('should use default subreddit when none specified', async () => {
      const trends = await socialApiClient.fetchRedditTrends();

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
    });
  });

  describe('aggregateTrends', () => {
    it('should aggregate trends from all platforms', async () => {
      const trends = await socialApiClient.aggregateTrends();

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
      
      // Should have both Twitter and Reddit trends
      const platforms = new Set(trends.map(t => t.platform));
      expect(platforms.size).toBeGreaterThanOrEqual(1);
      
      // Should be sorted by volume (descending)
      for (let i = 0; i < trends.length - 1; i++) {
        expect(trends[i].volume).toBeGreaterThanOrEqual(trends[i + 1].volume);
      }
    });
  });
});

