import { createHash } from "crypto";
import type { FeedbackEvent } from "../../events/types.js";
import { getPredictiveEngine } from "../predictive-engine.js";
import type { LearningSignal } from "@neonhub/predictive-engine";
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

  const signal: LearningSignal = {
    agentId: event.sourceAgent,
    key,
    content,
    reward: typeof event.meta?.reward === "number" ? event.meta.reward : undefined,
    metadata: {
      channel: event.channel,
      intent: event.intent ?? null,
      timestamp: event.meta?.timestamp ?? Date.now(),
    },
  };

  await engine.learn(signal);

  logger.debug({ agent: event.sourceAgent, key, channel: event.channel }, "Feedback event learned");
}

export async function recall(agent: FeedbackEvent["sourceAgent"], query: string, k = 5) {
  const engine = await getPredictiveEngine();
  return engine.recall(agent, query, k);
}
