import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import type {
  CadenceRecommendation,
  Channel,
  PromptOutcome,
  SnippetRank,
  TopicEventSignal,
} from "../types/agentic.js";
import { normalizeChannel, DEFAULT_CHANNEL } from "../types/agentic.js";
import { PersonService } from "./person.service.js";

const DEFAULT_INTERVAL_HOURS = 24;

function calculateWinRate(previousWinRate: number | null | undefined, usageCount: number, outcomeScore: number): number {
  const effectiveWinRate = typeof previousWinRate === "number" ? previousWinRate : 0.5;
  return Number(((effectiveWinRate * usageCount + outcomeScore) / (usageCount + 1)).toFixed(4));
}

function toSnippetRank(snippet: {
  id: string;
  name: string;
  channel: string;
  winRate: number | null;
  usageCount: number;
  content: string;
}): SnippetRank {
  return {
    id: snippet.id,
    name: snippet.name,
    channel: normalizeChannel(snippet.channel, DEFAULT_CHANNEL),
    winRate: snippet.winRate,
    usageCount: snippet.usageCount,
    content: snippet.content,
  };
}

export const LearningService = {
  async updatePromptWeights(objective: string, channelInput: string, outcome: PromptOutcome): Promise<void> {
    if (!outcome.snippetId) {
      logger.debug({ objective, channel: channelInput }, "No snippetId provided for prompt weight update");
      return;
    }

    const snippet = await prisma.snippetLibrary.findUnique({ where: { id: outcome.snippetId } });
    if (!snippet) {
      logger.warn({ snippetId: outcome.snippetId }, "Snippet not found when updating prompt weights");
      return;
    }

    const channel = normalizeChannel(channelInput, DEFAULT_CHANNEL);
    const usageCount = snippet.usageCount ?? 0;
    const outcomeScore = outcome.score ?? (outcome.success ? 1 : 0);
    const winRate = calculateWinRate(snippet.winRate, usageCount, outcomeScore);

    const metadata = typeof snippet.metadata === "object" && snippet.metadata !== null ? (snippet.metadata as Record<string, unknown>) : {};
    const serializedOutcome = {
      success: outcome.success,
      snippetId: outcome.snippetId ?? null,
      score: outcome.score ?? null,
      metadata: outcome.metadata ?? null,
    } as const;

    await prisma.snippetLibrary.update({
      where: { id: snippet.id },
      data: {
        usageCount: usageCount + 1,
        winRate,
        metadata: {
          ...metadata,
          lastOutcome: serializedOutcome,
          lastUpdatedAt: new Date().toISOString(),
          objective,
          channel,
        } as Prisma.JsonObject,
      },
    });
  },

  async updatePersonaTopics(personId: string, events: TopicEventSignal[]): Promise<void> {
    if (!events.length) return;
    for (const event of events) {
      if (!event.topic) continue;
      const weight = event.weight ?? event.confidence ?? 0.5;
      await PersonService.updateTopic(personId, event.topic, weight);
    }
  },

  async rankSnippets(): Promise<SnippetRank[]> {
    const snippets = await prisma.snippetLibrary.findMany({
      orderBy: [{ winRate: "desc" }, { usageCount: "desc" }, { updatedAt: "desc" }],
      take: 20,
      select: {
        id: true,
        name: true,
        channel: true,
        winRate: true,
        usageCount: true,
        content: true,
      },
    });

    return snippets.map(toSnippetRank);
  },

  async optimizeCadence(personId: string): Promise<CadenceRecommendation> {
    const events = await prisma.event.findMany({
      where: { personId },
      orderBy: { occurredAt: "desc" },
      take: 10,
      select: {
        occurredAt: true,
        channel: true,
        sentiment: true,
      },
    });

    if (!events.length) {
      return {
        nextSendTime: new Date(Date.now() + DEFAULT_INTERVAL_HOURS * 60 * 60 * 1000),
        channel: DEFAULT_CHANNEL,
        confidence: 0.4,
      };
    }

    const intervals: number[] = [];
    for (let index = 0; index < events.length - 1; index += 1) {
      const current = events[index];
      const next = events[index + 1];
      if (!current.occurredAt || !next.occurredAt) continue;
      const diff = current.occurredAt.getTime() - next.occurredAt.getTime();
      if (diff > 0) {
        intervals.push(diff);
      }
    }

    const averageIntervalMs = intervals.length
      ? intervals.reduce((sum, value) => sum + value, 0) / intervals.length
      : DEFAULT_INTERVAL_HOURS * 60 * 60 * 1000;

    const lastEvent = events[0];
    const preferredChannelInput = events.find((event) => event.sentiment === "positive")?.channel ?? lastEvent.channel;
    const preferredChannel = normalizeChannel(preferredChannelInput ?? DEFAULT_CHANNEL, DEFAULT_CHANNEL);
    const nextSendTime = new Date((lastEvent.occurredAt ?? new Date()).getTime() + averageIntervalMs);

    const confidence = Math.min(0.9, 0.4 + intervals.length * 0.1);

    return {
      nextSendTime,
      channel: preferredChannel,
      confidence,
    };
  },
};
