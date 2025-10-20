import { z } from "zod";

export const campaignTypeSchema = z.enum(['email', 'social', 'multi-channel']);
export const campaignStatusSchema = z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']);
export const socialPlatformSchema = z.enum(['twitter', 'linkedin', 'facebook', 'instagram']);

export const campaignConfigSchema = z.object({
  channels: z.array(z.string()).min(1, "At least one channel is required"),
  targeting: z.object({
    audience: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  budget: z.object({
    total: z.number().positive("Budget must be positive"),
    currency: z.string().length(3, "Currency must be 3-letter code"),
  }).optional(),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(100, "Name too long"),
  type: campaignTypeSchema,
  config: campaignConfigSchema,
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: campaignStatusSchema.optional(),
  config: campaignConfigSchema.optional(),
  schedule: z.object({
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()).optional(),
    timezone: z.string().optional(),
  }).optional(),
});

export const scheduleCampaignSchema = z.object({
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
  emailSequence: z.array(z.object({
    day: z.number().int().min(0, "Day must be 0 or greater"),
    subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
    body: z.string().min(1, "Body is required"),
  })).optional(),
  socialPosts: z.array(z.object({
    platform: socialPlatformSchema,
    content: z.string().min(1, "Content is required"),
    mediaUrls: z.array(z.string().url()).optional(),
    scheduledFor: z.string().datetime().or(z.date()),
  })).optional(),
});

export const generateEmailSequenceSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  audience: z.string().optional(),
  numEmails: z.number().int().min(1).max(10).optional(),
  tone: z.enum(['professional', 'casual', 'friendly']).optional(),
});

export const optimizeSubjectLineSchema = z.object({
  originalSubject: z.string().min(1, "Original subject is required"),
  context: z.string().optional(),
});

export const runABTestSchema = z.object({
  variants: z.array(z.object({
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
  })).min(2, "At least 2 variants required").max(5, "Maximum 5 variants"),
});

export const generateSocialPostSchema = z.object({
  content: z.string().min(1, "Content is required"),
  platform: socialPlatformSchema,
  tone: z.enum(['professional', 'casual', 'engaging']).optional(),
  includeHashtags: z.boolean().optional(),
});

export const optimizeForPlatformSchema = z.object({
  content: z.string().min(1, "Content is required"),
  platform: socialPlatformSchema,
});

export const schedulePostSchema = z.object({
  platform: socialPlatformSchema,
  content: z.string().min(1, "Content is required"),
  mediaUrls: z.array(z.string().url()).optional(),
  scheduledFor: z.string().datetime().or(z.date()),
});

export const optimizeCampaignSchema = z.object({
  optimizationGoals: z.array(z.string()).min(1, "At least one goal required"),
});

export const getCampaignMetricsQuerySchema = z.object({
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  includeDetails: z.boolean().optional(),
});

export const listCampaignsQuerySchema = z.object({
  status: campaignStatusSchema.optional(),
  type: campaignTypeSchema.optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});