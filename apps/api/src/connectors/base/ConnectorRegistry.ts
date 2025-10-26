import { logger } from "../../lib/logger.js";
import { Connector } from "./Connector.js";

class Registry {
  private readonly registry = new Map<string, Connector>();

  register(connector: Connector) {
    const key = connector.metadata.name;
    if (this.registry.has(key)) {
      logger.warn({ connector: key }, "Connector already registered; replacing existing instance");
    }
    this.registry.set(key, connector);
  }

  async registerAll(connectors: Connector[]) {
    for (const connector of connectors) {
      this.register(connector);
      try {
        await connector.onRegister();
      } catch (error) {
        logger.error({ error, connector: connector.metadata.name }, "Failed to run connector onRegister hook");
      }
    }
  }

  get(name: string) {
    return this.registry.get(name);
  }

  list() {
    return Array.from(this.registry.values());
  }
}

export const connectorRegistry = new Registry();
