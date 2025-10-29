import { logger } from "../../lib/logger.js";

let bootPromise: Promise<void> | null = null;

export async function ensureOrchestratorBootstrap(): Promise<void> {
  if (!bootPromise) {
    bootPromise = (async () => {
      const { AgentIntelligenceBus } = await import("../../../../../core/aib/index.js");
      const bus = new AgentIntelligenceBus();
      const maybeInitializable = bus as { initialize?: () => Promise<void> };
      if (typeof maybeInitializable.initialize === "function") {
        await maybeInitializable.initialize();
      }
      logger.info("Agent orchestrator bootstrap complete");
    })();
  }

  return bootPromise;
}
