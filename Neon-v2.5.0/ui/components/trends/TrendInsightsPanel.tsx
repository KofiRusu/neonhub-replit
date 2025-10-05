"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Sparkles, CheckCircle2 } from "lucide-react"

interface Signal {
  id: number
  type: "opportunity" | "warning" | "insight"
  title: string
  impact: "high" | "medium" | "low"
}

interface TrendInsightsPanelProps {
  signals: Signal[]
}

export function TrendInsightsPanel({ signals }: TrendInsightsPanelProps) {
  const highImpactCount = signals.filter((s) => s.impact === "high").length
  const opportunityCount = signals.filter((s) => s.type === "opportunity").length
  const warningCount = signals.filter((s) => s.type === "warning").length

  return (
    <Card className="border-border/50 bg-gradient-to-br from-space-purple/20 to-space-gray/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-neon-purple" />
              AI Insights Summary
            </CardTitle>
            <CardDescription>Key takeaways and recommended actions</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Auto-generated
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neon-green/30 bg-neon-green/10 p-4">
            <div className="text-2xl font-bold text-neon-green">{opportunityCount}</div>
            <div className="text-xs text-muted-foreground">Growth Opportunities</div>
          </div>
          <div className="rounded-lg border border-neon-pink/30 bg-neon-pink/10 p-4">
            <div className="text-2xl font-bold text-neon-pink">{warningCount}</div>
            <div className="text-xs text-muted-foreground">Attention Required</div>
          </div>
          <div className="rounded-lg border border-neon-blue/30 bg-neon-blue/10 p-4">
            <div className="text-2xl font-bold text-neon-blue">{highImpactCount}</div>
            <div className="text-xs text-muted-foreground">High Impact Signals</div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Top Recommendations</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/30 p-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-neon-green mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Prioritize video content production</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected 3x engagement boost based on current trend patterns
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/30 p-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-neon-green mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Optimize email send times</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Schedule campaigns for 2-4 PM window to maximize open rates
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/30 p-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-neon-green mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Target 25-34 age segment</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create specialized campaigns for this high-converting demographic
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
