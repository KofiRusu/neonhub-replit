import { prisma } from "../db/prisma.js";
import { agentJobManager } from "./base/AgentJobManager.js";
import { logger } from "../lib/logger.js";
import { broadcast } from "../ws/index.js";
import { emailAgent } from "./EmailAgent.js";
import { socialAgent, type SocialPlatform } from "./SocialAgent.js";
import type { Prisma } from "@prisma/client";
import { connectById } from "../lib/mappers.js";

export type CampaignType = "email" | "social" | "multi-channel";
export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed";

export interface CreateCampaignInput {
  name: string;
  type: CampaignType;
  config: {
    channels?: string[];
    targeting?: {
      audience?: string;
      tags?: string[];
    };
    budget?: {
      total?: number;
      currency?: string;
    };
  };
  ownerId: string;
  organizationId?: string;
}

export interface ScheduleCampaignInput {
  campaignId: string;
  schedule: {
    startDate: Date;
    endDate?: Date;
    emailSequence?: Array<{
      day: number;
      subject: string;
      body: string;
    }>;
    socialPosts?: Array<{
      platform: SocialPlatform;
      content: string;
      scheduledFor: Date;
    }>;
  };
  requestedById?: string;
}

export interface OptimizeCampaignInput {
  campaignId: string;
  optimizationGoals: string[];
  requestedById?: string;
}

/**
 * CampaignAgent - Orchestrates multi-channel marketing campaigns
 */
export class CampaignAgent {
  private readonly agentName = "campaign";

  private async resolveOrganizationId(userId: string): Promise<string> {
    const membership = await prisma.organizationMembership.findFirst({
      where: { userId },
      select: { organizationId: true },
    });

    if (!membership) {
      throw new Error("Organization context not found");
    }

    return membership.organizationId;
  }

