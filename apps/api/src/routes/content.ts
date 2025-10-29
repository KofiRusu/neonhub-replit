import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { GenerateContentRequestSchema } from "../types/index.js";
import { AppError, ValidationError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { contentAgent } from "../agents/content/ContentAgent.js";
import { getAuthenticatedUserId } from "../lib/requestUser.js";

export const contentRouter: Router = Router();

// Generate content using ContentAgent
contentRouter.post("/content/generate", async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = GenerateContentRequestSchema.safeParse(req.body);
    
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { topic, tone, audience, notes, brandId, brandVoiceId, campaignGoal, callToAction } = result.data;

    // Use real ContentAgent to generate content
    const output = await contentAgent.generateArticle({
      topic,
      primaryKeyword: topic,
      tone: tone as any,
      audience,
      callToAction,
      brandId,
      brandVoiceId,
      createdById: userId,
    });

    logger.info({ draftId: output.draftId, jobId: output.jobId, topic }, "Content generation initiated");

    res.json({
      success: true,
      data: {
        jobId: output.jobId,
        draftId: output.draftId,
        title: output.title,
        summary: output.summary,
        meta: output.meta,
        schema: output.schema,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get all drafts (paginated)
contentRouter.get("/content/drafts", async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [drafts, total] = await Promise.all([
      prisma.contentDraft.findMany({
        where: {
          createdById: userId,
        },
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      prisma.contentDraft.count({
        where: {
          createdById: userId,
        },
      }),
    ]);

    res.json({
      success: true,
      data: drafts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single draft
contentRouter.get("/content/drafts/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getAuthenticatedUserId(req);

    const draft = await prisma.contentDraft.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        error: "Draft not found",
      });
    }
    if (draft.createdById !== userId) {
      return next(new AppError("Unauthorized", 403, "FORBIDDEN"));
    }

    res.json({
      success: true,
      data: draft,
    });
  } catch (error) {
    next(error);
  }
});
