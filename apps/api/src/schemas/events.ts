import { z } from "zod";

export const TimelineQuery = z.object({
  personId: z.string(),
  limit: z.coerce.number().min(1).max(200).default(50),
});

export const TimelineEvent = z.object({
  id: z.string(),
  type: z.string(),
  channel: z.string().nullable(),
  ts: z.string(),
  payload: z.record(z.any()),
});

export const TimelineResponse = z.object({
  events: z.array(TimelineEvent),
});

export type TimelineQuery = z.infer<typeof TimelineQuery>;
export type TimelineEvent = z.infer<typeof TimelineEvent>;
export type TimelineResponse = z.infer<typeof TimelineResponse>;
