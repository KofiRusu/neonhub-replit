"use client"

import type { ReactNode } from "react"

interface ChartContainerProps {
  title: string
  children: ReactNode
  actions?: ReactNode
}

export function ChartContainer({ title, children, actions }: ChartContainerProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl p-6 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {actions}
      </div>
      <div className="w-full h-64">{children}</div>
    </div>
  )
}
