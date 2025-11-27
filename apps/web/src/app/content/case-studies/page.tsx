"use client"

import { NeonToolbar } from "@/components/neon/neon-toolbar"
import { NeonCard } from "@/components/neon/neon-card"
import { BarChart3, Plus } from "lucide-react"

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1120] via-[#13152A] to-[#0F1120]">
      <NeonToolbar
        title="Case Studies"
        onSearch={() => {}}
        actions={
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2B26FE] to-[#7A78FF] text-white font-medium hover:opacity-90 transition-all flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Case Study</span>
          </button>
        }
      />
      
      <div className="p-8">
        <NeonCard className="p-8 text-center">
          <BarChart3 className="w-16 h-16 text-[#2B26FE] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#E6E8FF] mb-2">Case Studies & Success Stories</h2>
          <p className="text-[#8A8FB2]">Document customer successes and results</p>
        </NeonCard>
      </div>
    </div>
  )
}
