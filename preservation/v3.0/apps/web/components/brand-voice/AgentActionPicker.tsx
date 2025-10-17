"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Zap, X, Settings, AlertTriangle, Clock, DollarSign } from "lucide-react"

interface AgentActionPickerProps {
  predictedIntent: string
  onConfirm: (intent: string, payload: any) => void
  onCancel: () => void
}

const intentConfigs = {
  "generate-post": {
    title: "Generate Social Post",
    description: "Create a social media post with brand voice compliance",
    icon: "📱",
    fields: [
      {
        name: "platform",
        label: "Platform",
        type: "select",
        options: ["Instagram", "Twitter", "LinkedIn", "Facebook"],
      },
      { name: "topic", label: "Topic", type: "text", placeholder: "What should the post be about?" },
      { name: "tone", label: "Tone", type: "select", options: ["Professional", "Casual", "Excited", "Educational"] },
      { name: "includeHashtags", label: "Include Hashtags", type: "boolean" },
    ],
    warnings: ["This will post to your social media account"],
    estimatedTime: "30 seconds",
    cost: "$0.02",
  },
  "seo-audit": {
    title: "SEO Audit",
    description: "Run comprehensive SEO analysis on your content",
    icon: "🔍",
    fields: [
      { name: "url", label: "URL to Audit", type: "text", placeholder: "https://example.com" },
      { name: "keywords", label: "Target Keywords", type: "text", placeholder: "keyword1, keyword2" },
      { name: "depth", label: "Audit Depth", type: "select", options: ["Quick", "Standard", "Deep"] },
    ],
    warnings: [],
    estimatedTime: "2 minutes",
    cost: "$0.10",
  },
  "email-seq": {
    title: "Email Sequence",
    description: "Generate a multi-email marketing sequence",
    icon: "📧",
    fields: [
      {
        name: "campaign",
        label: "Campaign Type",
        type: "select",
        options: ["Welcome", "Nurture", "Upsell", "Re-engagement"],
      },
      { name: "audience", label: "Target Audience", type: "text", placeholder: "Describe your audience" },
      { name: "emails", label: "Number of Emails", type: "select", options: ["3", "5", "7", "10"] },
      { name: "schedule", label: "Send Schedule", type: "select", options: ["Daily", "Every 2 days", "Weekly"] },
    ],
    warnings: ["This will create scheduled email campaigns"],
    estimatedTime: "1 minute",
    cost: "$0.15",
  },
  "support-reply": {
    title: "Support Reply",
    description: "Generate tone-safe customer support response",
    icon: "💬",
    fields: [
      {
        name: "inquiry",
        label: "Customer Inquiry",
        type: "textarea",
        placeholder: "Paste the customer's message here",
      },
      {
        name: "sentiment",
        label: "Customer Sentiment",
        type: "select",
        options: ["Happy", "Neutral", "Frustrated", "Angry"],
      },
      { name: "priority", label: "Priority Level", type: "select", options: ["Low", "Medium", "High", "Urgent"] },
    ],
    warnings: [],
    estimatedTime: "15 seconds",
    cost: "$0.01",
  },
  "trend-brief": {
    title: "Trend Analysis",
    description: "Scan trends and create relevance map for your brand",
    icon: "📈",
    fields: [
      { name: "industry", label: "Industry Focus", type: "text", placeholder: "e.g., SaaS, E-commerce, Healthcare" },
      {
        name: "timeframe",
        label: "Time Range",
        type: "select",
        options: ["Last 7 days", "Last 30 days", "Last 90 days"],
      },
      { name: "regions", label: "Geographic Focus", type: "text", placeholder: "e.g., US, Europe, Global" },
    ],
    warnings: [],
    estimatedTime: "45 seconds",
    cost: "$0.08",
  },
  "analytics-summarize": {
    title: "Analytics Summary",
    description: "Generate executive summary of marketing performance",
    icon: "📊",
    fields: [
      {
        name: "period",
        label: "Time Period",
        type: "select",
        options: ["Last 7 days", "Last 30 days", "Last quarter"],
      },
      {
        name: "metrics",
        label: "Focus Metrics",
        type: "select",
        options: ["All metrics", "Revenue focused", "Engagement focused", "Conversion focused"],
      },
      {
        name: "format",
        label: "Output Format",
        type: "select",
        options: ["Executive brief", "Detailed report", "Slide deck"],
      },
    ],
    warnings: [],
    estimatedTime: "1 minute",
    cost: "$0.05",
  },
}

export default function AgentActionPicker({ predictedIntent, onConfirm, onCancel }: AgentActionPickerProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const config = intentConfigs[predictedIntent as keyof typeof intentConfigs]

  if (!config) {
    return (
      <Card className="bg-[#1A1B23]/50 border-white/10 backdrop-blur-xl p-4">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Unknown intent: {predictedIntent}</p>
          <Button variant="outline" onClick={onCancel} className="mt-2 bg-transparent">
            Cancel
          </Button>
        </div>
      </Card>
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm(predictedIntent, formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="bg-[#1A1B23]/50 border-white/10 backdrop-blur-xl">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{config.icon}</div>
              <div>
                <h3 className="font-semibold text-white">{config.title}</h3>
                <p className="text-xs text-gray-400">{config.description}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-4 mt-3">
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{config.estimatedTime}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <DollarSign className="w-3 h-3" />
              <span>{config.cost}</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {config.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="text-sm text-gray-300">
                {field.label}
              </Label>

              {field.type === "text" && (
                <Input
                  id={field.name}
                  placeholder={"placeholder" in field ? field.placeholder : ""}
                  value={formData[field.name] || ""}
                  onChange={(e) => updateFormData(field.name, e.target.value)}
                  className="bg-[#2A2B35]/50 border-white/10 text-white placeholder-gray-400"
                />
              )}

              {field.type === "textarea" && (
                <Textarea
                  id={field.name}
                  placeholder={"placeholder" in field ? field.placeholder : ""}
                  value={formData[field.name] || ""}
                  onChange={(e) => updateFormData(field.name, e.target.value)}
                  className="bg-[#2A2B35]/50 border-white/10 text-white placeholder-gray-400 min-h-[80px]"
                />
              )}

              {field.type === "select" && field.options && (
                <Select value={formData[field.name] || ""} onValueChange={(value: string) => updateFormData(field.name, value)}>
                  <SelectTrigger className="bg-[#2A2B35]/50 border-white/10 text-white">
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2B35] border-white/10">
                    {field.options.map((option) => (
                      <SelectItem key={option} value={option} className="text-white hover:bg-white/10">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}

          {config.warnings.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {config.warnings.map((warning, index) => (
                    <p key={index} className="text-xs text-yellow-200">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-[#00FF88]/30 text-[#00FF88]">
              <Zap className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#00D4FF] to-[#B084FF] hover:from-[#00D4FF]/80 hover:to-[#B084FF]/80"
            >
              {isSubmitting ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
