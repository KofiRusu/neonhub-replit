import type { AgentName } from "./types.js";

const INTENT_AGENT_MAP = {
  "generate-draft": "ContentAgent",
  summarize: "ContentAgent",
  repurpose: "ContentAgent",
  "generate-post": "SocialAgent",
  "optimize-caption": "SocialAgent",
  "hashtag-pack": "SocialAgent",
  "generate-sequence": "EmailAgent",
  "optimize-subject": "EmailAgent",
  "ab-test": "EmailAgent",
  "keyword-research": "SEOAgent",
  "seo-audit": "SEOAgent",
  support: "SupportAgent",
  triage: "SupportAgent",
  "macro-suggest": "SupportAgent",
} as const satisfies Record<string, AgentName>;

export type KnownIntent = keyof typeof INTENT_AGENT_MAP;

type IntentResolution =
  | { ok: true; agent: AgentName }
  | {
      ok: false;
      reason: "INTENT_AGENT_MISMATCH";
      expected: AgentName;
      provided?: AgentName;
    }
  | { ok: false; reason: "AGENT_REQUIRED" };

export function resolveAgentForIntent(intent: string, provided?: AgentName): IntentResolution {
  const normalizedIntent = intent.trim() as KnownIntent;
  const expectedAgent = INTENT_AGENT_MAP[normalizedIntent];

  if (expectedAgent) {
    if (provided && provided !== expectedAgent) {
      return {
        ok: false,
        reason: "INTENT_AGENT_MISMATCH",
        expected: expectedAgent,
        provided,
      };
    }
    return { ok: true, agent: expectedAgent };
  }

  if (provided) {
    return { ok: true, agent: provided };
  }

  return { ok: false, reason: "AGENT_REQUIRED" };
}

export function isKnownIntent(intent: string): intent is KnownIntent {
  return Boolean(INTENT_AGENT_MAP[intent as KnownIntent]);
}
