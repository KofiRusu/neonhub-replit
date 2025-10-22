import { Router } from "express";
import { agentJobManager } from "../agents/base/AgentJobManager.js";
import { NotFoundError } from "../lib/errors.js";
import { getAuthenticatedUserId } from "../lib/requestUser.js";

export const jobsRouter = Router();

// Get job status
jobsRouter.get("/jobs/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getAuthenticatedUserId(req);

    const job = await agentJobManager.getJob(id);

    if (!job || job.createdById !== userId) {
      throw new NotFoundError("Job not found");
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
});

// Get all jobs (paginated)
jobsRouter.get("/jobs", async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const agent = req.query.agent as string | undefined;

    const where = {
      createdById: userId,
      ...(agent ? { agent } : {}),
    };

    const [jobs, total] = await Promise.all([
      prisma.agentJob.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.agentJob.count({ where }),
    ]);

    res.json({
      success: true,
      data: jobs,
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

// Import prisma for the jobs list route
import { prisma } from "../db/prisma.js";
