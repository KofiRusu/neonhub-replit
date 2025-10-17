import { z } from "zod";

export const MetricEventInputSchema = z.object({
  type: z.enum([
    "page_view",
    "click",
    "conversion",
    "open",
    "job_success",
    "job_error",
    "draft_created",
    "agent_run",
  ]),
  meta: z.record(z.any()).optional(),
});

export const MetricsSummaryQuerySchema = z.object({
  range: z.enum(["24h", "7d", "30d"]).default("30d"),
});

export type MetricEventInput = z.infer<typeof MetricEventInputSchema>;
export type MetricsSummaryQuery = z.infer<typeof MetricsSummaryQuerySchema>;
