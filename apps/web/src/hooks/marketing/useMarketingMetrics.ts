import { useQuery } from "@tanstack/react-query"

export function useMarketingMetrics(dateRange: string = "30d") {
  return useQuery({
    queryKey: ["marketing", "overview", dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/overview?range=${dateRange}`)
      if (!response.ok) {
        throw new Error("Failed to fetch marketing metrics")
      }
      const payload = await response.json()
      return payload.data
    },
    refetchInterval: 60000,
  })
}
