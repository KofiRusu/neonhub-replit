import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";
import { AppError } from "../lib/errors.js";
import { z } from "zod";
import { MarketingCampaignStatus, MarketingCampaignType } from "@prisma/client";

const marketingRouter: Router = Router();

const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(MarketingCampaignType),
  status: z.nativeEnum(MarketingCampaignStatus).optional(),
  brandId: z.string().optional(),
  budget: z.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

async function resolveOrganizationId(userId: string) {
  const membership = await prisma.organizationMembership.findFirst({
    where: { userId },
    select: { organizationId: true },
  });

  return membership?.organizationId ?? null;
}

marketingRouter.get("/overview", async (req, res, next) => {
  try {
    const { user } = req as AuthRequest;
    if (!user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const organizationId = await resolveOrganizationId(user.id);
    if (!organizationId) {
      throw new AppError("Organization context missing", 400, "MISSING_ORGANIZATION");
    }

    const [campaigns, leads, metrics] = await Promise.all([
      prisma.marketingCampaign.count({ where: { organizationId } }),
      prisma.marketingLead.count({ where: { organizationId } }),
      prisma.marketingMetric.findMany({
        where: { organizationId },
        orderBy: { date: "desc" },
        take: 30,
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalCampaigns: campaigns,
        totalLeads: leads,
        recentMetrics: metrics,
      },
    });
  } catch (error) {
    next(error);
  }
});

marketingRouter.get("/campaigns", async (req, res, next) => {
  try {
    const { user } = req as AuthRequest;
    if (!user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const organizationId = await resolveOrganizationId(user.id);
    if (!organizationId) {
      throw new AppError("Organization context missing", 400, "MISSING_ORGANIZATION");
    }

    const campaigns = await prisma.marketingCampaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
});

marketingRouter.post("/campaigns", async (req, res, next) => {
  try {
    const { user } = req as AuthRequest;
    if (!user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const organizationId = await resolveOrganizationId(user.id);
    if (!organizationId) {
      throw new AppError("Organization context missing", 400, "MISSING_ORGANIZATION");
    }

    const payload = createCampaignSchema.parse(req.body);

    const newCampaign = await prisma.marketingCampaign.create({
      data: {
        organizationId,
        name: payload.name,
        description: payload.description,
        type: payload.type,
        status: payload.status ?? MarketingCampaignStatus.draft,
        brandId: payload.brandId,
        budget: payload.budget,
        startDate: payload.startDate ?? new Date(),
        endDate: payload.endDate,
      },
    });

    res.status(201).json({ success: true, data: newCampaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0]?.message ?? "Invalid payload" });
      return;
    }

    next(error);
  }
});

export { marketingRouter };
