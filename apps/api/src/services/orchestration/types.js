"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_DEFINITIONS = exports.AGENT_NAMES = void 0;
var client_1 = require("@prisma/client");
exports.AGENT_NAMES = [
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
];
exports.AGENT_DEFINITIONS = {
    ContentAgent: {
        kind: client_1.AgentKind.COPILOT,
        version: "3.1.0",
        intents: ["generate-draft", "summarize", "repurpose"],
        description: "Writes long-form marketing content aligned with brand voice and campaign goals.",
        ownerTeam: "marketing",
    },
    SEOAgent: {
        kind: client_1.AgentKind.ANALYST,
        version: "2.4.0",
        intents: ["seo-audit", "keyword-research"],
        description: "Audits landing pages, returning structured keyword and metadata recommendations.",
        ownerTeam: "marketing",
    },
    EmailAgent: {
        kind: client_1.AgentKind.WORKFLOW,
        version: "2.2.0",
        intents: ["generate-sequence", "optimize-subject", "ab-test"],
        description: "Produces lifecycle email sequences and subject line optimizations.",
        ownerTeam: "marketing",
    },
    SupportAgent: {
        kind: client_1.AgentKind.COPILOT,
        version: "1.9.0",
        intents: ["support", "triage", "macro-suggest"],
        description: "Assists CX reps by drafting replies and summarizing incoming tickets.",
        ownerTeam: "support",
    },
    SocialAgent: {
        kind: client_1.AgentKind.WORKFLOW,
        version: "3.0.0",
        intents: ["generate-post", "optimize-caption", "hashtag-pack"],
        description: "Creates channel-specific social content with scheduling metadata.",
        ownerTeam: "marketing",
    },
    InsightAgent: {
        kind: client_1.AgentKind.ANALYST,
        version: "2.1.0",
        intents: ["analyze-data", "metric-digest"],
        description: "Surfaces actionable insights from campaign and revenue metrics.",
        ownerTeam: "ai-lab",
    },
    AdAgent: {
        kind: client_1.AgentKind.COPILOT,
        version: "1.7.0",
        intents: ["generate-ad", "variant-pack"],
        description: "Drafts multichannel ad creative and performance variants.",
        ownerTeam: "marketing",
    },
    BrandVoiceAgent: {
        kind: client_1.AgentKind.COPILOT,
        version: "1.5.0",
        intents: ["brand-voice", "tone-analysis", "knowledge-search"],
        description: "Exposes brand guidelines, example phrasing, and tone analysis utilities.",
        ownerTeam: "marketing",
    },
    DesignAgent: {
        kind: client_1.AgentKind.COPILOT,
        version: "1.3.0",
        intents: ["design-brief", "image-variant"],
        description: "Transforms campaign briefs into DALL·E-ready prompts and variant specs.",
        ownerTeam: "marketing",
    },
    CampaignAgent: {
        kind: client_1.AgentKind.WORKFLOW,
        version: "2.0.0",
        intents: ["plan-campaign", "optimize-funnel"],
        description: "Generates cross-channel campaign plans with funnel stage targeting.",
        ownerTeam: "marketing",
    },
};
