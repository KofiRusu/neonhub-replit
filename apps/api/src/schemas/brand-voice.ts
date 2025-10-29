import { z } from "zod";

export const ComposeArgs = z.object({
  channel: z.enum(["email", "sms", "dm", "post"]),
  objective: z.string().min(2),
  personId: z.string(),
  constraints: z.any().optional(),
});

export type ComposeArgs = z.infer<typeof ComposeArgs>;

export const ComposeResult = z.object({
  subjectLines: z.array(z.string()).optional(),
  htmlVariants: z.array(z.string()).optional(),
  body: z.string().optional(),
  meta: z.record(z.any()).default({}),
});

export type ComposeResult = z.infer<typeof ComposeResult>;
