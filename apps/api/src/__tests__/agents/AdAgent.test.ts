/**
 * AdAgent Tests
 */

import { adAgent } from '../../agents/AdAgent';

describe('AdAgent', () => {
  describe('generateAdCopy', () => {
    it('should generate ad copy with valid parameters', async () => {
      const result = await adAgent.generateAdCopy({
        product: 'AI Marketing Platform',
        audience: 'B2B Marketers',
        platform: 'google',
        tone: 'professional',
      });

      expect(result).toHaveProperty('headline');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('keywords');
      expect(Array.isArray(result.keywords)).toBe(true);
      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('should handle missing optional parameters', async () => {
      const result = await adAgent.generateAdCopy({
        product: 'Test Product',
        audience: 'General',
        platform: 'facebook',
      });

      expect(result).toHaveProperty('headline');
      expect(result.headline).toBeTruthy();
    });
  });

  describe('optimizeCampaign', () => {
    it('should provide recommendations for low CTR', async () => {
      const campaign = adAgent.getSampleCampaign();
      const performance = {
        clicks: 50,
        impressions: 10000,
        conversions: 2,
        ctr: 0.005, // Low CTR
      };

      const result = await adAgent.optimizeCampaign(campaign, performance);

      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('adjustedBudget');
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('CTR'))).toBe(true);
    });

    it('should recommend budget increase for high CTR', async () => {
      const campaign = adAgent.getSampleCampaign();
      const performance = {
        clicks: 600,
        impressions: 10000,
        conversions: 30,
        ctr: 0.06, // High CTR
      };

      const result = await adAgent.optimizeCampaign(campaign, performance);

      expect(result.adjustedBudget).toBeGreaterThan(campaign.budget);
      expect(result.recommendations.some(r => r.includes('budget'))).toBe(true);
    });
  });

  describe('generateVariations', () => {
    it('should generate multiple ad variations', async () => {
      const original = adAgent.getSampleCampaign();
      const variations = await adAgent.generateVariations(original);

      expect(Array.isArray(variations)).toBe(true);
      expect(variations.length).toBeGreaterThan(0);
      variations.forEach(variant => {
        expect(variant).toHaveProperty('headline');
        expect(variant).toHaveProperty('description');
      });
    });
  });

  describe('getSampleCampaign', () => {
    it('should return a valid sample campaign', () => {
      const sample = adAgent.getSampleCampaign();

      expect(sample).toHaveProperty('id');
      expect(sample).toHaveProperty('platform');
      expect(sample).toHaveProperty('headline');
      expect(sample).toHaveProperty('description');
      expect(sample).toHaveProperty('targetAudience');
      expect(sample).toHaveProperty('budget');
      expect(sample).toHaveProperty('keywords');
      expect(sample.budget).toBeGreaterThan(0);
    });
  });
});

