"use client"
import { useMemo } from "react"

interface TrendChartProps {
  timeRange: string
}

export function TrendChart({ timeRange }: TrendChartProps) {
  const _chartData = useMemo(() => {
    // Generate mock data based on time range
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      actual: 50 + Math.random() * 30 + i * 0.5,
      predicted: 50 + Math.random() * 25 + i * 0.6,
    }))
  }, [timeRange])

  return (
    <div className="h-[400px] w-full">
      {/* In a real implementation, use a charting library like recharts or chart.js */}
      <div className="relative h-full w-full rounded-lg border border-border/50 bg-gradient-to-br from-space-gray/50 to-space-purple/30 p-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">Chart visualization</div>
            <div className="text-xs text-muted-foreground/60">
              Integrate with recharts, chart.js, or similar library
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-neon-blue" />
                <span className="text-xs">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-neon-purple" />
                <span className="text-xs">Predicted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-neon-pink opacity-50" />
                <span className="text-xs">Confidence Band</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
