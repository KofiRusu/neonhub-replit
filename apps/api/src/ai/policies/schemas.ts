import { z } from "zod";

export const TaskSpecSchema = z.object({
  objective: z.string().min(3),
  audience: z.string().optional(),
  channel: z.enum(["blog", "email", "social"]).optional(),
  tone: z.string().optional(),
});

export const PlanStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
});

export const ArticleSpecSchema = z.object({
  headline: z.string().min(5),
  outline: z.array(z.string()).min(3),
  keywords: z.array(z.string()).optional(),
});

export const EmailSpecSchema = z.object({
  subject: z.string().min(5),
  previewText: z.string().optional(),
  callToAction: z.string().min(3),
});

export const SocialPostSpecSchema = z.object({
  platform: z.enum(["twitter", "linkedin", "instagram", "tiktok"]),
  copy: z.string().min(5),
  hashtags: z.array(z.string()).optional(),
});

export const SafetyFlagsSchema = z.object({
  containsSensitive: z.boolean().default(false),
  mentionsCompetitor: z.boolean().default(false),
  piiDetected: z.boolean().default(false),
});

export type TaskSpecInput = z.infer<typeof TaskSpecSchema>;
export type PlanStepInput = z.infer<typeof PlanStepSchema>;
