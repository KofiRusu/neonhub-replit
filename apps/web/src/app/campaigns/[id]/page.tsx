"use client"

import { useParams } from "next/navigation"
import { NeonToolbar } from "@/components/neon/neon-toolbar"
import { NeonCard } from "@/components/neon/neon-card"
import { Target, Edit, Play } from "lucide-react"

export default function CampaignDetailPage() {
  const params = useParams()
  const campaignId = params.id as string

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1120] via-[#13152A] to-[#0F1120]">
      <NeonToolbar
        title={`Campaign: ${campaignId}`}
        actions={
          <div className="flex space-x-2">
            <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[#E6E8FF] transition-all flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all flex items-center space-x-2">
              <Play className="w-4 h-4" />
              <span>Resume</span>
            </button>
          </div>
        }
      />
      
      <div className="p-8">
        <NeonCard className="p-8 text-center">
          <Target className="w-16 h-16 text-[#2B26FE] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#E6E8FF] mb-2">Campaign Details</h2>
          <p className="text-[#8A8FB2]">Campaign ID: {campaignId}</p>
        </NeonCard>
      </div>
    </div>
  )
}