  /**
   * Create a new campaign
   */
  async createCampaign(input: CreateCampaignInput): Promise<{ jobId: string; campaignId: string }> {
    const startTime = Date.now();
    
    const jobId = await agentJobManager.createJob({
      agent: this.agentName,
      input,
      createdById: input.ownerId,
    });

    try {
      await agentJobManager.startJob(jobId);

      const organizationId =
        input.organizationId ?? (await this.resolveOrganizationId(input.ownerId));

      const owner = connectById(input.ownerId);
      const organization = connectById(organizationId);

      if (!owner || !organization) {
        throw new Error("Unable to resolve campaign ownership context");
      }

      const config = input.config ? (input.config as Prisma.InputJsonValue) : undefined;

      const campaign = await prisma.campaign.create({
        data: {
          name: input.name,
          type: input.type,
          status: "draft",
          ...(config !== undefined ? { config } : {}),
          owner,
          organization,
        },
      });

      const duration = Date.now() - startTime;

      await agentJobManager.completeJob(
        jobId,
        {
          campaignId: campaign.id,
          name: campaign.name,
          type: campaign.type,
        },
        {
          duration,
        }
      );

      logger.info({
        jobId,
        campaignId: campaign.id,
        type: campaign.type,
        duration,
      }, "Campaign created");

      broadcast("campaign:created", {
        campaignId: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
      });

      return {
        jobId,
        campaignId: campaign.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({ jobId, error: errorMessage }, "Campaign creation failed");
      
      await agentJobManager.failJob(jobId, errorMessage);
      
      throw error;
    }
  }

  /**
   * Schedule a campaign with email sequences and social posts
   */
  async scheduleCampaign(input: ScheduleCampaignInput): Promise<{ jobId: string; scheduled: any }> {
    const startTime = Date.now();
    
    const jobId = await agentJobManager.createJob({
      agent: this.agentName,
      input,
      createdById: input.requestedById,
    });

    try {
      await agentJobManager.startJob(jobId);

      const campaign = await prisma.campaign.findUnique({
        where: { id: input.campaignId },
      });

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const scheduled: any = {
        emails: [],
        posts: [],
      };

      // Schedule email sequences if provided
      if (input.schedule.emailSequence && input.schedule.emailSequence.length > 0) {
        for (const email of input.schedule.emailSequence) {
          const scheduledFor = new Date(input.schedule.startDate);
          scheduledFor.setDate(scheduledFor.getDate() + email.day);

          const emailSeq = await prisma.emailSequence.create({
            data: {
              campaignId: input.campaignId,
              subject: email.subject,
              body: email.body,
              scheduledFor,
            },
          });

          scheduled.emails.push({
            id: emailSeq.id,
            day: email.day,
            scheduledFor,
          });
        }
      }

      // Schedule social posts if provided
      if (input.schedule.socialPosts && input.schedule.socialPosts.length > 0) {
        for (const post of input.schedule.socialPosts) {
          const socialPost = await prisma.socialPost.create({
            data: {
              campaignId: input.campaignId,
              platform: post.platform,
              content: post.content,
              scheduledFor: post.scheduledFor,
            },
          });

          scheduled.posts.push({
            id: socialPost.id,
            platform: post.platform,
            scheduledFor: post.scheduledFor,
          });
        }
      }

      // Update campaign status and schedule
      await prisma.campaign.update({
        where: { id: input.campaignId },
        data: {
          status: "scheduled",
          schedule: {
            startDate: input.schedule.startDate,
            endDate: input.schedule.endDate,
          },
        },
      });

      const duration = Date.now() - startTime;

      await agentJobManager.completeJob(
        jobId,
        {
          campaignId: input.campaignId,
          scheduled,
        },
        {
          duration,
        }
      );

      logger.info({
        jobId,
        campaignId: input.campaignId,
        emailCount: scheduled.emails.length,
        postCount: scheduled.posts.length,
        duration,
      }, "Campaign scheduled");

      broadcast("campaign:scheduled", {
        campaignId: input.campaignId,
        startDate: input.schedule.startDate,
        emailCount: scheduled.emails.length,
        postCount: scheduled.posts.length,
      });

      return {
        jobId,
        scheduled,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({ jobId, error: errorMessage }, "Campaign scheduling failed");
      
      await agentJobManager.failJob(jobId, errorMessage);
      
      throw error;
    }
  }

  /**
   * Run A/B test for campaign
   */
  async runABTest(campaignId: string, variants: any[], requestedById?: string): Promise<{ jobId: string; testId: string }> {
    const startTime = Date.now();
    
    const jobId = await agentJobManager.createJob({
      agent: this.agentName,
      input: { campaignId, variants },
      createdById: requestedById,
    });

    try {
      await agentJobManager.startJob(jobId);

      // Use EmailAgent to create A/B test
      const result = await emailAgent.runABTest({
        campaignId,
        variants,
        createdById: requestedById,
      });

      const duration = Date.now() - startTime;

      await agentJobManager.completeJob(
        jobId,
        {
          testId: result.testId,
          variantCount: variants.length,
        },
        {
          duration,
        }
      );

      logger.info({
        jobId,
        campaignId,
        testId: result.testId,
        duration,
      }, "A/B test initiated");

      return {
        jobId,
        testId: result.testId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({ jobId, error: errorMessage }, "A/B test failed");
      
      await agentJobManager.failJob(jobId, errorMessage);
      
      throw error;
    }
  }

  /**
   * Get comprehensive campaign metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<any> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        emailSequences: {
          select: {
            id: true,
            subject: true,
            sentAt: true,
            metrics: true,
          },
        },
        socialPosts: {
          select: {
            id: true,
            platform: true,
            publishedAt: true,
            metrics: true,
          },
        },
        abTests: {
          select: {
            id: true,
            name: true,
            winner: true,
            metrics: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Calculate email metrics
    const emailMetrics = await emailAgent.analyzePerformance(campaignId);

    // Calculate social metrics
    const socialMetrics = await socialAgent.getAnalytics({ campaignId });

    // Overall campaign metrics
    const overallMetrics = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        createdAt: campaign.createdAt,
      },
      email: emailMetrics,
      social: socialMetrics,
      abTests: campaign.abTests.map(test => ({
        id: test.id,
        name: test.name,
        winner: test.winner,
        metrics: test.metrics,
      })),
    };

    return overallMetrics;
  }

  /**
   * Optimize campaign based on performance data
   */
  async optimizeCampaign(input: OptimizeCampaignInput): Promise<{ jobId: string; recommendations: string[] }> {
    const startTime = Date.now();
    
    const jobId = await agentJobManager.createJob({
      agent: this.agentName,
      input,
      createdById: input.requestedById,
    });

    try {
      await agentJobManager.startJob(jobId);

      // Get current metrics
      const metrics = await this.getCampaignMetrics(input.campaignId);

      // Generate optimization recommendations
      const recommendations: string[] = [];

      // Email optimization recommendations
      if (metrics.email.openRate < 20) {
        recommendations.push("Improve email subject lines - current open rate is below industry average");
      }
      if (metrics.email.clickRate < 2) {
        recommendations.push("Add stronger call-to-actions to improve click-through rate");
      }

      // Social optimization recommendations
      if (metrics.social.byPlatform) {
        metrics.social.byPlatform.forEach((platform: any) => {
          const engagementRate = platform.totalLikes / (platform.totalImpressions || 1);
          if (engagementRate < 0.02) {
            recommendations.push(`Optimize ${platform.platform} content for better engagement`);
          }
        });
      }

      // A/B test recommendations
      if (metrics.abTests.length === 0) {
        recommendations.push("Run A/B tests to identify best-performing content");
      }

      // General recommendations
      if (input.optimizationGoals.includes("conversion")) {
        recommendations.push("Focus on conversion-optimized landing pages");
      }
      if (input.optimizationGoals.includes("reach")) {
        recommendations.push("Increase posting frequency and use trending hashtags");
      }

      const duration = Date.now() - startTime;

      await agentJobManager.completeJob(
        jobId,
        {
          campaignId: input.campaignId,
          recommendations,
          currentMetrics: metrics,
        },
        {
          duration,
        }
      );

      logger.info({
        jobId,
        campaignId: input.campaignId,
        recommendationCount: recommendations.length,
        duration,
      }, "Campaign optimization complete");

      broadcast("campaign:optimized", {
        campaignId: input.campaignId,
        recommendations,
      });

      return {
        jobId,
        recommendations,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({ jobId, error: errorMessage }, "Campaign optimization failed");
      
      await agentJobManager.failJob(jobId, errorMessage);
      
      throw error;
    }
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status },
    });

    logger.info({ campaignId, status }, "Campaign status updated");

    broadcast("campaign:status:changed", {
      campaignId,
      status,
    });
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string) {
    return prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        emailSequences: true,
        socialPosts: true,
        abTests: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * List user campaigns
   */
  async listCampaigns(ownerId: string, filters?: { status?: CampaignStatus; type?: CampaignType }) {
    const where: Prisma.CampaignWhereInput = {
      ownerId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
    };

    return prisma.campaign.findMany({
      where,
      include: {
        _count: {
          select: {
            emailSequences: true,
            socialPosts: true,
            abTests: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    await prisma.campaign.delete({
      where: { id: campaignId },
    });

    logger.info({ campaignId }, "Campaign deleted");

    broadcast("campaign:deleted", {
      campaignId,
    });
  }
}

export const campaignAgent = new CampaignAgent();
