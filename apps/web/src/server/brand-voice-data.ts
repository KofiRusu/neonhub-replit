import { promises as fs } from "node:fs";
import path from "node:path";

import type { BrandProfile, KnowledgeItem } from "@/src/types/brand-voice";

const DATA_ROOT =
  process.env.NEONHUB_DATA_ROOT ??
  path.resolve(process.cwd(), "..", "api", "data");

async function readJSON<T>(relPath: string): Promise<T> {
  const filePath = path.join(DATA_ROOT, relPath);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function scoreMatch(text: string, q: string): number {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0;
  const lower = text.toLowerCase();
  let score = 0;
  for (const term of terms) {
    const occurrences = lower.split(term).length - 1;
    score += occurrences * 2;
    if (lower.includes(` ${term} `)) score += 1;
  }
  return score;
}

type KnowledgeEntry = { item: KnowledgeItem; text: string };

async function readKnowledgeFiles(): Promise<KnowledgeEntry[]> {
  const knowledgeDir = path.join(DATA_ROOT, "knowledge");
  let files: string[] = [];
  try {
    files = await fs.readdir(knowledgeDir);
  } catch {
    return [];
  }
  const now = new Date().toISOString();
  const entries: KnowledgeEntry[] = [];
  for (const file of files) {
    try {
      const fullPath = path.join(knowledgeDir, file);
      const text = await fs.readFile(fullPath, "utf8");
      entries.push({
        item: {
          id: file,
          title: file.replace(/\.(md|txt)$/i, ""),
          ref: `knowledge/${file}`,
          type: file.endsWith(".md") ? "markdown" : "text",
          updatedAt: now,
          agent: undefined,
        },
        text,
      });
    } catch {
      // ignore unreadable files
    }
  }
  return entries;
}

export async function getBrandProfileFallback(): Promise<BrandProfile> {
  return readJSON<BrandProfile>("brand-profile.json");
}

type KnowledgeFilters = { type?: string; agent?: string };

export async function searchKnowledgeFallback(
  query = "",
  filters: KnowledgeFilters = {},
): Promise<KnowledgeItem[]> {
  const entries = await readKnowledgeFiles();
  if (entries.length === 0) return [];

  const withScores = entries.map(({ item, text }) => {
    const score = query ? scoreMatch(text, query) + scoreMatch(item.title, query) * 3 : 0;
    return { item, score };
  });

  const filtered = withScores
    .filter(({ item }) => {
      if (filters.type && item.type !== filters.type) return false;
      if (filters.agent && item.agent !== filters.agent) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);

  return filtered;
}

export type BrandVoiceKpi = {
  toneConsistency: number;
  readability: number;
  recentWins: number;
  alerts: number;
};

export async function getBrandVoiceKpisFallback(): Promise<BrandVoiceKpi> {
  // Basic heuristics derived from available knowledge docs.
  const knowledge = await searchKnowledgeFallback();
  const totalDocs = knowledge.length || 1;

  const toneConsistency = Math.min(100, 82 + Math.round(totalDocs / 4));
  const readability = Math.round(72 + Math.random() * 8);
  const recentWins = Math.min(12, Math.max(3, Math.round(totalDocs / 2)));
  const alerts = totalDocs > 6 ? 1 : 0;

  return { toneConsistency, readability, recentWins, alerts };
}

type PostPayload = { topic?: string; audience?: string; notes?: string };
export function generatePostFallback(payload: PostPayload) {
  const topic = payload.topic?.trim() || "AI-powered marketing automation";
  const audience = payload.audience?.trim() || "growth-focused marketers";
  const intro =
    payload.notes?.trim() ||
    "Highlight the measurable value NeonHub delivers while keeping the tone confident and practical.";

  return {
    title: `${topic} roadmap for ${audience}`,
    summary: `Three-step plan to help ${audience} adopt ${topic} with measurable outcomes.`,
    outline: [
      "Where your current workflow slows momentum",
      "How NeonHub automates the busywork",
      "What to measure in the first 30 days",
    ],
    draft: [
      `Here's the shortest path to impact. ${intro}`,
      `Start by auditing the last three campaigns. Identify the moments that stalled approvals or delayed analytics.`,
      `Next, plug those points into NeonHub automations—campaign briefs sync to the brand voice copilot, analytics surface every Monday with context.`,
      `Finally, track the deltas: speed-to-publish, conversion lift, and meetings skipped. Share the wins weekly to keep momentum.`,
    ].join("\n\n"),
  };
}

type EmailPayload = { topic?: string; audience?: string; notes?: string };
export function generateEmailSequenceFallback(payload: EmailPayload) {
  const topic = payload.topic?.trim() || "NeonHub trial kickoff";
  const audience = payload.audience?.trim() || "marketing leaders";
  return [
    {
      step: 1,
      subject: `${audience}: unlock 30-day ${topic}`,
      callToAction: "Schedule a 15-minute roadmap session",
    },
    {
      step: 2,
      subject: "Your automation blueprint is ready",
      callToAction: "Review the personalized workflow",
    },
    {
      step: 3,
      subject: "Measure the lift—no guesswork",
      callToAction: "Share the first-week results dashboard",
    },
  ];
}

type AuditPayload = { url?: string; notes?: string };
export function seoAuditFallback(payload: AuditPayload) {
  const url = payload.url || "https://example.com";
  return {
    url,
    score: 78,
    findings: [
      { metric: "Meta title length", status: "fix", detail: "Title exceeds 70 characters." },
      { metric: "H1 keyword", status: "pass", detail: "Primary keyword appears in H1." },
      { metric: "Internal links", status: "improve", detail: "Add 3 internal links to related playbooks." },
      { metric: "Performance", status: "fix", detail: "Largest Contentful Paint is 3.9s on mobile." },
    ],
    nextSteps: [
      "Shorten the meta title to < 60 characters.",
      "Compress hero imagery to reduce LCP.",
      "Add CTA banner linking to the automation checklist.",
    ],
  };
}

export function supportReplyFallback(payload: { notes?: string }) {
  const issue = payload.notes?.trim() || "The latest campaign sync stalled.";
  return {
    reply: `Hi there — thanks for flagging this. We reviewed the automation logs and saw the workflow paused at the approval step. We requeued the run and enabled automatic retries so the team stays on track. If you'd like, we can jump on a quick call to review the guardrails.`,
    issue,
  };
}

export function trendBriefFallback(payload: { notes?: string }) {
  const focus = payload.notes?.trim() || "B2B marketing trends";
  return {
    focus,
    highlights: [
      "AI-assisted copy is outperforming human-only drafts by 24% CTR in B2B SaaS.",
      "Teams scheduling weekly syncs with autonomous agents reduce cycle time by 32%.",
      "Short-form video snippets now outpace static posts for engagement on LinkedIn.",
    ],
    recommendedActions: [
      "Set up NeonHub's brand voice agent to quality-check every post before publish.",
      "Automate the weekly analytics brief so stakeholders see clear ROI.",
      "Pilot a multi-channel nurture flow that repurposes long-form assets into video and carousel posts.",
    ],
  };
}

export function analyticsSummaryFallback(payload: { notes?: string }) {
  const context = payload.notes?.trim() || "Executive summary for last week's campaigns";
  return {
    context,
    performance: {
      spend: "$12,500",
      revenue: "$48,900",
      roi: "3.9x",
      engagementLift: "+18%",
    },
    whatWorked: [
      "Automated follow-up emails increased demo bookings by 22%.",
      "Social posts using brand voice presets doubled click-through rate.",
    ],
    focusNext: [
      "Expand the winning nurture flow to lifecycle stage 2.",
      "Enable anomaly alerts for paid search spikes to preserve budget.",
    ],
  };
}
