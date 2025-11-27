import type { AgentHandler, AgentName } from "./types.js";
import { registerAgent, clearRegistry } from "./registry.js";
import { AGENT_DEFINITIONS } from "./types.js";
import { contentAgent } from "../../agents/content/ContentAgent.js";
import { seoAgent } from "../../agents/SEOAgent.js";
import { emailAgent } from "../../agents/EmailAgent.js";
import { socialAgent } from "../../agents/SocialAgent.js";
import { supportAgent } from "../../agents/SupportAgent.js";

const orchestratorAgents: Partial<Record<AgentName, AgentHandler>> = {
  ContentAgent: contentAgent,
  SEOAgent: seoAgent,
  EmailAgent: emailAgent,
  SocialAgent: socialAgent,
  SupportAgent: supportAgent,
};

let registered = false;

export function registerDefaultAgents(): void {
  if (registered) {
    return;
  }

  for (const [name, handler] of Object.entries(orchestratorAgents)) {
    if (!handler) continue;
    const definition = AGENT_DEFINITIONS[name as AgentName];

    registerAgent(name as AgentName, handler, {
      version: definition.version,
      capabilities: definition.intents,
    });
  }

  registered = true;
}

/** Test helper to allow re-registration between specs. */
export function resetRegisteredAgentsForTest(): void {
  clearRegistry();
  registered = false;
}
