import { generateText } from "../ai/openai.js";
import { prisma } from "../db/prisma.js";
import { agentJobManager } from "./base/AgentJobManager.js";
import { logger } from "../lib/logger.js";
import { broadcast } from "../ws/index.js";
import { normalizePostInput } from "./_shared/normalize.js";
import type { GeneratePostInput, SocialPlatform } from "./_shared/normalize.js";

export type { GeneratePostInput, SocialPlatform } from "./_shared/normalize.js";

export interface OptimizeForPlatformInput {
  content: string;
  platform: SocialPlatform;
  createdById?: string;
}

export interface SchedulePostInput {
  campaignId: string;
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  scheduledFor: Date;
  createdById?: string;
}

export interface GetAnalyticsInput {
  campaignId: string;
  platform?: SocialPlatform;
}

export interface GeneratePostOutput {
  jobId: string;
  content: string;
  hashtags?: string[];
  estimatedReach?: number;
}

/**
 * SocialAgent - Generates and optimizes social media content
 */
export class SocialAgent {
  private readonly agentName = "social";

  // Platform-specific constraints
  private readonly platformLimits = {
    twitter: { maxLength: 280, optimal: 250 },
    linkedin: { maxLength: 3000, optimal: 150 },
    facebook: { maxLength: 63206, optimal: 250 },
    instagram: { maxLength: 2200, optimal: 138 },
  };

