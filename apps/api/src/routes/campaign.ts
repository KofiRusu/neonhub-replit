import { Router } from "express";
import { z } from "zod";
import { campaignAgent } from "../agents/CampaignAgent.js";
import { emailAgent } from "../agents/EmailAgent.js";
import { socialAgent, type SocialPlatform } from "../agents/SocialAgent.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import {
  createCampaignSchema,
  updateCampaignSchema,
  scheduleCampaignSchema,
  runABTestSchema,
  generateEmailSequenceSchema,
  optimizeSubjectLineSchema,
  generateSocialPostSchema,
  optimizeForPlatformSchema,
  schedulePostSchema,
  optimizeCampaignSchema,
  getCampaignMetricsQuerySchema,
  listCampaignsQuerySchema,
} from "../schemas/campaign.js";

const router = Router();

/**
 * POST /api/campaigns - Create a new campaign
 */
router.post("/api/campaigns", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    const body = createCampaignSchema.parse(req.body);
    
    const result = await campaignAgent.createCampaign({
      name: body.name,
      type: body.type,
      config: body.config,
      userId,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR"));
    }
    next(error);
  }
});

/**
 * GET /api/campaigns - List user campaigns
 */
router.get("/api/campaigns", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    const query = listCampaignsQuerySchema.parse(req.query);
    
    const campaigns = await campaignAgent.listCampaigns(userId, {
      status: query.status,
      type: query.type,
    });

    res.json({
      success: true,
      data: campaigns,
      meta: {
        total: campaigns.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR"));
    }
    next(error);
  }
});

/**
 * GET /api/campaigns/:id - Get campaign details
 */
router.get("/api/campaigns/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const campaign = await campaignAgent.getCampaign(id);
    
    if (!campaign) {
      return next(new AppError("Campaign not found", 404, "NOT_FOUND"));
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/campaigns/:id - Update campaign
 */
router.put("/api/campaigns/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    updateCampaignSchema.parse(req.body);
    
    // Check campaign exists and user owns it
    const campaign = await campaignAgent.getCampaign(id);
    if (!campaign) {
      return next(new AppError("Campaign not found", 404, "NOT_FOUND"));
    }
    if (campaign.userId !== userId) {
      return next(new AppError("Unauthorized", 403, "FORBIDDEN"));
    }

    const updated = await campaignAgent.getCampaign(id);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR"));
    }
    next(error);
  }
});

/**
 * DELETE /api/campaigns/:id - Delete campaign
 */
router.delete("/api/campaigns/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    // Check campaign exists and user owns it
    const campaign = await campaignAgent.getCampaign(id);
    if (!campaign) {
      return next(new AppError("Campaign not found", 404, "NOT_FOUND"));
    }
    if (campaign.userId !== userId) {
      return next(new AppError("Unauthorized", 403, "FORBIDDEN"));
    }

    await campaignAgent.deleteCampaign(id);

    res.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/campaigns/:id/schedule - Schedule campaign
 */
router.post("/api/campaigns/:id/schedule", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    const body = scheduleCampaignSchema.parse(req.body);
    
    // Check campaign exists and user owns it
    const campaign = await campaignAgent.getCampaign(id);
    if (!campaign) {
      return next(new AppError("Campaign not found", 404, "NOT_FOUND"));
    }
    if (campaign.userId !== userId) {
      return next(new AppError("Unauthorized", 403, "FORBIDDEN"));
    }

    const result = await campaignAgent.scheduleCampaign({
      campaignId: id,
      schedule: {
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        emailSequence: body.emailSequence as Array<{
          day: number;
          subject: string;
          body: string;
        }>,
        socialPosts: body.socialPosts?.map(post => ({
          platform: post.platform as SocialPlatform,
          content: post.content as string,
          scheduledFor: new Date(post.scheduledFor),
        })),
      },
      userId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR"));
    }
    next(error);
  }
});

/**
 * POST /api/campaigns/:id/ab-test - Run A/B test
 */
router.post("/api/campaigns/:id/ab-test", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    const body = runABTestSchema.parse(req.body);
    
    // Check campaign exists and user owns it
    const campaign = await campaignAgent.getCampaign(id);
    if (!campaign) {
      return next(new AppError("Campaign not found", 404, "NOT_FOUND"));
    }
    if (campaign.userId !== userId) {
      return next(new AppError("Unauthorized", 403, "FORBIDDEN"));
    }

    const result = await campaignAgent.runABTest(id, body.variants, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR"));
    }
    next(error);
  }
});

/**
 * GET /api/campaigns/:id/analytics - Get campaign analytics
 */
