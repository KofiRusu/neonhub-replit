"use client";

import { useQuery } from "@tanstack/react-query";

export interface MetricsSummary {
  timeRange: string;
  startDate: string;
  totalEvents: number;
  draftsCreated: number;
  jobs: {
    total: number;
    successful: number;
    errored: number;
    successRate: number;
    avgLatencyMs: number;
  };
  events: {
    opens: number;
    clicks: number;
    conversions: number;
    pageViews: number;
  };
  eventsByType: Array<{
    type: string;
    count: number;
  }>;
}

async function fetchSummary(range: string = "30d"): Promise<MetricsSummary> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
  const res = await fetch(`${apiUrl}/metrics/summary?range=${range}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch metrics: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

export function useSummary(range: "24h" | "7d" | "30d" = "30d") {
  return useQuery({
    queryKey: ["metrics", "summary", range],
    queryFn: () => fetchSummary(range),
    refetchInterval: 30000, // Refetch every 30s
    staleTime: 15000, // Consider stale after 15s
  });
}
