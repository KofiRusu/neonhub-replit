import client from "prom-client";
import { workerConfig } from "./config.js";

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry, prefix: "agent_worker_" });

export const stepsStarted = new client.Counter({
  name: "agent_steps_started_total",
  help: "Steps started by the worker",
  registers: [registry]
});

export const stepsSucceeded = new client.Counter({
  name: "agent_steps_succeeded_total",
  help: "Steps completed successfully",
  registers: [registry]
});

export const stepsFailed = new client.Counter({
  name: "agent_steps_failed_total",
  help: "Steps failed permanently",
  registers: [registry]
});

export async function collectMetrics(): Promise<string> {
  if (!workerConfig.metricsEnabled) {
    return "";
  }
  return registry.metrics();
}

export function getRegistry(): client.Registry {
  return registry;
}
