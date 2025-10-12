export const ROUTES = {
  content_generatePost: "content/generate-post",
  seo_audit: "seo/audit",
  email_sequence: "email/sequence",
  support_reply: "support/reply",
  trends_brief: "trends/brief",
  analytics_execSummary: "analytics/executive-summary",
  brandVoice_profile: "brand-voice/profile",
  brandVoice_search: "brand-voice/search",
  analytics_brandVoiceKpis: "analytics/brand-voice-kpis",
} as const;

export type RouteKey = keyof typeof ROUTES;

// Optional local overrides. Edit src/lib/route-overrides.ts to adjust paths during alignment.
// This file exists by default but is empty.
import { ROUTE_OVERRIDES } from "@/src/lib/route-overrides";

const merged: Record<RouteKey, string> = { ...ROUTES } as Record<RouteKey, string>;
for (const k in ROUTE_OVERRIDES) {
  const key = k as RouteKey;
  const val = ROUTE_OVERRIDES[key];
  if (val) merged[key] = val;
}

export function r(key: RouteKey): string {
  return merged[key];
}



