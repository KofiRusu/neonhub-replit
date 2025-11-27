"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAgentForIntent = resolveAgentForIntent;
exports.isKnownIntent = isKnownIntent;
var INTENT_AGENT_MAP = {
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
};
function resolveAgentForIntent(intent, provided) {
    var normalizedIntent = intent.trim();
    var expectedAgent = INTENT_AGENT_MAP[normalizedIntent];
    if (expectedAgent) {
        if (provided && provided !== expectedAgent) {
            return {
                ok: false,
                reason: "INTENT_AGENT_MISMATCH",
                expected: expectedAgent,
                provided: provided,
            };
        }
        return { ok: true, agent: expectedAgent };
    }
    if (provided) {
        return { ok: true, agent: provided };
    }
    return { ok: false, reason: "AGENT_REQUIRED" };
}
function isKnownIntent(intent) {
    return Boolean(INTENT_AGENT_MAP[intent]);
}
