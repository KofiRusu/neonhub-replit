"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, Activity } from "lucide-react"

interface ForecastWidgetProps {
  title: string
  metric: string
  currentValue: number
  predictedValue: number
  confidence: number
  timeframe: string
  color: string
}

export function ForecastWidget({
  title,
  metric: _metric,
  currentValue,
  predictedValue,
  confidence,
  timeframe,
  color,
}: ForecastWidgetProps) {
  const change = ((predictedValue - currentValue) / currentValue) * 100

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-border transition-all duration-300 hover:shadow-neon-purple">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span>{title}</span>
          <Badge variant="outline" className="gap-1">
            <Target className="h-3 w-3" />
            {confidence}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current vs Predicted */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Current</div>
            <div className="text-2xl font-bold">{currentValue.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Predicted</div>
            <div className="text-2xl font-bold text-neon-green">{predictedValue.toFixed(1)}%</div>
          </div>
        </div>

        {/* Change Indicator */}
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-gradient-to-r from-space-gray/50 to-space-purple/20 p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 text-${color}`} />
            <span className="text-sm font-medium">Expected Growth</span>
          </div>
          <span className={`text-lg font-bold text-${color}`}>+{change.toFixed(1)}%</span>
        </div>

        {/* Timeframe */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span>Forecast for next {timeframe}</span>
        </div>

        {/* Mini Chart Placeholder */}
        <div className="h-16 rounded-lg border border-border/50 bg-gradient-to-br from-space-gray/30 to-space-purple/20 p-2">
          <div className="flex h-full items-end justify-between gap-1">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className={`w-full rounded-t bg-${color}/30 transition-all`}
                style={{ height: `${40 + i * 5 + Math.random() * 10}%` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
