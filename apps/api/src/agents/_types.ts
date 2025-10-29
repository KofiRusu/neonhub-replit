import type { AgentHandler, AgentName } from "../services/orchestration/types.js";

export interface AgentContract extends AgentHandler {
  name: AgentName;
  version: string;
  capabilities: string[];
}
