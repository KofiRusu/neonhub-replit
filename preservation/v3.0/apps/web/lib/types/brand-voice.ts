export interface BrandProfile {
  identity: {
    mission: string
    vision: string
    values: string[]
  }
  voice: {
    tone: string[]
    personality: string[]
    doList: string[]
    dontList: string[]
  }
  audience: {
    primary: string
    secondary: string[]
    personas: Array<{ name: string; description: string }>
  }
  positioning: {
    valueProps: string[]
    differentiators: string[]
    competitors: string[]
  }
}

export interface KnowledgeDoc {
  id: string
  title: string
  type: "policy" | "playbook" | "campaign" | "styleguide" | "template" | "research"
  content: string
  tags: string[]
  agent: string
  owner: string
  updatedAt: string
  isCanonical: boolean
  url?: string
}

export interface PromptPreset {
  id: string
  title: string
  description: string
  category: "seo" | "social" | "email" | "support" | "trends" | "analytics" | "content"
  prompt: string
  estimatedTime: string
  difficulty: "easy" | "medium" | "advanced"
  tags: string[]
}

export interface ActionResult {
  success: boolean
  summary?: string
  data?: any
  sources?: Array<{ title: string; url: string; updatedAt: string }>
  error?: string
}

export interface Intent {
  command: string
  description: string
  category: string
  status: "active" | "inactive" | "maintenance"
}

export interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: Array<{ title: string; url: string; updatedAt: string }>
  predictedIntent?: string
  reasoning?: string
}

export interface KPI {
  label: string
  value: string | number
  trend?: "up" | "down" | "flat"
  status?: "good" | "warning" | "error"
  change?: string
}
