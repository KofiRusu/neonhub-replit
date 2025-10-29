/**
 * SEO Internal Linking API Routes
 * 
 * Endpoints for internal link suggestions, anchor text generation, and topic clustering
 * 
 * @module routes/seo/links
 */

import { Router } from 'express';
import { z } from 'zod';
import { InternalLinkingService } from '@/services/seo/internal-linking.service';
import { prisma } from '@/lib/prisma';

const router: Router = Router();
const linkingService = new InternalLinkingService(prisma);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const suggestLinksSchema = z.object({
  currentPageUrl: z.string().url(),
  currentPageContent: z.string().min(100).max(50000),
  targetKeyword: z.string().min(1).max(200),
  maxSuggestions: z.number().int().min(1).max(20).optional().default(5)
});

const generateAnchorTextSchema = z.object({
  sourceContent: z.string().min(100).max(5000),
  targetKeyword: z.string().min(1).max(200),
  targetTitle: z.string().min(1).max(200)
});

const validateAnchorTextSchema = z.object({
  anchorText: z.string().min(1).max(200)
});

const buildTopicClustersSchema = z.object({
  topic: z.string().min(1).max(200)
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/seo/links/suggest
 * Suggest internal links for a page based on semantic similarity
 */
router.post('/suggest', async (req, res) => {
  try {
    const { currentPageUrl, currentPageContent, targetKeyword, maxSuggestions } = suggestLinksSchema.parse(req.body);
    
    const suggestions = await linkingService.suggestLinks({
      currentPageUrl,
      currentPageContent,
      targetKeyword,
      maxSuggestions
    });
    
    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length,
      sourceUrl: currentPageUrl
    });
  } catch (error) {
    console.error('Error suggesting links:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to suggest links'
    });
  }
});

/**
 * POST /api/seo/links/generate-anchor
 * Generate contextual anchor text for a link
 */
router.post('/generate-anchor', async (req, res) => {
  try {
    const { sourceContent, targetKeyword, targetTitle } = generateAnchorTextSchema.parse(req.body);
    
    const anchorText = await linkingService.generateAnchorText(sourceContent, targetKeyword, targetTitle);
    
    res.json({
      success: true,
      data: {
        anchorText,
        targetKeyword,
        targetTitle
      }
    });
  } catch (error) {
    console.error('Error generating anchor text:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate anchor text'
    });
  }
});

/**
 * POST /api/seo/links/validate-anchor
 * Validate anchor text quality
 */
router.post('/validate-anchor', async (req, res) => {
  try {
    const { anchorText } = validateAnchorTextSchema.parse(req.body);
    
    const validation = linkingService.validateAnchorText(anchorText);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating anchor text:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate anchor text'
    });
  }
});

/**
 * GET /api/seo/links/site-structure
 * Analyze site-wide internal linking structure
 */
router.get('/site-structure', async (req, res) => {
  try {
    const analytics = await linkingService.analyzeSiteStructure();
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error analyzing site structure:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze site structure'
    });
  }
});

/**
 * POST /api/seo/links/topic-clusters
 * Build topic clusters (pillar pages + supporting pages)
 */
router.post('/topic-clusters', async (req, res) => {
  try {
    const { topic } = buildTopicClustersSchema.parse(req.body);
    
    const clusters = await linkingService.buildTopicClusters(topic);
    
    res.json({
      success: true,
      data: clusters,
      count: clusters.length,
      topic
    });
  } catch (error) {
    console.error('Error building topic clusters:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build topic clusters'
    });
  }
});

export default router;
