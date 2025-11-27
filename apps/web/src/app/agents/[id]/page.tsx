"use client"

import { useParams } from "next/navigation"
import { NeonToolbar } from "@/components/neon/neon-toolbar"
import { NeonCard } from "@/components/neon/neon-card"
import { Bot, Play, Pause, Square } from "lucide-react"

export default function AgentDetailPage() {
  const params = useParams()
  const agentId = params.id as string

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1120] via-[#13152A] to-[#0F1120]">
      <NeonToolbar
        title={`Agent: ${agentId}`}
        actions={
          <div className="flex space-x-2">
            <button className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all flex items-center space-x-2">
              <Play className="w-4 h-4" />
              <span>Start</span>
            </button>
            <button className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all flex items-center space-x-2">
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
            <button className="px-4 py-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 transition-all flex items-center space-x-2">
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          </div>
        }
      />
      
      <div className="p-8">
        <NeonCard className="p-8 text-center">
          <Bot className="w-16 h-16 text-[#2B26FE] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#E6E8FF] mb-2">Agent Details</h2>
          <p className="text-[#8A8FB2]">Agent ID: {agentId}</p>
        </NeonCard>
      </div>
    </div>
  )
}
