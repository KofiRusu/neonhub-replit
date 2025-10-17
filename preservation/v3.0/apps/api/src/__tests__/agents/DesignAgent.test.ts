/**
 * DesignAgent Tests
 */

import { designAgent } from '../../agents/DesignAgent';

describe('DesignAgent', () => {
  describe('generateDesignSpec', () => {
    it('should generate design specifications', async () => {
      const result = await designAgent.generateDesignSpec({
        type: 'social-post',
        brand: 'NeonHub',
        message: 'Launch your AI marketing campaign',
        audience: 'B2B marketers',
      });

      expect(result).toHaveProperty('layout');
      expect(result).toHaveProperty('colors');
      expect(result).toHaveProperty('typography');
      expect(result).toHaveProperty('elements');
      expect(result).toHaveProperty('dallePrompt');
      
      expect(Array.isArray(result.colors)).toBe(true);
      expect(result.colors.length).toBeGreaterThan(0);
      expect(Array.isArray(result.elements)).toBe(true);
    });

    it('should handle missing optional audience', async () => {
      const result = await designAgent.generateDesignSpec({
        type: 'banner',
        brand: 'TestBrand',
        message: 'Test message',
      });

      expect(result).toHaveProperty('layout');
      expect(result).toHaveProperty('colors');
    });
  });

  describe('optimizeForPlatform', () => {
    it('should optimize design for Instagram', async () => {
      const original = designAgent.getSampleDesign();
      const optimized = await designAgent.optimizeForPlatform(original, 'instagram');

      expect(optimized).toHaveProperty('dimensions');
      expect(optimized.dimensions?.width).toBe(1080);
      expect(optimized.dimensions?.height).toBe(1080);
    });

    it('should optimize design for Facebook', async () => {
      const original = designAgent.getSampleDesign();
      const optimized = await designAgent.optimizeForPlatform(original, 'facebook');

      expect(optimized.dimensions?.width).toBe(1200);
      expect(optimized.dimensions?.height).toBe(630);
    });

    it('should optimize design for Twitter', async () => {
      const original = designAgent.getSampleDesign();
      const optimized = await designAgent.optimizeForPlatform(original, 'twitter');

      expect(optimized.dimensions?.width).toBe(1200);
      expect(optimized.dimensions?.height).toBe(675);
    });
  });

  describe('generateColorPalette', () => {
    it('should generate complementary color palette', () => {
      const palette = designAgent.generateColorPalette('#6366f1', 'complementary');

      expect(Array.isArray(palette)).toBe(true);
      expect(palette.length).toBeGreaterThan(1);
      expect(palette[0]).toBe('#6366f1'); // Base color
      palette.forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should generate analogous color palette', () => {
      const palette = designAgent.generateColorPalette('#ff5733', 'analogous');

      expect(palette.length).toBeGreaterThan(1);
      expect(palette[0]).toBe('#ff5733');
    });
  });

  describe('getSampleDesign', () => {
    it('should return a valid sample design', () => {
      const sample = designAgent.getSampleDesign();

      expect(sample).toHaveProperty('id');
      expect(sample).toHaveProperty('type');
      expect(sample).toHaveProperty('prompt');
      expect(sample).toHaveProperty('colors');
      expect(sample).toHaveProperty('dimensions');
      expect(sample).toHaveProperty('style');
      expect(sample).toHaveProperty('createdAt');
      
      expect(sample.dimensions.width).toBeGreaterThan(0);
      expect(sample.dimensions.height).toBeGreaterThan(0);
    });
  });
});

