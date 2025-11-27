"use client"

import { BarChart3 } from "lucide-react"

interface DataPoint {
  label: string
  values: number[]
}

interface MultiSeriesChartProps {
  data?: DataPoint[]
  series?: string[]
  height?: number
  title?: string
  range?: "24h" | "7d" | "30d" | "90d"
  onRangeChange?: (range: "24h" | "7d" | "30d" | "90d") => void
}

export function MultiSeriesChart({ 
  data = [], 
  series = ["Series 1", "Series 2"], 
  height = 300, 
  title = "Performance Trends",
  range = "30d",
  onRangeChange
}: MultiSeriesChartProps) {
  return (
    <div className="bg-[#13152A]/60 backdrop-blur-xl border border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#E6E8FF]">{title}</h3>
        
        {onRangeChange && (
          <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
            {(["24h", "7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => onRangeChange(r)}
                className={`px-3 py-1 text-sm rounded-md transition-all ${
                  range === r
                    ? "bg-[#2B26FE] text-white"
                    : "text-[#8A8FB2] hover:text-[#E6E8FF]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div 
        className="flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-white/5"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-[#8A8FB2] mx-auto mb-2 opacity-50" />
          <p className="text-sm text-[#8A8FB2]">Chart: {series.join(", ")}</p>
          <p className="text-xs text-[#8A8FB2]/60 mt-1">{data.length} data points</p>
        </div>
      </div>
    </div>
  )
}
