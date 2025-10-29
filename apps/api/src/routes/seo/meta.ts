/**
 * SEO Meta Tags API Routes
 * 
 * Endpoints for AI-powered title and meta description generation
 * 
 * @module routes/seo/meta
 */

import { Router } from 'express';
import { z } from 'zod';
import { MetaGenerationService } from '@/services/seo/meta-generation.service';
import type { MetaTagRequirements } from '@/services/seo/meta-generation.service';

const router: Router = Router();
const metaService = new MetaGenerationService();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const metaRequirementsSchema = z.object({
  keyword: z.string().min(1).max(200),
  pageType: z.enum(['homepage', 'product', 'blog', 'docs', 'landing', 'comparison']),
  pageContent: z.string().max(5000).optional(),
  brand: z.string().max(50).optional(),
  targetAudience: z.string().max(200).optional(),
  uniqueSellingPoint: z.string().max(200).optional()
});

const generateTitleSchema = metaRequirementsSchema;

const generateDescriptionSchema = metaRequirementsSchema;

const generateMetaTagsSchema = metaRequirementsSchema;

const generateWithVariationsSchema = metaRequirementsSchema.extend({
  variationCount: z.number().int().min(2).max(5).optional().default(3)
});

const validateMetaTagsSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  keyword: z.string().min(1).max(200)
});

type MetaRequirementsInput = z.infer<typeof metaRequirementsSchema>;

const toMetaRequirements = (input: MetaRequirementsInput): MetaTagRequirements => ({
  keyword: input.keyword,
  pageType: input.pageType,
  pageContent: input.pageContent,
  brand: input.brand,
  targetAudience: input.targetAudience,
  uniqueSellingPoint: input.uniqueSellingPoint
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/seo/meta/generate-title
 * Generate optimized title tag
 */
router.post('/generate-title', async (req, res) => {
  try {
    const parsed = generateTitleSchema.parse(req.body);
    const requirements = toMetaRequirements(parsed);
    
    const title = await metaService.generateTitle(requirements);
    
    res.json({
      success: true,
      data: title
    });
  } catch (error) {
    console.error('Error generating title:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate title'
    });
  }
});

/**
 * POST /api/seo/meta/generate-title-variations
 * Generate multiple title variations for A/B testing
 */
router.post('/generate-title-variations', async (req, res) => {
  try {
    const parsed = generateWithVariationsSchema.parse(req.body);
    const { variationCount, ...rest } = parsed;
    const requirements = toMetaRequirements(rest);
    
    const variations = await metaService.generateTitleVariations(requirements, variationCount);
    
    res.json({
      success: true,
      data: variations,
      count: variations.length
    });
  } catch (error) {
    console.error('Error generating title variations:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate title variations'
    });
  }
});

/**
 * POST /api/seo/meta/generate-description
 * Generate optimized meta description
 */
router.post('/generate-description', async (req, res) => {
  try {
    const parsed = generateDescriptionSchema.parse(req.body);
    const requirements = toMetaRequirements(parsed);
    
    const description = await metaService.generateDescription(requirements);
    
    res.json({
      success: true,
      data: description
    });
  } catch (error) {
    console.error('Error generating description:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate description'
    });
  }
});

/**
 * POST /api/seo/meta/generate-description-variations
 * Generate multiple description variations for A/B testing
 */
router.post('/generate-description-variations', async (req, res) => {
  try {
    const parsed = generateWithVariationsSchema.parse(req.body);
    const { variationCount, ...rest } = parsed;
    const requirements = toMetaRequirements(rest);
    
    const variations = await metaService.generateDescriptionVariations(requirements, variationCount);
    
    res.json({
      success: true,
      data: variations,
      count: variations.length
    });
  } catch (error) {
    console.error('Error generating description variations:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate description variations'
    });
  }
});

/**
 * POST /api/seo/meta/generate
 * Generate complete meta tags (title + description)
 */
router.post('/generate', async (req, res) => {
  try {
    const parsed = generateMetaTagsSchema.parse(req.body);
    const requirements = toMetaRequirements(parsed);
    
    const metaTags = await metaService.generateMetaTags(requirements);
    
    res.json({
      success: true,
      data: metaTags
    });
  } catch (error) {
    console.error('Error generating meta tags:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate meta tags'
    });
  }
});

/**
 * POST /api/seo/meta/generate-with-alternatives
 * Generate meta tags with A/B testing alternatives
 */
router.post('/generate-with-alternatives', async (req, res) => {
  try {
    const parsed = generateWithVariationsSchema.parse(req.body);
    const { variationCount, ...rest } = parsed;
    const requirements = toMetaRequirements(rest);
    
    const metaTags = await metaService.generateMetaTagsWithAlternatives(requirements, variationCount);
    
    res.json({
      success: true,
      data: metaTags
    });
  } catch (error) {
    console.error('Error generating meta tags with alternatives:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate meta tags with alternatives'
    });
  }
});

/**
 * POST /api/seo/meta/validate
 * Validate existing meta tags and get recommendations
 */
router.post('/validate', async (req, res) => {
  try {
    const { title, description, keyword } = validateMetaTagsSchema.parse(req.body);
    
    const validation = metaService.validateMetaTags(title, description, keyword);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating meta tags:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate meta tags'
    });
  }
});

export default router;
