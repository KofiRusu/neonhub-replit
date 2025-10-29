/**
 * SEO Content Optimization API Routes
 * 
 * Endpoints for content analysis, readability, and optimization recommendations
 * 
 * @module routes/seo/content
 */

import { Router } from 'express';
import { z } from 'zod';
import { ContentOptimizerService } from '@/services/seo/content-optimizer.service';

const router: Router = Router();
const contentService = new ContentOptimizerService();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const analyzeContentSchema = z.object({
  content: z.string().min(100).max(50000),
  targetKeyword: z.string().min(1).max(200)
});

const calculateReadabilitySchema = z.object({
  content: z.string().min(100).max(50000)
});

const analyzeKeywordsSchema = z.object({
  content: z.string().min(100).max(50000),
  targetKeyword: z.string().min(1).max(200)
});

const analyzeHeadingsSchema = z.object({
  content: z.string().min(100).max(50000)
});

const analyzeLinksSchema = z.object({
  content: z.string().min(100).max(50000)
});

const analyzeImagesSchema = z.object({
  content: z.string().min(100).max(50000)
});

const analyzeEEATSchema = z.object({
  content: z.string().min(100).max(50000)
});

const optimizeContentSchema = z.object({
  html: z.string().optional(),
  markdown: z.string().optional(),
  personaId: z.string().optional(),
  targetKeyword: z.string().optional()
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/seo/content/analyze
 * Comprehensive content analysis with recommendations
 */
router.post('/analyze', async (req, res) => {
  try {
    const { content, targetKeyword } = analyzeContentSchema.parse(req.body);
    
    const analysis = await contentService.analyzeContent(content, targetKeyword);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing content:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze content'
    });
  }
});

/**
 * POST /api/seo/content/readability
 * Calculate readability scores (Flesch Reading Ease, Flesch-Kincaid Grade Level)
 */
router.post('/readability', async (req, res) => {
  try {
    const { content } = calculateReadabilitySchema.parse(req.body);
    
    const readability = await contentService.calculateReadability(content);
    
    res.json({
      success: true,
      data: readability
    });
  } catch (error) {
    console.error('Error calculating readability:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate readability'
    });
  }
});

/**
 * POST /api/seo/content/keywords
 * Analyze keyword optimization (density, frequency, prominence, LSI keywords)
 */
router.post('/keywords', async (req, res) => {
  try {
    const { content, targetKeyword } = analyzeKeywordsSchema.parse(req.body);
    
    const keywordAnalysis = await contentService.analyzeKeywords(content, targetKeyword);
    
    res.json({
      success: true,
      data: keywordAnalysis
    });
  } catch (error) {
    console.error('Error analyzing keywords:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze keywords'
    });
  }
});

/**
 * POST /api/seo/content/headings
 * Analyze heading structure (H1, H2, H3 hierarchy and quality)
 */
router.post('/headings', async (req, res) => {
  try {
    const { content } = analyzeHeadingsSchema.parse(req.body);
    
    const headingAnalysis = await contentService.analyzeHeadings(content);
    
    res.json({
      success: true,
      data: headingAnalysis
    });
  } catch (error) {
    console.error('Error analyzing headings:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze headings'
    });
  }
});

/**
 * POST /api/seo/content/links
 * Analyze internal and external links (count, quality, anchor text)
 */
router.post('/links', async (req, res) => {
  try {
    const { content } = analyzeLinksSchema.parse(req.body);
    
    const linkAnalysis = await contentService.analyzeLinks(content);
    
    res.json({
      success: true,
      data: linkAnalysis
    });
  } catch (error) {
    console.error('Error analyzing links:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze links'
    });
  }
});

/**
 * POST /api/seo/content/images
 * Analyze images and alt text quality
 */
router.post('/images', async (req, res) => {
  try {
    const { content } = analyzeImagesSchema.parse(req.body);
    
    const imageAnalysis = await contentService.analyzeImages(content);
    
    res.json({
      success: true,
      data: imageAnalysis
    });
  } catch (error) {
    console.error('Error analyzing images:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze images'
    });
  }
});

/**
 * POST /api/seo/content/eeat
 * Analyze E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)
 */
router.post('/eeat', async (req, res) => {
  try {
    const { content } = analyzeEEATSchema.parse(req.body);
    
    const eeatAnalysis = await contentService.analyzeEEAT(content);
    
    res.json({
      success: true,
      data: eeatAnalysis
    });
  } catch (error) {
    console.error('Error analyzing E-E-A-T:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze E-E-A-T'
    });
  }
});

/**
 * POST /api/seo/content/optimize
 * Generate optimized content metadata with JSON-LD for SEO Agent
 * (Lightweight endpoint for quick content optimization)
 */
router.post('/optimize', async (req, res) => {
  try {
    const { html, markdown, personaId: _personaId, targetKeyword } = optimizeContentSchema.parse(req.body);
    
    const content = markdown || html || "";
    const primary = targetKeyword || "your topic";
    
    // Generate optimized metadata
    const title = `${primary.charAt(0).toUpperCase() + primary.slice(1)} | Comprehensive Guide`;
    const metaDescription = `Discover everything about ${primary}. Expert insights, actionable tips, and detailed analysis to help you succeed.`;
    const h1 = `Complete Guide to ${primary.charAt(0).toUpperCase() + primary.slice(1)}`;

    // Content suggestions based on analysis
    const suggestions: string[] = [
      `Ensure canonical URL is set to avoid duplicate content issues.`,
      `Include internal links to related articles for better site architecture.`,
      `Use schema.org Article markup for rich snippets in search results.`,
      `Target keyword "${primary}" should appear in the first 100 words.`,
      `Add alt text to all images with relevant keywords.`,
    ];

    // Check content length
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 300) {
      suggestions.push(`Expand content to at least 800 words for better search visibility.`);
    }

    // Generate JSON-LD structured data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: metaDescription,
      author: {
        "@type": "Organization",
        name: "NeonHub",
      },
      publisher: {
        "@type": "Organization",
        name: "NeonHub",
        logo: {
          "@type": "ImageObject",
          url: "https://neonhub.com/logo.png",
        },
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://neonhub.com/content",
      },
    };

    res.json({
      success: true,
      data: {
        title,
        metaDescription,
        h1,
        suggestions,
        jsonLd,
        optimizedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error optimizing content:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to optimize content'
    });
  }
});

export default router;
