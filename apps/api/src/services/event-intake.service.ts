import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { normalizeChannel, DEFAULT_CHANNEL } from "../types/agentic.js";
import type { Channel, EventClassification, NormalizedEvent, RawEvent } from "../types/agentic.js";
import { PersonService } from "./person.service.js";
import { MemoryRagService } from "./rag/memory.service.js";

const memoryService = new MemoryRagService();

function normalizeTimestamp(input?: string | Date): Date {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function summarizeEvent(event: NormalizedEvent, classification: EventClassification): string {
  const payload = event.payload ? JSON.stringify(event.payload).slice(0, 400) : "{}";
  const metadata = event.metadata ? JSON.stringify(event.metadata).slice(0, 400) : "{}";
  return [
    `Channel: ${event.channel}`,
    `Type: ${event.type}`,
    classification.intent ? `Intent: ${classification.intent}` : null,
    classification.topic ? `Topic: ${classification.topic}` : null,
    classification.sentiment ? `Sentiment: ${classification.sentiment}` : null,
    `Payload: ${payload}`,
    `Metadata: ${metadata}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function ensureChannel(channel: string): Channel {
  return normalizeChannel(channel, DEFAULT_CHANNEL);
}

function ensureType(type: string): string {
  return type.replace(/\s+/g, "_").toLowerCase();
}

export const EventIntakeService = {
  async ingest(raw: RawEvent): Promise<void> {
    const normalized = await this.normalize(raw);
    const classification = this.classify(normalized);

    const eventRecord = await prisma.event.create({
      data: {
        organizationId: normalized.organizationId,
        personId: normalized.personId,
        campaignId: normalized.campaignId,
        objectiveId: normalized.objectiveId,
        channel: normalized.channel,
        type: normalized.type,
        source: normalized.source ?? raw.source ?? null,
        providerId: normalized.providerId ?? null,
        topic: classification.topic,
        intent: classification.intent,
        sentiment: classification.sentiment,
        payload: (normalized.payload ?? null) as Prisma.JsonValue,
        metadata: {
          ...(normalized.metadata ?? {}),
          classification,
        } as Prisma.JsonObject,
        occurredAt: normalized.occurredAt,
      },
    });

    if (classification.topic) {
      const weight = classification.confidence ?? 0.6;
      await PersonService.updateTopic(eventRecord.personId, classification.topic, weight);
    }

    await this.embed({ ...normalized, personId: eventRecord.personId }, eventRecord.id, classification);
  },

  async normalize(raw: RawEvent): Promise<NormalizedEvent> {
    if (!raw.organizationId) {
      throw new Error("organizationId is required");
    }

    const occurredAt = normalizeTimestamp(raw.occurredAt);
    const channel = ensureChannel(raw.channel);
    const type = ensureType(raw.type);

    const personId = raw.personId
      ? raw.personId
      : await PersonService.resolve({
          organizationId: raw.organizationId,
          email: raw.email,
          phone: raw.phone,
          handle: raw.handle,
          createIfMissing: true,
          traits: raw.metadata && typeof raw.metadata === "object" ? (raw.metadata as Record<string, unknown>) : undefined,
        });

    return {
      organizationId: raw.organizationId,
      personId,
      channel,
      type,
      payload: raw.payload ?? null,
      metadata: raw.metadata ?? null,
      campaignId: raw.campaignId,
      objectiveId: raw.objectiveId,
      provider: raw.provider,
      providerId: raw.providerId,
      occurredAt,
      source: raw.source,
    };
  },

  classify(event: NormalizedEvent): EventClassification {
    const summary = `${event.channel}:${event.type}`;
    const result: EventClassification = { confidence: 0.5 };
    const lowerSummary = summary.toLowerCase();

    if (lowerSummary.includes("click")) {
      result.intent = "engagement";
      result.topic = "conversion";
      result.sentiment = "positive";
      result.confidence = 0.8;
    } else if (lowerSummary.includes("open")) {
      result.intent = "awareness";
      result.topic = "nurture";
      result.sentiment = "neutral";
      result.confidence = 0.6;
    } else if (lowerSummary.includes("reply") || lowerSummary.includes("response")) {
      result.intent = "conversation";
      result.topic = "relationship";
      result.sentiment = "positive";
      result.confidence = 0.7;
    } else if (lowerSummary.includes("unsubscribe") || lowerSummary.includes("opt_out")) {
      result.intent = "churn";
      result.topic = "retention";
      result.sentiment = "negative";
      result.confidence = 0.9;
    }

    return result;
  },

  async embed(event: NormalizedEvent, eventId: string, classification: EventClassification) {
    try {
      const summary = summarizeEvent(event, classification);
      await memoryService.storeSnippet({
        organizationId: event.organizationId,
        personId: event.personId,
        label: `${event.channel}:${event.type}`,
        text: summary,
        category: classification.intent,
        sourceEventId: eventId,
        metadata: {
          classification: classification as unknown as Prisma.JsonValue,
          summary,
          eventId,
        },
      });
    } catch (error) {
      logger.error({ error }, "Failed to embed event. Memory record skipped.");
    }
  },
};
