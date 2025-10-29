import { createHash } from "crypto";
import type { FeedbackEvent } from "../../events/types.js";
import { getPredictiveEngine } from "../predictive-engine.js";
import { logger } from "../../lib/logger.js";

function deriveKey(event: FeedbackEvent): string {
  if (event.meta && typeof event.meta.id === "string") {
    return event.meta.id;
  }

  const raw = JSON.stringify({
    channel: event.channel,
    kind: event.kind,
    text: event.text ?? "",
    timestamp: event.meta?.timestamp ?? Date.now()
  });

  return createHash("sha1").update(raw).digest("hex");
}

export async function learnFrom(event: FeedbackEvent): Promise<void> {
  const engine = await getPredictiveEngine();
  const key = deriveKey(event);
  const content = event.text ?? JSON.stringify(event.meta ?? {});

  if (typeof (engine as { learn?: (args: { agent: string; key: string; content: string }) => Promise<void> }).learn !== "function") {
    logger.warn({ agent: event.sourceAgent }, "Predictive engine does not support learn(); skipping feedback");
    return;
  }

  await (engine as unknown as {
    learn: (args: { agent: string; key: string; content: string }) => Promise<void>;
  }).learn({
    agent: event.sourceAgent,
    key,
    content
  });

  logger.debug({ agent: event.sourceAgent, key, channel: event.channel }, "Feedback event learned");
}

export async function recall(agent: FeedbackEvent["sourceAgent"], query: string, k = 5) {
  const engine = await getPredictiveEngine();
  if (typeof (engine as { recall?: (agent: string, query: string, k?: number) => Promise<unknown> }).recall !== "function") {
    logger.warn({ agent }, "Predictive engine does not support recall(); returning empty set");
    return [];
  }

  return (engine as unknown as { recall: (agent: string, query: string, k?: number) => Promise<unknown> }).recall(agent, query, k);
}
