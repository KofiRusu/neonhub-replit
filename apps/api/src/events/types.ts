import type { AgentName } from "../services/orchestration/types.js";

export type FeedbackChannel =
  | "email"
  | "sms"
  | "whatsapp"
  | "reddit"
  | "instagram"
  | "facebook"
  | "x"
  | "youtube"
  | "tiktok"
  | "google_ads"
  | "shopify"
  | "stripe";

export type FeedbackKind = "open" | "click" | "reply" | "conversion" | "error";

export interface FeedbackEvent {
  sourceAgent: AgentName;
  channel: FeedbackChannel;
  kind: FeedbackKind;
  text?: string;
  meta?: Record<string, unknown>;
}
