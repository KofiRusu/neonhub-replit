"use client"

import { NeonToolbar } from "@/components/neon/neon-toolbar"
import { NeonCard } from "@/components/neon/neon-card"
import { Workflow, Plus } from "lucide-react"

export default function EmailAutomationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1120] via-[#13152A] to-[#0F1120]">
      <NeonToolbar
        title="Email Automations"
        onSearch={() => {}}
        actions={
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2B26FE] to-[#7A78FF] text-white font-medium hover:opacity-90 transition-all flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Automation</span>
          </button>
        }
      />
      
      <div className="p-8">
        <NeonCard className="p-8 text-center">
          <Workflow className="w-16 h-16 text-[#2B26FE] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#E6E8FF] mb-2">Email Automations</h2>
          <p className="text-[#8A8FB2]">Automated email sequences and workflows</p>
        </NeonCard>
      </div>
    </div>
  )
}
