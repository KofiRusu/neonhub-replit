"use client"
import NeonCard from "@/components/neon-card"
import { HelpCircle, MessageSquare, LifeBuoy } from "lucide-react"

export default function SupportPage() {
  const cards = [
    { icon: <HelpCircle className="w-6 h-6" />, title: "Docs", desc: "Guides and references", glow: "blue" },
    { icon: <MessageSquare className="w-6 h-6" />, title: "Contact", desc: "Reach our team", glow: "green" },
    { icon: <LifeBuoy className="w-6 h-6" />, title: "Status", desc: "Uptime and incidents", glow: "purple" },
  ] as const
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Support</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <NeonCard key={c.title} glow={c.glow} className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5">{c.icon}</div>
              <div>
                <div className="font-semibold">{c.title}</div>
                <div className="text-sm text-gray-400">{c.desc}</div>
              </div>
            </div>
          </NeonCard>
        ))}
      </div>
    </div>
  )
}

