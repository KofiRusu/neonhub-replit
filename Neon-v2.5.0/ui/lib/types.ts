export interface Agent {
  id: string
  name: string
  type: "content" | "social" | "email" | "analytics" | "seo"
  status: "active" | "idle" | "processing" | "error"
  performance: number
  tasksCompleted: number
  createdAt: Date
  updatedAt: Date
}

export interface Campaign {
  id: string
  name: string
  description: string
  status: "draft" | "active" | "paused" | "completed"
  startDate: Date
  endDate?: Date
  budget: number
  spent: number
  metrics: {
    impressions: number
    clicks: number
    conversions: number
    ctr: number
    cpc: number
    roas: number
  }
  channels: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  status: "active" | "inactive" | "churned"
  ltv: number
  acquisitionChannel: string
  segments: string[]
  lastActivity: Date
  createdAt: Date
}

export interface Content {
  id: string
  title: string
  type: "blog" | "social" | "email" | "ad" | "landing"
  content: string
  status: "draft" | "published" | "archived"
  performance: {
    views: number
    engagement: number
    conversions: number
  }
  createdAt: Date
  publishedAt?: Date
}

export interface Analytics {
  period: "24h" | "7d" | "30d" | "90d"
  metrics: {
    revenue: number
    conversions: number
    traffic: number
    engagement: number
  }
  trends: {
    revenue: number[]
    conversions: number[]
    traffic: number[]
    engagement: number[]
  }
  topPerformers: {
    campaigns: Campaign[]
    content: Content[]
    channels: string[]
  }
}
