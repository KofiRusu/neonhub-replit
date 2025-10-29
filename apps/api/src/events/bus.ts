import { EventEmitter } from "events";
import type { FeedbackEvent } from "./types.js";
import { learnFrom } from "../services/learning/index.js";
import { logger } from "../lib/logger.js";

const bus = new EventEmitter();
const FEEDBACK_TOPIC = "feedback";

export function subscribe(handler: (event: FeedbackEvent) => void): () => void {
  bus.on(FEEDBACK_TOPIC, handler);
  return () => {
    bus.off(FEEDBACK_TOPIC, handler);
  };
}

export async function publish(event: FeedbackEvent): Promise<void> {
  try {
    bus.emit(FEEDBACK_TOPIC, event);
    await learnFrom(event);
  } catch (error) {
    logger.error({ error, agent: event.sourceAgent }, "Failed to process feedback event");
  }
}
