"use client"

import { ReactNode } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface KeyMetricTileProps {
  label: string
  value: string | number
  delta?: number
  icon?: ReactNode
  isActive?: boolean
  onClick?: () => void
}

export function KeyMetricTile({ label, value, delta, icon, isActive, onClick }: KeyMetricTileProps) {
  const trend = delta !== undefined ? (delta > 0 ? "up" : delta < 0 ? "down" : "neutral") : undefined
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-[#8A8FB2]"
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[#13152A]/60 backdrop-blur-xl border rounded-lg p-6 transition-all duration-500",
        onClick && "cursor-pointer hover:border-[#2B26FE]/50",
        isActive ? "border-[#2B26FE] bg-[#2B26FE]/10" : "border-white/10 hover:border-white/20"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        {icon && <div className="p-3 rounded-lg bg-[#2B26FE]/10 text-[#2B26FE]">{icon}</div>}
        {delta !== undefined && TrendIcon && (
          <div className={`flex items-center space-x-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{Math.abs(delta)}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-[#E6E8FF] mb-1">{value}</div>
      <div className="text-sm text-[#8A8FB2]">{label}</div>
    </div>
  )
}
