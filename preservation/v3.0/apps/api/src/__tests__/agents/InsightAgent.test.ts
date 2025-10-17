/**
 * InsightAgent Tests
 */

import { insightAgent } from '../../agents/InsightAgent';

describe('InsightAgent', () => {
  describe('analyzeData', () => {
    it('should analyze metrics and generate insights', async () => {
      const data = {
        metrics: [
          { name: 'Page Views', value: 10000, previousValue: 8000 },
          { name: 'Conversion Rate', value: 5.2, previousValue: 6.8 },
        ],
        timeframe: 'last 7 days',
      };

      const insights = await insightAgent.analyzeData(data);

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
      
      insights.forEach(insight => {
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('confidence');
        expect(insight).toHaveProperty('impact');
        expect(['trend', 'anomaly', 'prediction', 'recommendation']).toContain(insight.type);
      });
    });

    it('should detect significant increases', async () => {
      const data = {
        metrics: [{ name: 'Traffic', value: 15000, previousValue: 10000 }],
        timeframe: 'last month',
      };

      const insights = await insightAgent.analyzeData(data);

      expect(insights.some(i => i.type === 'trend')).toBe(true);
    });

    it('should detect significant decreases', async () => {
      const data = {
        metrics: [{ name: 'Engagement', value: 5000, previousValue: 8000 }],
        timeframe: 'last week',
      };

      const insights = await insightAgent.analyzeData(data);

      expect(insights.some(i => i.type === 'anomaly')).toBe(true);
    });
  });

  describe('predictTrends', () => {
    it('should generate predictions from historical data', async () => {
      const historicalData = [
        { date: '2025-01-01', value: 100 },
        { date: '2025-01-02', value: 110 },
        { date: '2025-01-03', value: 120 },
        { date: '2025-01-04', value: 125 },
        { date: '2025-01-05', value: 135 },
      ];

      const result = await insightAgent.predictTrends(historicalData);

      expect(result).toHaveProperty('predictions');
      expect(result).toHaveProperty('confidence');
      expect(Array.isArray(result.predictions)).toBe(true);
      expect(result.predictions.length).toBe(7);
      
      result.predictions.forEach(pred => {
        expect(pred).toHaveProperty('date');
        expect(pred).toHaveProperty('value');
        expect(pred.value).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle insufficient data gracefully', async () => {
      const historicalData = [
        { date: '2025-01-01', value: 100 },
      ];

      const result = await insightAgent.predictTrends(historicalData);

      expect(result.predictions).toEqual([]);
      expect(result.confidence).toBe(0);
    });
  });

  describe('getSampleInsights', () => {
    it('should return sample insights', () => {
      const samples = insightAgent.getSampleInsights();

      expect(Array.isArray(samples)).toBe(true);
      expect(samples.length).toBeGreaterThan(0);
      
      samples.forEach(insight => {
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('actionable');
        expect(insight).toHaveProperty('suggestedActions');
      });
    });
  });
});

