"use client"

import { cn } from "@/lib/utils"

interface NeonProgressProps {
  value: number
  max?: number
  className?: string
  color?: "blue" | "purple" | "pink" | "green"
}

export function NeonProgress({ value, max = 100, className, color = "blue" }: NeonProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const colorClasses = {
    blue: "bg-gradient-to-r from-[#2B26FE] to-[#7A78FF]",
    purple: "bg-gradient-to-r from-[#7A78FF] to-[#B14BFF]",
    pink: "bg-gradient-to-r from-[#FF006B] to-[#B14BFF]",
    green: "bg-gradient-to-r from-[#00FF94] to-[#00D9FF]",
  }

  return (
    <div className={cn("w-full h-2 bg-white/10 rounded-full overflow-hidden", className)}>
      <div
        className={cn("h-full transition-all duration-500", colorClasses[color])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
