"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Zap,
  Play,
  Edit,
  Copy,
  Plus,
  Search,
  Clock,
  Target,
  Mail,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Megaphone,
  FileText,
} from "lucide-react"

interface PromptPreset {
  id: string
  title: string
  description: string
  category: "seo" | "social" | "email" | "support" | "trends" | "analytics" | "content"
  prompt: string
  estimatedTime: string
  difficulty: "easy" | "medium" | "advanced"
  tags: string[]
  icon: React.ComponentType<any>
  color: string
}

const presets: PromptPreset[] = [
  {
    id: "seo-brief",
    title: "SEO Brief for Product X",
    description: "Generate comprehensive SEO strategy and content brief for a specific product or service",
    category: "seo",
    prompt:
      "Create a comprehensive SEO brief for [PRODUCT_NAME] including:\n\n1. Primary and secondary keyword research\n2. Content strategy and topic clusters\n3. Technical SEO recommendations\n4. Competitor analysis\n5. Content calendar for next 3 months\n\nTarget audience: [AUDIENCE]\nBusiness goals: [GOALS]",
    estimatedTime: "2-3 minutes",
    difficulty: "medium",
    tags: ["SEO", "strategy", "keywords", "content"],
    icon: Target,
    color: "text-[#00D4FF]",
  },
  {
    id: "social-plan",
    title: "30-day Social Plan (Multi-Platform)",
    description: "Create a complete 30-day social media content plan across Instagram, TikTok, and YouTube",
    category: "social",
    prompt:
      "Generate a 30-day social media content plan for:\n\nPlatforms: Instagram, TikTok, YouTube\nBrand: [BRAND_NAME]\nIndustry: [INDUSTRY]\nTarget audience: [AUDIENCE]\n\nInclude:\n- Content themes and pillars\n- Post types and formats\n- Posting schedule\n- Hashtag strategies\n- Engagement tactics\n- Performance KPIs",
    estimatedTime: "3-4 minutes",
    difficulty: "advanced",
    tags: ["social media", "content plan", "multi-platform", "strategy"],
    icon: Megaphone,
    color: "text-[#B084FF]",
  },
  {
    id: "email-sequence",
    title: "Email Sequence (Welcome → Upsell)",
    description: "Design a complete email nurture sequence from welcome to upsell conversion",
    category: "email",
    prompt:
      "Create a 7-email welcome sequence that nurtures new subscribers and leads to an upsell:\n\nProduct/Service: [PRODUCT]\nTarget audience: [AUDIENCE]\nUpsell offer: [OFFER]\n\nSequence should include:\n- Welcome and value delivery\n- Social proof and testimonials\n- Educational content\n- Soft pitch and upsell\n- Urgency and final call-to-action",
    estimatedTime: "2-3 minutes",
    difficulty: "medium",
    tags: ["email marketing", "sequence", "nurture", "upsell"],
    icon: Mail,
    color: "text-[#00FF88]",
  },
  {
    id: "support-reply",
    title: "Support Reply (Tone-Safe)",
    description: "Generate empathetic, brand-compliant customer support responses",
    category: "support",
    prompt:
      "Generate a customer support response that maintains our brand voice:\n\nCustomer inquiry: [CUSTOMER_MESSAGE]\nIssue type: [ISSUE_TYPE]\nCustomer sentiment: [SENTIMENT]\nResolution available: [YES/NO]\n\nResponse should be:\n- Empathetic and understanding\n- Brand voice compliant\n- Solution-focused\n- Professional yet warm",
    estimatedTime: "30 seconds",
    difficulty: "easy",
    tags: ["customer support", "brand voice", "empathy", "resolution"],
    icon: MessageSquare,
    color: "text-[#FF006B]",
  },
  {
    id: "trend-scan",
    title: "Trend Scan + Relevance Map",
    description: "Analyze current trends and map their relevance to your brand and industry",
    category: "trends",
    prompt:
      "Perform a trend analysis and create a relevance map:\n\nIndustry: [INDUSTRY]\nBrand: [BRAND_NAME]\nTime period: [TIMEFRAME]\nGeographic focus: [REGION]\n\nAnalyze:\n- Emerging trends in the industry\n- Social media trending topics\n- Consumer behavior shifts\n- Technology developments\n- Competitive landscape changes\n\nMap relevance and opportunity for our brand.",
    estimatedTime: "2-3 minutes",
    difficulty: "advanced",
    tags: ["trends", "analysis", "market research", "opportunities"],
    icon: TrendingUp,
    color: "text-yellow-500",
  },
  {
    id: "analytics-summary",
    title: "Analytics Summary for Exec",
    description: "Create executive-level marketing performance summary with key insights",
    category: "analytics",
    prompt:
      "Generate an executive summary of marketing performance:\n\nTime period: [PERIOD]\nKey metrics: [METRICS]\nCampaigns: [CAMPAIGNS]\nBudget: [BUDGET]\n\nInclude:\n- Performance highlights\n- Key wins and challenges\n- ROI analysis\n- Recommendations for next period\n- Budget allocation suggestions\n\nFormat for C-level presentation.",
    estimatedTime: "1-2 minutes",
    difficulty: "medium",
    tags: ["analytics", "executive", "performance", "ROI"],
    icon: BarChart3,
    color: "text-orange-500",
  },
  {
    id: "content-brief",
    title: "Blog Content Brief",
    description: "Generate detailed content brief for blog posts with SEO optimization",
    category: "content",
    prompt:
      "Create a comprehensive blog content brief:\n\nTopic: [TOPIC]\nTarget keyword: [KEYWORD]\nAudience: [AUDIENCE]\nContent goal: [GOAL]\n\nBrief should include:\n- SEO-optimized title and meta description\n- Content outline with H2/H3 structure\n- Key points to cover\n- Internal linking opportunities\n- Call-to-action suggestions\n- Word count recommendation",
    estimatedTime: "1-2 minutes",
    difficulty: "easy",
    tags: ["content", "blog", "SEO", "brief"],
    icon: FileText,
    color: "text-[#00D4FF]",
  },
]

