import { AgentKind } from "@prisma/client";

export const AGENT_NAMES = [
  "ContentAgent",
  "SEOAgent",
  "EmailAgent",
  "SupportAgent",
  "SocialAgent",
  "InsightAgent",
  "AdAgent",
  "BrandVoiceAgent",
  "DesignAgent",
  "CampaignAgent"
] as const;

export type AgentName = (typeof AGENT_NAMES)[number];

export interface AgentDefinition {
  kind: AgentKind;
  version: string;
  intents: string[];
  description: string;
  ownerTeam: "marketing" | "support" | "ai-lab" | "ops";
}

export const AGENT_DEFINITIONS: Record<AgentName, AgentDefinition> = {
  ContentAgent: {
    kind: AgentKind.COPILOT,
    version: "3.1.0",
    intents: ["generate-draft", "summarize", "repurpose"],
    description: "Writes long-form marketing content aligned with brand voice and campaign goals.",
    ownerTeam: "marketing",
  },
  SEOAgent: {
    kind: AgentKind.ANALYST,
    version: "2.4.0",
    intents: ["seo-audit", "keyword-research"],
    description: "Audits landing pages, returning structured keyword and metadata recommendations.",
    ownerTeam: "marketing",
  },
  EmailAgent: {
    kind: AgentKind.WORKFLOW,
    version: "2.2.0",
    intents: ["generate-sequence", "optimize-subject", "ab-test"],
    description: "Produces lifecycle email sequences and subject line optimizations.",
    ownerTeam: "marketing",
  },
  SupportAgent: {
    kind: AgentKind.COPILOT,
    version: "1.9.0",
    intents: ["support", "triage", "macro-suggest"],
    description: "Assists CX reps by drafting replies and summarizing incoming tickets.",
    ownerTeam: "support",
  },
  SocialAgent: {
    kind: AgentKind.WORKFLOW,
    version: "3.0.0",
    intents: ["generate-post", "optimize-caption", "hashtag-pack"],
    description: "Creates channel-specific social content with scheduling metadata.",
    ownerTeam: "marketing",
  },
  InsightAgent: {
    kind: AgentKind.ANALYST,
    version: "2.1.0",
    intents: ["analyze-data", "metric-digest"],
    description: "Surfaces actionable insights from campaign and revenue metrics.",
    ownerTeam: "ai-lab",
  },
  AdAgent: {
    kind: AgentKind.COPILOT,
    version: "1.7.0",
    intents: ["generate-ad", "variant-pack"],
    description: "Drafts multichannel ad creative and performance variants.",
    ownerTeam: "marketing",
  },
  BrandVoiceAgent: {
    kind: AgentKind.COPILOT,
    version: "1.5.0",
    intents: ["brand-voice", "tone-analysis", "knowledge-search"],
    description: "Exposes brand guidelines, example phrasing, and tone analysis utilities.",
    ownerTeam: "marketing",
  },
  DesignAgent: {
    kind: AgentKind.COPILOT,
    version: "1.3.0",
    intents: ["design-brief", "image-variant"],
    description: "Transforms campaign briefs into DALL·E-ready prompts and variant specs.",
    ownerTeam: "marketing",
  },
  CampaignAgent: {
    kind: AgentKind.WORKFLOW,
    version: "2.0.0",
    intents: ["plan-campaign", "optimize-funnel"],
    description: "Generates cross-channel campaign plans with funnel stage targeting.",
    ownerTeam: "marketing",
  },
};

export type OrchestratorRequest = {
  agent?: AgentName;
  intent: string;
  payload: unknown;
  context?: Record<string, unknown>;
};

export type OrchestratorResponse = {
  ok: boolean;
  data?: unknown;
  error?: string;
  code?: string;
  details?: unknown;
  meta?: {
    agent?: string;
    intent?: string;
    runId?: string;
    metrics?: Record<string, unknown>;
  };
};

export interface AgentHandler {
  handle(req: OrchestratorRequest): Promise<OrchestratorResponse>;
}
