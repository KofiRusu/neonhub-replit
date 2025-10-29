export const routeMap = {
  content_generatePost: "content/generate",
  seo_audit: "seo/audit",
  seo_keywordsAnalyze: "seo/keywords/analyze",
  seo_contentOptimize: "seo/content/optimize",
  email_sequence: "email/sequence",
  support_reply: "support/reply",
  trends_brief: "trends/brief",
  analytics_execSummary: "analytics/executive-summary",
  analytics_brandVoiceKpis: "analytics/brand-voice-kpis",
  brandVoice_profile: "brand-voice/profile",
  brandVoice_search: "brand-voice/search",
} as const;

export type RouteKey = keyof typeof routeMap;

export function r(key: RouteKey): string {
  return routeMap[key];
}

export default routeMap;
