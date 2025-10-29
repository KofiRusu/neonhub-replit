import { Router } from "express";
import { z } from "zod";
import { ok, fail } from "../lib/http";
import * as trendsService from "../services/trends.service";

export const trendsRouter: Router = Router();

// Validation schemas
const trendBriefSchema = z.object({
  notes: z.string().optional(),
  platforms: z.array(z.enum(['twitter', 'reddit'])).optional(),
  timeframe: z.string().optional(),
});

// POST /trends/brief - Generate comprehensive trend brief
trendsRouter.post("/trends/brief", async (req, res) => {
  try {
    const validatedData = trendBriefSchema.parse(req.body);
    const data = await trendsService.brief(validatedData);
    return res.json(ok(data));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0].message).body);
    }
    const message = error instanceof Error ? error.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// GET /trends/platform/:platform - Get trends from specific platform
trendsRouter.get("/trends/platform/:platform", async (req, res) => {
  try {
    const { platform } = req.params;
    const { limit } = req.query;
    
    if (platform !== 'twitter' && platform !== 'reddit') {
      return res.status(400).json(fail('Invalid platform. Must be twitter or reddit').body);
    }
    
    const options = limit ? { limit: parseInt(limit as string, 10) } : undefined;
    const trends = await trendsService.getTrendsByPlatform(platform, options);
    return res.json(ok(trends));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// GET /trends/search - Search for trends by keyword
trendsRouter.get("/trends/search", async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json(fail('Query parameter is required').body);
    }
    
    const trends = await trendsService.searchTrends(query);
    return res.json(ok(trends));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// GET /trends - Get all aggregated trends
trendsRouter.get("/trends", async (req, res) => {
  try {
    const brief = await trendsService.brief({});
    return res.json(ok(brief));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

export default trendsRouter;
