export const REGISTRY: Record<string, number> = {
  ContentAgent: 0.5,
  SEOAgent: 0.25,
  EmailAgent: 0.15,
  SocialAgent: 0.1,
};

export type AgentDescriptor = {
  id: keyof typeof REGISTRY;
  description: string;
  minScore?: number;
};

export const AGENTS: AgentDescriptor[] = [
  { id: "ContentAgent", description: "Long-form articles and strategy", minScore: 0.6 },
  { id: "SEOAgent", description: "SEO briefs and optimization", minScore: 0.65 },
  { id: "EmailAgent", description: "Lifecycle email content", minScore: 0.55 },
  { id: "SocialAgent", description: "Short-form social creatives", minScore: 0.5 },
];
