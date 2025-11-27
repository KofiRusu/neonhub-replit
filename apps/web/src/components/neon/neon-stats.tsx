"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  delta?: number
  change?: string
  className?: string
}

export function StatCard({ label, value, icon, delta, change, className }: StatCardProps) {
  // Support both delta (number) and change (string) for backwards compatibility
  const displayChange = change || (delta !== undefined ? `${delta > 0 ? "+" : ""}${delta}%` : undefined)
  
  return (
    <div className={cn("bg-[#13152A]/60 backdrop-blur-xl border border-white/10 rounded-lg p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        {icon && <div className="text-[#2B26FE]">{icon}</div>}
        {displayChange && (
          <span className={cn(
            "text-xs font-medium",
            displayChange.startsWith("+") ? "text-emerald-400" : "text-rose-400"
          )}>
            {displayChange}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-[#E6E8FF] mb-1">{value}</div>
      <div className="text-sm text-[#8A8FB2]">{label}</div>
    </div>
  )
}

// Alias for consistency
export { StatCard as NeonStats }
