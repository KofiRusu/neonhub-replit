"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import BrandVoiceCopilot from "@/components/brand-voice/BrandVoiceCopilot"
import BrandMemoryPanel from "@/components/brand-voice/BrandMemoryPanel"
import KnowledgeIndex from "@/components/brand-voice/KnowledgeIndex"
import PromptPresets from "@/components/brand-voice/PromptPresets"
import InsightsStrip from "@/components/brand-voice/InsightsStrip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Brain, Search, Plus, Download, Zap, FileText, Settings } from "lucide-react"

const kpiData = [
  { label: "Tone Consistency", value: "94%", trend: "up" as const },
  { label: "Readability Score", value: "8.2", trend: "flat" as const },
  { label: "Recent Wins", value: "12", trend: "up" as const },
  { label: "Active Alerts", value: "2", trend: "down" as const },
]

export default function BrandVoicePage() {
  const [activeTab, setActiveTab] = useState("copilot")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1A1B23]/50 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#00D4FF] to-[#B084FF] rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#B084FF] bg-clip-text text-transparent">
                  Brand Voice Copilot
                </h1>
                <p className="text-gray-400 text-sm">Ask anything. Launch actions.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search knowledge..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-[#2A2B35]/50 border-white/10 text-white placeholder-gray-400"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 bg-transparent"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-[#B084FF]/30 text-[#B084FF] hover:bg-[#B084FF]/10 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#00D4FF] to-[#B084FF] hover:from-[#00D4FF]/80 hover:to-[#B084FF]/80"
              >
                <Zap className="w-4 h-4 mr-2" />
                Run Agent
              </Button>
            </div>
          </div>

          {/* Insights Strip */}
          <InsightsStrip kpis={kpiData} />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#2A2B35]/30 border border-white/10">
            <TabsTrigger
              value="copilot"
              className="data-[state=active]:bg-[#00D4FF]/20 data-[state=active]:text-[#00D4FF] data-[state=active]:border-[#00D4FF]/30"
            >
              <Brain className="w-4 h-4 mr-2" />
              Copilot
            </TabsTrigger>
            <TabsTrigger
              value="memory"
              className="data-[state=active]:bg-[#B084FF]/20 data-[state=active]:text-[#B084FF] data-[state=active]:border-[#B084FF]/30"
            >
              <Settings className="w-4 h-4 mr-2" />
              Brand Memory
            </TabsTrigger>
            <TabsTrigger
              value="knowledge"
              className="data-[state=active]:bg-[#00FF88]/20 data-[state=active]:text-[#00FF88] data-[state=active]:border-[#00FF88]/30"
            >
              <FileText className="w-4 h-4 mr-2" />
              Knowledge Index
            </TabsTrigger>
            <TabsTrigger
              value="presets"
              className="data-[state=active]:bg-[#FF006B]/20 data-[state=active]:text-[#FF006B] data-[state=active]:border-[#FF006B]/30"
            >
              <Zap className="w-4 h-4 mr-2" />
              Presets
            </TabsTrigger>
          </TabsList>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <TabsContent value="copilot" className="space-y-6">
              <BrandVoiceCopilot />
            </TabsContent>

            <TabsContent value="memory" className="space-y-6">
              <BrandMemoryPanel />
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-6">
              <KnowledgeIndex query={searchQuery} />
            </TabsContent>

            <TabsContent value="presets" className="space-y-6">
              <PromptPresets />
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </div>
  )
}