  /**
   * Generate platform-optimized social media post
   */
  async generatePost(input: GeneratePostInput): Promise<GeneratePostOutput> {
    const startTime = Date.now();

    const normalized = normalizePostInput(input);
    
    const jobId = await agentJobManager.createJob({
      agent: this.agentName,
      input: normalized,
      createdById: normalized.createdById,
    });

    try {
      await agentJobManager.startJob(jobId);

      const platform = normalized.platform;
      const limits = this.platformLimits[platform] ?? this.platformLimits.twitter;
      const tone = normalized.tone === "authoritative" ? "professional" : normalized.tone;
      const contentTopic = normalized.content || normalized.topic;
      const hashtagDirective =
        normalized.includeHashtags && normalized.hashtags.length > 0
          ? `Use these hashtags: ${normalized.hashtags.join(", ")}`
          : normalized.includeHashtags
          ? "Include relevant hashtags"
          : "No hashtags";

      const prompt = `Create a ${platform} post about: ${contentTopic}

Platform: ${platform}
Tone: ${tone}
Character limit: ${limits.maxLength} (optimal: ${limits.optimal})
${hashtagDirective}
Call to action: ${normalized.callToAction}
Brand ID: ${normalized.brandId}

Requirements:
${this.getPlatformRequirements(platform)}

Return as JSON with format:
{
  "content": "Post content",
  "hashtags": ["tag1", "tag2"],
  "estimatedReach": 1000
}`;

      logger.info(
        { jobId, platform, contentLength: contentTopic.length, includeHashtags: normalized.includeHashtags },
        "Generating social post with AI"
      );

      const result = await generateText({
        prompt,
        temperature: 0.8,
        maxTokens: 500,
        systemPrompt: this.getPlatformSystemPrompt(platform),
      });

      const generated = this.parseGeneratedPost(result.text, platform);

      const duration = Date.now() - startTime;

      await agentJobManager.completeJob(
        jobId,
        {
          ...generated,
          platform,
          mock: result.mock,
        },
        {
          duration,
          tokens: result.usage?.totalTokens || 0,
          model: result.model,
        }
      );

      logger.info({
        jobId,
        platform,
        contentLength: generated.content.length,
        duration,
        mock: result.mock,
      }, "Social post generation complete");

      broadcast("metrics:delta", {
        type: "social_post_created",
        increment: 1,
        platform,
        timestamp: new Date(),
      });

      return {
        jobId,
        ...generated,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({ jobId, error: errorMessage }, "Social post generation failed");
      
      await agentJobManager.failJob(jobId, errorMessage);
      
      throw error;
    }
  }

  /**
   * Optimize content for specific platform
   */
  async optimizeForPlatform(input: OptimizeForPlatformInput): Promise<GeneratePostOutput> {
    const startTime = Date.now();
    
    const jobId = await agentJobManager.createJob({
      agent: this.agentName,
      input,
      createdById: input.createdById,
    });

    try {
      await agentJobManager.startJob(jobId);

      const limits = this.platformLimits[input.platform];

      const prompt = `Optimize this content for ${input.platform}:

Original: "${input.content}"

Platform constraints:
- Max length: ${limits.maxLength} characters
- Optimal length: ${limits.optimal} characters
${this.getPlatformRequirements(input.platform)}

Return optimized version as JSON:
{
  "content": "Optimized content",
  "hashtags": ["relevant", "tags"],
  "estimatedReach": 1500
}`;

      logger.info({ jobId, platform: input.platform }, "Optimizing content for platform");

      const result = await generateText({
        prompt,
        temperature: 0.7,
        maxTokens: 400,
        systemPrompt: this.getPlatformSystemPrompt(input.platform),
      });

      const optimized = this.parseGeneratedPost(result.text, input.platform);

      const duration = Date.now() - startTime;

      await agentJobManager.completeJob(
        jobId,
        {
          ...optimized,
          platform: input.platform,
          mock: result.mock,
        },
        {
          duration,
          tokens: result.usage?.totalTokens || 0,
          model: result.model,
        }
      );

      logger.info({
        jobId,
        platform: input.platform,
        duration,
        mock: result.mock,
      }, "Content optimization complete");

      return {
        jobId,
        ...optimized,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({ jobId, error: errorMessage }, "Content optimization failed");
      
      await agentJobManager.failJob(jobId, errorMessage);
      
      throw error;
    }
  }

  /**
   * Schedule a post for publishing
   */
  async schedulePost(input: SchedulePostInput): Promise<{ jobId: string; postId: string }> {
    const startTime = Date.now();
    
    const jobId = await agentJobManager.createJob({
      agent: this.agentName,
      input,
      createdById: input.createdById,
    });

    try {
      await agentJobManager.startJob(jobId);

      // Create social post record
      const post = await prisma.socialPost.create({
        data: {
          campaignId: input.campaignId,
          platform: input.platform,
          content: input.content,
          mediaUrls: input.mediaUrls || null,
          scheduledFor: input.scheduledFor,
        },
      });

      const duration = Date.now() - startTime;

      await agentJobManager.completeJob(
        jobId,
        {
          postId: post.id,
          platform: input.platform,
          scheduledFor: input.scheduledFor,
        },
        {
          duration,
        }
      );

      logger.info({
        jobId,
        postId: post.id,
        platform: input.platform,
        duration,
      }, "Post scheduled");

      broadcast("campaign:post:scheduled", {
        postId: post.id,
        campaignId: input.campaignId,
        platform: input.platform,
        scheduledFor: input.scheduledFor,
      });

      return {
        jobId,
        postId: post.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({ jobId, error: errorMessage }, "Post scheduling failed");
      
      await agentJobManager.failJob(jobId, errorMessage);
      
      throw error;
    }
  }

  /**
   * Get analytics for social posts
   */
  async getAnalytics(input: GetAnalyticsInput): Promise<any> {
    const where: any = { campaignId: input.campaignId };
    if (input.platform) {
      where.platform = input.platform;
    }

    const posts = await prisma.socialPost.findMany({
      where,
      select: {
        id: true,
        platform: true,
        publishedAt: true,
        metrics: true,
      },
    });

    const byPlatform: Record<string, any> = {};

    posts.forEach(post => {
      if (!byPlatform[post.platform]) {
        byPlatform[post.platform] = {
          platform: post.platform,
          posts: 0,
          published: 0,
          totalImpressions: 0,
          totalLikes: 0,
          totalShares: 0,
          totalComments: 0,
          totalClicks: 0,
        };
      }

      const metrics = post.metrics as any;
      byPlatform[post.platform].posts++;
      
      if (post.publishedAt) {
        byPlatform[post.platform].published++;
        if (metrics) {
          byPlatform[post.platform].totalImpressions += metrics.impressions || 0;
          byPlatform[post.platform].totalLikes += metrics.likes || 0;
          byPlatform[post.platform].totalShares += metrics.shares || 0;
          byPlatform[post.platform].totalComments += metrics.comments || 0;
          byPlatform[post.platform].totalClicks += metrics.clicks || 0;
        }
      }
    });

    const aggregated = Object.values(byPlatform);
    
    const total = {
      totalPosts: posts.length,
      totalPublished: posts.filter(p => p.publishedAt).length,
      byPlatform: aggregated,
    };

    return total;
  }

  /**
   * Get platform-specific requirements
   */
  private getPlatformRequirements(platform: SocialPlatform): string {
    const requirements = {
      twitter: `- Use concise, punchy language
- Include call-to-action
- Emojis are encouraged
- Optimize for engagement`,
      linkedin: `- Professional tone
- Value-driven content
- Include industry insights
- Thought leadership angle`,
      facebook: `- Conversational tone
- Story-driven content
- Community engagement
- Visual content friendly`,
      instagram: `- Visual-first mindset
- Lifestyle/aesthetic focus
- Strong call-to-action
- Strategic hashtag use`,
    };

    return requirements[platform] || "- Engaging content\n- Clear message";
  }

  /**
   * Get platform-specific system prompt
   */
  private getPlatformSystemPrompt(platform: SocialPlatform): string {
    const prompts = {
      twitter: "You are a Twitter marketing expert. Create concise, engaging tweets that drive conversation and retweets.",
      linkedin: "You are a LinkedIn content strategist. Create professional, thought-leading posts that establish authority.",
      facebook: "You are a Facebook marketing specialist. Create community-focused posts that encourage sharing and commenting.",
      instagram: "You are an Instagram content creator. Create visually-oriented, lifestyle posts with strategic hashtag use.",
    };

    return prompts[platform] || "You are a social media marketing expert.";
  }

  /**
   * Parse generated post from AI response
   */
  private parseGeneratedPost(text: string, platform: SocialPlatform): {
    content: string;
    hashtags?: string[];
    estimatedReach?: number;
  } {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          content: this.enforceLimit(parsed.content || text, platform),
          hashtags: parsed.hashtags || [],
          estimatedReach: parsed.estimatedReach || 1000,
        };
      }
    } catch (error) {
      logger.warn({ error }, "Failed to parse post as JSON, using fallback");
    }

    // Fallback: Use text directly
    return {
      content: this.enforceLimit(text, platform),
      hashtags: this.extractHashtags(text),
      estimatedReach: 1000,
    };
  }

  /**
   * Enforce platform character limits
   */
  private enforceLimit(content: string, platform: SocialPlatform): string {
    const limit = this.platformLimits[platform].maxLength;
    if (content.length <= limit) {
      return content;
    }
    return content.substring(0, limit - 3) + "...";
  }

  /**
   * Extract hashtags from text
   */
  private extractHashtags(text: string): string[] {
    const matches = text.match(/#\w+/g);
    return matches ? matches.slice(0, 5) : [];
  }
}

export const socialAgent = new SocialAgent();
