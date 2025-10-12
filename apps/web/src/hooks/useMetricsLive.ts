"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribe } from "../lib/realtime";
import type { MetricsSummary } from "./useSummary";

/**
 * Subscribe to live metrics updates via WebSocket
 * Optimistically updates React Query cache when metrics change
 */
export function useMetricsLive(range: "24h" | "7d" | "30d" = "30d") {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to metrics:delta events
    const unsubscribe = subscribe("metrics:delta", (data: any) => {
      console.log("📊 Metrics delta received:", data);

      // Optimistically update the cache
      queryClient.setQueryData<MetricsSummary>(
        ["metrics", "summary", range],
        (old) => {
          if (!old) return old;

          const updated = { ...old };

          // Increment based on event type
          if (data.type === "draft_created") {
            updated.draftsCreated += data.increment || 1;
          } else if (data.type === "conversion") {
            updated.events.conversions += data.increment || 1;
          } else if (data.type === "click") {
            updated.events.clicks += data.increment || 1;
          } else if (data.type === "open") {
            updated.events.opens += data.increment || 1;
          } else if (data.type === "page_view") {
            updated.events.pageViews += data.increment || 1;
          }

          updated.totalEvents += data.increment || 1;

          return updated;
        }
      );

      // Invalidate to fetch fresh data after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["metrics", "summary", range] });
      }, 2000);
    });

    // Subscribe to agent:job:update for job stats
    const unsubscribeJobs = subscribe("agent:job:update", (data: any) => {
      if (data.status === "success" || data.status === "error") {
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
