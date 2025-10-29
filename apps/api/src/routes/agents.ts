/**
 * Agents API Routes
 * Endpoints for all NeonHub AI agents
 */

import { Router } from 'express';
import { adAgent } from '../agents/AdAgent.js';
import { insightAgent } from '../agents/InsightAgent.js';
import { designAgent } from '../agents/DesignAgent.js';
import { socialApiClient } from '../lib/socialApiClient.js';
import { leadScraper } from '../lib/leadScraper.js';
import { pdfGenerator } from '../lib/pdfGenerator.js';

export const agentsRouter: Router = Router();

// Ad Agent Routes
agentsRouter.post('/ad/generate', async (req, res) => {
  try {
    const { product, audience, platform, tone } = req.body;
    const result = await adAgent.generateAdCopy({ product, audience, platform, tone });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

agentsRouter.post('/ad/optimize', async (req, res) => {
  try {
    const { campaign, performance } = req.body;
    const result = await adAgent.optimizeCampaign(campaign, performance);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

agentsRouter.get('/ad/sample', (_req, res) => {
  const sample = adAgent.getSampleCampaign();
  res.json({ success: true, data: sample });
});

// Insight Agent Routes
agentsRouter.post('/insight/analyze', async (req, res) => {
  try {
    const { metrics, timeframe } = req.body;
    const insights = await insightAgent.analyzeData({ metrics, timeframe });
    res.json({ success: true, data: insights });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

agentsRouter.post('/insight/predict', async (req, res) => {
  try {
    const { historicalData } = req.body;
    const predictions = await insightAgent.predictTrends(historicalData);
    res.json({ success: true, data: predictions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

agentsRouter.get('/insight/sample', (_req, res) => {
  const sample = insightAgent.getSampleInsights();
  res.json({ success: true, data: sample });
});

// Design Agent Routes
agentsRouter.post('/design/generate', async (req, res) => {
  try {
    const { type, brand, message, audience } = req.body;
    const spec = await designAgent.generateDesignSpec({ type, brand, message, audience });
    res.json({ success: true, data: spec });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

agentsRouter.post('/design/image', async (req, res) => {
  try {
    const { prompt, size } = req.body;
    const imageUrl = await designAgent.generateImage(prompt, size);
    res.json({ success: true, data: { imageUrl } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

agentsRouter.get('/design/sample', (_req, res) => {
  const sample = designAgent.getSampleDesign();
  res.json({ success: true, data: sample });
});

// Trend Agent Routes (Social API)
agentsRouter.get('/trends/twitter', async (_req, res) => {
  try {
    const trends = await socialApiClient.fetchTwitterTrends();
    res.json({ success: true, data: trends });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

agentsRouter.get('/trends/reddit', async (req, res) => {
  try {
    const subreddit = req.query.subreddit as string || 'all';
    const trends = await socialApiClient.fetchRedditTrends(subreddit);
    res.json({ success: true, data: trends });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

agentsRouter.get('/trends/aggregate', async (_req, res) => {
  try {
    const trends = await socialApiClient.aggregateTrends();
    res.json({ success: true, data: trends });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Outreach Agent Routes
agentsRouter.post('/outreach/scrape', async (req, res) => {
  try {
    const { url, maxPages } = req.body;
    
    // Use mock data in development
    if (process.env.NODE_ENV === 'development' || !url) {
      const mockLeads = leadScraper.getMockLeads();
      return res.json({ success: true, data: mockLeads });
    }

    await leadScraper.initialize();
    const leads = await leadScraper.scrapeDirectory(url, maxPages);
    await leadScraper.close();
    
    res.json({ success: true, data: leads });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

agentsRouter.post('/outreach/proposal', async (req, res) => {
  try {
    const proposalData = req.body.proposalData || pdfGenerator.getSampleProposal();
    const pdfBuffer = await pdfGenerator.generateProposal(proposalData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=proposal.pdf');
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

agentsRouter.post('/outreach/email-template', async (req, res) => {
  try {
    const { companyName } = req.body;
    const template = pdfGenerator.generateEmailTemplate(companyName);
    res.json({ success: true, data: { template } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all available agents
agentsRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      agents: [
        { id: 'ad', name: 'Ad Agent', description: 'AI-powered ad campaign creation and optimization' },
        { id: 'insight', name: 'Insight Agent', description: 'Data analysis and business intelligence' },
        { id: 'design', name: 'Design Agent', description: 'AI-powered design generation' },
        { id: 'trend', name: 'Trend Agent', description: 'Social media trend monitoring' },
        { id: 'outreach', name: 'Outreach Agent', description: 'B2B lead generation and outreach' },
      ],
    },
  });
});

export default agentsRouter;

