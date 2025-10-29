import { logger } from "../../lib/logger.js";
import type { AgentHandler, AgentName } from "./types.js";

type RegistryEntry = {
  name: AgentName;
  handler: AgentHandler;
  registeredAt: Date;
  version?: string;
  capabilities?: string[];
};

const handlers = new Map<AgentName, RegistryEntry>();

export function registerAgent(name: AgentName, handler: AgentHandler, meta?: { version?: string; capabilities?: string[] }): void {
  handlers.set(name, {
    name,
    handler,
    registeredAt: new Date(),
    version: meta?.version,
    capabilities: meta?.capabilities
  });
  logger.info({ agent: name, version: meta?.version }, "Agent registered with orchestrator");
}

export function getAgent(name: AgentName): RegistryEntry | undefined {
  return handlers.get(name);
}

export function listAgents(): RegistryEntry[] {
  return Array.from(handlers.values());
}

export function unregisterAgent(name: AgentName): void {
  handlers.delete(name);
  logger.info({ agent: name }, "Agent unregistered from orchestrator");
}

export function clearRegistry(): void {
  handlers.clear();
}
