/**
 * SEO Recommendations API Routes
 * 
 * Endpoints for AI-powered SEO recommendations, competitive analysis, and trends
 * 
 * @module routes/seo/recommendations
 */

import { Router } from 'express';
import { z } from 'zod';
import { SEORecommendationsService } from '@/services/seo/recommendations.service';
import { prisma } from '@/lib/prisma';
import type { ContentAnalysis } from '@/services/seo/content-optimizer.service';

const router: Router = Router();
const recommendationsService = new SEORecommendationsService(prisma);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const analyzeCompetitorsSchema = z.object({
  competitorUrls: z.array(z.string().url()).min(1).max(5)
});

const recommendForPageSchema = z.object({
  url: z.string().url(),
  content: z.string().min(100).max(50000),
  analysis: z.object({
    wordCount: z.number(),
    readability: z.any(),
    keywordOptimization: z.any(),
    headingStructure: z.any(),
    internalLinks: z.any(),
    images: z.any(),
    eeat: z.any(),
    score: z.number(),
    recommendations: z.array(z.any())
  })
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/seo/recommendations/weekly
 * Generate weekly SEO recommendations
 * 
 * Includes:
 * - Trending keywords
 * - Content gaps
 * - Stale content
 * - Competitive opportunities
 * - Performance issues
 */
router.get('/weekly', async (req, res) => {
  try {
    const recommendations = await recommendationsService.generateWeeklyRecommendations();
    
    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating weekly recommendations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate recommendations'
    });
  }
});

/**
 * POST /api/seo/recommendations/competitors
 * Analyze competitors and identify opportunities
 */
router.post('/competitors', async (req, res) => {
  try {
    const { competitorUrls } = analyzeCompetitorsSchema.parse(req.body);
    
    const insights = await recommendationsService.analyzeCompetitors(competitorUrls);
    
    res.json({
      success: true,
      data: insights,
      count: insights.length
    });
  } catch (error) {
    console.error('Error analyzing competitors:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze competitors'
    });
  }
});

/**
 * GET /api/seo/recommendations/content-gaps
 * Identify content gaps (keywords/topics where NeonHub has no content)
 */
router.get('/content-gaps', async (req, res) => {
  try {
    const gaps = await recommendationsService.identifyContentGaps();
    
    res.json({
      success: true,
      data: gaps,
      count: gaps.length
    });
  } catch (error) {
    console.error('Error identifying content gaps:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to identify content gaps'
    });
  }
});

/**
 * GET /api/seo/recommendations/trending
 * Find trending keywords in the industry
 */
router.get('/trending', async (req, res) => {
  try {
    const trendingKeywords = await recommendationsService.findTrendingKeywords();
    
    res.json({
      success: true,
      data: trendingKeywords,
      count: trendingKeywords.length
    });
  } catch (error) {
    console.error('Error finding trending keywords:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find trending keywords'
    });
  }
});

/**
 * GET /api/seo/recommendations/stale-content
 * Find stale content that needs updating
 */
router.get('/stale-content', async (req, res) => {
  try {
    const stalePages = await recommendationsService.findStaleContent();
    
    res.json({
      success: true,
      data: stalePages,
      count: stalePages.length
    });
  } catch (error) {
    console.error('Error finding stale content:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find stale content'
    });
  }
});

/**
 * GET /api/seo/recommendations/competitive-gaps
 * Find competitive keyword gaps
 */
router.get('/competitive-gaps', async (req, res) => {
  try {
    const gaps = await recommendationsService.findCompetitiveGaps();
    
    res.json({
      success: true,
      data: gaps,
      count: gaps.length
    });
  } catch (error) {
    console.error('Error finding competitive gaps:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find competitive gaps'
    });
  }
});

/**
 * GET /api/seo/recommendations/performance-issues
 * Detect performance issues (traffic drops, ranking drops, etc.)
 */
router.get('/performance-issues', async (req, res) => {
  try {
    const issues = await recommendationsService.detectPerformanceIssues();
    
    res.json({
      success: true,
      data: issues,
      count: issues.length
    });
  } catch (error) {
    console.error('Error detecting performance issues:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to detect performance issues'
    });
  }
});

/**
 * POST /api/seo/recommendations/for-page
 * Generate personalized recommendations for a specific page
 */
router.post('/for-page', async (req, res) => {
  try {
    const parsed = recommendForPageSchema.parse(req.body);
    const analysis: ContentAnalysis = {
      wordCount: parsed.analysis.wordCount,
      readability: parsed.analysis.readability as ContentAnalysis['readability'],
      keywordOptimization: parsed.analysis.keywordOptimization as ContentAnalysis['keywordOptimization'],
      headingStructure: parsed.analysis.headingStructure as ContentAnalysis['headingStructure'],
      internalLinks: parsed.analysis.internalLinks as ContentAnalysis['internalLinks'],
      images: parsed.analysis.images as ContentAnalysis['images'],
      eeat: parsed.analysis.eeat as ContentAnalysis['eeat'],
      score: parsed.analysis.score,
      recommendations: parsed.analysis.recommendations as ContentAnalysis['recommendations']
    };
    
    const recommendations = await recommendationsService.recommendForPage(parsed.url, parsed.content, analysis);
    
    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      url: parsed.url
    });
  } catch (error) {
    console.error('Error generating page recommendations:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate page recommendations'
    });
  }
});

export default router;
