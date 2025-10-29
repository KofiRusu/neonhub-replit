import client from "prom-client";
import { appConfig } from "./config.js";

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry, prefix: "agent_infra_" });

export const runsStarted = new client.Counter({
  name: "agent_runs_started_total",
  help: "Number of runs started",
  registers: [registry]
});

export const runsFailed = new client.Counter({
  name: "agent_runs_failed_total",
  help: "Number of runs failed to start",
  registers: [registry]
});

export const stepsEnqueued = new client.Counter({
  name: "agent_steps_enqueued_total",
  help: "Number of steps enqueued",
  registers: [registry]
});

export async function collectMetrics(): Promise<string> {
  if (!appConfig.metricsEnabled) {
    return "";
  }
  return registry.metrics();
}

export function getRegistry(): client.Registry {
  return registry;
}
