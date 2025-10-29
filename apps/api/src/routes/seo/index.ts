/**
 * SEO API Routes - Main Router
 * 
 * Aggregates all SEO-related routes:
 * - Keywords (research, intent, prioritization)
 * - Meta tags (generation, validation, A/B testing)
 * - Content (analysis, optimization, recommendations)
 * - Recommendations (weekly, competitive, trending)
 * - Links (internal linking, anchor text, topic clusters)
 * 
 * @module routes/seo
 */

import { Router } from 'express';
import keywordsRouter from './keywords';
import metaRouter from './meta';
import contentRouter from './content';
import recommendationsRouter from './recommendations';
import linksRouter from './links';
import { audit } from '../../services/seo.service';

const router: Router = Router();

// Mount sub-routers
router.use('/keywords', keywordsRouter);
router.use('/meta', metaRouter);
router.use('/content', contentRouter);
router.use('/recommendations', recommendationsRouter);
router.use('/links', linksRouter);

/**
 * GET /api/seo
 * API health check and available endpoints
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NeonHub SEO API',
    version: '1.0.0',
    endpoints: {
      keywords: {
        'POST /keywords/classify-intent': 'Classify search intent for a keyword',
        'POST /keywords/classify-intent-batch': 'Classify intent for multiple keywords',
        'POST /keywords/generate-long-tail': 'Generate long-tail keyword variations',
        'POST /keywords/competitive-gaps': 'Find keyword gaps vs competitors',
        'POST /keywords/prioritize': 'Prioritize keywords by opportunity score',
        'POST /keywords/extract': 'Extract keywords from content',
        'POST /keywords/density': 'Calculate keyword density'
      },
      meta: {
        'POST /meta/generate-title': 'Generate optimized title tag',
        'POST /meta/generate-title-variations': 'Generate title A/B test variations',
        'POST /meta/generate-description': 'Generate optimized meta description',
        'POST /meta/generate-description-variations': 'Generate description A/B test variations',
        'POST /meta/generate': 'Generate complete meta tags',
        'POST /meta/generate-with-alternatives': 'Generate meta tags with alternatives',
        'POST /meta/validate': 'Validate existing meta tags'
      },
      content: {
        'POST /content/analyze': 'Comprehensive content analysis',
        'POST /content/readability': 'Calculate readability scores',
        'POST /content/keywords': 'Analyze keyword optimization',
        'POST /content/headings': 'Analyze heading structure',
        'POST /content/links': 'Analyze links (internal/external)',
        'POST /content/images': 'Analyze images and alt text',
        'POST /content/eeat': 'Analyze E-E-A-T signals'
      },
      recommendations: {
        'GET /recommendations/weekly': 'Generate weekly SEO recommendations',
        'POST /recommendations/competitors': 'Analyze competitors',
        'GET /recommendations/content-gaps': 'Identify content gaps',
        'GET /recommendations/trending': 'Find trending keywords',
        'GET /recommendations/stale-content': 'Find stale content',
        'GET /recommendations/competitive-gaps': 'Find competitive keyword gaps',
        'GET /recommendations/performance-issues': 'Detect performance issues',
        'POST /recommendations/for-page': 'Generate page-specific recommendations'
      },
      links: {
        'POST /links/suggest': 'Suggest internal links for a page',
        'POST /links/generate-anchor': 'Generate anchor text',
        'POST /links/validate-anchor': 'Validate anchor text quality',
        'GET /links/site-structure': 'Analyze site-wide link structure',
        'POST /links/topic-clusters': 'Build topic clusters'
      }
    },
    documentation: '/api/seo/docs'
  });
});

/**
 * GET /api/seo/health
 * Detailed health check for SEO services
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      keywords: 'operational',
      meta: 'operational',
      content: 'operational',
      recommendations: 'operational',
      links: 'operational'
    },
    dependencies: {
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      prisma: 'operational',
      database: 'operational'
    }
  });
});

/**
 * POST /api/seo/audit
 * Quick SEO audit endpoint (used by SEOAgent)
 */
router.post('/audit', async (req, res) => {
  try {
    const { url, notes } = req.body as { url?: string; notes?: string };
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'url required'
      });
    }
    const data = await audit({ url, notes });
    return res.json({
      success: true,
      data
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json({
      success: false,
      error: message
    });
  }
});

export default router;
