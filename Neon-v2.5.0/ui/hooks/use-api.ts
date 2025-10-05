"use client"

// Custom hooks for API integration with Neon-v2.4.0
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export const useAgents = () => {
  const { toast } = useToast()

  const agents = api.agent.getAll.useQuery()
  const createAgent = api.agent.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Agent Created",
        description: "New AI agent has been successfully created.",
      })
      agents.refetch()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateAgent = api.agent.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Agent Updated",
        description: "Agent settings have been saved.",
      })
      agents.refetch()
    },
  })

  const deleteAgent = api.agent.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Agent Deleted",
        description: "Agent has been removed from your workspace.",
      })
      agents.refetch()
    },
  })

  return {
    agents: agents.data || [],
    isLoading: agents.isLoading,
    createAgent: createAgent.mutate,
    updateAgent: updateAgent.mutate,
    deleteAgent: deleteAgent.mutate,
    isCreating: createAgent.isPending,
    isUpdating: updateAgent.isPending,
    isDeleting: deleteAgent.isPending,
  }
}

export const useCampaigns = () => {
  const { toast } = useToast()

  const campaigns = api.campaign.getAll.useQuery()
  const createCampaign = api.campaign.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: "New marketing campaign has been launched.",
      })
      campaigns.refetch()
    },
  })

  const updateCampaign = api.campaign.update.useMutation({
    onSuccess: () => {
      campaigns.refetch()
    },
  })

  return {
    campaigns: campaigns.data || [],
    isLoading: campaigns.isLoading,
    createCampaign: createCampaign.mutate,
    updateCampaign: updateCampaign.mutate,
    isCreating: createCampaign.isPending,
    isUpdating: updateCampaign.isPending,
  }
}

export const useAnalytics = (period: "24h" | "7d" | "30d" | "90d" = "7d") => {
  const analytics = api.analytics.getOverview.useQuery({ period })
  const customerInsights = api.analytics.getCustomerInsights.useQuery({ period })
  const performanceMetrics = api.analytics.getPerformanceMetrics.useQuery({ period })

  return {
    overview: analytics.data,
    customerInsights: customerInsights.data,
    performanceMetrics: performanceMetrics.data,
    isLoading: analytics.isLoading || customerInsights.isLoading || performanceMetrics.isLoading,
  }
}

export const useContent = () => {
  const { toast } = useToast()

  const content = api.content.getAll.useQuery()
  const generateContent = api.content.generate.useMutation({
    onSuccess: () => {
      toast({
        title: "Content Generated",
        description: "AI has created new content for your campaign.",
      })
      content.refetch()
    },
  })

  const publishContent = api.content.publish.useMutation({
    onSuccess: () => {
      toast({
        title: "Content Published",
        description: "Your content is now live across selected channels.",
      })
      content.refetch()
    },
  })

  return {
    content: content.data || [],
    isLoading: content.isLoading,
    generateContent: generateContent.mutate,
    publishContent: publishContent.mutate,
    isGenerating: generateContent.isPending,
    isPublishing: publishContent.isPending,
  }
}
