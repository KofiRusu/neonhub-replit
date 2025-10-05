/**
 * React Query hooks for Trends data
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { getSummary, transformToTrendMetrics, generateSignals, type MetricsSummary, type TrendMetric, type AISignal } from "@/src/lib/adapters/trends"

/**
 * Hook to fetch metrics summary
 */
export function useSummary(range: "24h" | "7d" | "30d" = "30d"): UseQueryResult<MetricsSummary, Error> {
  return useQuery({
    queryKey: ["metrics", "summary", range],
    queryFn: () => getSummary(range),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

/**
 * Hook to get trend metrics (derived from summary)
 */
export function useTrendMetrics(range: "24h" | "7d" | "30d" = "30d"): UseQueryResult<TrendMetric[], Error> {
  return useQuery({
    queryKey: ["metrics", "trends", range],
    queryFn: async () => {
      const summary = await getSummary(range)
      return transformToTrendMetrics(summary)
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

/**
 * Hook to get AI signals (derived from summary)
 */
export function useSignals(range: "24h" | "7d" | "30d" = "30d"): UseQueryResult<AISignal[], Error> {
  return useQuery({
    queryKey: ["metrics", "signals", range],
    queryFn: async () => {
      const summary = await getSummary(range)
      return generateSignals(summary)
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