const categoryColors = {
  seo: "border-[#00D4FF]/30 bg-[#00D4FF]/10 text-[#00D4FF]",
  social: "border-[#B084FF]/30 bg-[#B084FF]/10 text-[#B084FF]",
  email: "border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88]",
  support: "border-[#FF006B]/30 bg-[#FF006B]/10 text-[#FF006B]",
  trends: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
  analytics: "border-orange-500/30 bg-orange-500/10 text-orange-500",
  content: "border-[#00D4FF]/30 bg-[#00D4FF]/10 text-[#00D4FF]",
}

const difficultyColors = {
  easy: "border-[#00FF88]/30 text-[#00FF88]",
  medium: "border-yellow-500/30 text-yellow-500",
  advanced: "border-[#FF006B]/30 text-[#FF006B]",
}

export default function PromptPresets() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedPreset, setSelectedPreset] = useState<PromptPreset | null>(null)
  const [customPrompt, setCustomPrompt] = useState("")

  const filteredPresets = presets.filter((preset) => {
    const matchesSearch =
      preset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || preset.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(presets.map((p) => p.category)))

  const handleRunPreset = (preset: PromptPreset) => {
    // This would integrate with the copilot to run the preset
    console.log("Running preset:", preset.id)
  }

  const handleOpenInCopilot = (preset: PromptPreset) => {
    // This would open the preset in the copilot chat
    console.log("Opening in copilot:", preset.id)
  }

  const handleCopyPrompt = (preset: PromptPreset) => {
    navigator.clipboard.writeText(preset.prompt)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Prompt Presets</h2>
          <p className="text-sm text-gray-400">Curated prompts for common marketing tasks</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#FF006B] to-[#B084FF] hover:from-[#FF006B]/80 hover:to-[#B084FF]/80">
              <Plus className="w-4 h-4 mr-2" />
              Create Preset
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1A1B23] border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Custom Preset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Preset Title</label>
                <Input
                  placeholder="Enter preset title..."
                  className="bg-[#2A2B35]/50 border-white/10 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
                <Input
                  placeholder="Brief description of what this preset does..."
                  className="bg-[#2A2B35]/50 border-white/10 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Prompt Template</label>
                <Textarea
                  placeholder="Enter your prompt template here. Use [VARIABLE_NAME] for dynamic values..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="bg-[#2A2B35]/50 border-white/10 text-white placeholder-gray-400 min-h-[120px]"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" className="border-white/20 text-gray-400 bg-transparent">
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-[#FF006B] to-[#B084FF]">Save Preset</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-[#1A1B23]/50 border-white/10 backdrop-blur-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#2A2B35]/50 border-white/10 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? "bg-[#00D4FF] text-white" : "border-white/20 text-gray-400"}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "bg-[#00D4FF] text-white"
                    : "border-white/20 text-gray-400 hover:text-white"
                }
              >
                {category.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPresets.map((preset, index) => (
          <motion.div
            key={preset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-[#1A1B23]/50 border-white/10 backdrop-blur-xl p-6 h-full flex flex-col hover:bg-[#1A1B23]/70 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r ${
                      preset.category === "seo"
                        ? "from-[#00D4FF] to-[#B084FF]"
                        : preset.category === "social"
                          ? "from-[#B084FF] to-[#FF006B]"
                          : preset.category === "email"
                            ? "from-[#00FF88] to-[#00D4FF]"
                            : preset.category === "support"
                              ? "from-[#FF006B] to-[#B084FF]"
                              : preset.category === "trends"
                                ? "from-yellow-500 to-orange-500"
                                : preset.category === "analytics"
                                  ? "from-orange-500 to-[#FF006B]"
                                  : "from-[#00D4FF] to-[#B084FF]"
                    }`}
                  >
                    <preset.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm">{preset.title}</h3>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyPrompt(preset)}
                  className="text-gray-400 hover:text-white h-8 w-8 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              <p className="text-sm text-gray-400 mb-4 flex-1 leading-relaxed">{preset.description}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400">{preset.estimatedTime}</span>
                  </div>
                  <Badge variant="outline" className={difficultyColors[preset.difficulty]}>
                    {preset.difficulty}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className={categoryColors[preset.category]}>
                    {preset.category}
                  </Badge>
                  {preset.tags.slice(0, 2).map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs bg-[#2A2B35]/50 text-gray-400">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleRunPreset(preset)}
                    className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#B084FF] hover:from-[#00D4FF]/80 hover:to-[#B084FF]/80 text-xs"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Run
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenInCopilot(preset)}
                    className="border-white/20 text-gray-400 hover:text-white text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredPresets.length === 0 && (
        <Card className="bg-[#1A1B23]/50 border-white/10 backdrop-blur-xl p-12 text-center">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No presets found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your search or create a custom preset.</p>
          <Button className="bg-gradient-to-r from-[#FF006B] to-[#B084FF] hover:from-[#FF006B]/80 hover:to-[#B084FF]/80">
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Preset
          </Button>
        </Card>
      )}
    </div>
  )
}
