"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribe } from "../lib/realtime";
import type { MetricsSummary } from "./useSummary";

type MetricsDeltaPayload = { type: string; increment?: number };
type AgentJobUpdatePayload = { status?: "success" | "error" | string };

function isMetricsDeltaPayload(value: unknown): value is MetricsDeltaPayload {
  return typeof value === "object" && value !== null && "type" in value;
}

function isAgentJobUpdatePayload(value: unknown): value is AgentJobUpdatePayload {
  return typeof value === "object" && value !== null && "status" in value;
}

/**
 * Subscribe to live metrics updates via WebSocket
 * Optimistically updates React Query cache when metrics change
 */
export function useMetricsLive(range: "24h" | "7d" | "30d" = "30d") {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to metrics:delta events
    const unsubscribe = subscribe("metrics:delta", (payload) => {
      if (!isMetricsDeltaPayload(payload)) {
        return;
      }
      const increment = payload.increment ?? 1;
      const eventType = payload.type;
      console.log("📊 Metrics delta received:", payload);

      // Optimistically update the cache
      queryClient.setQueryData<MetricsSummary>(
        ["metrics", "summary", range],
        (old) => {
          if (!old) return old;

          const updated = { ...old };

          if (eventType === "draft_created") {
            updated.draftsCreated += increment;
          } else if (eventType === "conversion") {
            updated.events.conversions += increment;
          } else if (eventType === "click") {
            updated.events.clicks += increment;
          } else if (eventType === "open") {
            updated.events.opens += increment;
          } else if (eventType === "page_view") {
            updated.events.pageViews += increment;
          }

          updated.totalEvents += increment;

          return updated;
        }
      );

      // Invalidate to fetch fresh data after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["metrics", "summary", range] });
      }, 2000);
    });

    // Subscribe to agent:job:update for job stats
    const unsubscribeJobs = subscribe("agent:job:update", (payload) => {
      if (!isAgentJobUpdatePayload(payload)) {
        return;
      }
      if (payload.status === "success" || payload.status === "error") {

        // Invalidate metrics to refetch job stats
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["metrics", "summary", range] });
        }, 1000);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeJobs();
    };
  }, [queryClient, range]);
}
