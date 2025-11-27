"use client"

import type { ReactNode } from "react"

interface ChartContainerProps {
  title: string
  children: ReactNode
  actions?: ReactNode
}

export function ChartContainer({ title, children, actions }: ChartContainerProps) {
  return (
    <div className="glass-strong p-6 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {actions}
      </div>
      <div className="w-full h-64">{children}</div>
    </div>
  )
}
