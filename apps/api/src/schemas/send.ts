import { z } from "zod";

export const SendEmailArgs = z.object({
  to: z.string(),
  subject: z.string(),
  html: z.string(),
  meta: z.record(z.any()).optional(),
});

export const SendSMSArgs = z.object({
  to: z.string(),
  body: z.string().max(320),
  meta: z.record(z.any()).optional(),
});

export const SendResult = z.object({
  id: z.string(),
  status: z.enum(["queued", "sent", "failed"]),
  providerId: z.string().optional(),
  error: z.string().optional(),
});

export type SendEmailArgs = z.infer<typeof SendEmailArgs>;
export type SendSMSArgs = z.infer<typeof SendSMSArgs>;
export type SendResult = z.infer<typeof SendResult>;
