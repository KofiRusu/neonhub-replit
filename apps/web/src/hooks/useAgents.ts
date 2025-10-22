"use client";

import { useQuery } from "@tanstack/react-query";
import { listAgentStatuses, type AgentStatusSummary } from "@/src/lib/adapters/agents";

export function useAgentStatuses(limit = 4) {
  return useQuery({
    queryKey: ["agents", "status", limit],
    queryFn: () => listAgentStatuses(limit),
    staleTime: 30 * 1000,
  });
}

export type { AgentStatusSummary };
