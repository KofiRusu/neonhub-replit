"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Target,
  Users,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Edit,
  Upload,
  Download,
} from "lucide-react"

interface BrandProfile {
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

interface BrandMemoryPanelProps {
  brandProfile?: BrandProfile
  canEdit?: boolean
}

const mockBrandProfile: BrandProfile = {
  identity: {
    mission: "Empower businesses with AI-driven marketing intelligence that delivers measurable results",
    vision: "To be the leading platform where AI and human creativity converge for marketing excellence",
    values: ["Innovation", "Transparency", "Results-Driven", "Customer-Centric", "Ethical AI"],
  },
  voice: {
    tone: ["Professional", "Confident", "Innovative", "Approachable"],
    personality: ["Expert", "Trustworthy", "Forward-thinking", "Solution-oriented"],
    doList: [
      "Use data-driven insights to support claims",
      "Speak with authority on AI and marketing",
      "Focus on measurable business outcomes",
      "Use clear, jargon-free language",
      "Emphasize ROI and efficiency gains",
    ],
    dontList: [
      "Make unrealistic promises or guarantees",
      "Use overly technical jargon without explanation",
      "Dismiss traditional marketing approaches",
      "Sound robotic or impersonal",
      "Ignore compliance and ethical considerations",
    ],
  },
  audience: {
    primary: "Marketing Directors and CMOs at mid-to-large enterprises",
    secondary: ["Marketing Managers", "Digital Marketing Specialists", "Marketing Agencies", "Growth Teams"],
    personas: [
      {
        name: "Strategic Sarah",
        description:
          "CMO focused on ROI, scalability, and team efficiency. Values data-driven decisions and measurable outcomes.",
      },
      {
        name: "Tactical Tom",
        description: "Marketing Manager executing campaigns daily. Needs tools that save time and improve performance.",
      },
      {
        name: "Agency Alex",
        description:
          "Agency owner managing multiple clients. Requires white-label solutions and client reporting capabilities.",
      },
    ],
  },
  positioning: {
    valueProps: [
      "AI-powered marketing intelligence that actually drives results",
      "Unified platform eliminating tool sprawl and data silos",
      "Predictive insights that help you stay ahead of trends",
      "Automated workflows that scale your marketing operations",
    ],
    differentiators: [
      "Advanced AI models trained specifically for marketing use cases",
      "Real-time brand voice compliance across all channels",
      "Integrated ecosystem vs. point solutions",
      "Transparent AI with explainable recommendations",
    ],
    competitors: ["HubSpot", "Marketo", "Salesforce Marketing Cloud", "Jasper AI", "Copy.ai"],
  },
}

const toneMetrics = [
  { label: "Consistency Score", value: 94, target: 90, status: "good" },
  { label: "Brand Alignment", value: 89, target: 85, status: "good" },
  { label: "Readability", value: 82, target: 80, status: "good" },
  { label: "Sentiment Match", value: 76, target: 80, status: "warning" },
]

export default function BrandMemoryPanel({ brandProfile = mockBrandProfile, canEdit = false }: BrandMemoryPanelProps) {
  const [activeTab, setActiveTab] = useState("identity")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-[#00FF88]"
      case "warning":
        return "text-yellow-500"
      case "error":
        return "text-[#FF006B]"
      default:
        return "text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return CheckCircle
      case "warning":
        return AlertCircle
      case "error":
        return AlertCircle
      default:
        return AlertCircle
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[#B084FF] to-[#FF006B] rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Brand Memory</h2>
            <p className="text-sm text-gray-400">Your brand's core identity and voice guidelines</p>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#B084FF]/30 text-[#B084FF] hover:bg-[#B084FF]/10 bg-transparent"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-[#B084FF] to-[#FF006B] hover:from-[#B084FF]/80 hover:to-[#FF006B]/80"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Tone Diagnostics */}
      <Card className="bg-[#1A1B23]/50 border-white/10 backdrop-blur-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-[#00D4FF]" />
          Tone Diagnostics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {toneMetrics.map((metric, index) => {
            const StatusIcon = getStatusIcon(metric.status)
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#2A2B35]/30 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{metric.label}</span>
                  <StatusIcon className={`w-4 h-4 ${getStatusColor(metric.status)}`} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${getStatusColor(metric.status)}`}>{metric.value}%</span>
                    <span className="text-xs text-gray-500">Target: {metric.target}%</span>
                  </div>
                  <Progress value={metric.value} className="h-2" />
                </div>
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Brand Profile */}
      <Card className="bg-[#1A1B23]/50 border-white/10 backdrop-blur-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-white/10 p-6 pb-0">
            <TabsList className="grid w-full grid-cols-4 bg-[#2A2B35]/30 border border-white/10">
              <TabsTrigger
                value="identity"
                className="data-[state=active]:bg-[#B084FF]/20 data-[state=active]:text-[#B084FF]"
              >
                <Target className="w-4 h-4 mr-2" />
                Identity
              </TabsTrigger>
              <TabsTrigger
                value="voice"
                className="data-[state=active]:bg-[#00D4FF]/20 data-[state=active]:text-[#00D4FF]"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Voice
              </TabsTrigger>
              <TabsTrigger
                value="audience"
                className="data-[state=active]:bg-[#00FF88]/20 data-[state=active]:text-[#00FF88]"
              >
                <Users className="w-4 h-4 mr-2" />
                Audience
              </TabsTrigger>
              <TabsTrigger
                value="positioning"
                className="data-[state=active]:bg-[#FF006B]/20 data-[state=active]:text-[#FF006B]"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Positioning
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="identity" className="space-y-6 mt-0">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#B084FF] mb-2">Mission</h4>
                  <p className="text-gray-300 leading-relaxed">{brandProfile.identity.mission}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#B084FF] mb-2">Vision</h4>
                  <p className="text-gray-300 leading-relaxed">{brandProfile.identity.vision}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#B084FF] mb-2">Core Values</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandProfile.identity.values.map((value, index) => (
                      <Badge key={index} variant="outline" className="border-[#B084FF]/30 text-[#B084FF]">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="voice" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#00D4FF] mb-2">Tone</h4>
                    <div className="flex flex-wrap gap-2">
                      {brandProfile.voice.tone.map((tone, index) => (
                        <Badge key={index} variant="outline" className="border-[#00D4FF]/30 text-[#00D4FF]">
                          {tone}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#00D4FF] mb-2">Personality</h4>
                    <div className="flex flex-wrap gap-2">
                      {brandProfile.voice.personality.map((trait, index) => (
                        <Badge key={index} variant="outline" className="border-[#00D4FF]/30 text-[#00D4FF]">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#00FF88] mb-2">Do's</h4>
                    <ul className="space-y-1">
                      {brandProfile.voice.doList.map((item, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start">
                          <CheckCircle className="w-3 h-3 text-[#00FF88] mr-2 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#FF006B] mb-2">Don'ts</h4>
                    <ul className="space-y-1">
                      {brandProfile.voice.dontList.map((item, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start">
                          <AlertCircle className="w-3 h-3 text-[#FF006B] mr-2 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audience" className="space-y-6 mt-0">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#00FF88] mb-2">Primary Audience</h4>
                  <p className="text-gray-300">{brandProfile.audience.primary}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#00FF88] mb-2">Secondary Audiences</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandProfile.audience.secondary.map((audience, index) => (
                      <Badge key={index} variant="outline" className="border-[#00FF88]/30 text-[#00FF88]">
                        {audience}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#00FF88] mb-2">Key Personas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {brandProfile.audience.personas.map((persona, index) => (
                      <div key={index} className="bg-[#2A2B35]/30 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-2">{persona.name}</h5>
                        <p className="text-sm text-gray-400">{persona.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="positioning" className="space-y-6 mt-0">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#FF006B] mb-2">Value Propositions</h4>
                  <ul className="space-y-2">
                    {brandProfile.positioning.valueProps.map((prop, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-start">
                        <CheckCircle className="w-3 h-3 text-[#FF006B] mr-2 mt-0.5 flex-shrink-0" />
                        {prop}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#FF006B] mb-2">Key Differentiators</h4>
                  <ul className="space-y-2">
                    {brandProfile.positioning.differentiators.map((diff, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-start">
                        <TrendingUp className="w-3 h-3 text-[#FF006B] mr-2 mt-0.5 flex-shrink-0" />
                        {diff}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#FF006B] mb-2">Competitive Landscape</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandProfile.positioning.competitors.map((competitor, index) => (
                      <Badge key={index} variant="outline" className="border-[#FF006B]/30 text-[#FF006B]">
                        {competitor}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  )
}
