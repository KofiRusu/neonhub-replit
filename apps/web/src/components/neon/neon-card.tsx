"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface NeonCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  glow?: "blue" | "purple" | "pink" | "green"
}

export function NeonCard({ children, className, onClick, glow }: NeonCardProps) {
  const glowClasses = {
    blue: "hover:border-[#2B26FE]/50 hover:shadow-[0_0_20px_rgba(43,38,254,0.2)]",
    purple: "hover:border-[#7A78FF]/50 hover:shadow-[0_0_20px_rgba(122,120,255,0.2)]",
    pink: "hover:border-[#FF006B]/50 hover:shadow-[0_0_20px_rgba(255,0,107,0.2)]",
    green: "hover:border-[#00FF94]/50 hover:shadow-[0_0_20px_rgba(0,255,148,0.2)]",
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[#13152A]/60 backdrop-blur-xl border border-white/10 rounded-lg transition-all hover:border-white/20",
        onClick && "cursor-pointer",
        glow && glowClasses[glow],
        className
      )}
    >
      {children}
    </div>
  )
}
