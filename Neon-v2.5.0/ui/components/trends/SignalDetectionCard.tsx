"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, TrendingUp, Lightbulb, ArrowRight, Clock } from "lucide-react"

interface Signal {
  id: number
  type: "opportunity" | "warning" | "insight"
  title: string
  description: string
  confidence: number
  impact: "high" | "medium" | "low"
  action: string
  timeframe: string
  metrics: Record<string, string>
}

interface SignalDetectionCardProps {
  signal: Signal
}

export function SignalDetectionCard({ signal }: SignalDetectionCardProps) {
  const getTypeConfig = (type: Signal["type"]) => {
    switch (type) {
      case "opportunity":
        return {
          icon: TrendingUp,
          color: "neon-green",
          bgColor: "bg-neon-green/10",
          borderColor: "border-neon-green/30",
        }
      case "warning":
        return {
          icon: AlertCircle,
          color: "neon-pink",
          bgColor: "bg-neon-pink/10",
          borderColor: "border-neon-pink/30",
        }
      case "insight":
        return {
          icon: Lightbulb,
          color: "neon-blue",
          bgColor: "bg-neon-blue/10",
          borderColor: "border-neon-blue/30",
        }
    }
  }

  const config = getTypeConfig(signal.type)
  const TypeIcon = config.icon

  return (
    <Card
      className={`border ${config.borderColor} ${config.bgColor} backdrop-blur-sm transition-all duration-300 hover:shadow-${config.color}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-lg bg-${config.color}/20 p-2`}>
                <TypeIcon className={`h-4 w-4 text-${config.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm">{signal.title}</h4>
                  <Badge variant="outline" className="shrink-0">
                    {signal.confidence}% confidence
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{signal.description}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex flex-wrap gap-3">
              {Object.entries(signal.metrics).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className="capitalize text-muted-foreground">{key}:</span>
                  <span className={`font-medium ${value.startsWith("+") ? "text-neon-green" : "text-neon-pink"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Action */}
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-card/30 p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{signal.timeframe}</span>
                  <Badge variant="secondary" className="ml-2">
                    {signal.impact} impact
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-medium">{signal.action}</p>
              </div>
              <Button size="sm" className={`gap-2 bg-${config.color} hover:bg-${config.color}/90`}>
                Take Action
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
