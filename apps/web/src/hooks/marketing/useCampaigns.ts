import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useCampaigns() {
  return useQuery({
    queryKey: ["marketing", "campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/marketing/campaigns")
      if (!response.ok) {
        throw new Error("Failed to fetch campaigns")
      }
      const payload = await response.json()
      return payload.data
    },
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (campaignData: unknown) => {
      const response = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      })
      if (!response.ok) {
        throw new Error("Failed to create campaign")
      }
      const payload = await response.json()
      return payload.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing", "campaigns"] })
    },
  })
}
