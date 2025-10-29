/**
 * SEO Keywords API Routes
 * 
 * Endpoints for keyword research, intent classification, and prioritization
 * 
 * @module routes/seo/keywords
 */

import { Router } from 'express';
import { z } from 'zod';
import { KeywordResearchService } from '@/services/seo/keyword-research.service';
import type { KeywordMetrics, KeywordIntent } from '@/services/seo/keyword-research.service';
import { prisma } from '@/lib/prisma';

const router: Router = Router();
const keywordService = new KeywordResearchService(prisma);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const classifyIntentSchema = z.object({
  keyword: z.string().min(1).max(200)
});

const classifyIntentBatchSchema = z.object({
  keywords: z.array(z.string().min(1).max(200)).min(1).max(50)
});

const generateLongTailSchema = z.object({
  seedKeyword: z.string().min(1).max(200),
  count: z.number().int().min(5).max(50).optional().default(20)
});

const findCompetitiveGapsSchema = z.object({
  competitorUrls: z.array(z.string().url()).min(1).max(5),
  ourKeywords: z.array(z.string()).optional().default([])
});

const prioritizeKeywordsSchema = z.object({
  keywords: z.array(z.object({
    keyword: z.string(),
    searchVolume: z.number(),
    difficulty: z.number(),
    competition: z.enum(['low', 'medium', 'high']),
    competitionScore: z.number(),
    cpc: z.number().optional(),
    trend: z.enum(['rising', 'stable', 'declining'])
  })).min(1).max(100),
  intents: z.array(z.object({
    keyword: z.string(),
    intent: z.enum(['informational', 'navigational', 'commercial', 'transactional']),
    confidence: z.number().min(0).max(1)
  }))
});

const extractKeywordsSchema = z.object({
  content: z.string().min(100).max(50000)
});

const analyzeKeywordsSimpleSchema = z.object({
  terms: z.array(z.string().min(1).max(200)).min(1).max(50),
  personaId: z.string().optional()
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/seo/keywords/classify-intent
 * Classify search intent for a single keyword
 */
router.post('/classify-intent', async (req, res) => {
  try {
    const { keyword } = classifyIntentSchema.parse(req.body);
    
    const result = await keywordService.classifyIntent(keyword);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error classifying intent:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to classify intent'
    });
  }
});

/**
 * POST /api/seo/keywords/classify-intent-batch
 * Classify search intent for multiple keywords (batch processing)
 */
router.post('/classify-intent-batch', async (req, res) => {
  try {
    const { keywords } = classifyIntentBatchSchema.parse(req.body);
    
    const results = await keywordService.classifyIntentBatch(keywords);
    
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('Error classifying intents (batch):', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to classify intents'
    });
  }
});

/**
 * POST /api/seo/keywords/generate-long-tail
 * Generate long-tail keyword variations from a seed keyword
 */
router.post('/generate-long-tail', async (req, res) => {
  try {
    const { seedKeyword, count } = generateLongTailSchema.parse(req.body);
    
    const variations = await keywordService.generateLongTail(seedKeyword, count);
    
    res.json({
      success: true,
      data: variations,
      count: variations.length,
      seedKeyword
    });
  } catch (error) {
    console.error('Error generating long-tail keywords:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate long-tail keywords'
    });
  }
});

/**
 * POST /api/seo/keywords/competitive-gaps
 * Find keyword gaps where competitors rank but we don't
 */
router.post('/competitive-gaps', async (req, res) => {
  try {
    const { competitorUrls, ourKeywords } = findCompetitiveGapsSchema.parse(req.body);
    
    const gaps = await keywordService.findCompetitiveGaps(competitorUrls, ourKeywords);
    
    res.json({
      success: true,
      data: gaps,
      count: gaps.length,
      competitors: competitorUrls
    });
  } catch (error) {
    console.error('Error finding competitive gaps:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find competitive gaps'
    });
  }
});

/**
 * POST /api/seo/keywords/prioritize
 * Prioritize keywords based on opportunity score (volume/difficulty × intent × relevance)
 */
router.post('/prioritize', async (req, res) => {
  try {
    const parsed = prioritizeKeywordsSchema.parse(req.body);
    const normalizedKeywords: KeywordMetrics[] = parsed.keywords.map(metric => ({
      keyword: metric.keyword,
      searchVolume: metric.searchVolume,
      difficulty: metric.difficulty,
      competition: metric.competition,
      competitionScore: metric.competitionScore,
      cpc: metric.cpc,
      trend: metric.trend
    }));
    const normalizedIntents: KeywordIntent[] = parsed.intents.map(intent => ({
      keyword: intent.keyword,
      intent: intent.intent,
      confidence: intent.confidence
    }));
    
    const suggestions = await keywordService.prioritizeKeywords(normalizedKeywords, normalizedIntents);
    
    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length
    });
  } catch (error) {
    console.error('Error prioritizing keywords:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prioritize keywords'
    });
  }
});

/**
 * POST /api/seo/keywords/extract
 * Extract keywords from existing content
 */
router.post('/extract', async (req, res) => {
  try {
    const { content } = extractKeywordsSchema.parse(req.body);
    
    const keywords = await keywordService.extractKeywords(content);
    
    res.json({
      success: true,
      data: keywords,
      count: keywords.length
    });
  } catch (error) {
    console.error('Error extracting keywords:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract keywords'
    });
  }
});

/**
 * POST /api/seo/keywords/density
 * Calculate keyword density for content
 */
router.post('/density', async (req, res) => {
  try {
    const { content, keyword } = z.object({
      content: z.string().min(100),
      keyword: z.string().min(1)
    }).parse(req.body);
    
    const density = keywordService.calculateKeywordDensity(content, keyword);
    const analysis = keywordService.isKeywordDensityOptimal(content, keyword);
    
    res.json({
      success: true,
      data: {
        keyword,
        density,
        ...analysis
      }
    });
  } catch (error) {
    console.error('Error calculating keyword density:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate keyword density'
    });
  }
});

/**
 * POST /api/seo/keywords/analyze
 * Simple deterministic keyword analysis for SEO Agent
 * (Lightweight endpoint for batch keyword scoring and intent classification)
 */
router.post('/analyze', async (req, res) => {
  try {
    const { terms, personaId } = analyzeKeywordsSimpleSchema.parse(req.body);
    
    const analyzed = terms.map((term) => {
      const termLower = term.toLowerCase();
      const wordCount = termLower.split(/\s+/).length;
      
      // Score calculation: longer tail = higher score
      const baseScore = Math.min(100, 50 + wordCount * 15);
      
      // Determine intent based on keyword patterns
      let intent: "info" | "comm" | "nav" | "tran" = "info";
      if (termLower.match(/buy|purchase|price|shop|order/)) intent = "tran";
      else if (termLower.match(/how|what|why|guide|tutorial/)) intent = "info";
      else if (termLower.match(/^[a-z\s]+\.(com|org|io)$/)) intent = "nav";
      else if (termLower.match(/review|best|vs|compare|top/)) intent = "comm";
      
      return {
        term: termLower,
        score: baseScore,
        intent,
      };
    });

    res.json({
      success: true,
      data: {
        terms: analyzed.sort((a, b) => b.score - a.score),
        personaId,
        analyzedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error analyzing keywords:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze keywords'
    });
  }
});

export default router;
