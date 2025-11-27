"use client"

import { NeonToolbar } from "@/components/neon/neon-toolbar"
import { NeonCard } from "@/components/neon/neon-card"
import { Shield } from "lucide-react"

export default function EmailDeliverabilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1120] via-[#13152A] to-[#0F1120]">
      <NeonToolbar title="Deliverability" onSearch={() => {}} />
      
      <div className="p-8">
        <NeonCard className="p-8 text-center">
          <Shield className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#E6E8FF] mb-2">Email Deliverability</h2>
          <p className="text-[#8A8FB2]">Monitor your sender reputation and deliverability metrics</p>
        </NeonCard>
      </div>
    </div>
  )
}