router.get("/api/campaigns/:id/analytics", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    getCampaignMetricsQuerySchema.parse(req.query);
    
    // Check campaign exists and user owns it
    const campaign = await campaignAgent.getCampaign(id);
    if (!campaign) {
      return next(new AppError("Campaign not found", 404, "NOT_FOUND"));
    }
    if (campaign.userId !== userId) {
      return next(new AppError("Unauthorized", 403, "FORBIDDEN"));
    }

    const metrics = await campaignAgent.getCampaignMetrics(id);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR"));
    }
    next(error);
  }
});

/**
 * POST /api/campaigns/:id/optimize - Optimize campaign
 */
router.post("/api/campaigns/:id/optimize", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    const body = optimizeCampaignSchema.parse(req.body);
    
    // Check campaign exists and user owns it
    const campaign = await campaignAgent.getCampaign(id);
    if (!campaign) {
      return next(new AppError("Campaign not found", 404, "NOT_FOUND"));
    }
    if (campaign.userId !== userId) {
      return next(new AppError("Unauthorized", 403, "FORBIDDEN"));
    }

    const result = await campaignAgent.optimizeCampaign({
      campaignId: id,
      optimizationGoals: body.optimizationGoals,
      userId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR"));
    }
    next(error);
  }
});

/**
 * POST /api/campaigns/:id/email/sequence - Generate email sequence
 */
router.post("/api/campaigns/:id/email/sequence", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    const body = generateEmailSequenceSchema.parse(req.body);
    
    // Check campaign exists
    const campaign = await campaignAgent.getCampaign(id);
    if (!campaign) {
      return next(new AppError("Campaign not found", 404, "NOT_FOUND"));
    }
    if (campaign.userId !== userId) {
      return next(new AppError("Unauthorized", 403, "FORBIDDEN"));
    }

    const result = await emailAgent.generateSequence({
      topic: body.topic as string,
      audience: body.audience,
      numEmails: body.numEmails,
      tone: body.tone,
      createdById: userId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR"));
    }
    next(error);
  }
});

/**
 * POST /api/campaigns/email/optimize-subject - Optimize email subject line
 */
router.post("/api/campaigns/email/optimize-subject", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    const body = optimizeSubjectLineSchema.parse(req.body);
    
    const result = await emailAgent.optimizeSubjectLine({
      originalSubject: body.originalSubject as string,
      context: body.context,
      createdById: userId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR"));
    }
    next(error);
  }
});

/**
 * POST /api/campaigns/social/generate - Generate social post
 */
router.post("/api/campaigns/social/generate", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    const body = generateSocialPostSchema.parse(req.body);
    
    const result = await socialAgent.generatePost({
      content: body.content as string,
      platform: body.platform as SocialPlatform,
      tone: body.tone,
      includeHashtags: body.includeHashtags,
      createdById: userId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR"));
    }
    next(error);
  }
});

/**
 * POST /api/campaigns/social/optimize - Optimize content for platform
 */
router.post("/api/campaigns/social/optimize", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    const body = optimizeForPlatformSchema.parse(req.body);
    
    const result = await socialAgent.optimizeForPlatform({
      content: body.content as string,
      platform: body.platform as SocialPlatform,
      createdById: userId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR"));
    }
    next(error);
  }
});

/**
 * POST /api/campaigns/:id/social/schedule - Schedule social post
 */
router.post("/api/campaigns/:id/social/schedule", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    const body = schedulePostSchema.parse(req.body);
    
    // Check campaign exists
    const campaign = await campaignAgent.getCampaign(id);
    if (!campaign) {
      return next(new AppError("Campaign not found", 404, "NOT_FOUND"));
    }
    if (campaign.userId !== userId) {
      return next(new AppError("Unauthorized", 403, "FORBIDDEN"));
    }

    const result = await socialAgent.schedulePost({
      campaignId: id,
      platform: body.platform,
      content: body.content,
      mediaUrls: body.mediaUrls,
      scheduledFor: new Date(body.scheduledFor),
      createdById: userId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation failed", 400, "VALIDATION_ERROR"));
    }
    next(error);
  }
});

/**
 * PATCH /api/campaigns/:id/status - Update campaign status
 */
router.patch("/api/campaigns/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user-id";
    
    const { status } = req.body;
    
    if (!["draft", "scheduled", "active", "paused", "completed"].includes(status)) {
      return next(new AppError("Invalid status", 400, "VALIDATION_ERROR"));
    }

    // Check campaign exists and user owns it
    const campaign = await campaignAgent.getCampaign(id);
    if (!campaign) {
      return next(new AppError("Campaign not found", 404, "NOT_FOUND"));
    }
    if (campaign.userId !== userId) {
      return next(new AppError("Unauthorized", 403, "FORBIDDEN"));
    }

    await campaignAgent.updateCampaignStatus(id, status);
    
    const updated = await campaignAgent.getCampaign(id);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

logger.info("Campaign routes registered");

export const campaignRouter = router;