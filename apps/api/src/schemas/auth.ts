import { z } from 'zod';

export const credentialProviderSchema = z.enum([
  'twitter',
  'linkedin',
  'facebook',
  'instagram',
  'sendgrid',
  'stripe',
  'openai',
]);

export const credentialSchema = z.object({
  provider: credentialProviderSchema,
  accountId: z.string().optional(),
  accessToken: z.string().min(1).optional(),
  refreshToken: z.string().min(1).optional(),
  accessSecret: z.string().min(1).optional(),
  scope: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const settingsSchema = z.object({
  brandVoice: z.record(z.any()).optional(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  notificationFrequency: z.enum(['realtime', 'daily', 'weekly']),
  timezone: z.string(),
  locale: z.string(),
  dateFormat: z.string(),
  dataRetention: z.number().min(1).max(365),
  allowAnalytics: z.boolean(),
  allowPersonalization: z.boolean(),
  apiRateLimit: z.number().min(10).max(10000),
  webhookUrl: z.string().url().optional().nullable(),
  webhookSecret: z.string().optional().nullable(),
});