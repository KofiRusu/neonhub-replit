"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCampaignsQuerySchema = exports.getCampaignMetricsQuerySchema = exports.optimizeCampaignSchema = exports.schedulePostSchema = exports.optimizeForPlatformSchema = exports.generateSocialPostSchema = exports.runABTestSchema = exports.optimizeSubjectLineSchema = exports.generateEmailSequenceSchema = exports.scheduleCampaignSchema = exports.updateCampaignSchema = exports.createCampaignSchema = exports.campaignConfigSchema = exports.socialPlatformSchema = exports.campaignStatusSchema = exports.campaignTypeSchema = void 0;
var zod_1 = require("zod");
exports.campaignTypeSchema = zod_1.z.enum(['email', 'social', 'multi-channel']);
exports.campaignStatusSchema = zod_1.z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']);
exports.socialPlatformSchema = zod_1.z.enum(['twitter', 'linkedin', 'facebook', 'instagram']);
exports.campaignConfigSchema = zod_1.z.object({
    channels: zod_1.z.array(zod_1.z.string()).min(1, "At least one channel is required"),
    targeting: zod_1.z.object({
        audience: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
    budget: zod_1.z.object({
        total: zod_1.z.number().positive("Budget must be positive"),
        currency: zod_1.z.string().length(3, "Currency must be 3-letter code"),
    }).optional(),
});
exports.createCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Campaign name is required").max(100, "Name too long"),
    type: exports.campaignTypeSchema,
    config: exports.campaignConfigSchema,
});
exports.updateCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    status: exports.campaignStatusSchema.optional(),
    config: exports.campaignConfigSchema.optional(),
    schedule: zod_1.z.object({
        startDate: zod_1.z.string().datetime().or(zod_1.z.date()),
        endDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        timezone: zod_1.z.string().optional(),
    }).optional(),
});
exports.scheduleCampaignSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().or(zod_1.z.date()),
    endDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    emailSequence: zod_1.z.array(zod_1.z.object({
        day: zod_1.z.number().int().min(0, "Day must be 0 or greater"),
        subject: zod_1.z.string().min(1, "Subject is required").max(200, "Subject too long"),
        body: zod_1.z.string().min(1, "Body is required"),
    })).optional(),
    socialPosts: zod_1.z.array(zod_1.z.object({
        platform: exports.socialPlatformSchema,
        content: zod_1.z.string().min(1, "Content is required"),
        mediaUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
        scheduledFor: zod_1.z.string().datetime().or(zod_1.z.date()),
    })).optional(),
});
exports.generateEmailSequenceSchema = zod_1.z.object({
    topic: zod_1.z.string().min(1, "Topic is required"),
    audience: zod_1.z.string().optional(),
    numEmails: zod_1.z.number().int().min(1).max(10).optional(),
    tone: zod_1.z.enum(['professional', 'casual', 'friendly']).optional(),
});
exports.optimizeSubjectLineSchema = zod_1.z.object({
    originalSubject: zod_1.z.string().min(1, "Original subject is required"),
    context: zod_1.z.string().optional(),
});
exports.runABTestSchema = zod_1.z.object({
    variants: zod_1.z.array(zod_1.z.object({
        subject: zod_1.z.string().min(1, "Subject is required"),
        body: zod_1.z.string().min(1, "Body is required"),
    })).min(2, "At least 2 variants required").max(5, "Maximum 5 variants"),
});
exports.generateSocialPostSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Content is required"),
    platform: exports.socialPlatformSchema,
    tone: zod_1.z.enum(['professional', 'casual', 'engaging']).optional(),
    includeHashtags: zod_1.z.boolean().optional(),
});
exports.optimizeForPlatformSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Content is required"),
    platform: exports.socialPlatformSchema,
});
exports.schedulePostSchema = zod_1.z.object({
    platform: exports.socialPlatformSchema,
    content: zod_1.z.string().min(1, "Content is required"),
    mediaUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
    scheduledFor: zod_1.z.string().datetime().or(zod_1.z.date()),
});
exports.optimizeCampaignSchema = zod_1.z.object({
    optimizationGoals: zod_1.z.array(zod_1.z.string()).min(1, "At least one goal required"),
});
exports.getCampaignMetricsQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    endDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    includeDetails: zod_1.z.boolean().optional(),
});
exports.listCampaignsQuerySchema = zod_1.z.object({
    status: exports.campaignStatusSchema.optional(),
    type: exports.campaignTypeSchema.optional(),
    page: zod_1.z.number().int().positive().optional(),
    limit: zod_1.z.number().int().positive().max(100).optional(),
});
